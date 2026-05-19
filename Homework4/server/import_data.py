
"""
import_data.py
--------------
Reads all data from server/data/ and imports it into MongoDB.

Collections:
  stock_list   — one document with all ticker symbols
  stock_prices — one document per ticker, OHLC as array of records
  stock_news   — one document per article (all tickers in one collection)
  tsne_data    — one document per ticker with x, y, sector

Run from the server/ directory:
    python import_data.py
"""
import os
import pandas as pd
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import csv

# MongoDB connection (localhost, default port)
client = AsyncIOMotorClient("mongodb://localhost:27017")
db     = client["stock_jun_wu"]

stock_list_col   = db["stock_list"]
stock_prices_col = db["stock_prices"]
stock_news_col   = db["stock_news"]
tsne_col         = db["tsne_data"]

def discover_tickers() -> list[str]:
    """Return sorted list of tickers found in stockdata/ CSV files."""
    tickers = []
    stockdata_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "stockdata") # absolute path to stockdata
    if os.path.isdir(stockdata_dir):
        for fname in os.listdir(stockdata_dir):
            if fname.endswith(".csv"):
                tickers.append(fname.replace(".csv", ""))
    return sorted(tickers)

def read_stock_csv(ticker: str) -> list[dict]:
    """Parse stockdata/<ticker>.csv into a list of record dicts."""
    stockdata_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "stockdata")
    path = os.path.join(stockdata_dir, f"{ticker}.csv")
    records = []
    if not os.path.exists(path):
        print(f"  [WARN] No CSV found for {ticker}, skipping.")
        return records

    # parse each row into a record for MongoDB
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            date_val = row.get("Date") or row.get("date") or ""
            try:
                records.append({
                    "date":  date_val.strip(),
                    "Open":  float(row.get("Open")  or row.get("open")  or 0),
                    "High":  float(row.get("High")  or row.get("high")  or 0),
                    "Low":   float(row.get("Low")   or row.get("low")   or 0),
                    "Close": float(row.get("Close") or row.get("close") or 0),
                })
            except ValueError:
                continue
    return records

def parse_news_file(filepath: str, ticker: str) -> dict | None:
    """
    Parse a single news .txt file with this format:
        Title: <title>
        Date:  <date>
        URL:   <url>

        <article body>
    """
    try:
        with open(filepath, encoding="utf-8", errors="replace") as f:
            raw = f.read()
    except OSError:
        return None

    lines = raw.split("\n")
    title = date = url = ""
    content_start = 0

    # Get the metadata lines and find the title, data, url and contents
    for i, line in enumerate(lines):
        if line.startswith("Title: "):
            title = line[len("Title: "):].strip()
        elif line.startswith("Date: "):
            date = line[len("Date: "):].strip()
        elif line.startswith("URL: "):
            url = line[len("URL: "):].strip()
        elif line.strip() == "" and title and date:
            content_start = i + 1
            break

    content = "\n".join(lines[content_start:]).strip()

    if not title:
        return None

    return {
        "Stock":   ticker,
        "Title":   title,
        "Date":    date,
        "url":     url,
        "content": content,
    }

def read_all_news() -> list[dict]:
    """Walk stocknews/<ticker>/ directories and collect all article dicts."""
    articles = []
    stocknews_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "stocknews")
    if not os.path.isdir(stocknews_dir):
        print(f"  [WARN] stocknews/ not found at {stocknews_dir}")
        return articles

    # go through each ticker csv and parse the news txt files 
    for ticker in os.listdir(stocknews_dir):
        ticker_dir = os.path.join(stocknews_dir, ticker)
        if not os.path.isdir(ticker_dir):
            continue
        for fname in os.listdir(ticker_dir):
            if not fname.endswith(".txt"):
                continue
            article = parse_news_file(os.path.join(ticker_dir, fname), ticker)
            if article:
                articles.append(article)
    return articles

def read_tsne_csv() -> list[dict]:
    """Parse tsne.csv into a list of {Stock, x, y, sector} dicts."""
    rows = []
    tsne_csv = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "tsne.csv")
    if not os.path.exists(tsne_csv):
        print(f"  [WARN] tsne.csv not found at {tsne_csv}")
        return rows

    # parse each row into a tsne record for MongoDB
    with open(tsne_csv, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                rows.append({
                    "Stock":  (row.get("ticker") or row.get("Ticker") or "").strip(),
                    "x":      float(row.get("x") or row.get("X") or 0),
                    "y":      float(row.get("y") or row.get("Y") or 0),
                    "sector": (row.get("sector") or row.get("Sector") or "").strip(),
                })
            except ValueError:
                continue
    return rows

# import the list of all ticker symbols into the stock_list collection
async def import_stock_list(tickers: list[str]) -> None:
    await stock_list_col.drop()
    await stock_list_col.insert_one({"tickers": tickers})

# import the stock price series for each ticker into the stock_prices collection
async def import_stock_prices(tickers: list[str]) -> None:
    await stock_prices_col.drop()

    # read each ticker's CSV and create a doc for the ticker with the price series as an array of records
    docs = []
    for ticker in tickers:
        series = read_stock_csv(ticker)
        if series:
            docs.append({"name": ticker, "stock_series": series})
            print(f"  {ticker}: {len(series)} rows")

    if docs:
        await stock_prices_col.insert_many(docs)
        await stock_prices_col.create_index("name", unique=True)

# import all news articles into the stock_news collection, one doc per article
async def import_stock_news() -> None:
    await stock_news_col.drop()

    articles = read_all_news()
    if articles:
        await stock_news_col.insert_many(articles)
        await stock_news_col.create_index("Stock")

# import the t-SNE data into the tsne_data collection, one doc per ticker
async def import_tsne() -> None:
    await tsne_col.drop()

    rows = read_tsne_csv()
    if rows:
        await tsne_col.insert_many(rows)
        await tsne_col.create_index("Stock", unique=True)

# main function to run all imports
async def import_tickers_to_mongodb() -> None:
    tickers = discover_tickers()
    if not tickers:
        print("[ERROR] No CSV files found in stockdata/")
        return

    await import_stock_list(tickers)
    print()
    await import_stock_prices(tickers)
    print()
    await import_stock_news()
    print()
    await import_tsne()

    print("\nAll data imported successfully.")
    client.close()

if __name__ == "__main__":
    asyncio.run(import_tickers_to_mongodb())
