"""
Imports all stock data into MongoDB (stock_pmanimaran).
Run once from the server/ directory: python import_data.py
"""
import os
import asyncio
import pandas as pd
from motor.motor_asyncio import AsyncIOMotorClient

client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.stock_pmanimaran

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

TICKERS = [
    'AAPL', 'BAC', 'CAT', 'CVX', 'DAL', 'GOOGL', 'GS', 'HAL',
    'JNJ', 'JPM', 'KO', 'MCD', 'META', 'MMM', 'MSFT', 'NKE',
    'NVDA', 'PFE', 'UNH', 'XOM'
]

SECTORS = {
    'AAPL': 'Technology', 'MSFT': 'Technology', 'NVDA': 'Technology',
    'GOOGL': 'Technology', 'META': 'Technology',
    'JPM': 'Finance', 'GS': 'Finance', 'BAC': 'Finance',
    'JNJ': 'Healthcare', 'PFE': 'Healthcare', 'UNH': 'Healthcare',
    'XOM': 'Energy', 'CVX': 'Energy', 'HAL': 'Energy',
    'MCD': 'Consumer', 'NKE': 'Consumer', 'KO': 'Consumer',
    'MMM': 'Industrial', 'CAT': 'Industrial', 'DAL': 'Industrial',
}


def parse_news_file(filepath: str, ticker: str) -> dict:
    with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
        text = f.read()
    sections = {'Title': '', 'Date': '', 'Content': ''}
    current = None
    buf = []
    for line in text.split('\n'):
        stripped = line.strip()
        if stripped in sections:
            if current and buf:
                sections[current] = '\n'.join(buf).strip()
            current = stripped
            buf = []
        elif current:
            buf.append(line)
    if current and buf:
        sections[current] = '\n'.join(buf).strip()
    return {
        'Stock': ticker,
        'Title': sections['Title'] or os.path.basename(filepath),
        'Date': sections['Date'],
        'content': sections['Content'],
    }


async def run():
    await db.stock_list.drop()
    await db.stock_prices.drop()
    await db.stock_news.drop()
    await db.tsne_data.drop()
    print("Cleared existing collections.")

    # stock_list
    await db.stock_list.insert_one({"tickers": TICKERS})
    print(f"Inserted stock_list ({len(TICKERS)} tickers)")

    for ticker in TICKERS:
        # stock_prices
        df = pd.read_csv(os.path.join(DATA_DIR, "stockdata", f"{ticker}.csv"))
        series = [
            {"date": str(row["Date"]), "Open": float(row["Open"]),
             "High": float(row["High"]), "Low": float(row["Low"]), "Close": float(row["Close"])}
            for _, row in df.iterrows()
        ]
        await db.stock_prices.insert_one({"name": ticker, "stock_series": series})

        # stock_news
        news_dir = os.path.join(DATA_DIR, "stocknews", ticker)
        news_docs = []
        if os.path.isdir(news_dir):
            for fname in sorted(os.listdir(news_dir)):
                if fname.endswith('.txt'):
                    news_docs.append(parse_news_file(os.path.join(news_dir, fname), ticker))
        if news_docs:
            await db.stock_news.insert_many(news_docs)

        print(f"  {ticker}: {len(series)} price rows, {len(news_docs)} news articles")

    # tsne_data
    tsne_df = pd.read_csv(os.path.join(DATA_DIR, "tsne.csv"))
    tsne_docs = [
        {"Stock": row["ticker"], "x": float(row["x"]), "y": float(row["y"]),
         "sector": SECTORS.get(row["ticker"], "Unknown")}
        for _, row in tsne_df.iterrows()
    ]
    await db.tsne_data.insert_many(tsne_docs)
    print(f"Inserted tsne_data ({len(tsne_docs)} stocks)")
    print("\nImport complete!")


if __name__ == "__main__":
    asyncio.run(run())
