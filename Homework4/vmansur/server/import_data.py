from __future__ import annotations

import asyncio
import csv
import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from motor.motor_asyncio import AsyncIOMotorClient


MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "stock_vmansur"

DATA_DIR = Path(__file__).resolve().parent / "data"
STOCKDATA_DIR = DATA_DIR / "stockdata"
STOCKNEWS_DIR = DATA_DIR / "stocknews"
TSNE_CSV = DATA_DIR / "tsne.csv"

STOCK_SECTOR_MAP: Dict[str, str] = {
    "AAPL": "Technology", "MSFT": "Technology", "NVDA": "Technology",
    "GOOGL": "Technology", "META": "Technology",
    "JPM": "Financials", "GS": "Financials", "BAC": "Financials",
    "JNJ": "Healthcare", "PFE": "Healthcare", "UNH": "Healthcare",
    "MCD": "Consumer", "NKE": "Consumer", "KO": "Consumer",
    "MMM": "Industrials", "CAT": "Industrials", "DAL": "Industrials",
    "XOM": "Energy", "CVX": "Energy", "HAL": "Energy",
}


def _to_float(value: str) -> Optional[float]:
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _normalize_date(raw: str) -> str:
    if not raw:
        return raw
    match = re.match(r"\s*(\d{4}-\d{2}-\d{2})", raw)
    return match.group(1) if match else raw.strip()


def load_stock_csv(path: Path) -> List[dict]:
    rows: List[dict] = []
    with path.open(newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            close = _to_float(row.get("Close", ""))
            open_ = _to_float(row.get("Open", ""))
            high = _to_float(row.get("High", ""))
            low = _to_float(row.get("Low", ""))
            if close is None or open_ is None or high is None or low is None:
                continue
            rows.append({
                "date": _normalize_date(row.get("Date", "")),
                "Open": open_,
                "High": high,
                "Low": low,
                "Close": close,
                "Volume": _to_float(row.get("Volume", "")) or 0.0,
            })
    rows.sort(key=lambda r: r["date"])
    return rows


_NEWS_LABEL_RE = re.compile(r"^(Title|Date|URL|Content)\s*:?\s*(.*)$", re.IGNORECASE)


def _canonical_label(raw: str) -> str:
    lower = raw.lower()
    if lower == "url":
        return "URL"
    return lower.capitalize()


def parse_news_file(path: Path, ticker: str) -> Optional[dict]:
    text = path.read_text(encoding="utf-8", errors="replace")
    lines = text.splitlines()

    fields: Dict[str, str] = {"Title": "", "Date": "", "URL": "", "Content": ""}
    content_lines: List[str] = []
    current_label: Optional[str] = None

    i = 0
    while i < len(lines):
        raw = lines[i]
        stripped = raw.strip()
        match = _NEWS_LABEL_RE.match(stripped)
        if match and stripped.lower() in {"title", "date", "url", "content"}:
            label = _canonical_label(match.group(1))
            if label == "Content":
                current_label = "Content"
                i += 1
                continue
            value_parts: List[str] = []
            i += 1
            while i < len(lines) and lines[i].strip() != "" and not _is_known_label(lines[i]):
                value_parts.append(lines[i].strip())
                i += 1
            fields[label] = " ".join(value_parts).strip()
            current_label = None
            continue

        if match and match.group(2):
            label = _canonical_label(match.group(1))
            if label == "Content":
                current_label = "Content"
                content_lines.append(match.group(2).strip())
            else:
                fields[label] = match.group(2).strip()
                current_label = None
            i += 1
            continue

        if current_label == "Content":
            content_lines.append(raw)
        i += 1

    if content_lines:
        fields["Content"] = "\n".join(content_lines).strip()

    if not fields["Title"] and not fields["Content"]:
        return None

    return {
        "Stock": ticker,
        "Title": fields["Title"] or path.stem,
        "Date": _normalize_news_date(fields["Date"]) or _date_from_filename(path.name),
        "URL": fields["URL"] or None,
        "content": fields["Content"],
    }


def _is_known_label(line: str) -> bool:
    return line.strip().lower() in {"title", "date", "url", "content"}


def _normalize_news_date(raw: str) -> str:
    match = re.match(r"\s*(\d{4}-\d{2}-\d{2})", raw or "")
    return match.group(1) if match else (raw or "").strip()


def _date_from_filename(filename: str) -> str:
    match = re.match(r"(\d{4}-\d{2}-\d{2})", filename)
    if match:
        return match.group(1)
    match = re.match(r"(\d{4})(\d{2})(\d{2})_", filename)
    if match:
        return f"{match.group(1)}-{match.group(2)}-{match.group(3)}"
    return ""


def load_tsne_csv(path: Path) -> List[dict]:
    rows: List[dict] = []
    with path.open(newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            ticker = (
                row.get("ticker") or row.get("Stock") or row.get("symbol") or row.get("name") or ""
            ).strip().upper()
            x = _to_float(row.get("x") or row.get("tsne_x") or row.get("dim1") or "")
            y = _to_float(row.get("y") or row.get("tsne_y") or row.get("dim2") or "")
            if not ticker or x is None or y is None:
                continue
            sector = (
                row.get("sector") or row.get("category") or row.get("label") or ""
            ).strip() or STOCK_SECTOR_MAP.get(ticker, "Unknown")
            rows.append({"Stock": ticker, "x": x, "y": y, "sector": sector})
    return rows


def discover_tickers() -> Tuple[List[str], List[Path]]:
    if not STOCKDATA_DIR.is_dir():
        return [], []
    csv_paths = sorted(STOCKDATA_DIR.glob("*.csv"))
    tickers = [p.stem.upper() for p in csv_paths]
    return tickers, csv_paths


async def import_all() -> None:
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    print(f"Connected to MongoDB at {MONGO_URL}, database: {DB_NAME}")

    tickers, csv_paths = discover_tickers()
    if not tickers:
        print(f"No CSV files found under {STOCKDATA_DIR}. Aborting.")
        return

    stock_list = db["stock_list"]
    await stock_list.delete_many({})
    await stock_list.insert_one({"tickers": tickers})
    print(f"Imported stock_list with {len(tickers)} tickers.")

    stock_prices = db["stock_prices"]
    await stock_prices.delete_many({})
    price_docs = []
    for ticker, csv_path in zip(tickers, csv_paths):
        series = load_stock_csv(csv_path)
        if not series:
            print(f"  - {ticker}: no usable rows, skipping.")
            continue
        price_docs.append({
            "name": ticker,
            "stock_series": series,
        })
    if price_docs:
        await stock_prices.insert_many(price_docs)
        await stock_prices.create_index("name", unique=True)
    print(f"Imported stock_prices for {len(price_docs)} tickers.")

    stock_news = db["stock_news"]
    await stock_news.delete_many({})
    news_docs: List[dict] = []
    if STOCKNEWS_DIR.is_dir():
        for ticker_dir in sorted(STOCKNEWS_DIR.iterdir()):
            if not ticker_dir.is_dir():
                continue
            ticker = ticker_dir.name.upper()
            for news_path in sorted(ticker_dir.glob("*.txt")):
                doc = parse_news_file(news_path, ticker)
                if doc:
                    news_docs.append(doc)
    if news_docs:
        await stock_news.insert_many(news_docs)
        await stock_news.create_index("Stock")
        await stock_news.create_index([("Stock", 1), ("Date", -1)])
    print(f"Imported stock_news with {len(news_docs)} articles.")

    tsne_collection = db["tsne"]
    await tsne_collection.delete_many({})
    if TSNE_CSV.is_file():
        tsne_rows = load_tsne_csv(TSNE_CSV)
        if tsne_rows:
            await tsne_collection.insert_many(tsne_rows)
            await tsne_collection.create_index("Stock", unique=True)
        print(f"Imported tsne collection with {len(tsne_rows)} rows.")
    else:
        print(f"  tsne.csv not found at {TSNE_CSV}; tsne collection left empty.")

    print("Done.")


if __name__ == "__main__":
    asyncio.run(import_all())
