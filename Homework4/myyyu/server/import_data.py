"""Import HW1/HW2 data from server/data/ into MongoDB.

Idempotent: each collection is dropped before re-insert. Bad rows / unparseable
files are skipped with a warning so the import always finishes.

Run:
    python import_data.py
"""

from __future__ import annotations

import csv
import sys
from pathlib import Path
from typing import Iterable

from pymongo import ASCENDING, MongoClient

from data_scheme import (
    DB_NAME,
    NEWS_COLLECTION,
    PRICES_COLLECTION,
    TSNE_COLLECTION,
)

DATA_DIR = Path(__file__).resolve().parent / "data"
MONGO_URI = "mongodb://localhost:27017"


def warn(msg: str) -> None:
    print(f"  [warn] {msg}", file=sys.stderr)


def parse_float(value: str) -> float | None:
    try:
        cleaned = value.replace("$", "").replace(",", "").strip()
        if cleaned == "":
            return None
        return float(cleaned)
    except (TypeError, ValueError):
        return None


def import_stock_prices(db) -> int:
    coll = db[PRICES_COLLECTION]
    coll.drop()
    folder = DATA_DIR / "stockdata"
    csv_files = sorted(folder.glob("*.csv"))
    total = 0
    for csv_path in csv_files:
        ticker = csv_path.stem.upper()
        rows: list[dict] = []
        with csv_path.open(encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for line_num, raw in enumerate(reader, start=2):
                date = (raw.get("Date") or raw.get("date") or "").strip()
                op = parse_float(raw.get("Open") or raw.get("open") or "")
                hi = parse_float(raw.get("High") or raw.get("high") or "")
                lo = parse_float(raw.get("Low") or raw.get("low") or "")
                cl = parse_float(raw.get("Close") or raw.get("close") or "")
                vol = parse_float(raw.get("Volume") or raw.get("volume") or "")
                if not date or None in (op, hi, lo, cl):
                    warn(f"{csv_path.name}:{line_num} bad row, skipping")
                    continue
                rows.append({
                    "ticker": ticker,
                    "date": date,
                    "open": op,
                    "high": hi,
                    "low": lo,
                    "close": cl,
                    "volume": vol,
                })
        if rows:
            coll.insert_many(rows)
            total += len(rows)
            print(f"  {ticker}: {len(rows)} price rows")
        else:
            warn(f"no rows ingested from {csv_path.name}")
    coll.create_index([("ticker", ASCENDING), ("date", ASCENDING)])
    return total


def parse_news_file(path: Path) -> dict | None:
    """Parse a HW1 news .txt file. Format:

        Title: <headline>
        Date: 2026-04-07 18:00 UTC
        URL: <url>
        Content:
        <body line 1>
        <body line 2>
        ...
    """
    try:
        text = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        text = path.read_text(encoding="utf-8", errors="replace")
    lines = text.splitlines()
    title = date = url = None
    content_lines: list[str] = []
    in_content = False
    for line in lines:
        if in_content:
            content_lines.append(line)
            continue
        if line.startswith("Title:"):
            title = line[len("Title:"):].strip()
        elif line.startswith("Date:"):
            date = line[len("Date:"):].strip()
        elif line.startswith("URL:"):
            url = line[len("URL:"):].strip()
        elif line.startswith("Content:"):
            in_content = True
            tail = line[len("Content:"):].strip()
            if tail:
                content_lines.append(tail)
    if not title or not date:
        return None
    content = "\n".join(content_lines).strip()
    return {"title": title, "date": date, "url": url, "content": content}


def import_news(db) -> int:
    coll = db[NEWS_COLLECTION]
    coll.drop()
    root = DATA_DIR / "stocknews"
    total = 0
    for ticker_dir in sorted(p for p in root.iterdir() if p.is_dir()):
        ticker = ticker_dir.name.upper()
        rows: list[dict] = []
        for txt in sorted(ticker_dir.glob("*.txt")):
            parsed = parse_news_file(txt)
            if parsed is None:
                warn(f"could not parse {txt.relative_to(DATA_DIR)}")
                continue
            parsed["ticker"] = ticker
            rows.append(parsed)
        if rows:
            coll.insert_many(rows)
            total += len(rows)
            print(f"  {ticker}: {len(rows)} news articles")
        else:
            warn(f"no news ingested for {ticker}")
    coll.create_index([("ticker", ASCENDING)])
    coll.create_index([("ticker", ASCENDING), ("date", ASCENDING)])
    return total


def import_tsne(db) -> int:
    coll = db[TSNE_COLLECTION]
    coll.drop()
    path = DATA_DIR / "tsne.csv"
    rows: list[dict] = []
    with path.open(encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for line_num, raw in enumerate(reader, start=2):
            ticker = (raw.get("ticker") or raw.get("Ticker") or "").strip().upper()
            x = parse_float(raw.get("x") or raw.get("X") or "")
            y = parse_float(raw.get("y") or raw.get("Y") or "")
            sector = (raw.get("sector") or raw.get("Sector") or "Unknown").strip()
            if not ticker or x is None or y is None:
                warn(f"tsne.csv:{line_num} bad row, skipping")
                continue
            rows.append({"ticker": ticker, "x": x, "y": y, "sector": sector})
    if rows:
        coll.insert_many(rows)
    coll.create_index([("ticker", ASCENDING)], unique=True)
    return len(rows)


def main() -> int:
    print(f"Connecting to {MONGO_URI}, db={DB_NAME}")
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    try:
        client.admin.command("ping")
    except Exception as e:
        print(f"ERROR: cannot reach MongoDB at {MONGO_URI}: {e}", file=sys.stderr)
        return 2
    db = client[DB_NAME]

    print("\n[1/3] Importing stock prices...")
    n_prices = import_stock_prices(db)
    print(f"  -> {n_prices} price rows total")

    print("\n[2/3] Importing news...")
    n_news = import_news(db)
    print(f"  -> {n_news} news articles total")

    print("\n[3/3] Importing t-SNE...")
    n_tsne = import_tsne(db)
    print(f"  -> {n_tsne} t-SNE rows")

    print("\nDone.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
