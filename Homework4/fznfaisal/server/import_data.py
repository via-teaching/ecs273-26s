import asyncio
import csv
from datetime import datetime
from pathlib import Path

from motor.motor_asyncio import AsyncIOMotorClient

# MongoDB connection (localhost, default port)
client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.stock_faze

DATA_ROOT = Path(__file__).resolve().parent / "data"

SECTOR_BY_TICKER = {
    "AAPL": "Technology",
    "BAC": "Finance",
    "CAT": "Industrials",
    "CVX": "Energy",
    "DAL": "Industrials",
    "GOOGL": "Technology",
    "GS": "Finance",
    "HAL": "Energy",
    "JNJ": "Healthcare",
    "JPM": "Finance",
    "KO": "Consumer",
    "MCD": "Consumer",
    "META": "Technology",
    "MMM": "Industrials",
    "MSFT": "Technology",
    "NKE": "Consumer",
    "NVDA": "Technology",
    "PFE": "Healthcare",
    "UNH": "Healthcare",
    "XOM": "Energy",
}


async def import_data_to_mongodb():
    tickers = await import_stock_prices()
    await import_stock_list(tickers)
    await import_tsne_points()
    await import_news_articles()
    await create_indexes()
    print(f"Imported {len(tickers)} tickers into stock_faze.")


async def import_stock_list(tickers: list[str]):
    await db.stock_list.delete_many({})
    await db.stock_list.insert_one({"tickers": tickers})


async def import_stock_prices() -> list[str]:
    stock_documents = []

    for csv_path in sorted((DATA_ROOT / "stockdata").glob("*.csv")):
        ticker = csv_path.stem
        series = []

        with csv_path.open(newline="", encoding="utf-8") as file:
            for row in csv.DictReader(file):
                series.append(
                    {
                        "date": row["Date"],
                        "open": float(row["Open"]),
                        "high": float(row["High"]),
                        "low": float(row["Low"]),
                        "close": float(row["Close"]),
                        "volume": int(float(row["Volume"])),
                    }
                )

        stock_documents.append({"ticker": ticker, "series": series})

    await db.stock_prices.delete_many({})
    if stock_documents:
        await db.stock_prices.insert_many(stock_documents)

    return [document["ticker"] for document in stock_documents]


async def import_tsne_points():
    points = []

    with (DATA_ROOT / "tsne.csv").open(newline="", encoding="utf-8") as file:
        for row in csv.DictReader(file):
            ticker = row["ticker"]
            points.append(
                {
                    "ticker": ticker,
                    "x": float(row["tsne_dim_1"]),
                    "y": float(row["tsne_dim_2"]),
                    "sector": SECTOR_BY_TICKER.get(ticker, "Other"),
                }
            )

    await db.tsne_points.delete_many({})
    if points:
        await db.tsne_points.insert_many(points)


async def import_news_articles():
    articles = []

    for article_path in sorted((DATA_ROOT / "stocknews").glob("*/*.txt")):
        ticker = article_path.parent.name
        raw = article_path.read_text(encoding="utf-8")
        title, date_text, url, content = parse_news_file(raw)
        parsed_date = parse_news_date(date_text)

        articles.append(
            {
                "id": str(article_path.relative_to(DATA_ROOT)),
                "ticker": ticker,
                "title": title,
                "date": date_text,
                "dateSort": parsed_date,
                "dateLabel": parsed_date.strftime("%b %-d, %Y, %-I:%M %p") if parsed_date else date_text,
                "url": url,
                "content": content,
            }
        )

    await db.stock_news.delete_many({})
    if articles:
        await db.stock_news.insert_many(articles)


def parse_news_file(raw: str) -> tuple[str, str, str, str]:
    lines = raw.splitlines()
    title = lines[0].replace("Title:", "", 1).strip() if len(lines) > 0 else ""
    date_text = lines[1].replace("Date:", "", 1).strip() if len(lines) > 1 else ""
    url = lines[2].replace("URL:", "", 1).strip() if len(lines) > 2 else ""

    content_start = 3
    while content_start < len(lines) and lines[content_start].strip() == "":
        content_start += 1

    return title, date_text, url, "\n".join(lines[content_start:]).strip()


def parse_news_date(date_text: str) -> datetime | None:
    try:
        return datetime.strptime(date_text, "%Y-%m-%d %H:%M")
    except ValueError:
        return None


async def create_indexes():
    await db.stock_prices.create_index("ticker", unique=True)
    await db.tsne_points.create_index("ticker", unique=True)
    await db.stock_news.create_index([("ticker", 1), ("dateSort", -1)])


if __name__ == "__main__":
    asyncio.run(import_data_to_mongodb())
