import os
import asyncio
import pandas as pd
from motor.motor_asyncio import AsyncIOMotorClient


# MongoDB connection
client = AsyncIOMotorClient("mongodb://localhost:27017")

# TODO: change this to your own database name
# Requirement: stock_<abbr_of_your_name>
db = client.stock_pyl


stock_name_collection = db.get_collection("stock_list")
stock_price_collection = db.get_collection("stock_prices")
stock_news_collection = db.get_collection("stock_news")
tsne_collection = db.get_collection("tsne_projection")


tickers = [
    'XOM', 'CVX', 'HAL',
    'MMM', 'CAT', 'DAL',
    'MCD', 'NKE',
    'JNJ', 'PFE', 'UNH',
    'JPM', 'GS', 'BAC',
    'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META'
]


# Adjust these paths if your folder structure is different
SERVER_DIR  = os.path.dirname(os.path.abspath(__file__))
HW4_DIR = os.path.dirname(SERVER_DIR)
ROOT_DIR = os.path.dirname(HW4_DIR)

STOCK_DATA_DIR = os.path.join(
    ROOT_DIR, "Homework3", "react-js-template", "public", "data", "stockdata"
)

NEWS_DATA_DIR = os.path.join(
    ROOT_DIR, "Homework3", "react-js-template", "public", "data", "stocknews"
)

TSNE_FILE = os.path.join(
    ROOT_DIR, "Homework3", "react-js-template", "public", "data", "tsne.csv"
)


async def clear_collections():
    """
    Clear old data before importing.
    This prevents duplicate data when running import_data.py multiple times.
    """
    await stock_name_collection.delete_many({})
    await stock_price_collection.delete_many({})
    await stock_news_collection.delete_many({})
    await tsne_collection.delete_many({})


async def import_tickers_to_mongodb():
    await stock_name_collection.insert_one({
        "tickers": tickers
    })
    print("Imported stock list")


async def import_stock_prices_to_mongodb():
    """
    Import stock price CSV files.

    MongoDB format:
    {
        "name": "AAPL",
        "stock_series": [
            {
                "date": "2024-01-01",
                "Open": 100.0,
                "High": 105.0,
                "Low": 98.0,
                "Close": 102.0
            }
        ]
    }
    """

    for ticker in tickers:
        csv_path = os.path.join(STOCK_DATA_DIR, f"{ticker}.csv")

        if not os.path.exists(csv_path):
            print(f"Missing stock file: {csv_path}")
            continue

        df = pd.read_csv(csv_path)

        # Make column names easier to handle
        df.columns = [col.strip() for col in df.columns]

        # Find date column
        if "Date" in df.columns:
            date_col = "Date"
        elif "date" in df.columns:
            date_col = "date"
        else:
            print(f"No Date column found in {csv_path}")
            continue

        stock_series = []

        for _, row in df.iterrows():
            try:
                stock_series.append({
                    "date": str(row[date_col]),
                    "Open": float(row["Open"]),
                    "High": float(row["High"]),
                    "Low": float(row["Low"]),
                    "Close": float(row["Close"])
                })
            except Exception as e:
                print(f"Skipping one row in {ticker}: {e}")

        await stock_price_collection.insert_one({
            "name": ticker,
            "stock_series": stock_series
        })

        print(f"Imported price data for {ticker}")


async def import_tsne_to_mongodb():
    """
    Import t-SNE projection data.

    Expected CSV columns:
    Ticker, TSNE_1, TSNE_2, Sector
    """

    if not os.path.exists(TSNE_FILE):
        print(f"Missing t-SNE file: {TSNE_FILE}")
        return

    df = pd.read_csv(TSNE_FILE)
    df.columns = [col.strip() for col in df.columns]

    for _, row in df.iterrows():
        await tsne_collection.insert_one({
            "Stock": str(row["Ticker"]),
            "x": float(row["TSNE_1"]),
            "y": float(row["TSNE_2"]),
            "Sector": str(row["Sector"])
        })

    print("Imported t-SNE data")


async def import_news_to_mongodb():
    """
    Import stock news data.

    Requirement:
    Do not create one collection per stock.
    Store all news articles in one collection: stock_news.

    This function supports a folder structure like:
    public/data/stocknews/AAPL/*.txt
    public/data/stocknews/MSFT/*.txt

    Each txt file is treated as one article.
    """

    if not os.path.exists(NEWS_DATA_DIR):
        print(f"Missing news folder: {NEWS_DATA_DIR}")
        return

    for ticker in tickers:
        ticker_news_dir = os.path.join(NEWS_DATA_DIR, ticker)

        if not os.path.exists(ticker_news_dir):
            print(f"Missing news folder for {ticker}: {ticker_news_dir}")
            continue

        for filename in os.listdir(ticker_news_dir):
            file_path = os.path.join(ticker_news_dir, filename)

            if not os.path.isfile(file_path):
                continue

            if not filename.endswith(".txt"):
                continue

            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read().strip()

                title = filename.replace(".txt", "")

                await stock_news_collection.insert_one({
                    "Stock": ticker,
                    "Title": title,
                    "Date": "",
                    "content": content
                })

            except Exception as e:
                print(f"Failed to import news file {file_path}: {e}")

        print(f"Imported news for {ticker}")


async def main():
    await clear_collections()

    await import_tickers_to_mongodb()
    await import_stock_prices_to_mongodb()
    await import_tsne_to_mongodb()
    await import_news_to_mongodb()

    print("All data imported successfully")


if __name__ == "__main__":
    asyncio.run(main())