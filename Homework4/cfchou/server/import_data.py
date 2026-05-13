import asyncio
import re
from pathlib import Path

import pandas as pd
from motor.motor_asyncio import AsyncIOMotorClient

DATA_DIR = Path(__file__).parent / "data"
MONGO_URI = "mongodb://localhost:27017"
DB_NAME = "stock_chifang"

client = AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]


def list_tickers() -> list[str]:
    csvs = sorted((DATA_DIR / "stockdata").glob("*.csv"))
    return [p.stem for p in csvs]


async def import_stock_list(tickers: list[str]) -> None:
    coll = db.get_collection("stock_list")
    await coll.delete_many({})
    await coll.insert_one({"tickers": tickers})
    print(f"[stock_list] inserted 1 document with {len(tickers)} tickers")


async def import_stock_prices(tickers: list[str]) -> None:
    coll = db.get_collection("stock_prices")
    await coll.delete_many({})

    docs = []
    for ticker in tickers:
        csv_path = DATA_DIR / "stockdata" / f"{ticker}.csv"
        df = pd.read_csv(csv_path)
        series = [
            {
                "date": str(row["Date"]),
                "Open": float(row["Open"]),
                "High": float(row["High"]),
                "Low": float(row["Low"]),
                "Close": float(row["Close"]),
                "Volume": float(row["Volume"]),
            }
            for _, row in df.iterrows()
        ]
        docs.append({"name": ticker, "stock_series": series})

    if docs:
        await coll.insert_many(docs)
    print(f"[stock_prices] inserted {len(docs)} stock documents")


_NEWS_FIELD_RE = re.compile(r"^(Title|Date|URL):\s*(.*)$")


def parse_news_file(path: Path, ticker: str) -> dict:
    text = path.read_text(encoding="utf-8", errors="replace")
    title, date_str, url = "", "", ""
    content_lines: list[str] = []
    in_content = False

    for line in text.splitlines():
        if in_content:
            content_lines.append(line)
            continue
        if line.strip() == "Content:":
            in_content = True
            continue
        m = _NEWS_FIELD_RE.match(line)
        if not m:
            continue
        key, val = m.group(1), m.group(2).strip()
        if key == "Title":
            title = val
        elif key == "Date":
            date_str = val
        elif key == "URL":
            url = val

    return {
        "Stock": ticker,
        "Title": title or path.stem,
        "Date": date_str,
        "URL": url,
        "content": "\n".join(content_lines).strip(),
    }


async def import_stock_news(tickers: list[str]) -> None:
    coll = db.get_collection("stock_news")
    await coll.delete_many({})

    docs = []
    for ticker in tickers:
        folder = DATA_DIR / "stocknews" / ticker
        if not folder.is_dir():
            continue
        for txt in sorted(folder.glob("*.txt")):
            docs.append(parse_news_file(txt, ticker))

    if docs:
        await coll.insert_many(docs)
    print(f"[stock_news] inserted {len(docs)} articles across {len(tickers)} tickers")


async def import_tsne() -> None:
    coll = db.get_collection("tsne")
    await coll.delete_many({})

    csv_path = DATA_DIR / "tsne.csv"
    df = pd.read_csv(csv_path)
    sym_col = "symbol" if "symbol" in df.columns else "Stock"
    docs = [
        {
            "Stock": str(row[sym_col]),
            "x": float(row["x"]),
            "y": float(row["y"]),
            "sector": str(row.get("sector", "") or ""),
        }
        for _, row in df.iterrows()
    ]
    if docs:
        await coll.insert_many(docs)
    print(f"[tsne] inserted {len(docs)} points")


async def main() -> None:
    tickers = list_tickers()
    if not tickers:
        raise SystemExit(f"No CSVs found under {DATA_DIR / 'stockdata'}")
    print(f"Using database: {DB_NAME}")
    print(f"Found {len(tickers)} tickers: {tickers}")

    await import_stock_list(tickers)
    await import_stock_prices(tickers)
    await import_stock_news(tickers)
    await import_tsne()
    print("Done.")


if __name__ == "__main__":
    asyncio.run(main())
