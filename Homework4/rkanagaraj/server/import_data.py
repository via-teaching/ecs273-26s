import os
import json
import pandas as pd
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.stock_rk

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

TICKERS = [
    'AAPL', 'BAC', 'CAT', 'CVX', 'DAL',
    'GOOGL', 'GS', 'HAL', 'JNJ', 'JPM',
    'KO', 'MCD', 'META', 'MMM', 'MSFT',
    'NKE', 'NVDA', 'PFE', 'UNH', 'XOM',
]


async def import_stock_list():
    col = db.get_collection("stock_list")
    await col.drop()
    await col.insert_one({"tickers": TICKERS})
    print("Imported stock_list")


async def import_stock_prices():
    col = db.get_collection("stock_prices")
    await col.drop()
    for ticker in TICKERS:
        path = os.path.join(DATA_DIR, "stockdata", f"{ticker}.csv")
        df = pd.read_csv(path)
        series = [
            {
                "date": str(row["Date"]),
                "Open": float(row["Open"]),
                "High": float(row["High"]),
                "Low": float(row["Low"]),
                "Close": float(row["Close"]),
            }
            for _, row in df.iterrows()
        ]
        await col.insert_one({"name": ticker, "stock_series": series})
    print(f"Imported stock_prices for {len(TICKERS)} stocks")


async def import_stock_news():
    col = db.get_collection("stock_news")
    await col.drop()
    docs = []
    for ticker in TICKERS:
        path = os.path.join(DATA_DIR, "stocknews", ticker, "news.json")
        if not os.path.exists(path):
            print(f"  Warning: no news file for {ticker}")
            continue
        with open(path, "r") as f:
            articles = json.load(f)
        for article in articles:
            docs.append({
                "Stock": ticker,
                "title": article.get("title", ""),
                "date": article.get("date", ""),
                "url": article.get("url", ""),
                "content": article.get("content", ""),
            })
    await col.insert_many(docs)
    print(f"Imported stock_news ({len(docs)} articles)")


async def import_tsne():
    col = db.get_collection("tsne")
    await col.drop()
    path = os.path.join(DATA_DIR, "tsne.csv")
    df = pd.read_csv(path)
    docs = [
        {
            "Stock": str(row["ticker"]),
            "x": float(row["x"]),
            "y": float(row["y"]),
            "sector": str(row["sector"]),
        }
        for _, row in df.iterrows()
    ]
    await col.insert_many(docs)
    print(f"Imported tsne ({len(docs)} stocks)")


async def main():
    await import_stock_list()
    await import_stock_prices()
    await import_stock_news()
    await import_tsne()
    print("All data imported successfully.")


if __name__ == "__main__":
    asyncio.run(main())
