import os
import pandas as pd
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

# MongoDB connection (localhost, default port)
client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.stock_ws

stock_name_collection = db.get_collection("stock_list")
stock_price_collection = db.get_collection("stock_prices")
stock_news_collection = db.get_collection("stock_news")
tsne_collection = db.get_collection("tsne")
tickers = ['XOM', 'CVX', 'HAL', 'MMM', 'CAT', 'DAL', 'MCD', 'NKE', 'KO', 'JNJ', 'PFE', 'UNH', 'JPM', 'GS', 'BAC', 'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META']

data_dir = "data"
stock_dir = os.path.join(data_dir, "stockdata")
news_dir = os.path.join(data_dir, "stocknews")
tsne = os.path.join(data_dir, "tsne.csv")

async def clear_collections():
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
        file_path = os.path.join(stock_dir, f"{ticker}.csv")
        df = pd.read_csv(file_path)
        records = df.to_dict("records")
        await stock_price_collection.insert_one({
            "ticker": ticker,
            "records": records
        })

async def import_tsne_to_mongodb():
    df = pd.read_csv(tsne)
    records = df.to_dict("records")
    await tsne_collection.insert_many(records)

async def import_news_to_mongodb():
    for ticker in tickers:
        folder_path = os.path.join(news_dir, ticker)
        for filename in os.listdir(folder_path):
            file_path = os.path.join(folder_path, filename)

            if filename.endswith(".txt"):
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()

                await stock_news_collection.insert_one({
                    "ticker": ticker,
                    "title": filename.replace(".txt", ""),
                    "date": "",
                    "content": content
                })

async def main():
    await clear_collections()
    await import_tickers_to_mongodb()
    await import_stock_prices_to_mongodb()
    await import_tsne_to_mongodb()
    await import_news_to_mongodb()

if __name__ == "__main__":
    asyncio.run(main())