import os
import pandas as pd
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

client = AsyncIOMotorClient("mongodb://localhost:27018")
db = client.stock_muyzheng

TICKERS = [
    "XOM", "CVX", "HAL",
    "MMM", "CAT", "DAL",
    "MCD", "NKE", "KO",
    "JNJ", "PFE", "UNH",
    "JPM", "GS", "BAC",
    "AAPL", "MSFT", "NVDA", "GOOGL", "META",
]

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")


async def import_stock_list():
    coll = db.get_collection("stock_list")
    await coll.drop()
    await coll.insert_one({"tickers": TICKERS})
    print("Imported stock list")


async def import_stock_prices():
    coll = db.get_collection("stock_prices")
    await coll.drop()
    for ticker in TICKERS:
        csv_path = os.path.join(DATA_DIR, "stockdata", f"{ticker}.csv")
        if not os.path.exists(csv_path):
            print(f"Warning: {csv_path} not found, skipping")
            continue
        # The CSV has 3 header rows before the actual data
        df = pd.read_csv(
            csv_path, skiprows=3, header=None,
            names=["Date", "Open", "High", "Low", "Close", "Volume"]
        )
        df = df.dropna(subset=["Date"])
        stock_series = [
            {
                "date": str(row["Date"]),
                "Open": float(row["Open"]),
                "High": float(row["High"]),
                "Low": float(row["Low"]),
                "Close": float(row["Close"]),
            }
            for _, row in df.iterrows()
        ]
        stock_series.sort(key=lambda d: d["date"])
        await coll.insert_one({"name": ticker, "stock_series": stock_series})
        print(f"Imported stock prices for {ticker} ({len(stock_series)} rows)")


def parse_news_file(filepath: str) -> dict:
    """Parse a news .txt file into a dict with Title, Date, content fields."""
    with open(filepath, "r", encoding="utf-8", errors="replace") as f:
        raw = f.read()

    title = ""
    date = ""
    content_lines = []
    in_content = False

    for line in raw.splitlines():
        if not in_content:
            if line.startswith("Title:"):
                title = line[len("Title:"):].strip()
            elif line.startswith("Date:"):
                date = line[len("Date:"):].strip()
            elif line.startswith("Content:"):
                in_content = True
        else:
            content_lines.append(line)

    return {
        "Title": title,
        "Date": date,
        "content": "\n".join(content_lines).strip(),
    }


async def import_stock_news():
    coll = db.get_collection("stock_news")
    await coll.drop()
    news_dir = os.path.join(DATA_DIR, "stocknews")
    docs = []
    for ticker in sorted(os.listdir(news_dir)):
        ticker_dir = os.path.join(news_dir, ticker)
        if not os.path.isdir(ticker_dir):
            continue
        for filename in os.listdir(ticker_dir):
            if not filename.endswith(".txt"):
                continue
            filepath = os.path.join(ticker_dir, filename)
            try:
                article = parse_news_file(filepath)
                article["Stock"] = ticker
                docs.append(article)
            except Exception as e:
                print(f"Error reading {filepath}: {e}")
    if docs:
        await coll.insert_many(docs)
    print(f"Imported {len(docs)} news articles across {len(set(d['Stock'] for d in docs))} stocks")


async def import_tsne():
    coll = db.get_collection("tsne")
    await coll.drop()
    tsne_path = os.path.join(DATA_DIR, "tsne.csv")
    df = pd.read_csv(tsne_path)
    docs = [
        {
            "Stock": str(row["ticker"]),
            "x": float(row["x"]),
            "y": float(row["y"]),
            "sector": str(row["sector"]),
        }
        for _, row in df.iterrows()
    ]
    await coll.insert_many(docs)
    print(f"Imported {len(docs)} t-SNE data points")


async def main():
    await import_stock_list()
    await import_stock_prices()
    await import_stock_news()
    await import_tsne()
    client.close()
    print("Data import complete!")


if __name__ == "__main__":
    asyncio.run(main())
