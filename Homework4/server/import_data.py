import os
import re
import pandas as pd
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

# MongoDB connection (localhost, default port)
client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.stock_jth

stock_name_collection = db.get_collection("stock_list")
tickers = [ 'XOM', 'CVX', 'HAL',
            'MMM', 'CAT', 'DAL',
            'MCD', 'NKE', 'KO',
            'JNJ', 'PFE', 'UNH',
            'JPM', 'GS', 'BAC',
            'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META']
async def import_tickers_to_mongodb():
    # Insert the tickers into the collection
    await stock_name_collection.insert_one({
        "tickers": tickers
    })

async def import_stock_data():
    stock_path = "/home/jobe/ECS273/ecs273-26s/Homework4/server/data/stockdata"
    stock_series_collection = db.get_collection("stock_series")
    for file_name in os.listdir(stock_path):
        if not file_name.endswith(".csv"):
            continue
        ticker = file_name.removesuffix(".csv")
        file_path = os.path.join(stock_path, file_name)
        stock_df = pd.read_csv(file_path)
        records = stock_df.to_dict(orient="records")
        await stock_series_collection.insert_one({
            "name": ticker,
            "stock_series": records
        })

async def import_stock_news():
    stock_news_path = "/home/jobe/ECS273/ecs273-26s/Homework4/server/data/stocknews"
    stock_news_collection = db.get_collection("stock_news")

    for ticker_folder in os.listdir(stock_news_path):
        ticker_folder_path = os.path.join(stock_news_path, ticker_folder)
        if not os.path.isdir(ticker_folder_path):
            continue
        for article_file in os.listdir(ticker_folder_path):
            article_path = os.path.join(ticker_folder_path, article_file)
            with open(article_path, "r", encoding="utf-8") as f:
                article = f.read()
                ticker = ticker_folder
                title = re.match(r"Title:\s*(.*)", article).group(1)
                date = re.match(r"Title:\s*.*\nDate:\s*(.*)", article).group(1)
                content = re.match(r"Title:\s*.*\nDate:\s*.*\nLink:\s*.*\n+(.*)", article).group(1)
                await stock_news_collection.insert_one({
                    "Stock": ticker,
                    "Title": title,
                    "Date": date,
                    "content": content
                })

async def import_tsne():
    tsne_collection = db.get_collection("tsne")
    tsne_path = "/home/jobe/ECS273/ecs273-26s/Homework4/server/data/tsne.csv"
    tsne_df = pd.read_csv(tsne_path)

    records = tsne_df.to_dict(orient="records")
    for row in records:
        await tsne_collection.insert_one({
            "Stock": row["ticker"],
            "Category": row["category"],
            "x": row["dim1"],
            "y": row["dim2"]
        })

async def main():
    await import_tickers_to_mongodb()
    await import_stock_data()
    await import_stock_news()
    await import_tsne()

if __name__ == "__main__":
    asyncio.run(main())
