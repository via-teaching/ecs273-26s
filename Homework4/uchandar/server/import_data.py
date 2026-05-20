import os
import asyncio
import pandas as pd
from motor.motor_asyncio import AsyncIOMotorClient

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")

client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.stock_uchandar

tickers = [
    'XOM', 'CVX', 'HAL',
    'MMM', 'CAT', 'DAL',
    'MCD', 'NKE', 'KO',
    'JNJ', 'PFE', 'UNH',
    'JPM', 'GS', 'BAC',
    'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META'
]


async def importStockList():
    collection = db.get_collection("stock_list")
    await collection.drop()
    await collection.insert_one({"tickers": tickers})
    print(f"stock_list: inserted 1 document ({len(tickers)} tickers)")


async def importStockPrices():
    collection = db.get_collection("stock_price")
    await collection.drop()

    stockDataDir = os.path.join(DATA_DIR, "stockdata")
    for ticker in tickers:
        csvPath = os.path.join(stockDataDir, f"{ticker}.csv")
        df = pd.read_csv(csvPath)

        # Strip timezone offset — keep YYYY-MM-DD only
        df['Date'] = pd.to_datetime(df['Date'], utc=True).dt.strftime('%Y-%m-%d')

        stockSeries = [
            {
                "date": row['Date'],
                "Open": float(row['Open']),
                "High": float(row['High']),
                "Low": float(row['Low']),
                "Close": float(row['Close'])
            }
            for _, row in df.iterrows()
        ]

        await collection.insert_one({"name": ticker, "stock_series": stockSeries})

    print(f"stock_price: inserted {len(tickers)} documents")


async def importStockNews():
    collection = db.get_collection("stock_news")
    await collection.drop()

    newsBaseDir = os.path.join(DATA_DIR, "stocknews")
    totalInserted = 0

    for ticker in tickers:
        tickerDir = os.path.join(newsBaseDir, ticker)
        if not os.path.isdir(tickerDir):
            continue

        for fileName in sorted(os.listdir(tickerDir)):
            if not fileName.endswith(".txt"):
                continue

            filePath = os.path.join(tickerDir, fileName)
            with open(filePath, 'r', encoding='utf-8') as f:
                lines = f.readlines()

            title = ""
            date = ""
            bodyLines = []
            headerDone = False

            for line in lines:
                stripped = line.rstrip('\n')
                if not headerDone:
                    if stripped.startswith("Title: "):
                        title = stripped[len("Title: "):]
                    elif stripped.startswith("Date: "):
                        date = stripped[len("Date: "):]
                    elif stripped == "":
                        headerDone = True
                else:
                    bodyLines.append(stripped)

            content = "\n".join(bodyLines).strip()

            await collection.insert_one({
                "Stock": ticker,
                "Title": title,
                "Date": date,
                "content": content
            })
            totalInserted += 1

    print(f"stock_news: inserted {totalInserted} documents")


async def importTsne():
    collection = db.get_collection("tsne")
    await collection.drop()

    tsnePath = os.path.join(DATA_DIR, "tsne.csv")
    df = pd.read_csv(tsnePath)

    docs = [
        {
            "Stock": row['ticker'],
            "x": float(row['tsne_dim_1']),
            "y": float(row['tsne_dim_2']),
            "sector": row['sector']
        }
        for _, row in df.iterrows()
    ]

    await collection.insert_many(docs)
    print(f"tsne: inserted {len(docs)} documents")


async def main():
    print("Importing data into stock_uchandar...")
    await importStockList()
    await importStockPrices()
    await importStockNews()
    await importTsne()
    print("Import complete.")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
