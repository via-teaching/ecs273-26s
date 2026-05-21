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
    
    clean_records = []
    for ticker in tickers:
        ticker_path = os.path.join(base_path, ticker)
        if not os.path.exists(ticker_path): 
            continue
            
        for filename in os.listdir(ticker_path):
            if filename.endswith(".json"):
                with open(os.path.join(ticker_path, filename), 'r') as f:
                    for item in json.load(f):
                        clean_records.append({
                            "Stock": ticker.upper(), 
                            **item
                        })
                    
    if clean_records:
        await news_col.insert_many(clean_records)
    print("News articles imported.")

async def import_tsne_data():
    await tsne_col.delete_many({})
    df = pd.read_csv("data/tsne.csv")
    records = df.to_dict(orient='records')
    
    clean_records = []
    for i, record in enumerate(records):
        if i < len(tickers):
            clean_records.append({
                "Stock": tickers[i].upper(),
                "x": float(record.get('tsne_1', 0)),
                "y": float(record.get('tsne_2', 0))
            })
            
    if clean_records:
        await tsne_col.insert_many(clean_records)
    print("t-SNE coordinates imported.")

async def main():
    await import_tickers_to_mongodb()
    await import_stock_prices()
    await import_stock_news()
    await import_tsne_data()

if __name__ == "__main__":
    asyncio.run(main())