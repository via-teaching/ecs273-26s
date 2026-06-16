import os
import pandas as pd
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

# MongoDB connection (localhost, default port)
client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.stock_sts

tickers = [ 'XOM', 'CVX', 'HAL',
            'MMM', 'CAT', 'DAL',
            'MCD', 'NKE', 'KO',
            'JNJ', 'PFE', 'UNH',
            'JPM', 'GS', 'BAC',
            'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META']


stock_name_collection = db.get_collection("stock_list")
# - - - Function - - - #
# Store a list of tickers
async def import_tickers_to_mongodb():
    await stock_name_collection.delete_many({})

    # Insert the tickers into the collection
    await stock_name_collection.insert_one({
        "tickers": tickers
    })


stock_price_collection = db.get_collection("stock_price")
# - - - Function - - - #
# Store a history of stock price data
# NOTE: Using StockModelV2
async def import_prices_to_mongodb():
    await stock_price_collection.delete_many({})

    for ticker in tickers:
        try:
            price_dataframe = pd.read_csv('./data/stockdata/' + ticker + '.csv')
            price_dicts = price_dataframe.to_dict(orient='records')
            stock_list = []
            for dict in price_dicts:
                stock_unit = {
                    "date": dict['Date'],
                    "Open": dict['Open'],
                    "High": dict['High'],
                    "Low": dict['Low'],
                    "Close": dict['Close']
                }
                stock_list.append(stock_unit)

            stock_model = {
                "name": ticker,
                "stock_series": stock_list
            }

            await stock_price_collection.insert_one(stock_model)
        except Exception as e:
            print(f"WARNING: {e}")
            print(f"    Unable to retrieve data for ticker {ticker}")


stock_news_collection = db.get_collection("stock_news")
# - - - Function - - - #
# Store all stock news articles
async def import_news_to_mongodb():
    await stock_news_collection.delete_many({})

    stocknews_path = './data/stocknews/'
    # Loop through all subfolders
    for ticker in tickers:
        tickernews_path = stocknews_path + ticker + '/'
        # Loop through all files in a subfolder
        try:
            for file_name in os.listdir(tickernews_path):
                if file_name.endswith('.txt'):
                    with open(tickernews_path + file_name, 'r') as file:
                        # Grab the title and date, and use them to double-check the file is formatted correctly
                        title = file.readline()
                        date = file.readline()

                        if ((not title.startswith("Title: ")) or (not date.startswith("Date: "))):
                            print(f"WARNING: not adding following article for improper formatting: {file_name}")
                            continue

                        title_formatted = title[7:-1]
                        date_formatted = date[6:-1]

                        # Skip past URL and empty line
                        file.readline()
                        file.readline()

                        # Read in the rest of the file as the body content
                        content_formatted = file.read()

                        stocknews = {
                            "Stock": ticker,
                            "Title": title_formatted,
                            "Date": date_formatted,
                            "content": content_formatted
                        }

                        await stock_news_collection.insert_one(stocknews)
        except Exception as _:
            print(f"WARNING: unable to find news data at {tickernews_path}")
            print(f"    News data was not added to the database for ticker {ticker}")


tsne_collection = db.get_collection("tsne")
# - - - Function - - - #
# Store tsne data
async def import_tsne_to_mongodb():
    await tsne_collection.delete_many({})

    try:
        tsne_dataframe = pd.read_csv('./data/tsne.csv')
        tsne_dicts = tsne_dataframe.to_dict(orient='records')
        for dict in tsne_dicts:
            tsne_data = {
                "Stock": dict["Ticker"],
                "x": dict["X"],
                "y": dict["Y"]
            }
            
            await tsne_collection.insert_one(tsne_data)
    except Exception as _:
        print(f"WARNING: unable to find tsne data at `./data/tsne.csv`")
        print(f"    TSNE chart will not display")



# - - - Main Function - - - #
# Import all data. Do this concurrently (gather) rather than in series (two awaits) to save time
async def import_all_data():
    await asyncio.gather(
        import_tickers_to_mongodb(),
        import_prices_to_mongodb(),
        import_news_to_mongodb(),
        import_tsne_to_mongodb()
    )

if __name__ == "__main__":
    asyncio.run(import_all_data())
