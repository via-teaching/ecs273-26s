import os
import pandas as pd
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

# MongoDB connection (localhost, default port)
client = AsyncIOMotorClient("mongodb://localhost:27017")

# Create or access the database and collections
db = client.stock_hz

# Represents an ObjectId field in the database.
stock_name_collection = db.get_collection("stock_list")
stock_price_collection = db.get_collection("stock_price")
stock_news_collection = db.get_collection("stock_news")
tsne_collection = db.get_collection("tsne")

tickers = [ 'XOM', 'CVX', 'HAL',
            'MMM', 'CAT', 'DAL',
            'MCD', 'NKE', 'KO',
            'JNJ', 'PFE', 'UNH',
            'JPM', 'GS', 'BAC',
            'AAPL', 'MSFT', 'NVDA', 
            'GOOGL', 'META']

data_directory = os.path.join(os.path.dirname(__file__), "data")
stock_data_directory = os.path.join(data_directory, "stockdata")
stock_news_directory = os.path.join(data_directory, "stocknews")

# Import tickers to MongoDB
async def import_tickers_to_mongodb():
    await stock_name_collection.delete_many({})  # clear old data first
    await stock_name_collection.insert_one({
        "tickers": tickers
    })
    print("Tickers imported.")

# Import stock prices to MongoDB
async def import_stock_prices():
    await stock_price_collection.delete_many({})  # clear old data first

    # Loop through each ticker, read its CSV file, and insert the data into MongoDB
    for ticker in tickers:
        csv_path = os.path.join(stock_data_directory, f"{ticker}.csv")
        df = pd.read_csv(csv_path)
        df["Date"] = df["Date"].str[:10]  # to "XXXX-XX-XX"
        records = [
            {
                "date": row["Date"],
                "Open": float(row["Open"]),
                "High": float(row["High"]),
                "Low": float(row["Low"]),
                "Close": float(row["Close"]),
            }
            for _, row in df.iterrows()
        ]

        await stock_price_collection.insert_one({
            "name": ticker,
            "stock_series": records
        })

        print(f"Stock price imported: {ticker}")

# Import stock news to MongoDB
async def import_stock_news():
    await stock_news_collection.delete_many({})  # clear old data first
    
    # Loop through each ticker's news directory, read the text files, and insert the data into MongoDB
    for ticker in tickers:
        news_dir = os.path.join(stock_news_directory, ticker)
        for filename in os.listdir(news_dir):
            if not filename.endswith(".txt"):
                continue
            filepath = os.path.join(news_dir, filename)
            with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()

            # parse Title and Date from the first few lines of the file
            title, date = "", ""
            for line in content.splitlines():
                if line.startswith("Title:"):
                    title = line.replace("Title:", "").strip()
                elif line.startswith("Date:"):
                    date = line.replace("Date:", "").strip()
                if title and date:
                    break

            await stock_news_collection.insert_one({
                "Stock": ticker,
                "Title": title,
                "Date": date,
                "content": content,
            })
        print(f"News imported: {ticker}")

# Import t-SNE data to MongoDB (all perplexity values)
async def import_tsne():
    await tsne_collection.delete_many({})  # clear old data first
    tsne_dir = os.path.join(data_directory, "tsne_result")
    for filename in os.listdir(tsne_dir):
        if not filename.endswith(".csv"):
            continue
        # extract perplexity number from filename e.g. "tsne_p10.csv" -> 10
        perplexity = int(filename.replace("tsne_p", "").replace(".csv", ""))
        filepath = os.path.join(tsne_dir, filename)
        df = pd.read_csv(filepath)
        docs = [
            {
                "Stock": row["Ticker"],
                "Category": row["Category"],
                "x": float(row["Raw_TSNE1"]),
                "y": float(row["Raw_TSNE2"]),
                "latent_x": float(row["Latent_TSNE1"]),
                "latent_y": float(row["Latent_TSNE2"]),
                "perplexity": perplexity,
            }
            for _, row in df.iterrows()
        ]
        await tsne_collection.insert_many(docs)
        print(f"t-SNE imported: perplexity {perplexity}")

async def main():
    # Run all import functions sequentially
    await import_tickers_to_mongodb()
    await import_stock_prices()
    await import_stock_news()
    await import_tsne()
    print("All data imported successfully.")

if __name__ == "__main__":
    asyncio.run(main())