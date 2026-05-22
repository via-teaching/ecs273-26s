import os
import asyncio
import pandas as pd
from motor.motor_asyncio import AsyncIOMotorClient


client = AsyncIOMotorClient("mongodb://localhost:27017")

# Change database name using your name abbreviation
db = client.stock_hb

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")

stock_list_collection = db.get_collection("stock_list")
stock_collection = db.get_collection("stock_data")
news_collection = db.get_collection("stock_news")
tsne_collection = db.get_collection("tsne_data")


async def import_tickers():
    stockdata_dir = os.path.join(DATA_DIR, "stockdata")

    tickers = [
        file.replace(".csv", "")
        for file in os.listdir(stockdata_dir)
        if file.endswith(".csv")
    ]

    await stock_list_collection.delete_many({})
    await stock_list_collection.insert_one({
        "tickers": sorted(tickers)
    })

    print("Imported ticker list")


async def import_stock_data():
    stockdata_dir = os.path.join(DATA_DIR, "stockdata")

    await stock_collection.delete_many({})

    for file in os.listdir(stockdata_dir):
        if not file.endswith(".csv"):
            continue

        ticker = file.replace(".csv", "")
        file_path = os.path.join(stockdata_dir, file)

        df = pd.read_csv(file_path)

        stock_series = []

        for _, row in df.iterrows():
            stock_series.append({
                "date": str(row["Date"]),
                "Open": float(row["Open"]),
                "High": float(row["High"]),
                "Low": float(row["Low"]),
                "Close": float(row["Close"]),
            })

        await stock_collection.insert_one({
            "name": ticker,
            "stock_series": stock_series
        })

    print("Imported stock price data")


async def import_news_data():
    stocknews_dir = os.path.join(DATA_DIR, "stocknews")

    await news_collection.delete_many({})

    for ticker in os.listdir(stocknews_dir):
        ticker_dir = os.path.join(stocknews_dir, ticker)

        if not os.path.isdir(ticker_dir):
            continue

        for file in os.listdir(ticker_dir):
            if not file.endswith(".txt"):
                continue

            file_path = os.path.join(ticker_dir, file)

            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()

            await news_collection.insert_one({
                "Stock": ticker,
                "Title": file.replace(".txt", ""),
                "Date": "",
                "content": content
            })

    print("Imported stock news data")


async def import_tsne_data():
    tsne_path = os.path.join(DATA_DIR, "tsne.csv")

    await tsne_collection.delete_many({})

    df = pd.read_csv(tsne_path)

    records = []

    for _, row in df.iterrows():
        records.append({
            "Stock": str(row["Ticker"]),
            "x": float(row["TSNE1"]),
            "y": float(row["TSNE2"])
        })

    if records:
        await tsne_collection.insert_many(records)

    print("Imported t-SNE data")


async def main():
    await import_tickers()
    await import_stock_data()
    await import_news_data()
    await import_tsne_data()

    print("All data imported successfully!")


if __name__ == "__main__":
    asyncio.run(main())