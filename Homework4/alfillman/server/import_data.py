"""
One-shot script to import all stock data into MongoDB.
Run this ONCE before starting the API server:  python import_data.py
"""
import os
import pandas as pd
from pymongo import MongoClient

# ---- Config ----
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "stock_AF" 
DATA_DIR = "data"     # relative to server/

TICKERS = ['XOM', 'CVX', 'HAL', 'MMM', 'CAT', 'DAL',
           'MCD', 'NKE', 'KO', 'JNJ', 'PFE', 'UNH',
           'JPM', 'GS', 'BAC', 'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META']

# ---- Connect ----
client = MongoClient(MONGO_URL)
db = client[DB_NAME]

# Drop old collections so re-running the script doesn't pile up duplicates
for name in ["stock_list", "stock_prices", "stock_news", "tsne"]:
    db.drop_collection(name)


############ TICKERS 
db.stock_list.insert_one({"tickers": TICKERS})
print(f"Inserted ticker list ({len(TICKERS)} tickers)")


############## STOCK DATA 
price_docs = []
for ticker in TICKERS:
    csv_path = os.path.join(DATA_DIR, "stockdata", f"{ticker}.csv")
    if not os.path.exists(csv_path):
        print(f"  skipping {ticker} (no CSV)")
        continue

    # Your CSVs have an unnamed index coHomework4lumn first, so use index_col=0
    df = pd.read_csv(csv_path)

    # Convert Date column to clean ISO strings (drops the timezone for simplicity)
    df["Date"] = pd.to_datetime(df["Date"], utc=True).dt.strftime("%Y-%m-%d")

    series = [
        {
            "date": row["Date"],
            "Open": float(row["Open"]),
            "High": float(row["High"]),
            "Low": float(row["Low"]),
            "Close": float(row["Close"]),
        }
        for _, row in df.iterrows()
    ]

    price_docs.append({"name": ticker, "stock_series": series})

db.stock_prices.insert_many(price_docs)

db.stock_prices.create_index("name")
print(f"Inserted {len(price_docs)} stock price documents")

############### NEWS ############
news_docs = []
news_dir = os.path.join(DATA_DIR, "stocknews")
for ticker in TICKERS:
    ticker_dir = os.path.join(news_dir, ticker)
    if not os.path.isdir(ticker_dir):
        continue

    for fname in os.listdir(ticker_dir):
        if not fname.endswith(".txt"):
            continue

        with open(os.path.join(ticker_dir, fname), "r", encoding="utf-8") as f:
            raw = f.read()

        # Parse the header: "Title: ...", "Date: ...", "URL: ..." then body
        title, date, content = "", "", ""
        lines = raw.split("\n")
        body_start = 0
        for i, line in enumerate(lines):
            if line.startswith("Title:"):
                title = line[len("Title:"):].strip()
            elif line.startswith("Date:"):
                date = line[len("Date:"):].strip()
            elif line.startswith("URL:"):
                body_start = i + 1
                break
        content = "\n".join(lines[body_start:]).strip()

        news_docs.append({
            "Stock": ticker,
            "Title": title,
            "Date": date,
            "content": content,
        })

if news_docs:
    db.stock_news.insert_many(news_docs)
    db.stock_news.create_index("Stock")  # speeds up filtering by ticker
print(f"Inserted {len(news_docs)} news articles")


################# TSNE 
tsne_path = os.path.join(DATA_DIR, "tsne.csv")
tsne_df = pd.read_csv(tsne_path)
tsne_docs = [
    {
        "Stock": row["ticker"],
        "x": float(row["x"]),
        "y": float(row["y"]),
        "sector": row["sector"],
    }
    for _, row in tsne_df.iterrows()
]
db.tsne.insert_many(tsne_docs)
print(f"Inserted {len(tsne_docs)} t-SNE points")

print("\nDone!")
