import os
import pandas as pd
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import json


# MongoDB connection (localhost, default port)

client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.stock_ajoyuan

stock_name_collection = db.get_collection("stock_list")
prices_col = db.get_collection("stock_prices")
news_col = db.get_collection("stock_news")
tsne_col = db.get_collection("tsne_data")
list_col = db.get_collection("stock_list")

tickers = [
    'XOM', 'CVX', 'HAL',
    'MMM', 'CAT', 'DAL',
    'MCD', 'NKE', 'KO',
    'JNJ', 'PFE', 'UNH',
    'JPM', 'GS', 'BAC',
    'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META'
]

async def import_tickers_to_mongodb():
    await list_col.delete_many({})
    await stock_name_collection.insert_one({
        "tickers": tickers
    })

async def import_stock_prices():
    await prices_col.delete_many({})
    base_path = "data/stockdata"
    
    for ticker in tickers:
        file_path = os.path.join(base_path, f"{ticker}.csv")
        if os.path.exists(file_path):
            df = pd.read_csv(file_path)
            series_records = df[["Date", "Open", "High", "Low", "Close"]].to_dict(orient='records')
            
            await prices_col.insert_one({
                "name": ticker.upper(),
                "stock_series": series_records
            })
    print("Stock prices imported.")

async def import_stock_news():
    await news_col.delete_many({})
    base_path = "data/stocknews"
    complete_news = []
    
    for ticker in tickers:
        ticker_path = os.path.join(base_path, ticker)
        if os.path.exists(ticker_path):
            for filename in os.listdir(ticker_path):
                if filename.endswith(".json"):
                    with open(os.path.join(ticker_path, filename), 'r') as f:
                        complete_news.extend([{"Stock": ticker.upper(), **item} for item in json.load(f)])
                    
    if complete_news:
        await news_col.insert_many(complete_news)
    print("News articles imported.")

async def import_tsne_data():
    await tsne_col.delete_many({})
    
    df = pd.read_csv("data/tsne.csv").head(len(tickers))
    df['Stock'] = [t.upper() for t in tickers[:len(df)]]
    df = df.rename(columns={'tsne_1': 'x', 'tsne_2': 'y'})
    
    await tsne_col.insert_many(df[['Stock', 'x', 'y']].to_dict(orient='records'))
    print("t-SNE coordinates imported.")

async def main():
    await import_tickers_to_mongodb()
    await import_stock_prices()
    await import_stock_news()
    await import_tsne_data()

if __name__ == "__main__":
    asyncio.run(main())