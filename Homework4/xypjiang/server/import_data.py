import os
import pandas as pd
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

# MongoDB connection (localhost, default port)
client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.stock_xj

stock_name_collection = db.get_collection("stock_list")
price_collection = db.get_collection("stock_prices")
news_collection = db.get_collection("stock_news")
tsne_collection = db.get_collection("tsne_data")

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

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), 'data'))
print(f"DEBUG: The computed data directory path is: {BASE_DIR}")

async def import_stock_prices():
    await price_collection.drop()
    stockdata_dir = os.path.join(BASE_DIR, 'stockdata')
    
    if not os.path.exists(stockdata_dir):
        print(f"Directory not found: {stockdata_dir}")
        return

    for ticker in tickers:
        csv_path = os.path.join(stockdata_dir, f"{ticker}.csv")
        if os.path.exists(csv_path):
            df = pd.read_csv(csv_path)
            df = df.rename(columns={'Date': 'date'})
            stock_series = df[['date', 'Open', 'High', 'Low', 'Close']].to_dict(orient='records')
            
            doc = {
                "name": ticker,
                "stock_series": stock_series
            }
            await price_collection.insert_one(doc)
            
    print("Stock prices imported.")

async def import_stock_news():
    await news_collection.drop()
    stocknews_dir = os.path.join(BASE_DIR, 'stocknews')
    
    if not os.path.exists(stocknews_dir):
        print(f"Directory not found: {stocknews_dir}")
        return

    news_docs = []
    for ticker in tickers:
        ticker_dir = os.path.join(stocknews_dir, ticker)
        if not os.path.isdir(ticker_dir):
            continue
            
        for file in os.listdir(ticker_dir):
            if not file.endswith('.txt'):
                continue
                
            date = file[:10]
            
            with open(os.path.join(ticker_dir, file), 'r', encoding='utf-8') as f:
                lines = f.readlines()
                
            if len(lines) > 0 and lines[0].startswith("Title:"):
                title = lines[0].replace("Title:", "").strip()
                content = "".join(lines[1:]).strip()
            else:
                title = file[11:-4] 
                content = "".join(lines).strip()
                
            news_docs.append({
                "Stock": ticker,
                "Title": title,
                "Date": date,
                "content": content
            })
            
    if news_docs:
        await news_collection.insert_many(news_docs)
    print("Stock news imported.")

async def import_tsne_data():
    await tsne_collection.drop()
    tsne_file = os.path.join(BASE_DIR, 'tsne.csv')
    
    if not os.path.exists(tsne_file):
        print(f"File not found: {tsne_file}")
        return
        
    df = pd.read_csv(tsne_file)
    tsne_docs = []
    
    for _, row in df.iterrows():
        symbol_col = 'Symbol' if 'Symbol' in df.columns else df.columns[0]
        x_col = 'tsne_1' if 'tsne_1' in df.columns else df.columns[1]
        y_col = 'tsne_2' if 'tsne_2' in df.columns else df.columns[2]
        sector_col = 'Sector' if 'Sector' in df.columns else None
        
        tsne_docs.append({
            "Stock": row[symbol_col],
            "x": float(row[x_col]),
            "y": float(row[y_col]),
            "Sector": row[sector_col] if sector_col else None
        })
        
    if tsne_docs:
        await tsne_collection.insert_many(tsne_docs)
    print("t-SNE data imported.")

async def main():
    print("Starting data import...")
    await import_tickers_to_mongodb()
    await import_stock_prices()
    await import_stock_news()
    await import_tsne_data()
    print("All data imported to MongoDB successfully")

if __name__ == "__main__":
    asyncio.run(main())
