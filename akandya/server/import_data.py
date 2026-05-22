import os
import json
import pandas as pd
from pymongo import MongoClient

from data_scheme import (
    DATABASE_NAME,
    PRICE_COLLECTION,
    NEWS_COLLECTION,
    TSNE_COLLECTION,
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")

STOCKDATA_DIR = os.path.join(DATA_DIR, "stockdata")
STOCKNEWS_DIR = os.path.join(DATA_DIR, "stocknews")
TSNE_PATH = os.path.join(DATA_DIR, "tsne.csv")

client = MongoClient("mongodb://localhost:27017/")
db = client[DATABASE_NAME]

price_collection = db[PRICE_COLLECTION]
news_collection = db[NEWS_COLLECTION]
tsne_collection = db[TSNE_COLLECTION]


def import_stock_prices():
    price_collection.delete_many({})

    for filename in os.listdir(STOCKDATA_DIR):
        if not filename.lower().endswith(".csv"):
            continue

        ticker = filename.replace(".csv", "").upper()
        file_path = os.path.join(STOCKDATA_DIR, filename)

        df = pd.read_csv(file_path)
        df = df.fillna("")

        records = df.to_dict(orient="records")

        document = {
            "ticker": ticker,
            "prices": records,
        }

        price_collection.insert_one(document)
        print(f"Imported stock prices: {ticker}")


def import_stock_news():
    news_collection.delete_many({})

    for ticker in os.listdir(STOCKNEWS_DIR):
        ticker_folder = os.path.join(STOCKNEWS_DIR, ticker)

        if not os.path.isdir(ticker_folder):
            continue

        news_json_path = os.path.join(ticker_folder, "news.json")

        if not os.path.exists(news_json_path):
            print(f"No news.json found for {ticker}")
            continue

        with open(news_json_path, "r", encoding="utf-8") as f:
            articles = json.load(f)

        for article in articles:
            article["ticker"] = ticker.upper()
            news_collection.insert_one(article)

        print(f"Imported news: {ticker.upper()} ({len(articles)} articles)")


def import_tsne():
    tsne_collection.delete_many({})

    df = pd.read_csv(TSNE_PATH)
    df = df.fillna("")

    records = df.to_dict(orient="records")

    for record in records:
        record["ticker"] = str(record["ticker"]).upper()
        record["x"] = float(record["x"])
        record["y"] = float(record["y"])
        tsne_collection.insert_one(record)

    print(f"Imported t-SNE data: {len(records)} points")


def main():
    print("Starting data import...")
    print(f"Database: {DATABASE_NAME}")

    import_stock_prices()
    import_stock_news()
    import_tsne()

    print("All data imported successfully.")


if __name__ == "__main__":
    main()