import os
import pandas as pd
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

# MongoDB connection (localhost, default port)
client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.stock_jcmorrison

stock_name_collection = db.get_collection("stock_list")
tickers = [ 'XOM', 'CVX', 'HAL', 'MMM', 'CAT', 'DAL', 'MCD', 'NKE', 'KO',
            'JNJ', 'PFE', 'UNH', 'JPM', 'GS', 'BAC', 'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META']

TICKER_SECTORS = {
    'XOM': 'Energy',
    'CVX': 'Energy',
    'HAL': 'Energy',
    'MMM': 'Industrials',
    'CAT': 'Industrials',
    'DAL': 'Industrials',
    'MCD': 'Consumer',
    'NKE': 'Consumer',
    'KO': 'Consumer',
    'JNJ': 'Healthcare',
    'PFE': 'Healthcare',
    'UNH': 'Healthcare',
    'JPM': 'Financials',
    'GS': 'Financials',
    'BAC': 'Financials',
    'AAPL': 'Technology',
    'MSFT': 'Technology',
    'NVDA': 'Technology',
    'GOOGL': 'Technology',
    'META': 'Technology',
}

async def import_tickers_to_mongodb():
    # Insert the tickers into the collection
    await stock_name_collection.insert_one({
        "tickers": tickers
    })

async def import_stock_prices_to_mongodb():
    stock_prices_collection = db.get_collection("stock_prices")
    data_folder = os.path.join(os.path.dirname(__file__), "data", "stockdata")
    for ticker in tickers:
        csv_path = os.path.join(data_folder, f"{ticker}.csv")
        if not os.path.exists(csv_path):
            print(f"No CSV found for {ticker}")
            continue
        df = pd.read_csv(csv_path)
        # change timing for storage
        df['Date'] = df['Date'].str[:10]
        stock_series = []
        for _, row in df.iterrows():
            stock_series.append({
                "date": row['Date'],
                "Open": float(row['Open']),
                "High": float(row['High']),
                "Low": float(row['Low']),
                "Close": float(row['Close']),
            })
        await stock_prices_collection.insert_one({
            "name": ticker,
            "stock_series": stock_series,
        })
        print(f"Inserted stock prices for {ticker} ({len(stock_series)} rows)")

async def import_stock_news_to_mongodb():
    # all tickers share collection, filtered by stock field
    stock_news_collection = db.get_collection("stock_news")
    news_root = os.path.join(os.path.dirname(__file__), "data", "stocknews")
    for ticker in tickers:
        ticker_folder = os.path.join(news_root, ticker)
        if not os.path.exists(ticker_folder):
            print(f"No news folder for {ticker}")
            continue
        count = 0
        for fname in os.listdir(ticker_folder):
            if not fname.endswith(".txt"):
                continue
            if fname == "manifest.txt":
                continue
            fpath = os.path.join(ticker_folder, fname)
            with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()
            # parse title and date
            title = ""
            date = ""
            content = ""
            for i, line in enumerate(text.splitlines()):
                if line.startswith("Title:"):
                    title = line.replace("Title:", "").strip()
                elif line.startswith("Date:"):
                    date = line.replace("Date:", "").strip()
                elif line.startswith("Content:"):
                    content = "\n".join(text.splitlines()[i:]).replace("Content:", "").strip()
                    break
            if not title:
                title = fname.replace(".txt", "")
            await stock_news_collection.insert_one({
                "Stock": ticker,
                "Title": title,
                "Date": date,
                "content": content,
            })
            count += 1
        print(f"Inserted {count} news articles for {ticker}")

async def import_tsne_to_mongodb():
    # Read tsne.csv and insert one document per ticker into the tsne collection
    tsne_collection = db.get_collection("tsne")
    tsne_path = os.path.join(os.path.dirname(__file__), "data", "tsne.csv")
    if not os.path.exists(tsne_path):
        print(f"tsne.csv not found at {tsne_path}")
        return
    df = pd.read_csv(tsne_path)
    for _, row in df.iterrows():
        ticker = row['ticker']
        await tsne_collection.insert_one({
            "Stock": ticker,
            "x": float(row['x']),
            "y": float(row['y']),
            "sector": TICKER_SECTORS.get(ticker, "Unknown"),
        })
        
        print(f"Inserted t-SNE data for {ticker}")

async def main():
    # clear existing collections before importing to avoid duplicates
    await db.get_collection("stock_list").drop()
    await db.get_collection("stock_prices").drop()
    await db.get_collection("stock_news").drop()
    await db.get_collection("tsne").drop()
    await import_tickers_to_mongodb()
    await import_stock_prices_to_mongodb()
    await import_stock_news_to_mongodb()
    await import_tsne_to_mongodb()

if __name__ == "__main__":
    asyncio.run(main())
