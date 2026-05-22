import os
import pandas as pd
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

# MongoDB connection (localhost, default port)
client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.stock_jianxing


stock_name_collection = db.get_collection("stock_list")
stock_data_collection_v1 = db.get_collection("stock_v1")
stock_data_collection_v2 = db.get_collection("stock_v2")
stock_news_collection = db.get_collection("stock_news")
tsne_collection = db.get_collection("tsne")

tickers = [ 'XOM', 'CVX', 'HAL',
            'MMM', 'CAT', 'DAL',
            'MCD', 'NKE', 'KO',
            'JNJ', 'PFE', 'UNH',
            'JPM', 'GS', 'BAC',
            'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META']
async def import_tickers_to_mongodb():
    # Keep one stock list document when the importer is run multiple times.
    await stock_name_collection.replace_one({"_id": "stock_list"}, {
        "_id": "stock_list",
        "tickers": tickers
    }, upsert=True)

async def import_stock_data_to_mongodb():
    base_dir = os.path.join(os.path.dirname(__file__), "data", "stockdata")
    if not os.path.isdir(base_dir):
        raise FileNotFoundError(f"Stock data directory not found: {base_dir}")

    csv_files = []
    for fname in os.listdir(base_dir):
        if fname.lower().endswith(".csv"):
            csv_files.append(os.path.join(base_dir, fname))

    for csv_path in sorted(csv_files):
        ticker = os.path.splitext(os.path.basename(csv_path))[0]
        try:
            df = pd.read_csv(csv_path)
            document_v1 = {
                "name": ticker,
                "date": df["Date"].astype(str).tolist(),
                "Open": df["Open"].astype(float).tolist(),
                "High": df["High"].astype(float).tolist(),
                "Low": df["Low"].astype(float).tolist(),
                "Close": df["Close"].astype(float).tolist(),
            }
            result = await stock_data_collection_v1.replace_one(
                {"name": ticker},
                document_v1,
                upsert=True
            )
            if result.upserted_id is not None:
                print(f"Inserted stock_v1 data for {ticker} (id: {result.upserted_id})")
            else:
                print(f"Updated stock_v1 data for {ticker}")

            stock_series = [{
                "date": row["Date"],
                "Open": row["Open"],
                "High": row["High"],
                "Low": row["Low"],
                "Close": row["Close"]
            } for _, row in df.iterrows()]

            document_v2 = {
                "name": ticker, 
                "stock_series": stock_series
            }

            result = await stock_data_collection_v2.replace_one(
                {"name": ticker},
                document_v2,
                upsert=True
            )
            if result.upserted_id is not None:
                print(f"Inserted stock_v2 data for {ticker} (id: {result.upserted_id})")
            else:
                print(f"Updated stock_v2 data for {ticker}")


        except Exception as exc:
            print(f"Failed to read {csv_path}: {exc}")

async def import_stock_news_to_mongodb():
    base_dir = os.path.join(os.path.dirname(__file__), "data", "stocknews")
    if not os.path.isdir(base_dir):
        raise FileNotFoundError(f"Stock news directory not found: {base_dir}")

    for entry in sorted(os.listdir(base_dir)):
        subdir_path = os.path.join(base_dir, entry)
        if not os.path.isdir(subdir_path):
            continue
        ticker = entry

        news_items = []
        for fname in sorted(os.listdir(subdir_path)):
            if not fname.lower().endswith(".txt"):
                continue
            fpath = os.path.join(subdir_path, fname)
            try:
                with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                lines = content.splitlines()

                title_value = ""
                date_value = ""
                content_start_index = 0
                saw_meta = False
                for i, line in enumerate(lines):
                    if line.startswith("Title:"):
                        title_value = line[len("Title:"):].strip()
                        saw_meta = True
                    elif line.startswith("Date:"):
                        date_value = line[len("Date:"):].strip()
                        saw_meta = True
                    elif line.strip() == "" and saw_meta:
                        content_start_index = i + 1
                        break
                article_body = "\n".join(lines[content_start_index:]).strip()

                news_items.append({
                    "Stock": ticker,
                    "Title": title_value,
                    "Date": date_value,
                    "content": article_body
                })
            except Exception as exc:
                print(f"Failed to parse news file {fpath}: {exc}")
                continue

        if news_items:
            await stock_news_collection.delete_many({"Stock": ticker})
            result = await stock_news_collection.insert_many(news_items)
            print(f"Loaded news for {ticker}: {len(result.inserted_ids)} items")

async def import_tsne_to_mongodb():
    csv_path = os.path.join(os.path.dirname(__file__), "data", "tsne.csv")
    if not os.path.isfile(csv_path):
        raise FileNotFoundError(f"t-SNE CSV file not found: {csv_path}")
    
    try:
        df = pd.read_csv(csv_path)
        
        for _, row in df.iterrows():
            document = {
                "Stock": row["stock"],
                "x": float(row["tsne_coord1"]),
                "y": float(row["tsne_coord2"]),
                "sector": row["sector"]
            }
            result = await tsne_collection.replace_one(
                {"Stock": row["stock"]},
                document,
                upsert=True
            )
            if result.upserted_id is not None:
                print(f"Inserted t-SNE data for {row['stock']} (id: {result.upserted_id})")
            else:
                print(f"Updated t-SNE data for {row['stock']}")
    except Exception as exc:
        print(f"Failed to import t-SNE data: {exc}")
        raise
    
async def clear_existing_data():
    await stock_name_collection.delete_many({})
    await stock_data_collection_v1.delete_many({})
    await stock_data_collection_v2.delete_many({})
    await stock_news_collection.delete_many({})
    await tsne_collection.delete_many({})

async def import_data_to_mongodb():
    await clear_existing_data()
    await import_tickers_to_mongodb()
    await import_stock_data_to_mongodb()
    await import_stock_news_to_mongodb()
    await import_tsne_to_mongodb()

    
if __name__ == "__main__":
    asyncio.run(import_data_to_mongodb())