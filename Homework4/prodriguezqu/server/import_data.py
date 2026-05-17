import os
import asyncio
import pandas as pd
from motor.motor_asyncio import AsyncIOMotorClient

# MongoDB connection (localhost, default port)
client = AsyncIOMotorClient("mongodb://localhost:27017")
# I took "abbr of your name" to mean the first letters of my full name, so I used prrq here.
db = client.stock_prrq

stock_name_collection = db.get_collection("stock_list")
stock_price_collection = db.get_collection("stock_prices")
stock_news_collection = db.get_collection("stock_news")
tsne_collection = db.get_collection("tsne_data")

tickers = ['XOM', 'CVX', 'HAL',
           'MMM', 'CAT', 'DAL',
           'MCD', 'NKE', 'KO',
           'JNJ', 'PFE', 'UNH',
           'JPM', 'GS', 'BAC',
           'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META']

base_data_dir = os.path.join(os.path.dirname(__file__), "data")
stockdata_dir = os.path.join(base_data_dir, "stockdata")
stocknews_dir = os.path.join(base_data_dir, "stocknews")
tsne_path = os.path.join(base_data_dir, "tsne.csv")


async def clear_collections():
    # just clearing the collections first so rerunning this file does not keep stacking duplicates
    await stock_name_collection.delete_many({})
    await stock_price_collection.delete_many({})
    await stock_news_collection.delete_many({})
    await tsne_collection.delete_many({})


async def import_tickers_to_mongodb():
    # Insert the tickers into the collection
    await stock_name_collection.insert_one({
        "tickers": tickers
    })


async def import_stock_prices_to_mongodb():
    for ticker in tickers:
        csv_path = os.path.join(stockdata_dir, f"{ticker}.csv")
        df = pd.read_csv(csv_path)

        stock_series = []
        for _, row in df.iterrows():
            stock_series.append({
                "date": str(row["Date"]),
                "Open": float(row["Open"]),
                "High": float(row["High"]),
                "Low": float(row["Low"]),
                "Close": float(row["Close"]),
            })

        # keeping stock prices as one document per ticker because that felt easiest to use again later
        await stock_price_collection.insert_one({
            "name": ticker,
            "stock_series": stock_series
        })


def parse_news_file(file_path):
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        raw_text = f.read()

    lines = raw_text.splitlines()
    title = ""
    date = ""

    for line in lines:
        if line.startswith("Title:"):
            title = line.replace("Title:", "", 1).strip()
        elif line.startswith("Date:"):
            date = line.replace("Date:", "", 1).strip()

    content_index = raw_text.find("Content:")
    content = raw_text[content_index + len("Content:"):].strip() if content_index != -1 else ""

    return {
        "Title": title,
        "Date": date,
        "content": content,
    }


async def import_stock_news_to_mongodb():
    # HW4 says all news should be in one collection, so each article is one document here
    for ticker in tickers:
        ticker_dir = os.path.join(stocknews_dir, ticker)
        if not os.path.isdir(ticker_dir):
            continue

        for file_name in os.listdir(ticker_dir):
            if not file_name.endswith(".txt"):
                continue

            file_path = os.path.join(ticker_dir, file_name)
            parsed_news = parse_news_file(file_path)

            await stock_news_collection.insert_one({
                "Stock": ticker,
                "Title": parsed_news["Title"],
                "Date": parsed_news["Date"],
                "content": parsed_news["content"],
            })


async def import_tsne_to_mongodb():
    df = pd.read_csv(tsne_path)

    for _, row in df.iterrows():
        await tsne_collection.insert_one({
            "Stock": str(row["ticker"]),
            "x": float(row["x"]),
            "y": float(row["y"]),
            "category": str(row["category"]),
        })


async def import_all_data():
    await clear_collections()
    await import_tickers_to_mongodb()
    await import_stock_prices_to_mongodb()
    await import_stock_news_to_mongodb()
    await import_tsne_to_mongodb()


if __name__ == "__main__":
    asyncio.run(import_all_data())
