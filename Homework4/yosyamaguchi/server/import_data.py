import os
import pandas as pd
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

# MongoDB connection (localhost, default port)
client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.stock_yosyamaguchi
 
# Collections
stock_name_collection = db.get_collection("stock_list")
stock_prices_collection = db.get_collection("stock_prices")
stock_news_collection = db.get_collection("stock_news")
tsne_data_collection = db.get_collection("tsne_data")
 
tickers = [ 'XOM', 'CVX', 'HAL',
            'MMM', 'CAT', 'DAL',
            'MCD', 'NKE', 'KO',
            'JNJ', 'PFE', 'UNH',
            'JPM', 'GS', 'BAC',
            'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META']

async def import_tickers_to_mongodb():
    # Clear existing data to avoid duplicates
    await stock_name_collection.delete_many({})
    # Insert the tickers into the collection
    await stock_name_collection.insert_one({
        "tickers": tickers
    })
    print("Tickers imported.")

# This is a placeholder function.
# You would need to have stock price CSV files (e.g., AAPL.csv) in a directory.
async def import_stock_prices_to_mongodb():
    await stock_prices_collection.delete_many({})
    # Assuming data is in a directory like 'data/stockdata'
    # This path is relative to where you run the script.
    data_dir = "data/stockdata" 
    all_stock_data = []
    for ticker in tickers:
        file_path = os.path.join(data_dir, f"{ticker}.csv")
        if os.path.exists(file_path):
            df = pd.read_csv(file_path)
            # Convert to array of records format (for StockModelV2)
            stock_series = df.rename(columns={'Date': 'date'}).to_dict('records')
            stock_data = {
                "name": ticker,
                "stock_series": stock_series
            }
            all_stock_data.append(stock_data)
    
    if all_stock_data:
        await stock_prices_collection.insert_many(all_stock_data)
        print(f"Imported stock prices for {len(all_stock_data)} tickers.")
    else:
        print("No stock price CSV files found. Skipping stock price import.")

async def import_stock_news_to_mongodb():
    await stock_news_collection.delete_many({})
    # The path should be relative to the execution directory of the script.
    news_dir = "data/stocknews"
    all_news_articles = []

    if not os.path.isdir(news_dir):
        print(f"News directory not found: {news_dir}. Skipping news import.")
        return

    for stock_ticker in os.listdir(news_dir):
        stock_dir_path = os.path.join(news_dir, stock_ticker)
        if os.path.isdir(stock_dir_path):
            for filename in os.listdir(stock_dir_path):
                if filename.endswith(".txt"):
                    file_path = os.path.join(stock_dir_path, filename)
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        lines = f.readlines()
                        
                        title = lines[0].replace("Title:", "").strip() if lines else ""
                        date = lines[1].replace("Date:", "").strip() if len(lines) > 1 else ""
                        
                        # Find the start of the content after the header
                        content_start_index = 3
                        while content_start_index < len(lines) and lines[content_start_index].strip() == "":
                            content_start_index += 1
                        
                        content = "".join(lines[content_start_index:]).strip()

                        if title and date and content:
                            all_news_articles.append({
                                "Stock": stock_ticker,
                                "Title": title,
                                "Date": date,
                                "content": content
                            })
    if all_news_articles:
        await stock_news_collection.insert_many(all_news_articles)
        print(f"Imported {len(all_news_articles)} news articles.")
    else:
        print("No news articles found to import.")

async def import_tsne_data_to_mongodb():
    await tsne_data_collection.delete_many({})
    # Assuming data is in a file like 'data/tsne.csv'
    file_path = "data/tsne.csv"
    if os.path.exists(file_path):
        df = pd.read_csv(file_path)
        # Ensure columns match the tsneDataModel (Stock, x, y)
        if all(col in df.columns for col in ['Stock', 'x', 'y']):
            tsne_records = df.to_dict('records')
            if tsne_records:
                await tsne_data_collection.insert_many(tsne_records)
                print(f"Imported t-SNE data for {len(tsne_records)} stocks.")
        else:
            print("t-SNE CSV file is missing required columns (Stock, x, y).")
    else:
        print("t-SNE data file not found. Skipping t-SNE import.")

async def main():
    await import_tickers_to_mongodb()
    await import_stock_prices_to_mongodb()
    await import_stock_news_to_mongodb()
    await import_tsne_data_to_mongodb()

if __name__ == "__main__":
    asyncio.run(main())
