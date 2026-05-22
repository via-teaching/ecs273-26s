import os
import pandas as pd
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

# MongoDB connection (localhost, default port)
client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.stock_xiaoyu

stock_name_collection = db.get_collection("stock_list")
tickers = [ 'XOM', 'CVX', 'HAL',
            'MMM', 'CAT', 'DAL',
            'MCD', 'NKE', 'KO',
            'JNJ', 'PFE', 'UNH',
            'JPM', 'GS', 'BAC',
            'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META']

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

async def import_stock_list():
    col = db.get_collection("stock_list")
    await col.delete_many({}) 
    await col.insert_many([{"tickers": tickers}])
    print("✓ stock_list imported")

async def import_stock_prices():
    col = db.get_collection("stock_prices")
    await col.delete_many({})       

    for ticker in tickers:
        csv_path = os.path.join(DATA_DIR, "stockdata", f"{ticker}.csv")
        df = pd.read_csv(csv_path)

        records = []
        for _, row in df.iterrows():
            records.append({
                "date": str(row["Date"]),
                "Open": float(row["Open"]),
                "High": float(row["High"]),
                "Low": float(row["Low"]),
                "Close": float(row["Close"]),
            })

        await col.insert_one({
            "name": ticker,
            "stock_series": records,
        })
        print(f"  ✓ {ticker} prices imported ({len(records)} rows)")

    print("✓ All stock prices imported")

async def import_stock_news():
    col = db.get_collection("stock_news")
    await col.delete_many({})

    all_articles = []

    for ticker in tickers:
        news_dir = os.path.join(DATA_DIR, "stocknews", ticker)
        if not os.path.isdir(news_dir):
            continue

        for filename in sorted(os.listdir(news_dir)):
            if not filename.endswith(".txt"):
                continue

            filepath = os.path.join(news_dir, filename)
            with open(filepath, "r", encoding="utf-8") as f:
                text = f.read()

            #title, date, content = "", "", []
            lines = text.split("\n")
            title = ""
            date = ""
            content_lines = []

            for line in lines:
                if line.startswith("Title: "):
                    title = line[len("Title: "):]
                elif line.startswith("Date: "):
                    date = line[len("Date: "):]
                elif line.startswith("URL: "):
                    continue
                else:
                    content_lines.append(line)

            content = "\n".join(content_lines).strip()

            all_articles.append({
                "Stock": ticker,       # filter by this field in the frontend
                "Title": title,
                "Date": date,
                "content": content,
            })


    if all_articles:
        await col.insert_many(all_articles)
    print(f"✓ stock_news imported ({len(all_articles)} articles)")

async def import_tsne():
    col = db.get_collection("tsne_data")
    await col.delete_many({})

    tsne_path = os.path.join(DATA_DIR, "tsne.csv")
    df = pd.read_csv(tsne_path)

    docs = []
    for _, row in df.iterrows():
        docs.append({
            "Stock": row["ticker"],
            "x": float(row["x"]),
            "y": float(row["y"]),
            "sector": row.get("sector", ""),
        })

    if docs:
        await col.insert_many(docs)
    print(f"✓ tsne_data imported ({len(docs)} stocks)")

async def main():
    await import_stock_list()
    await import_stock_prices()
    await import_stock_news()
    await import_tsne()

if __name__ == "__main__":
    asyncio.run(main())