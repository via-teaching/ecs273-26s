import os
import pandas as pd
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

COINBASE_BOILERPLATE = "The above button links to Coinbase. Yahoo Finance is not a broker-dealer or investment adviser and does not offer securities or cryptocurrencies for sale or facilitate trading. Coinbase pays us for certain activity generated through this link. Prices displayed are informational."


# MongoDB connection (localhost, default port)
client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.stock_obimartin

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

async def import_stock_prices():
    # This data format matches V2 in data_scheme
    stock_collection = db.get_collection("stock_prices")
    for ticker in tickers:
        filepath = os.path.join("data", "stockdata", f"{ticker}.csv")
        df = pd.read_csv(filepath)
        stock_series = []
        for _, row in df.iterrows():
            stock_series.append({
                "date": str(row["Date"]),
                "Open": float(row["Open"]),
                "High": float(row["High"]),
                "Low": float(row["Low"]),
                "Close": float(row["Close"])
            })
        await stock_collection.insert_one({
            "name": ticker,
            "stock_series": stock_series
        })

async def import_stock_news():
    news_collection = db.get_collection("stock_news")
    news_dir = os.path.join("data", "stocknews")
    for ticker in tickers:
        ticker_dir = os.path.join(news_dir, ticker)
        if not os.path.exists(ticker_dir):
            continue
        for filename in os.listdir(ticker_dir):
            filepath = os.path.join(ticker_dir, filename)
            with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                lines = f.read()
            title = ""
            date = ""
            content = ""
            in_content = False
            for line in lines.splitlines():
                if line.startswith("Title:"):
                    title = line.replace("Title:", "").strip()
                elif line.startswith("Date:"):
                    date = line.replace("Date:", "").strip()
                elif line.startswith("Content:"):
                    in_content = True
                    content = line.replace("Content:", "").strip()
                elif in_content:
                    if line.strip():
                        content += " " + line.strip()
            if content.startswith(COINBASE_BOILERPLATE):
                content = content[len(COINBASE_BOILERPLATE):].strip()
            await news_collection.insert_one({
                "Stock": ticker,
                "Title": title,
                "Date": date,
                "content": content
            })

async def import_tsne():
    tsne_collection = db.get_collection("tsne")
    df = pd.read_csv(os.path.join("data", "tsne.csv"))
    for _, row in df.iterrows():
        await tsne_collection.insert_one({
            "Stock": str(row["ticker"]),
            "x": float(row["x"]),
            "y": float(row["y"]),
            "sector": str(row["sector"])
        })

if __name__ == "__main__":
    async def main():
        await import_tickers_to_mongodb()
        await import_stock_prices()
        await import_stock_news()
        await import_tsne()
    asyncio.run(main())
