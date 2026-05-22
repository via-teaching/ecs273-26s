import os
import json
import pandas as pd
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

# MongoDB connection
client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.stock_jason

tickers = [
    'XOM', 'CVX', 'HAL',
    'MMM', 'CAT', 'DAL',
    'MCD', 'NKE', 'KO',
    'JNJ', 'PFE', 'UNH',
    'JPM', 'GS', 'BAC',
    'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META'
]

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

async def import_tickers():
    col = db.get_collection("stock_list")
    await col.drop()
    await col.insert_one({"tickers": tickers})
    print("Imported ticker list")

async def import_stock_prices():
    col = db.get_collection("stock_prices")
    await col.drop()
    for ticker in tickers:
        path = os.path.join(DATA_DIR, "stockdata", f"{ticker}.csv")
        if not os.path.exists(path):
            print(f"Missing: {ticker}.csv, skipping")
            continue
        df = pd.read_csv(path)
        df = df.rename(columns={"Date": "date"})
        df["date"] = df["date"].astype(str)
        records = df[["date", "Open", "High", "Low", "Close"]].to_dict(orient="records")
        await col.insert_one({"name": ticker, "stock_series": records})
        print(f"Imported stock prices: {ticker}")

async def import_news():
    col = db.get_collection("stock_news")
    await col.drop()
    for ticker in tickers:
        path = os.path.join(DATA_DIR, "stocknews", f"{ticker}.json")
        if not os.path.exists(path):
            continue
        with open(path) as f:
            articles = json.load(f)
        docs = []
        for a in articles:
            docs.append({
                "Stock": ticker,
                "Title": a.get("title", ""),
                "Date": a.get("date", ""),
                "content": a.get("content", "")
            })
        if docs:
            await col.insert_many(docs)
            print(f"Imported news: {ticker} ({len(docs)} articles)")

async def import_tsne():
    col = db.get_collection("tsne")
    await col.drop()
    path = os.path.join(DATA_DIR, "tsne.csv")
    df = pd.read_csv(path)
    records = df.to_dict(orient="records")
    await col.insert_many(records)
    print(f"Imported t-SNE: {len(records)} records")

async def main():
    await import_tickers()
    await import_stock_prices()
    await import_news()
    await import_tsne()
    print("Done!")

if __name__ == "__main__":
    asyncio.run(main())
