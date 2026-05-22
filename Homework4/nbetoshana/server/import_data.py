import os
import pandas as pd
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

# MongoDB connection (localhost, default port)
client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.stock_noah

# this section gets the MongoDB collections I am using
stock_name_collection = db.get_collection("stock_list")
stock_data_collection = db.get_collection("stock_data")
stock_news_collection = db.get_collection("stock_news")
tsne_collection = db.get_collection("tsne")

# this section is the list of stocks used in the dashboard
tickers = [ 'XOM', 'CVX', 'HAL',
            'MMM', 'CAT', 'DAL',
            'MCD', 'NKE', 'KO',
            'JNJ', 'PFE', 'UNH',
            'JPM', 'GS', 'BAC',
            'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META']

async def import_tickers_to_mongodb():
    # Insert the tickers into the collection
    await stock_name_collection.delete_many({})
    await stock_name_collection.insert_one({
        "tickers": tickers
    })

async def import_stock_data_to_mongodb():
    # Insert the stock data into the collection
    await stock_data_collection.delete_many({})

    # this section reads each stock CSV file and stores it as one document
    for stock_name in tickers:
        file_path = os.path.join("data", "stockdata", stock_name + ".csv")

        if not os.path.exists(file_path):
            print(file_path, "not found")
            continue

        df = pd.read_csv(file_path)

        stock_series = []
        for index, row in df.iterrows():
            stock_series.append({
                "date": str(row["Date"]),
                "Open": float(row["Open"]),
                "High": float(row["High"]),
                "Low": float(row["Low"]),
                "Close": float(row["Close"])
            })

        await stock_data_collection.insert_one({
            "name": stock_name,
            "stock_series": stock_series
        })

async def import_news_to_mongodb():
    # Insert the news into the collection
    await stock_news_collection.delete_many({})

    # this section reads the news text files and puts them all in one collection
    for stock_name in tickers:
        folder_path = os.path.join("data", "stocknews", stock_name)

        if not os.path.exists(folder_path):
            print(folder_path, "not found")
            continue

        for filename in os.listdir(folder_path):
            if filename.endswith(".txt"):
                file_path = os.path.join(folder_path, filename)

                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    text = f.read()

                title = ""
                date = ""

                lines = text.split("\n")
                content_lines = []

                for line in lines:
                    if line.startswith("Title:"):
                        title = line.replace("Title:", "").strip()
                    elif line.startswith("Date:"):
                        date = line.replace("Date:", "").strip()
                    elif line.startswith("URL:"):
                        continue
                    else:
                        content_lines.append(line)

                content = "\n".join(content_lines).strip()

                if content == "":
                    cleaned_lines = []
                    for line in lines:
                        if line.startswith("Title:"):
                            continue
                        elif line.startswith("Date:"):
                            continue
                        elif line.startswith("URL:"):
                            continue
                        else:
                            cleaned_lines.append(line)

                    content = "\n".join(cleaned_lines).strip()

                await stock_news_collection.insert_one({
                    "Stock": stock_name,
                    "Title": title,
                    "Date": date,
                    "content": content
                })

async def import_tsne_to_mongodb():
    # Insert the t-SNE data into the collection
    await tsne_collection.delete_many({})

    # this section reads the t-SNE csv and stores one row per stock
    file_path = os.path.join("data", "tsne.csv")

    if not os.path.exists(file_path):
        print(file_path, "not found")
        return

    df = pd.read_csv(file_path)

    for index, row in df.iterrows():
        await tsne_collection.insert_one({
            "Stock": str(row["ticker"]),
            "x": float(row["x"]),
            "y": float(row["y"]),
            "sector": str(row["sector"])
        })

# this section runs all the import steps in order
async def import_all_to_mongodb():
    await import_tickers_to_mongodb()
    await import_stock_data_to_mongodb()
    await import_news_to_mongodb()
    await import_tsne_to_mongodb()

if __name__ == "__main__":
    asyncio.run(import_all_to_mongodb())