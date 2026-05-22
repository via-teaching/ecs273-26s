"""
Load local CSV/txt data into MongoDB (database: stock_ppk).

Run from the server folder:
    python import_data.py
"""

from __future__ import annotations

import html
import re
from pathlib import Path

import pandas as pd
from pymongo import MongoClient

from data_scheme import (
    COLLECTION_STOCK_NEWS,
    COLLECTION_STOCK_PRICES,
    COLLECTION_TSNE,
    DB_NAME,
)

MONGO_URI = "mongodb://localhost:27017"

SCRIPT_DIR = Path(__file__).resolve().parent
DATA_DIR = SCRIPT_DIR / "data"
STOCKDATA_DIR = DATA_DIR / "stockdata"
STOCKNEWS_DIR = DATA_DIR / "stocknews"
TSNE_CSV = DATA_DIR / "tsne.csv"

NEWS_LABELS = ("Title", "Date", "URL", "Content")
PRICE_COLUMNS = ("date", "open", "high", "low", "close")

EMPTY_NEWS_CONTENT = (
    "This article summary is limited because the original source did not provide a clean "
    "full-text version in the local dataset after removing webpage noise, unrelated headlines, "
    "advertisements, and boilerplate text. The item is still included because its title, date, "
    "ticker association, and available metadata indicate that it is connected to the selected stock. "
    "In the context of this visualization, it can still be useful as a signal of market attention, "
    "company-related discussion, or sector-level activity during the selected time period. Users should "
    "treat this entry as a lightweight news reference rather than a complete article body, and can "
    "compare it with the stock price chart and t-SNE view to understand when the item appeared "
    "relative to broader stock behavior."
)

GENERIC_KEYWORDS = frozenset(
    {
        "record", "beats", "profit", "profits", "today", "week", "year", "stock",
        "stocks", "market", "markets", "rise", "rises", "rose", "jump", "jumps",
        "fall", "falls", "high", "low", "best", "top", "watch", "read", "show",
        "open", "close", "trading", "investors", "wall", "street", "earnings",
        "sells", "sold", "sell", "million", "worth", "about", "shares", "share",
        "company", "says", "said", "could", "would", "will", "after", "before",
    }
)

PRIORITY_ANCHOR_PATTERNS = (
    r"\bTAIPEI,\s*\w+\s+\d+,\s*\([^)]+\)\s*[-–—]",
    r"\(Reuters\)\s*[-–—]\s*",
    r"/PRNewswire/\s*--\s*",
    r"\bPRNewswire\s*--\s*",
    r"\bTaiwan Semiconductor\b",
    r"\bSemiconductor giant Nvidia\b",
    r"\bWe recently published\b",
    r"\bInitial data shows\b",
    r"\bAccording to the latest\b",
)

TITLE_STOPWORDS = frozenset(
    {
        "the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "with", "from", "by",
        "as", "is", "are", "was", "were", "this", "that", "it", "its", "into", "over",
        "after", "before", "your", "has", "have", "will", "out", "how", "why", "what",
        "when", "who", "new", "all", "any", "but", "not", "now", "may", "can", "just",
        "more", "some", "than", "then", "here", "also", "only", "very", "most", "much",
        "such", "other", "about", "stock", "stocks", "market", "markets", "best", "top",
        "list", "watch", "read", "here", "what", "need", "know", "today", "week", "year",
    }
)

EXACT_NOISE_PHRASES = (
    "Oops, something went wrong",
    "Tip: Try a valid symbol or a specific company name for relevant results",
    "Sign in to access your portfolio",
    "Try again.",
    "Unlock stock picks and a broker-level newsfeed that powers Wall Street.",
)

FOOTER_MARKERS = (
    "Tip: Try a valid symbol",
    "Sign in to access your portfolio",
    "Try again.",
    "Disclosure:",
    "This article is originally published",
    "This article by Simply Wall St is general in nature",
    "Have feedback on this article?",
    "Concerned about the content?",
    "View original content:",
    "For Press & Corporate Inquiries",
    "For Sales -",
    "For Media -",
    "Logo:",
    "SOURCE ",
    "Never miss an important update on your stock portfolio",
    "About Future Market Insights",
    "Stay updated on the most important news stories",
    "Alternatively, explore our Community",
    "Simply Wall St has no position in any stocks mentioned",
)

GUARD_OPENING_MARKERS = (
    "oops",
    "tip:",
    "why your water bill",
    "stock market today",
    "treasury secretary",
    "stocks drift",
    "trump",
    "dow",
    "s&p 500",
    "nasdaq hits record",
    "bitcoin bounced",
    "tax refunds shoot up",
    "wall street strategists",
    "gen z is driving",
)

YAHOO_HEADLINE_MARKERS = (
    "s&p 500",
    "dow",
    "nasdaq",
    "bitcoin bounced",
    "water bill",
    "treasury secretary",
    "stocks drift",
    "stock market today",
    "trump says",
    "trump orders",
    "jpmorgan profits",
    "goldman sachs q1",
    "us stocks",
    "stocks soar",
    "stocks sink",
    "stocks rise",
    "stocks post",
    "stocks turned",
    "stocks pull",
    "stocks rebounded",
    "oil prices",
    "oil surges",
    "oil tumbled",
    "oil rose",
    "inflation soars",
    "fed officials",
    "motley fool",
    "appeared first on",
    "yahoo finance",
    "strictlyvc",
    "techcrunch brand",
    "crunchboard",
    "partner content",
    "latest ai amazon",
)

ARTICLE_STYLE_STARTS = (
    "we recently published",
    "in this article",
    "initial data shows",
    "the company said",
    "according to",
    "semiconductor giant",
)

NEWSWIRE_MARKERS = (
    "reuters",
    "prnewswire",
    "business wire",
    "globenewswire",
    "access newswire",
    "new york",
    "newark",
    "san francisco",
    "los angeles",
    "washington",
    "london",
    "taipei",
    "toronto",
    "chicago",
    "dallas",
    "boston",
)

CODE_MARKERS = (
    "@react-refresh",
    "injectIntoGlobalHook",
    "/@vite/client",
    "/src/main.jsx",
    "/src/main.tsx",
    '<div id="root">',
)


def normalize_whitespace(text: str) -> str:
    if not text:
        return ""
    return re.sub(r"\s+", " ", text.replace("\r", " ")).strip()


def strip_html(text: str) -> str:
    if not text:
        return ""
    cleaned = re.sub(r"<script[^>]*>[\s\S]*?</script>", " ", text, flags=re.IGNORECASE)
    cleaned = re.sub(r"<style[^>]*>[\s\S]*?</style>", " ", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"<[^>]+>", " ", cleaned)
    return html.unescape(cleaned).strip()


def normalize_news_text(raw: str) -> str:
    return (raw or "").replace("\ufeff", "").replace("\r\n", "\n").replace("\r", "\n")


def _extract_labeled_field(text: str, label: str) -> str:
    """Read one labeled section (colon or block layout)."""
    colon_match = re.search(
        rf"^{label}\s*:\s*(.*?)(?=^(?:Title|Date|URL|Content)\s*(?:\n|:)|\Z)",
        text,
        flags=re.IGNORECASE | re.MULTILINE | re.DOTALL,
    )
    if colon_match:
        return colon_match.group(1).strip()

    block_match = re.search(
        rf"^{label}\s*\n(.*?)(?=^(?:Title|Date|URL|Content)\s*(?:\n|:)|\Z)",
        text,
        flags=re.IGNORECASE | re.MULTILINE | re.DOTALL,
    )
    if block_match:
        return block_match.group(1).strip()
    return ""


def _extract_body_after_headers(text: str) -> str:
    """Many files omit a Content label; body follows URL (or Date) block."""
    markers = [
        r"^URL\s*:\s*[^\n]*\n+",
        r"^URL\s*\n[^\n]*\n+",
        r"^Date\s*:\s*[^\n]*\n+",
        r"^Date\s*\n[^\n]*\n+",
    ]
    for pattern in markers:
        match = re.search(pattern, text, flags=re.IGNORECASE | re.MULTILINE)
        if match:
            return text[match.end() :].strip()
    return ""


def remove_exact_noise_phrases(text: str) -> str:
    t = text
    for phrase in EXACT_NOISE_PHRASES:
        t = re.sub(re.escape(phrase), " ", t, flags=re.IGNORECASE)
    t = re.sub(
        r"\bNever miss an important update on your stock portfolio\b[\s\S]*?\bFREE\.\s*",
        " ",
        t,
        flags=re.IGNORECASE,
    )
    return normalize_whitespace(t)


def get_title_keywords(title: str, ticker: str = "") -> list[str]:
    """Meaningful words from the headline used to find the real article start."""
    raw = re.sub(r"[^\w\s']", " ", (title or "").lower())
    tokens = [t for t in raw.split() if t]
    keywords: list[str] = []

    for token in tokens:
        if token in TITLE_STOPWORDS:
            continue
        if len(token) >= 4:
            keywords.append(token)
        elif len(token) >= 3 and token.isupper():
            keywords.append(token.lower())

    if ticker:
        keywords.append(ticker.lower())

    # Dedupe while preserving order
    seen = set()
    out = []
    for kw in keywords:
        if kw not in seen:
            seen.add(kw)
            out.append(kw)
    return out


def split_sentences(text: str) -> list[str]:
    if not text:
        return []
    parts = re.split(r"(?<=[.!?])\s+(?=[A-Z0-9\"'(]|$)", text)
    return [p.strip() for p in parts if p and p.strip()]


def _count_keyword_hits(sentence: str, keywords: list[str]) -> int:
    lower = sentence.lower()
    return sum(1 for kw in keywords if kw and kw in lower)


def _strong_keyword_hits(sentence: str, keywords: list[str]) -> list[str]:
    lower = sentence.lower()
    return [kw for kw in keywords if kw not in GENERIC_KEYWORDS and kw in lower]


def _has_newswire_or_city(sentence: str) -> bool:
    lower = sentence.lower()
    if re.search(r"\(Reuters\)\s*[-–—]", sentence, re.IGNORECASE):
        return True
    if re.search(r"/PRNewswire/\s*--", sentence, re.IGNORECASE):
        return True
    if re.search(
        r"\b(?:NEW YORK|NEWARK|SAN FRANCISCO|LOS ANGELES|WASHINGTON|LONDON|TORONTO|CHICAGO|DALLAS|BOSTON|SEATTLE|TAIPEI)\b",
        sentence,
        re.IGNORECASE,
    ):
        return True
    return any(marker in lower for marker in NEWSWIRE_MARKERS)


def _has_article_style_start(sentence: str) -> bool:
    lower = sentence.lower()
    return any(lower.startswith(start) or f" {start}" in lower for start in ARTICLE_STYLE_STARTS)


def _has_ticker_exchange_pattern(sentence: str) -> bool:
    return bool(
        re.search(
            r"\b[A-Z][A-Za-z0-9&'.-]*(?:\s+[A-Z][A-Za-z0-9&'.-]*){0,5}\s*\((?:NYSE|NASDAQ|AMEX|OTC):[A-Z]{1,5}\)",
            sentence,
        )
    )


def is_noise_sentence(sentence: str, keywords: list[str], ticker: str) -> bool:
    lower = sentence.lower()
    if len(sentence) < 20:
        return True

    hits = _count_keyword_hits(sentence, keywords)
    has_ticker = bool(ticker and re.search(rf"\b{re.escape(ticker)}\b", sentence, re.IGNORECASE))

    # Long Yahoo collage: do not discard whole block; anchor trim will slice inside it.
    if len(sentence) > 220 and (hits >= 1 or has_ticker or _has_newswire_or_city(sentence)):
        return False

    if hits >= 2 or _has_article_style_start(sentence) or _has_ticker_exchange_pattern(sentence):
        return False
    if has_ticker and hits >= 1:
        return False
    if _has_newswire_or_city(sentence) and len(sentence) > 60:
        return False

    if any(marker in lower for marker in GUARD_OPENING_MARKERS):
        return True
    if re.search(r"\bOops\b", sentence, re.IGNORECASE):
        return True
    if re.search(r"\bTip:\s*Try a valid symbol", sentence, re.IGNORECASE):
        return True
    if len(sentence) < 160 and any(marker in lower for marker in YAHOO_HEADLINE_MARKERS):
        return True
    if len(sentence) < 140 and hits == 0 and not has_ticker:
        return True
    return False


def is_relevant_sentence(sentence: str, keywords: list[str], ticker: str) -> bool:
    if is_noise_sentence(sentence, keywords, ticker):
        return False

    strong = _strong_keyword_hits(sentence, keywords)
    if len(strong) >= 2:
        return True
    if len(strong) >= 1 and (_has_newswire_or_city(sentence) or len(sentence) > 120):
        return True
    if ticker and re.search(rf"\b{re.escape(ticker)}\b", sentence, re.IGNORECASE):
        if _has_newswire_or_city(sentence) or _has_article_style_start(sentence) or len(strong) >= 1:
            return True
        if len(sentence) > 200 and not any(m in sentence.lower() for m in YAHOO_HEADLINE_MARKERS[:12]):
            return True
    if _has_newswire_or_city(sentence) and len(strong) >= 1:
        return True
    if _has_article_style_start(sentence) and len(strong) >= 1:
        return True
    if _has_ticker_exchange_pattern(sentence):
        return True
    return False


def _sentence_start_before(text: str, anchor: int) -> int:
    window_start = max(0, anchor - 500)
    window = text[window_start:anchor]
    rel = window.rfind(". ")
    if rel != -1:
        return window_start + rel + 2
    return max(0, anchor - 80)


def find_text_anchor(text: str, keywords: list[str], ticker: str) -> tuple[int | None, bool]:
    """Return (start_index, is_priority_anchor). Priority anchors use exact cut."""
    for pattern in PRIORITY_ANCHOR_PATTERNS:
        m = re.search(pattern, text, re.IGNORECASE)
        if m and m.start() >= 40:
            return m.start(), True

    strong = [kw for kw in keywords if kw not in GENERIC_KEYWORDS]
    for kw in sorted(strong, key=len, reverse=True):
        m = re.search(rf"\b{re.escape(kw)}\b", text, re.IGNORECASE)
        if m and m.start() >= 200:
            return m.start(), False

    if ticker:
        for m in re.finditer(rf"\b{re.escape(ticker)}\b", text, re.IGNORECASE):
            if m.start() >= 350:
                return m.start(), False

    return None, False


def _anchor_slice_start(text: str, anchor: int, is_priority: bool) -> int:
    if is_priority:
        return anchor
    return _sentence_start_before(text, anchor)


def refine_with_anchor(text: str, keywords: list[str], ticker: str) -> tuple[str, bool]:
    anchor, is_priority = find_text_anchor(text, keywords, ticker)
    if anchor is None or anchor < 40:
        return text, False
    start = _anchor_slice_start(text, anchor, is_priority)
    if start <= 0:
        return text, False
    return text[start:].strip(), True


def trim_to_first_relevant_sentence(text: str, keywords: list[str], ticker: str) -> tuple[str, bool]:
    """Drop leading sentences until the first one tied to the title/ticker."""
    sentences = split_sentences(text)
    if not sentences:
        return "", False

    first_idx = None
    for i, sentence in enumerate(sentences):
        if is_relevant_sentence(sentence, keywords, ticker):
            first_idx = i
            break

    trimmed = ""
    leading_trimmed = False

    if first_idx is not None:
        trimmed = " ".join(sentences[first_idx:]).strip()
        leading_trimmed = first_idx > 0
    else:
        anchor, is_priority = find_text_anchor(text, keywords, ticker)
        if anchor is None:
            return "", False
        start = _anchor_slice_start(text, anchor, is_priority)
        trimmed = text[start:].strip()
        leading_trimmed = start > 0

    refined, anchor_trimmed = refine_with_anchor(trimmed, keywords, ticker)
    return refined, leading_trimmed or anchor_trimmed


def apply_opening_guard(text: str, keywords: list[str], ticker: str) -> str:
    """Keep removing leading sentences while they still look like Yahoo noise."""
    sentences = split_sentences(text)
    while sentences:
        first = sentences[0]
        lower = first.lower()
        if is_relevant_sentence(first, keywords, ticker) and not any(
            g in lower for g in GUARD_OPENING_MARKERS
        ):
            break
        sentences.pop(0)
    return " ".join(sentences).strip()


def trim_trailing_stories(body: str) -> str:
    if not body:
        return ""

    reporting = re.search(r"\(Reporting by[^;]+;\s*Editing by[^)]+\)", body, re.IGNORECASE)
    if reporting and reporting.end() > 120:
        body = body[: reporting.end()]

    for marker in FOOTER_MARKERS:
        idx = body.lower().find(marker.lower())
        if idx > 150:
            body = body[:idx]

    for pattern in (
        r"\bappeared first on\b",
        r"\bThe post \w+",
        r"\bSOURCE [A-Z]",
    ):
        m = re.search(pattern, body, re.IGNORECASE)
        if m and m.start() > 150:
            body = body[: m.start()]

    second_story = re.search(
        r"\)\s+(?:WASHINGTON|NEW YORK|NEWARK|DALLAS|LOS ANGELES|TORONTO|CHICAGO|BOSTON|LONDON|SAN FRANCISCO)\s*\([A-Z]{2,}\)\s*[-–—]\s*",
        body,
        re.IGNORECASE,
    )
    if second_story and second_story.start() > 150:
        body = body[: second_story.start() + 1]

    region_story = re.search(r"\)\s+[A-Z][a-z]+(?:,\s*[A-Z][a-z]+)?-based\s+\w+", body)
    if region_story and region_story.start() > 200:
        body = body[: region_story.start() + 1]

    tip = body.lower().rfind("tip: try a valid symbol")
    if tip > 200:
        body = body[:tip]

    if body.lower().rstrip().endswith("try again."):
        body = re.sub(r"\s*Try again\.?\s*$", "", body, flags=re.IGNORECASE)

    return body.strip()


def is_still_noisy(text: str, keywords: list[str], ticker: str) -> bool:
    if not text or len(text) < 80:
        return True
    if any(marker in text for marker in CODE_MARKERS):
        return True
    first = split_sentences(text)[:1]
    if first and not is_relevant_sentence(first[0], keywords, ticker):
        lower = first[0].lower()
        if any(g in lower for g in GUARD_OPENING_MARKERS):
            return True
    if re.search(r"Oops,?\s*something went wrong", text, re.IGNORECASE):
        return True
    if text.lower().count("appeared first on") >= 2:
        return True
    return False


def clean_news_content(
    raw_content: str, title: str = "", ticker: str = ""
) -> tuple[str, bool]:
    """
    Strip Yahoo headline blobs; return (cleaned_text, leading_noise_was_trimmed).
    """
    text = strip_html(raw_content or "")
    text = normalize_whitespace(text)
    if not text:
        return EMPTY_NEWS_CONTENT, False

    keywords = get_title_keywords(title, ticker)
    text = remove_exact_noise_phrases(text)
    trimmed = False

    anchor, is_priority = find_text_anchor(text, keywords, ticker)
    if anchor is not None:
        start = _anchor_slice_start(text, anchor, is_priority)
        if start > 0:
            text = text[start:].strip()
            trimmed = True
    else:
        text, trimmed = trim_to_first_relevant_sentence(text, keywords, ticker)
        if not text:
            return EMPTY_NEWS_CONTENT, trimmed
        text, anchor_trimmed = refine_with_anchor(text, keywords, ticker)
        trimmed = trimmed or anchor_trimmed

    text = apply_opening_guard(text, keywords, ticker)
    text = trim_trailing_stories(text)
    text = normalize_whitespace(text)

    if is_still_noisy(text, keywords, ticker):
        return EMPTY_NEWS_CONTENT, trimmed

    return text, trimmed


def parse_news_file(raw: str, ticker: str = "") -> dict[str, str]:
    """Parse block-style or colon-style labeled news txt files."""
    text = normalize_news_text(raw)
    fields = {label.lower(): _extract_labeled_field(text, label) for label in NEWS_LABELS}

    content = fields.get("content") or ""
    if not content.strip():
        content = _extract_body_after_headers(text)

    title = (fields.get("title") or "").strip()
    fields["title"] = title
    fields["date"] = (fields.get("date") or "").strip()
    fields["url"] = (fields.get("url") or "").strip()
    cleaned, trimmed = clean_news_content(content, title=title, ticker=ticker)
    fields["content"] = cleaned
    fields["_trimmed"] = trimmed

    return fields


def normalize_date_string(value) -> str:
    s = str(value).strip()
    if not s or s.lower() == "nan":
        return ""
    # Keep full timestamp when present; trim to date if it looks like ISO datetime.
    if len(s) >= 10 and s[4] == "-" and s[7] == "-":
        return s
    return s


def read_stock_csv(csv_path: Path) -> list[dict]:
    df = pd.read_csv(csv_path)
    df.columns = [str(c).strip().lower() for c in df.columns]

    missing = [c for c in PRICE_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(f"{csv_path.name}: missing columns {missing} (have {list(df.columns)})")

    records = []
    for _, row in df.iterrows():
        date_str = normalize_date_string(row["date"])
        if not date_str:
            continue

        record = {
            "date": date_str,
            "open": float(row["open"]),
            "high": float(row["high"]),
            "low": float(row["low"]),
            "close": float(row["close"]),
        }
        if "volume" in df.columns and pd.notna(row.get("volume")):
            record["volume"] = float(row["volume"])
        records.append(record)

    return records


def read_tsne_csv(csv_path: Path) -> list[dict]:
    df = pd.read_csv(csv_path)
    df.columns = [str(c).strip().lower() for c in df.columns]

    ticker_col = "ticker" if "ticker" in df.columns else None
    x_col = "x" if "x" in df.columns else "tsne_1" if "tsne_1" in df.columns else None
    y_col = "y" if "y" in df.columns else "tsne_2" if "tsne_2" in df.columns else None
    sector_col = (
        "sector"
        if "sector" in df.columns
        else "category"
        if "category" in df.columns
        else None
    )

    if not ticker_col or not x_col or not y_col:
        raise ValueError(
            f"{csv_path.name}: need ticker + x/y (or tsne_1/tsne_2); columns: {list(df.columns)}"
        )

    rows = []
    for _, row in df.iterrows():
        ticker = str(row[ticker_col]).strip()
        if not ticker:
            continue
        sector = "Unknown"
        if sector_col and pd.notna(row.get(sector_col)):
            sector = str(row[sector_col]).strip() or "Unknown"
        rows.append(
            {
                "ticker": ticker,
                "x": float(row[x_col]),
                "y": float(row[y_col]),
                "sector": sector,
            }
        )
    return rows


def clear_collections(db) -> None:
    for name in (COLLECTION_STOCK_PRICES, COLLECTION_STOCK_NEWS, COLLECTION_TSNE):
        db[name].delete_many({})


def create_indexes(db) -> None:
    db[COLLECTION_STOCK_PRICES].create_index("ticker", unique=True)
    db[COLLECTION_STOCK_NEWS].create_index("ticker")
    db[COLLECTION_TSNE].create_index("ticker", unique=True)


def import_stock_prices(db) -> int:
    if not STOCKDATA_DIR.is_dir():
        print(f"Warning: stock data folder not found: {STOCKDATA_DIR}")
        return 0

    csv_files = sorted(STOCKDATA_DIR.glob("*.csv"))
    if not csv_files:
        print(f"Warning: no CSV files in {STOCKDATA_DIR}")
        return 0

    docs = []
    for csv_path in csv_files:
        ticker = csv_path.stem.upper()
        try:
            records = read_stock_csv(csv_path)
        except (ValueError, OSError) as err:
            print(f"  Skipped {csv_path.name}: {err}")
            continue
        if not records:
            print(f"  Skipped {csv_path.name}: no rows")
            continue
        docs.append({"ticker": ticker, "records": records})

    if docs:
        db[COLLECTION_STOCK_PRICES].insert_many(docs)
    return len(docs)


def import_stock_news(db) -> int:
    if not STOCKNEWS_DIR.is_dir():
        print(f"Warning: stock news folder not found: {STOCKNEWS_DIR}")
        return 0

    articles = []
    fallback_count = 0
    trimmed_count = 0
    ticker_dirs = sorted(p for p in STOCKNEWS_DIR.iterdir() if p.is_dir())
    if not ticker_dirs:
        print(f"Warning: no ticker subfolders in {STOCKNEWS_DIR}")
        return 0

    for ticker_dir in ticker_dirs:
        ticker = ticker_dir.name.upper()
        for txt_path in sorted(ticker_dir.glob("*.txt")):
            try:
                raw = txt_path.read_text(encoding="utf-8", errors="replace")
            except OSError as err:
                print(f"  Skipped {txt_path}: {err}")
                continue

            parsed = parse_news_file(raw, ticker=ticker)
            title = parsed.get("title") or txt_path.stem
            content = parsed.get("content") or EMPTY_NEWS_CONTENT
            if parsed.get("_trimmed"):
                trimmed_count += 1
            if content == EMPTY_NEWS_CONTENT:
                fallback_count += 1

            articles.append(
                {
                    "ticker": ticker,
                    "title": title,
                    "date": parsed.get("date") or "",
                    "url": parsed.get("url") or "",
                    "content": content,
                }
            )

    if articles:
        db[COLLECTION_STOCK_NEWS].insert_many(articles)

    print(f"Imported {len(articles)} news articles.")
    print(f"  Leading Yahoo noise trimmed: {trimmed_count}")
    if fallback_count:
        print(f"  No useful content found: {fallback_count}")

    return len(articles)


def import_tsne(db) -> int:
    if not TSNE_CSV.is_file():
        print(f"Warning: t-SNE file not found: {TSNE_CSV}")
        return 0

    try:
        rows = read_tsne_csv(TSNE_CSV)
    except (ValueError, OSError) as err:
        print(f"Warning: could not read t-SNE data: {err}")
        return 0

    if rows:
        db[COLLECTION_TSNE].insert_many(rows)
    return len(rows)


def main() -> None:
    print(f"Data directory: {DATA_DIR}")

    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    db = client[DB_NAME]

    try:
        client.admin.command("ping")
    except Exception as err:
        print(f"Could not connect to MongoDB at {MONGO_URI}: {err}")
        print("Start MongoDB first (e.g. brew services start mongodb-community)")
        return

    print(f"Connected to MongoDB (database: {DB_NAME})")

    clear_collections(db)
    print("Cleared existing stock_prices, stock_news, and tsne_projection data.")

    price_count = import_stock_prices(db)
    news_count = import_stock_news(db)
    tsne_count = import_tsne(db)

    create_indexes(db)

    print(f"Imported {price_count} stock price documents.")
    print(f"Imported {news_count} news articles.")
    print(f"Imported {tsne_count} t-SNE rows.")
    print("Indexes created on ticker for all three collections.")

    client.close()


if __name__ == "__main__":
    main()
