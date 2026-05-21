import os
import re
import pandas as pd
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

# MongoDB connection (localhost, default port)
client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.stock_yl

# Path to data folder (relative to this script)
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
STOCKDATA_DIR = os.path.join(DATA_DIR, "stockdata")
STOCKNEWS_DIR = os.path.join(DATA_DIR, "stocknews")
TSNE_CSV = os.path.join(DATA_DIR, "tsne.csv")

# 20 tickers (same list as starter)
tickers = ['XOM', 'CVX', 'HAL',
           'MMM', 'CAT', 'DAL',
           'MCD', 'NKE', 'KO',
           'JNJ', 'PFE', 'UNH',
           'JPM', 'GS', 'BAC',
           'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META']


async def import_stock_list():
    """Insert the list of stock tickers."""
    coll = db.get_collection("stock_list")
    await coll.drop()  # Clear old data so re-running is safe
    await coll.insert_one({"tickers": tickers})
    print(f"[stock_list] inserted {len(tickers)} tickers")


async def import_stock_prices():
    """Insert OHLC time series for each ticker (StockModelV2 format)."""
    coll = db.get_collection("stock_prices")
    await coll.drop()

    documents = []
    for ticker in tickers:
        csv_path = os.path.join(STOCKDATA_DIR, f"{ticker}.csv")
        if not os.path.exists(csv_path):
            print(f"[stock_prices] WARNING: {csv_path} not found, skipping")
            continue

        df = pd.read_csv(csv_path)

        # Normalize the date column to short format YYYY-MM-DD
        df["date"] = pd.to_datetime(df["Date"], utc=True).dt.strftime("%Y-%m-%d")

        # Build list of {date, Open, High, Low, Close} records
        stock_series = df[["date", "Open", "High", "Low", "Close"]].to_dict(orient="records")

        documents.append({
            "name": ticker,
            "stock_series": stock_series
        })

    if documents:
        await coll.insert_many(documents)
    print(f"[stock_prices] inserted {len(documents)} stocks")


def parse_news_file(filepath):
    """Parse a news .txt file. Returns (title, date, content)."""
    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        lines = f.readlines()

    title = ""
    date = ""
    content_start = 0

    for i, line in enumerate(lines[:6]):  # check the first few lines for headers
        if line.startswith("Title:"):
            title = line[len("Title:"):].strip()
        elif line.startswith("Date:"):
            date = line[len("Date:"):].strip()
        elif line.startswith("URL:"):
            content_start = i + 1
        elif line.startswith("Content:"):
            content_start = i + 1

    # Everything after the last header line is the article body.
    content_lines = lines[content_start:]
    content = "".join(content_lines).strip()

    return title, date, content


async def import_stock_news():
    """Insert all news as a single collection, filtered by Stock field."""
    coll = db.get_collection("stock_news")
    await coll.drop()

    documents = []
    for ticker in tickers:
        folder = os.path.join(STOCKNEWS_DIR, ticker)
        if not os.path.isdir(folder):
            print(f"[stock_news] WARNING: {folder} not found, skipping")
            continue

        for filename in os.listdir(folder):
            if not filename.endswith(".txt"):
                continue
            filepath = os.path.join(folder, filename)
            title, date, content = parse_news_file(filepath)

            documents.append({
                "Stock": ticker,
                "Title": title,
                "Date": date,
                "content": content
            })

    if documents:
        await coll.insert_many(documents)
    print(f"[stock_news] inserted {len(documents)} news items")


async def import_tsne():
    """Insert t-SNE 2D coordinates for each stock."""
    coll = db.get_collection("tsne")
    await coll.drop()

    if not os.path.exists(TSNE_CSV):
        print(f"[tsne] WARNING: {TSNE_CSV} not found, skipping")
        return

    df = pd.read_csv(TSNE_CSV)
    # Rename `ticker` -> `Stock` to match the schema
    df = df.rename(columns={"ticker": "Stock"})
    documents = df.to_dict(orient="records")

    if documents:
        await coll.insert_many(documents)
    print(f"[tsne] inserted {len(documents)} points")


async def main():
    await import_stock_list()
    await import_stock_prices()
    await import_stock_news()
    await import_tsne()
    print("All imports complete.")


if __name__ == "__main__":
    asyncio.run(main())