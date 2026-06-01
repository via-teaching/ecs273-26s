import os
import pandas as pd
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

client = AsyncIOMotorClient("mongodb://localhost:27017")

db = client.stock_msreza

stock_list_collection = db.get_collection("stock_list")
stock_price_collection = db.get_collection("stock_prices")
news_collection = db.get_collection("stock_news")
tsne_collection = db.get_collection("tsne_data")


async def import_tickers():

    tickers = []

    stock_folder = "data/stockdata"

    for file in os.listdir(stock_folder):

        if file.endswith(".csv"):

            ticker = file.replace(".csv", "")

            tickers.append(ticker)

    await stock_list_collection.delete_many({})

    await stock_list_collection.insert_one({
        "tickers": sorted(tickers)
    })

    print("Ticker list imported.")


async def import_stock_prices():

    await stock_price_collection.delete_many({})

    stock_folder = "data/stockdata"

    for file in os.listdir(stock_folder):

        if not file.endswith(".csv"):
            continue

        ticker = file.replace(".csv", "")

        path = os.path.join(stock_folder, file)

        df = pd.read_csv(path)

        records = df.to_dict("records")

        await stock_price_collection.insert_one({
            "name": ticker,
            "stock_series": records
        })

    print("Stock price data imported.")
            

async def import_news():

    await news_collection.delete_many({})

    news_folder = "data/stocknews"

    for ticker in os.listdir(news_folder):

        ticker_folder = os.path.join(news_folder, ticker)

        if not os.path.isdir(ticker_folder):
            continue

        for filename in os.listdir(ticker_folder):

            if not filename.endswith(".txt"):
                continue

            filepath = os.path.join(
                ticker_folder,
                filename
            )

            with open(filepath, "r", encoding="utf-8") as f:

                text = f.read()

            lines = text.splitlines()

            title = ""
            date = ""
            content = ""

            for i, line in enumerate(lines):

                if line.startswith("Title:"):
                    title = line.replace(
                        "Title:",
                        ""
                    ).strip()

                elif line.startswith("Date:"):
                    date = line.replace(
                        "Date:",
                        ""
                    ).strip()

                    content = "\n".join(
                        lines[i + 1:]
                    ).strip()

                    break

            await news_collection.insert_one({
                "Stock": ticker,
                "Title": title,
                "Date": date,
                "content": content
            })

    print("News data imported.")


async def import_tsne():
    await tsne_collection.delete_many({})

    df = pd.read_csv("data/tsne.csv")

    # Normalize column names
    if "ticker" in df.columns:
        df = df.rename(columns={"ticker": "Stock"})

    records = df.to_dict("records")

    if len(records) > 0:
        await tsne_collection.insert_many(records)

    print("t-SNE data imported.")


async def main():

    await import_tickers()
    await import_stock_prices()
    await import_news()
    await import_tsne()

    print("All data imported successfully.")


if __name__ == "__main__":

    asyncio.run(main())
