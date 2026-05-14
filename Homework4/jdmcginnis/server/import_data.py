import os
import pandas as pd
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

# MongoDB connection (localhost, default port)
client = AsyncIOMotorClient("mongodb://localhost:27017")
# db = client.stock_yuchia
db = client.stock_joshmcginnis


stock_name_collection = db.get_collection("stock_list")
stock_data_collection = db.get_collection("stock_data")
stock_news_collection = db.get_collection("stock_news")
stock_tsne_collection = db.get_collection("stock_tsne")

tickers = [ 'XOM', 'CVX', 'HAL',
            'MMM', 'CAT', 'DAL',
            'MCD', 'NKE', 'KO',
            'JNJ', 'PFE', 'UNH',
            'JPM', 'GS', 'BAC',
            'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META']
async def import_tickers_to_mongodb():
    # Insert the tickers into the collection
    await stock_name_collection.insert_one({
        "tickers": tickers
    })

async def import_stock_price_data():

    # Note: Stock News Entries Contain: (Title, Date, URL, Content)

    # iterate through stock tickers and import them into your database
    base_dir = "data/stockdata"
    for ticker in tickers:
        file_dir = f"{base_dir}/{ticker}.csv"

        # extract info from stock csv
        df = pd.read_csv(file_dir)
        df_dates = []
        for date in df["Date"]:
            df_dates.append(date[:10]) # don't need the time, just the date

        df_opens = df["Open"].tolist()
        df_highs = df["High"].tolist()
        df_lows = df["Low"].tolist()
        df_closes = df["Close"].tolist()

        # Following format of StockModelV1 (couldn't figure out the StockModeV2)
        stock_data = {
            "name": ticker,
            "date": df_dates,
            "Open": df_opens,
            "High": df_highs,
            "Low": df_lows,
            "Close": df_closes,
        }
        await stock_data_collection.insert_one(stock_data)
    print("Finished Importing Stock Price Data!")


async def import_stock_news_data():

    # iterate though tickers; each ticker will be a folder name
    base_dir = "data/stocknews"
    for ticker in tickers:
        ticker_dir = f"{base_dir}/{ticker}"

        # each folder will have several .txt files that we can import
        files = os.listdir(ticker_dir)
        for file in files:
            file_dir = os.path.join(ticker_dir, file)

            with open(file_dir, "r", encoding="utf-8") as f:
                data = f.readlines()

            # bad txt file! skip it!
            if len(data) < 3:
                continue

            title = data[0].replace("Title:", "").strip()
            date = data[1].replace("Date:", "").strip()
            content = "".join(data[2:]).strip() # getting all content into one large string

            ticker_news = {
                "Stock": ticker,
                "Title": title,
                "Date": date,
                "content": content
            }

            await stock_news_collection.insert_one(ticker_news)

    print("Finished Importing News Data!")
    return


async def import_tSNE_data():
    file_dir = "data/tsne.csv"
    df = pd.read_csv(file_dir)

    for i in range (df.shape[0]):
        row_contents = df.iloc[i].tolist()
        tsne_data = {
            "Stock": row_contents[0],
            "x": row_contents[1],
            "y": row_contents[2]
        }

        await stock_tsne_collection.insert_one(tsne_data)

    print("Finished Importing TSNE Data!")
    return



async def import_data():
    await import_tickers_to_mongodb()
    await import_stock_price_data()
    await import_stock_news_data()
    await import_tSNE_data()

if __name__ == "__main__":
    asyncio.run(import_data())
