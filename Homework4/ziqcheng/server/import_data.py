import os
import json
import pandas as pd
from data_scheme import (
    stock_prices_collection,
    stock_news_collection,
    tsne_collection,
    create_indexes,
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
STOCKDATA_DIR = os.path.join(DATA_DIR, "stockdata")
STOCKNEWS_DIR = os.path.join(DATA_DIR, "stocknews")
TSNE_PATH = os.path.join(DATA_DIR, "tsne.csv")


def clean_database():
 
    stock_prices_collection.delete_many({})
    stock_news_collection.delete_many({})
    tsne_collection.delete_many({})


def import_stock_prices():

    if not os.path.exists(STOCKDATA_DIR):
        print(f"Missing folder: {STOCKDATA_DIR}")
        return

    for filename in os.listdir(STOCKDATA_DIR):
        if not filename.endswith(".csv"):
            continue

        ticker = filename.replace(".csv", "").upper()
        file_path = os.path.join(STOCKDATA_DIR, filename)

        df = pd.read_csv(file_path)
        df = df.fillna("")

        records = df.to_dict(orient="records")

        stock_prices_collection.update_one(
            {"ticker": ticker},
            {
                "$set": {
                    "ticker": ticker,
                    "records": records,
                }
            },
            upsert=True,
        )

        print(f"Imported stock prices: {ticker}")


def import_stock_news():
    """
    Import stock news from:
    server/data/stocknews/

    This version handles both:
    1. one JSON file containing a single article dictionary
    2. one JSON file containing a list of article dictionaries
    3. txt files
    """
    if not os.path.exists(STOCKNEWS_DIR):
        print(f"Missing folder: {STOCKNEWS_DIR}")
        return

    for ticker in os.listdir(STOCKNEWS_DIR):
        ticker_dir = os.path.join(STOCKNEWS_DIR, ticker)

        if not os.path.isdir(ticker_dir):
            continue

        ticker = ticker.upper()

        for filename in os.listdir(ticker_dir):
            file_path = os.path.join(ticker_dir, filename)

            if filename.endswith(".json"):
                with open(file_path, "r", encoding="utf-8") as f:
                    try:
                        data = json.load(f)
                    except json.JSONDecodeError:
                        print(f"Skipping invalid JSON: {file_path}")
                        continue

                # Case 1: JSON file is a list of articles
                if isinstance(data, list):
                    articles = data

                # Case 2: JSON file is one article dictionary
                elif isinstance(data, dict):
                    articles = [data]

                else:
                    print(f"Skipping unsupported JSON format: {file_path}")
                    continue

                for article in articles:
                    if not isinstance(article, dict):
                        continue

                    stock_news_collection.insert_one(
                        {
                            "ticker": ticker,
                            "title": article.get("title")
                            or article.get("Title")
                            or article.get("headline")
                            or article.get("Headline")
                            or filename,
                            "date": article.get("date")
                            or article.get("Date")
                            or article.get("published")
                            or article.get("publishedAt")
                            or "",
                            "content": article.get("content")
                            or article.get("Content")
                            or article.get("summary")
                            or article.get("Summary")
                            or article.get("description")
                            or article.get("Description")
                            or "",
                            "url": article.get("url")
                            or article.get("URL")
                            or article.get("link")
                            or article.get("Link")
                            or "",
                        }
                    )

            elif filename.endswith(".txt"):
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read().strip()

                if content:
                    stock_news_collection.insert_one(
                        {
                            "ticker": ticker,
                            "title": filename.replace(".txt", ""),
                            "date": "",
                            "content": content,
                            "url": "",
                        }
                    )

        print(f"Imported news: {ticker}")

def import_tsne():
    """
    Import t-SNE data from:
    server/data/tsne.csv

    Expected columns:
    ticker, x, y, sector
    """
    if not os.path.exists(TSNE_PATH):
        print(f"Missing file: {TSNE_PATH}")
        return

    df = pd.read_csv(TSNE_PATH)
    df.columns = df.columns.str.strip()

    print("t-SNE columns:", df.columns.tolist())
    print("t-SNE row count:", len(df))

    tsne_collection.delete_many({})

    for _, row in df.iterrows():
        record = row.to_dict()

        ticker = (
            record.get("ticker")
            or record.get("Ticker")
            or record.get("Stock")
            or record.get("stock")
            or record.get("symbol")
            or record.get("Symbol")
        )

        x = (
            record.get("x")
            or record.get("X")
            or record.get("tsne_x")
            or record.get("TSNE_X")
        )

        y = (
            record.get("y")
            or record.get("Y")
            or record.get("tsne_y")
            or record.get("TSNE_Y")
        )

        sector = (
            record.get("sector")
            or record.get("Sector")
            or record.get("category")
            or record.get("Category")
            or record.get("industry")
            or record.get("Industry")
            or "Unknown"
        )

        if ticker is None or str(ticker).strip() == "":
            print("Skipping row without ticker:", record)
            continue

        if x is None or y is None or str(x).strip() == "" or str(y).strip() == "":
            print(f"Skipping row with missing x/y: {ticker}")
            continue

        doc = {
            "ticker": str(ticker).strip().upper(),
            "x": float(x),
            "y": float(y),
            "sector": str(sector).strip(),
        }

       
        tsne_collection.insert_one(doc)

    print("Imported t-SNE data count:", tsne_collection.count_documents({}))

if __name__ == "__main__":
    create_indexes()
    clean_database()

    import_stock_prices()
    import_stock_news()
    import_tsne()

    print("All data imported successfully.")