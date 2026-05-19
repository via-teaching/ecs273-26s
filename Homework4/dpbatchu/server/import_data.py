"""
import_data.py — Import stock data into MongoDB for ECS 273 HW4.

Reads:
  server/data/stockdata/*.csv       (yfinance OHLCV data)
  server/data/stocknews/*/news.json (news articles per ticker)
  server/data/tsne.csv              (t-SNE 2D projection)

Collections written:
  stock_prices      — one doc per ticker, records array
  stock_news        — one doc per article, with ticker field
  tsne_projection   — one doc per ticker

Safe to run multiple times: drops and recreates each collection.
"""

import os
import csv
import json
from pathlib import Path
from pymongo import MongoClient, ASCENDING

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "stock_dp")

DATA_DIR = Path(__file__).parent / "data"
STOCKDATA_DIR = DATA_DIR / "stockdata"
STOCKNEWS_DIR = DATA_DIR / "stocknews"
TSNE_FILE = DATA_DIR / "tsne.csv"


def parse_date(s: str) -> str:
    """Normalize yfinance date strings — keep only YYYY-MM-DD portion."""
    return s.strip()[:10] if s else s


def import_prices(db) -> tuple[int, int]:
    col = db.stock_prices
    col.drop()
    col.create_index([("ticker", ASCENDING)], unique=True)

    csv_files = sorted(STOCKDATA_DIR.glob("*.csv"))
    if not csv_files:
        print(f"  No CSV files found in {STOCKDATA_DIR}")
        return 0, 0

    total_files = 0
    total_records = 0

    for csv_file in csv_files:
        ticker = csv_file.stem.upper()
        records = []

        try:
            with open(csv_file, newline="", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    try:
                        date_str = row.get("Date") or row.get("date") or ""
                        open_v  = float(row.get("Open")   or row.get("open")   or 0)
                        high_v  = float(row.get("High")   or row.get("high")   or 0)
                        low_v   = float(row.get("Low")    or row.get("low")    or 0)
                        close_v = float(row.get("Close")  or row.get("close")  or 0)
                        vol     = int(float(row.get("Volume") or row.get("volume") or 0))
                        if not date_str or close_v == 0:
                            continue
                        records.append({
                            "date":   parse_date(date_str),
                            "open":   open_v,
                            "high":   high_v,
                            "low":    low_v,
                            "close":  close_v,
                            "volume": vol,
                        })
                    except (ValueError, TypeError):
                        continue
        except Exception as e:
            print(f"  Warning: could not read {csv_file.name}: {e}")
            continue

        if records:
            col.insert_one({"ticker": ticker, "records": records})
            total_files += 1
            total_records += len(records)

    return total_files, total_records


def import_news(db) -> int:
    col = db.stock_news
    col.drop()
    col.create_index([("ticker", ASCENDING)])

    total = 0

    for stock_dir in sorted(STOCKNEWS_DIR.iterdir()):
        if not stock_dir.is_dir():
            continue
        ticker = stock_dir.name.upper()
        news_file = stock_dir / "news.json"
        if not news_file.exists():
            print(f"  Warning: no news.json in {stock_dir.name}/")
            continue

        try:
            with open(news_file, encoding="utf-8") as f:
                raw = json.load(f)
        except Exception as e:
            print(f"  Warning: could not read {news_file}: {e}")
            continue

        if isinstance(raw, list):
            articles = raw
        elif isinstance(raw, dict):
            articles = raw.get("articles") or raw.get("news") or raw.get("results") or []
        else:
            continue

        docs = []
        for art in articles:
            if not isinstance(art, dict):
                continue
            title   = str(art.get("title")   or art.get("Title")   or "").strip()
            date    = str(art.get("date")     or art.get("Date")    or "").strip()
            content = str(art.get("content")  or art.get("Content") or "").strip()
            url     = str(art.get("url")      or art.get("URL")     or art.get("link") or "").strip()
            if not title:
                continue
            doc = {"ticker": ticker, "title": title, "date": date, "content": content}
            if url:
                doc["url"] = url
            docs.append(doc)

        if docs:
            col.insert_many(docs)
            total += len(docs)

    return total


def import_tsne(db) -> int:
    col = db.tsne_projection
    col.drop()
    col.create_index([("ticker", ASCENDING)], unique=True)

    if not TSNE_FILE.exists():
        print(f"  Warning: {TSNE_FILE} not found")
        return 0

    rows = []
    try:
        with open(TSNE_FILE, newline="", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                ticker = (row.get("ticker") or row.get("Ticker") or row.get("stock") or "").strip().upper()
                if not ticker:
                    continue
                try:
                    x = float(row.get("x") or row.get("X") or 0)
                    y = float(row.get("y") or row.get("Y") or 0)
                    sector = (row.get("sector") or row.get("Sector") or "Other").strip()
                    rows.append({"ticker": ticker, "x": x, "y": y, "sector": sector})
                except (ValueError, TypeError):
                    continue
    except Exception as e:
        print(f"  Warning: could not read tsne.csv: {e}")
        return 0

    if rows:
        col.insert_many(rows)
    return len(rows)


if __name__ == "__main__":
    client = MongoClient(MONGODB_URI)
    db = client[DB_NAME]

    print(f"Database : {DB_NAME}")
    print(f"URI      : {MONGODB_URI}")
    print()

    print("Importing stock prices...")
    n_files, n_records = import_prices(db)
    print(f"  {n_files} CSV files, {n_records} price records")

    print("Importing news articles...")
    n_news = import_news(db)
    print(f"  {n_news} news articles")

    print("Importing t-SNE data...")
    n_tsne = import_tsne(db)
    print(f"  {n_tsne} t-SNE rows")

    print()
    print("=" * 40)
    print("Import summary")
    print("=" * 40)
    print(f"  Database          : {DB_NAME}")
    print(f"  Collections       : stock_prices, stock_news, tsne_projection")
    print(f"  Stock CSV files   : {n_files}")
    print(f"  Price records     : {n_records}")
    print(f"  News articles     : {n_news}")
    print(f"  t-SNE rows        : {n_tsne}")
