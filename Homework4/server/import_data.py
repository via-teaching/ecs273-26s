import os
import pandas as pd
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
from data_scheme import *

# MongoDB connection (localhost, default port)
client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.stock_py

tickers = [ 'XOM', 'CVX', 'HAL',
            'MMM', 'CAT', 'DAL',
            'MCD', 'NKE', 'KO',
            'JNJ', 'PFE', 'UNH',
            'JPM', 'GS', 'BAC',
            'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META']
async def import_tickers_to_mongodb():
    # Insert the tickers into the collection
    try:
        stock_list_collection = db.get_collection("stock_list")
        stock_list_model = StockListModel(tickers=tickers)

        await stock_list_collection.insert_one(stock_list_model.model_dump(exclude_none=True))
        
        print(f"[SUCCESS]    Finished inserting tickers into MongoDB")
    except Exception as e:
        print(f"Failed to insert tickers: {e}")

async def import_stock_to_mongodb():
    for ticker in tickers:
        file_path = os.path.join("data", "stockdata", f"{ticker}.csv")
        if os.path.exists(file_path):
            df = pd.read_csv(file_path)
            stock_series = []
            
            for _, row in df.iterrows():
                stock_unit = StockUnitModel(
                    date=row["Date"],
                    open=row["Open"],
                    high=row["High"],
                    low=row["Low"],
                    close=row["Close"]
                )
                stock_series.append(stock_unit)
            
            try:
                stock_data_collection = db.get_collection("stock_data")
                stock_data = StockModelV2(
                    name=ticker,
                    stock_series=stock_series
                )
                await stock_data_collection.insert_one(stock_data.model_dump(exclude_none=True))
            except Exception as e:
                print(f"Failed to insert stock data for {ticker}: {e}")

        else:
            print(f"File {file_path} does not exist.")
        
        print(f"[SUCCESS]    Finished processing stock data for {ticker}")

async def import_news_to_mongodb():
    stock_news_list_collection = db.get_collection("stock_news_list")

    for ticker in sorted(os.listdir("data/stocknews")):
        ticker_path = os.path.join("data/stocknews", ticker)
        if not os.path.isdir(ticker_path):
            continue

        stock_news_list = []
        for fname in os.listdir(ticker_path):
            if fname.endswith(".txt"):
                file_path = os.path.join(ticker_path, fname)

            if os.path.exists(file_path):
                content = ""
                with open(file_path, "r") as f:
                    content = f.read()
                
                parts = content.split('--Article Content--\n', 1)
                content = parts[1].strip() if len(parts) > 1 else ""
                metadata= {}

                for line in parts[0].strip().splitlines():
                    key, _ , value = line.partition(':')
                    metadata[key.strip().lower()] = value.strip()
                
                stock_news = StockNewsModel(
                    stock=ticker,
                    title=metadata.get("title", ""),
                    date=metadata.get("date", ""),
                    content=content
                )
                stock_news_list.append(stock_news)
            else:
                print(f"File {file_path} does not exist.")
            
        try:
            stock_news_list = sorted(stock_news_list, key=lambda x: x.date)
            stock_news_list_model = StockNewsListModel(
                stock=ticker,
                news=stock_news_list
            )
            await stock_news_list_collection.insert_one(stock_news_list_model.model_dump(exclude_none=True))
        except Exception as e:
            print(f"Failed to insert news list for {ticker}: {e}")
        
        print(f"[SUCCESS]    Finished processing news for {ticker}")

async def import_tsne_to_mongodb():
    tsne_data_collection = db.get_collection("tsne_data")
    file_path = os.path.join("data", "tsne.csv")

    if os.path.exists(file_path):
        df = pd.read_csv(file_path)
        for _, row in df.iterrows():
            tsne_data = tsneDataModel(
                stock=row["ticker"],
                sector=row["sector"],
                x=row["tsne_x"],
                y=row["tsne_y"]
            )
            
            try:
                await tsne_data_collection.insert_one(tsne_data.model_dump(exclude_none=True))
                print(f"[SUCCESS]    Finished inserting t-SNE data for {row['ticker']}")
            except Exception as e:
                print(f"Failed to insert t-SNE data: {e}")
    else:
        print(f"File {file_path} does not exist.")

async def main():
    await import_tickers_to_mongodb()
    await import_stock_to_mongodb()
    await import_news_to_mongodb()
    await import_tsne_to_mongodb()

if __name__ == "__main__":
    asyncio.run(main())
