import os, csv, json, re, asyncio
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from data_scheme import SECTOR_MAP, TICKERS

MONGO_URI = "mongodb://localhost:27017"
DB_NAME   = "stock_yuhua"
DATA_DIR  = Path(__file__).parent / "data"

def strip_html(text):
    if not text: return ""
    return re.sub(r"<[^>]+>", "", text).replace("\n", " ").strip()

def parse_txt_article(path: Path, ticker: str) -> dict | None:
    try:
        lines = path.read_text(encoding="utf-8", errors="ignore").splitlines()
        title = date = url = ""
        content_start = 0
        for i, line in enumerate(lines[:5]):
            if line.startswith("Title:"):
                title = line[len("Title:"):].strip()
            elif line.startswith("Date:"):
                date = line[len("Date:"):].strip()[:10]  # keep YYYY-MM-DD
            elif line.startswith("URL:"):
                url = line[len("URL:"):].strip()
                content_start = i + 1
        content = " ".join(lines[content_start:]).strip()
        return {"Stock": ticker, "Title": title, "Date": date, "content": content}
    except Exception as e:
        print(f"  [WARN] {path.name}: {e}")
        return None

async def import_stock_list(db):
    col = db.get_collection("stock_list")
    await col.drop()
    await col.insert_one({"tickers": TICKERS})
    print(f"  stock_list: {len(TICKERS)} tickers")

async def import_stock_prices(db):
    col = db.get_collection("stock_prices")
    await col.drop()
    await col.create_index("name", unique=True)
    inserted = 0
    for ticker in TICKERS:
        path = DATA_DIR / "stockdata" / f"{ticker}.csv"
        if not path.exists():
            print(f"  [WARN] missing {path}"); continue
        series = []
        with open(path, newline="") as f:
            for row in csv.DictReader(f):
                try:
                    series.append({"date": row["Date"].strip(),
                        "Open": float(row["Open"]), "High": float(row["High"]),
                        "Low": float(row["Low"]),   "Close": float(row["Close"])})
                except (KeyError, ValueError): continue
        await col.insert_one({"name": ticker, "stock_series": series})
        print(f"  [OK] {ticker}: {len(series)} rows")
        inserted += 1
    print(f"  stock_prices: {inserted} docs\n")

async def import_stock_news(db):
    col = db.get_collection("stock_news")
    await col.drop()
    await col.create_index("Stock")
    total = 0
    for ticker in TICKERS:
        news_dir = DATA_DIR / "stocknews" / ticker
        if not news_dir.exists():
            print(f"  [WARN] no news for {ticker}"); continue
        articles = []
        # handle .txt files
        for tf in sorted(news_dir.glob("*.txt")):
            article = parse_txt_article(tf, ticker)
            if article:
                articles.append(article)
        # also handle .json files if present
        for jf in sorted(news_dir.glob("*.json")):
            if jf.name == "index.json": continue
            try:
                with open(jf, encoding="utf-8") as f:
                    data = json.load(f)
                items = data if isinstance(data, list) else [data]
                for item in items:
                    articles.append({"Stock": ticker,
                        "Title": item.get("title","").strip(),
                        "Date":  item.get("date","").strip(),
                        "content": strip_html(item.get("content",""))})
            except Exception as e:
                print(f"  [WARN] {jf.name}: {e}")
        if articles:
            await col.insert_many(articles)
            print(f"  [OK] {ticker}: {len(articles)} articles")
            total += len(articles)
    print(f"  stock_news: {total} total\n")

async def import_tsne(db):
    col = db.get_collection("tsne_data")
    await col.drop()
    await col.create_index("Stock", unique=True)
    path = DATA_DIR / "tsne.csv"
    if not path.exists():
        print(f"  [WARN] missing {path}"); return
    docs = []
    with open(path, newline="") as f:
        for row in csv.DictReader(f):
            r = {k.lower(): v for k, v in row.items()}
            ticker = r.get("ticker","").strip().upper()
            try:
                docs.append({"Stock": ticker, "x": float(r.get("x",0)),
                    "y": float(r.get("y",0)),
                    "sector": r.get("sector", SECTOR_MAP.get(ticker,"Unknown"))})
            except ValueError: continue
    if docs: await col.insert_many(docs)
    print(f"  tsne_data: {len(docs)} docs\n")

async def main():
    print(f"Connecting to {MONGO_URI}, db: {DB_NAME}\n")
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]
    await import_stock_list(db)
    await import_stock_prices(db)
    await import_stock_news(db)
    await import_tsne(db)
    print("Done!")
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
