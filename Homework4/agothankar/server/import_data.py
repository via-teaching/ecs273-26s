import asyncio
from pathlib import Path

import pandas as pd
from motor.motor_asyncio import AsyncIOMotorClient

# MongoDB connection (localhost, default port)
client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.stock_agothankar

stock_name_collection = db.get_collection("stock_list")
stock_data_collection = db.get_collection("stock_data")
stock_news_collection = db.get_collection("stock_news")
tsne_collection = db.get_collection("tsne_data")

DATA_DIR = Path(__file__).parent / "data"
STOCKDATA_DIR = DATA_DIR / "stockdata"
STOCKNEWS_DIR = DATA_DIR / "stocknews"
TSNE_PATH = DATA_DIR / "tsne.csv"
NEWS_METADATA_KEYS = {"Title", "Date", "URL"}


def get_tickers() -> list[str]:
    return sorted(path.stem.upper() for path in STOCKDATA_DIR.glob("*.csv"))


def split_news_metadata(content: str) -> tuple[dict[str, str], str]:
    metadata = {}
    body_lines = []

    for line in content.splitlines():
        key, separator, value = line.partition(":")
        if separator and key in NEWS_METADATA_KEYS:
            metadata[key] = value.strip()
        else:
            body_lines.append(line)

    return metadata, "\n".join(body_lines).strip()


def parse_news_file(path: Path, stock: str) -> dict:
    stem = path.stem
    if "_" in stem:
        date, title = stem.split("_", 1)
    else:
        date, title = "", stem

    content = path.read_text(encoding="utf-8", errors="replace")
    metadata, body = split_news_metadata(content)

    return {
        "Stock": stock,
        "Date": metadata.get("Date") or date,
        "Title": metadata.get("Title") or title,
        "content": body,
        "url": metadata.get("URL") or None,
        "fileName": path.name,
    }


async def import_tickers_to_mongodb():
    tickers = get_tickers()
    if not tickers:
        raise RuntimeError(f"No stock CSV files found in {STOCKDATA_DIR}")

    await stock_name_collection.delete_many({})
    await stock_data_collection.delete_many({})
    await stock_news_collection.delete_many({})
    await tsne_collection.delete_many({})

    await stock_name_collection.insert_one({"tickers": tickers})

    for ticker in tickers:
        csv_path = STOCKDATA_DIR / f"{ticker}.csv"
        stock_df = pd.read_csv(csv_path)
        stock_df = stock_df.where(pd.notnull(stock_df), None)
        stock_series = []

        for row in stock_df.to_dict("records"):
            stock_series.append({
                "date": str(row.get("Date", "")),
                "Open": row.get("Open"),
                "High": row.get("High"),
                "Low": row.get("Low"),
                "Close": row.get("Close"),
                "Volume": row.get("Volume"),
            })

        await stock_data_collection.insert_one({
            "name": ticker,
            "stock_series": stock_series,
        })

    news_docs = []
    if STOCKNEWS_DIR.exists():
        for stock_dir in STOCKNEWS_DIR.iterdir():
            if not stock_dir.is_dir():
                continue
            for news_path in sorted(stock_dir.glob("*.txt")):
                news_docs.append(parse_news_file(news_path, stock_dir.name.upper()))

    if news_docs:
        await stock_news_collection.insert_many(news_docs)

    if TSNE_PATH.exists():
        tsne_df = pd.read_csv(TSNE_PATH)
        tsne_docs = []
        for row in tsne_df.to_dict("records"):
            tsne_docs.append({
                "Stock": row.get("Ticker"),
                "x": row.get("TSNE-1"),
                "y": row.get("TSNE-2"),
                "Sector": row.get("Sector"),
            })
        if tsne_docs:
            await tsne_collection.insert_many(tsne_docs)

    await stock_data_collection.create_index("name", unique=True)
    await stock_news_collection.create_index("Stock")
    await tsne_collection.create_index("Stock", unique=True)

    print(
        f"Imported {len(tickers)} stocks, {len(news_docs)} news articles, "
        f"and t-SNE data into MongoDB database '{db.name}'."
    )


if __name__ == "__main__":
    asyncio.run(import_tickers_to_mongodb())
