import asyncio
from pathlib import Path

import pandas as pd
from motor.motor_asyncio import AsyncIOMotorClient

from data_scheme import (
    COLLECTION_STOCK_LIST,
    COLLECTION_STOCK_NEWS,
    COLLECTION_STOCK_PRICES,
    COLLECTION_TSNE,
    DATABASE_NAME,
    TICKERS,
)

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
STOCKDATA_DIR = DATA_DIR / "stockdata"
STOCKNEWS_DIR = DATA_DIR / "stocknews"
TSNE_CSV = DATA_DIR / "tsne.csv"

client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client[DATABASE_NAME]


def parse_news_file(path: Path, stock: str) -> dict:
    text = path.read_text(encoding="utf-8", errors="replace")
    title = ""
    date = ""
    content = ""

    for line in text.splitlines():
        if line.startswith("Title:"):
            title = line.split(":", 1)[1].strip()
        elif line.startswith("Date:"):
            date = line.split(":", 1)[1].strip()

    if "Content:" in text:
        content = text.split("Content:", 1)[1].strip()

    return {
        "Stock": stock,
        "Title": title or path.stem,
        "Date": date,
        "content": content,
    }


def load_stock_series(csv_path: Path) -> list[dict]:
    df = pd.read_csv(csv_path)
    series = []
    for row in df.itertuples(index=False):
        series.append(
            {
                "date": str(row.Date),
                "Open": float(row.Open),
                "High": float(row.High),
                "Low": float(row.Low),
                "Close": float(row.Close),
            }
        )
    return series


async def clear_collections() -> None:
    await db[COLLECTION_STOCK_LIST].delete_many({})
    await db[COLLECTION_STOCK_PRICES].delete_many({})
    await db[COLLECTION_STOCK_NEWS].delete_many({})
    await db[COLLECTION_TSNE].delete_many({})


async def import_tickers() -> None:
    await db[COLLECTION_STOCK_LIST].insert_one({"tickers": TICKERS})


async def import_stock_prices() -> None:
    docs = []
    for ticker in TICKERS:
        csv_path = STOCKDATA_DIR / f"{ticker}.csv"
        if not csv_path.exists():
            raise FileNotFoundError(f"Missing stock CSV: {csv_path}")
        docs.append({"name": ticker, "stock_series": load_stock_series(csv_path)})
    await db[COLLECTION_STOCK_PRICES].insert_many(docs)


async def import_news() -> None:
    articles = []
    for ticker_dir in sorted(STOCKNEWS_DIR.iterdir()):
        if not ticker_dir.is_dir():
            continue
        stock = ticker_dir.name.upper()
        if stock not in TICKERS:
            continue
        for news_file in sorted(ticker_dir.glob("*.txt")):
            articles.append(parse_news_file(news_file, stock))

    if not articles:
        raise RuntimeError(f"No news articles found under {STOCKNEWS_DIR}")

    await db[COLLECTION_STOCK_NEWS].insert_many(articles)
    await db[COLLECTION_STOCK_NEWS].create_index("Stock")
    await db[COLLECTION_STOCK_NEWS].create_index([("Stock", 1), ("Date", 1)])


async def import_tsne() -> None:
    df = pd.read_csv(TSNE_CSV)
    docs = []
    for row in df.itertuples(index=False):
        ticker = str(row.ticker).upper()
        if ticker not in TICKERS:
            continue
        docs.append(
            {
                "Stock": ticker,
                "x": float(row.x),
                "y": float(row.y),
                "category": str(row.category),
            }
        )

    if len(docs) != len(TICKERS):
        found = {d["Stock"] for d in docs}
        missing = sorted(set(TICKERS) - found)
        if missing:
            raise RuntimeError(f"Missing t-SNE rows for: {', '.join(missing)}")

    await db[COLLECTION_TSNE].insert_many(docs)
    await db[COLLECTION_TSNE].create_index("Stock", unique=True)


async def import_all() -> None:
    await clear_collections()
    await import_tickers()
    await import_stock_prices()
    await import_news()
    await import_tsne()

    counts = {
        COLLECTION_STOCK_LIST: await db[COLLECTION_STOCK_LIST].count_documents({}),
        COLLECTION_STOCK_PRICES: await db[COLLECTION_STOCK_PRICES].count_documents({}),
        COLLECTION_STOCK_NEWS: await db[COLLECTION_STOCK_NEWS].count_documents({}),
        COLLECTION_TSNE: await db[COLLECTION_TSNE].count_documents({}),
    }
    print(f"Imported into database '{DATABASE_NAME}':")
    for name, count in counts.items():
        print(f"  {name}: {count} documents")


if __name__ == "__main__":
    asyncio.run(import_all())
