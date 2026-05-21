import os
import pandas as pd
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.stock_lsd

stock_list_collection = db.get_collection("stock_list")
stock_prices_collection = db.get_collection("stock_prices")
stock_news_collection = db.get_collection("stock_news")
tsne_collection = db.get_collection("tsne")

tickers = [
    'XOM', 'CVX', 'HAL',
    'MMM', 'CAT', 'DAL',
    'MCD', 'NKE', 'KO',
    'JNJ', 'PFE', 'UNH',
    'JPM', 'GS', 'BAC',
    'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META',
]

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STOCK_DATA_DIR = os.path.join(BASE_DIR, "data", "stockdata")
STOCK_NEWS_DIR = os.path.join(BASE_DIR, "data", "stocknews")
TSNE_CSV = os.path.join(BASE_DIR, "data", "tsne.csv")


async def import_stock_list():
    await stock_list_collection.delete_many({})
    await stock_list_collection.insert_one({"tickers": tickers})
    print("Imported stock list")


async def import_stock_prices():
    await stock_prices_collection.delete_many({})
    for ticker in tickers:
        csv_path = os.path.join(STOCK_DATA_DIR, f"{ticker}.csv")
        if not os.path.exists(csv_path):
            print(f"Missing: {csv_path}")
            continue
        df = pd.read_csv(csv_path)
        # Normalize date column (strip timezone offset)
        df["Date"] = pd.to_datetime(df["Date"], utc=True).dt.strftime("%Y-%m-%d")
        stock_series = [
            {
                "date": row["Date"],
                "Open": float(row["Open"]),
                "High": float(row["High"]),
                "Low": float(row["Low"]),
                "Close": float(row["Close"]),
            }
            for _, row in df.iterrows()
        ]
        await stock_prices_collection.insert_one({
            "name": ticker,
            "stock_series": stock_series,
        })
        print(f"Imported stock prices: {ticker}")


async def import_stock_news():
    await stock_news_collection.delete_many({})
    for ticker in tickers:
        news_dir = os.path.join(STOCK_NEWS_DIR, ticker)
        if not os.path.isdir(news_dir):
            print(f"No news dir for {ticker}")
            continue
        for filename in sorted(os.listdir(news_dir)):
            if not filename.endswith(".txt"):
                continue
            filepath = os.path.join(news_dir, filename)
            with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                lines = f.read().splitlines()

            title = ""
            date = ""
            content_lines = []
            for line in lines:
                if line.startswith("Title:"):
                    title = line[len("Title:"):].strip()
                elif line.startswith("Date:"):
                    date = line[len("Date:"):].strip()
                elif line.strip():
                    content_lines.append(line.strip())

            content = " ".join(content_lines)
            await stock_news_collection.insert_one({
                "Stock": ticker,
                "Title": title,
                "Date": date,
                "content": content,
            })
        print(f"Imported news: {ticker}")


async def import_tsne():
    await tsne_collection.delete_many({})
    if not os.path.exists(TSNE_CSV):
        print(f"t-SNE CSV not found at {TSNE_CSV}")
        return
    df = pd.read_csv(TSNE_CSV)
    # First column is the ticker symbol (unnamed index column)
    ticker_col = df.columns[0]
    records = []
    for _, row in df.iterrows():
        records.append({
            "Stock": str(row[ticker_col]),
            "x": float(row["x"]),
            "y": float(row["y"]),
            "sector": str(row["sector"]) if "sector" in df.columns else "",
        })
    await tsne_collection.insert_many(records)
    print(f"Imported {len(records)} t-SNE data points")


async def main():
    await import_stock_list()
    await import_stock_prices()
    await import_stock_news()
    await import_tsne()
    print("All data imported successfully.")


if __name__ == "__main__":
    asyncio.run(main())
