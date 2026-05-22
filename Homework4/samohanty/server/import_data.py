"""
Import HW1/HW2 data into MongoDB.

Reads files from ./data/ and populates three collections in the
'stock_sm' database:

  - stock_prices: OHLCV records, one per (ticker, date)
  - stock_news:   articles, one per file, with a Stock field for filtering
  - stock_tsne:   t-SNE coordinates, one per ticker

Run once before starting the FastAPI server:

    python import_data.py
"""

from __future__ import annotations

import csv
import os
import re
import sys
from datetime import datetime
from pathlib import Path

from pymongo import MongoClient, ASCENDING


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
DB_NAME = "stock_sm"
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017")

DATA_DIR = Path(__file__).parent / "data"
STOCKDATA_DIR = DATA_DIR / "stockdata"
STOCKNEWS_DIR = DATA_DIR / "stocknews"
TSNE_CSV = DATA_DIR / "tsne.csv"


# ---------------------------------------------------------------------------
# Sector lookup (ticker -> sector). Must match the labels used in tsne.csv.
# ---------------------------------------------------------------------------
SECTOR_OF: dict[str, str] = {
    # Energy
    "XOM": "Energy", "CVX": "Energy", "HAL": "Energy",
    # Industrials
    "CAT": "Industrials", "MMM": "Industrials", "DAL": "Industrials",
    # Consumer Discretionary
    "AMZN": "Consumer_Discretionary", "TSLA": "Consumer_Discretionary", "HD": "Consumer_Discretionary",
    "MCD": "Consumer_Discretionary",
    # Consumer Staples
    "KO": "Consumer_Staples", "PG": "Consumer_Staples",
    # Healthcare
    "JNJ": "Healthcare", "PFE": "Healthcare", "UNH": "Healthcare",
    # Financials
    "JPM": "Financials", "GS": "Financials", "BAC": "Financials",
    # Information Technology
    "AAPL": "Information_Technology", "NVDA": "Information_Technology",
}


# ---------------------------------------------------------------------------
# Importers
# ---------------------------------------------------------------------------
def import_stock_prices(db) -> int:
    """Read all <TICKER>.csv files and insert price records."""
    coll = db["stock_prices"]
    coll.drop()  # idempotent — easier to re-run
    docs: list[dict] = []
    files = sorted(STOCKDATA_DIR.glob("*.csv"))
    for fpath in files:
        ticker = fpath.stem
        with fpath.open(newline="") as fh:
            reader = csv.DictReader(fh)
            for row in reader:
                date_str = (row.get("Date") or "").strip()
                if not date_str:
                    continue
                # Date may include time/timezone — keep just YYYY-MM-DD.
                date_str = date_str[:10]
                try:
                    date_val = datetime.strptime(date_str, "%Y-%m-%d")
                except ValueError:
                    continue
                try:
                    doc = {
                        "Ticker": ticker,
                        "Date": date_val,
                        "Open": float(row["Open"]),
                        "High": float(row["High"]),
                        "Low": float(row["Low"]),
                        "Close": float(row["Close"]),
                        "Volume": float(row.get("Volume") or 0),
                    }
                except (KeyError, ValueError):
                    continue
                docs.append(doc)
    if docs:
        coll.insert_many(docs)
    coll.create_index([("Ticker", ASCENDING), ("Date", ASCENDING)])
    print(f"  stock_prices : {len(docs):,} records across {len(files)} tickers")
    return len(docs)


_FIELD_RE = re.compile(r"^(Title|Date|URL):\s*(.+)$", re.IGNORECASE)


def _parse_news_file(text: str) -> dict:
    """Extract Title/Date/URL header fields and remaining content."""
    title = ""
    date = ""
    url = ""
    content_lines: list[str] = []
    header_done = False
    for line in text.splitlines():
        if not header_done:
            m = _FIELD_RE.match(line.strip())
            if m:
                key, value = m.group(1).lower(), m.group(2).strip()
                if key == "title":
                    title = value
                elif key == "date":
                    date = value
                elif key == "url":
                    url = value
                continue
            if line.strip() == "":
                # blank line ends the header
                if title or date or url:
                    header_done = True
                continue
            header_done = True
        content_lines.append(line)
    return {
        "Title": title,
        "Date": date,
        "URL": url,
        "Content": "\n".join(content_lines).strip(),
    }


def import_stock_news(db) -> int:
    """All news articles go into one collection, filtered by `Stock`."""
    coll = db["stock_news"]
    coll.drop()
    docs: list[dict] = []
    for ticker_dir in sorted(STOCKNEWS_DIR.iterdir()):
        if not ticker_dir.is_dir():
            continue
        ticker = ticker_dir.name
        for fpath in sorted(ticker_dir.glob("*.txt")):
            try:
                text = fpath.read_text(encoding="utf-8", errors="ignore")
            except OSError:
                continue
            parsed = _parse_news_file(text)
            docs.append({
                "Stock": ticker,
                "Filename": fpath.name,
                **parsed,
            })
    if docs:
        coll.insert_many(docs)
    coll.create_index([("Stock", ASCENDING)])
    print(f"  stock_news   : {len(docs):,} articles")
    return len(docs)


def import_tsne(db) -> int:
    """Each row of tsne.csv -> one document."""
    coll = db["stock_tsne"]
    coll.drop()
    docs: list[dict] = []
    if not TSNE_CSV.exists():
        print(f"  WARNING: {TSNE_CSV} not found, skipping t-SNE import")
        return 0
    with TSNE_CSV.open(newline="") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            ticker = (row.get("ticker") or row.get("Ticker") or "").strip()
            if not ticker:
                continue
            try:
                x = float(row["x"])
                y = float(row["y"])
            except (KeyError, ValueError):
                continue
            sector = (row.get("sector") or row.get("Sector")
                      or SECTOR_OF.get(ticker, "Other")).strip()
            docs.append({"Ticker": ticker, "x": x, "y": y, "Sector": sector})
    if docs:
        coll.insert_many(docs)
    coll.create_index([("Ticker", ASCENDING)])
    print(f"  stock_tsne   : {len(docs)} points")
    return len(docs)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main() -> int:
    print(f"Connecting to {MONGO_URI} -> {DB_NAME}")
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=3000)
    try:
        client.admin.command("ping")
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR: cannot reach MongoDB at {MONGO_URI}: {exc}")
        print("Make sure mongod is running (e.g. `brew services start mongodb-community`).")
        return 1

    db = client[DB_NAME]

    if not STOCKDATA_DIR.exists():
        print(f"ERROR: {STOCKDATA_DIR} does not exist.")
        return 1

    print("Importing data...")
    import_stock_prices(db)
    import_stock_news(db)
    import_tsne(db)

    # quick summary
    print("Collections in DB:")
    for name in db.list_collection_names():
        print(f"  {name}: {db[name].count_documents({})} docs")
    print("Done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
