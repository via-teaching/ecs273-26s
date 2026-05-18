from pathlib import Path
import asyncio
from collections import Counter

import pandas as pd
from motor.motor_asyncio import AsyncIOMotorClient


BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
STOCKDATA_DIR = DATA_DIR / "stockdata"
STOCKNEWS_DIR = DATA_DIR / "stocknews"
TSNE_PATH = DATA_DIR / "tsne.csv"

# Use stock_<abbr_of_your_name> to avoid collisions during grading.
client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.stock_sijia


def load_stock_price_documents() -> tuple[list[str], list[dict]]:
    tickers: list[str] = []
    documents: list[dict] = []

    for csv_path in sorted(STOCKDATA_DIR.glob("*.csv")):
        ticker = csv_path.stem
        tickers.append(ticker)

        frame = pd.read_csv(csv_path)
        stock_series = [
            {
                "date": str(row["Date"]),
                "Open": float(row["Open"]),
                "High": float(row["High"]),
                "Low": float(row["Low"]),
                "Close": float(row["Close"]),
            }
            for _, row in frame.iterrows()
        ]

        documents.append(
            {
                "name": ticker,
                "stock_series": stock_series,
            }
        )

    return tickers, documents


def parse_news_file(news_path: Path, stock_name: str) -> dict:
    text = news_path.read_text(encoding="utf-8", errors="replace").strip()
    header, _, body = text.partition("\n\n")
    header_lines = [line.strip() for line in header.splitlines() if line.strip()]

    article: dict[str, str] = {
        "Stock": stock_name,
        "Title": news_path.stem,
        "Date": "",
        "URL": "",
        "content": body.strip(),
    }

    for line in header_lines:
        if line.startswith("Title:"):
            article["Title"] = line.removeprefix("Title:").strip()
        elif line.startswith("Date:"):
            article["Date"] = line.removeprefix("Date:").strip()
        elif line.startswith("URL:"):
            article["URL"] = line.removeprefix("URL:").strip()

    return article


def load_news_documents() -> list[dict]:
    documents: list[dict] = []

    for stock_dir in sorted(path for path in STOCKNEWS_DIR.iterdir() if path.is_dir()):
        stock_name = stock_dir.name
        for news_path in sorted(stock_dir.glob("*.txt")):
            documents.append(parse_news_file(news_path, stock_name))

    return documents


def load_tsne_documents() -> list[dict]:
    frame = pd.read_csv(TSNE_PATH)
    documents: list[dict] = []

    for _, row in frame.iterrows():
        documents.append(
            {
                "Stock": str(row["ticker"]),
                "x": float(row["x"]),
                "y": float(row["y"]),
                "category": str(row["category"]),
            }
        )

    return documents


async def import_all_data() -> None:
    tickers, stock_documents = load_stock_price_documents()
    news_documents = load_news_documents()
    tsne_documents = load_tsne_documents()
    news_counter = Counter(doc["Stock"] for doc in news_documents)

    stock_list_collection = db.get_collection("stock_list")
    stock_price_collection = db.get_collection("stock_prices")
    stock_news_collection = db.get_collection("stock_news")
    tsne_collection = db.get_collection("tsne")

    # Reload the homework dataset from scratch so repeated runs do not duplicate rows.
    await stock_list_collection.delete_many({})
    await stock_price_collection.delete_many({})
    await stock_news_collection.delete_many({})
    await tsne_collection.delete_many({})

    if tickers:
        await stock_list_collection.insert_one({"tickers": tickers})
    if stock_documents:
        await stock_price_collection.insert_many(stock_documents)
    if news_documents:
        await stock_news_collection.insert_many(news_documents)
    if tsne_documents:
        await tsne_collection.insert_many(tsne_documents)

    await stock_price_collection.create_index("name", unique=True)
    await stock_news_collection.create_index([("Stock", 1), ("Date", -1)])
    await tsne_collection.create_index("Stock", unique=True)

    print(
        "Imported "
        f"{len(tickers)} tickers, "
        f"{len(stock_documents)} stock documents, "
        f"{len(news_documents)} news documents, "
        f"and {len(tsne_documents)} tsne documents into database 'stock_sijia'."
    )
    print(f"News stocks imported: {sorted(news_counter.keys())}")
    print(f"News counts by stock: {dict(sorted(news_counter.items()))}")


if __name__ == "__main__":
    asyncio.run(import_all_data())
