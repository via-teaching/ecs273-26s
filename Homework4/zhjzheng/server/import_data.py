import os
import pandas as pd
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.stock_zjz

tickers = [
    'AAPL', 'BAC', 'CAT', 'CVX', 'DAL',
    'GOOGL', 'GS', 'HAL', 'JNJ', 'JPM',
    'KO', 'MCD', 'META', 'MMM', 'MSFT',
    'NKE', 'NVDA', 'PFE', 'UNH', 'XOM'
]

async def import_stock_list():
    col = db.get_collection("stock_list")
    await col.delete_many({})
    await col.insert_one({"tickers": tickers})
    print("imported stock list")

async def import_stock_data():
    col = db.get_collection("stock_prices")
    await col.delete_many({})

    data_dir = "data/stockdata"
    for ticker in tickers:
        fpath = os.path.join(data_dir, f"{ticker}.csv")
        df = pd.read_csv(fpath)
        records = []
        for _, row in df.iterrows():
            records.append({
                "date": str(row["Date"]),
                "Open": float(row["Open"]),
                "High": float(row["High"]),
                "Low": float(row["Low"]),
                "Close": float(row["Close"]),
            })
        doc = {"name": ticker, "stock_series": records}
        await col.insert_one(doc)
        print(f"  imported {ticker} stock data")

    print("imported all stock data")

async def import_news():
    col = db.get_collection("stock_news")
    await col.delete_many({})

    news_dir = "data/stocknews"
    for ticker in tickers:
        ticker_dir = os.path.join(news_dir, ticker)
        if not os.path.isdir(ticker_dir):
            print(f"  no news folder for {ticker}, skipping")
            continue
        for fname in os.listdir(ticker_dir):
            if not fname.endswith('.txt'):
                continue
            fpath = os.path.join(ticker_dir, fname)
            with open(fpath, encoding='utf-8', errors='ignore') as f:
                raw = f.read()

            lines = raw.split('\n')
            title, date = '', ''
            content_lines = []
            past_sep = False
            for line in lines:
                if line.startswith('Title:'):
                    title = line.replace('Title:', '').strip()
                elif line.startswith('Date:'):
                    date = line.replace('Date:', '').strip()
                elif line.startswith('---'):
                    past_sep = True
                elif past_sep:
                    content_lines.append(line)

            doc = {
                "Stock": ticker,
                "Title": title,
                "Date": date,
                "content": '\n'.join(content_lines).strip()
            }
            await col.insert_one(doc)

        print(f"  imported {ticker} news")

    print("imported all news")

async def import_tsne():
    col = db.get_collection("tsne")
    await col.delete_many({})

    df = pd.read_csv("data/tsne.csv")
    for _, row in df.iterrows():
        doc = {
            "Stock": row["ticker"],
            "x": float(row["x"]),
            "y": float(row["y"]),
            "sector": row["sector"]
        }
        await col.insert_one(doc)

    print("imported tsne data")

async def main():
    await import_stock_list()
    await import_stock_data()
    await import_news()
    await import_tsne()
    print("all done!")

if __name__ == "__main__":
    asyncio.run(main())
