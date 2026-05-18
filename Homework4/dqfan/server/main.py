from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient

from data_scheme import StockListModel, StockModelV2, StockNewsModel, TSNEDataModel


client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.stock_sijia

stock_list_collection = db.get_collection("stock_list")
stock_price_collection = db.get_collection("stock_prices")
stock_news_collection = db.get_collection("stock_news")
tsne_collection = db.get_collection("tsne")


app = FastAPI(
    title="Stock tracking API",
    summary="A full-stack API for stock prices, stock news, and t-SNE projection data.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def ensure_valid_ticker(stock_name: str) -> str:
    ticker = stock_name.upper()
    stock_list = await stock_list_collection.find_one({}, {"_id": 0, "tickers": 1})
    valid_tickers = stock_list["tickers"] if stock_list and "tickers" in stock_list else []

    if ticker not in valid_tickers:
        raise HTTPException(
            status_code=404,
            detail=f"Ticker '{ticker}' was not found.",
        )

    return ticker


@app.get("/", tags=["health"])
async def root():
    return {"message": "Stock tracking API is running."}


@app.get("/stock_list", response_model=StockListModel, tags=["stocks"])
async def get_stock_list():
    stock_list = await stock_list_collection.find_one()
    if stock_list is None:
        raise HTTPException(status_code=404, detail="Stock list not found. Run import_data.py first.")
    return stock_list


@app.get("/stock/{stock_name}", response_model=StockModelV2, tags=["stocks"])
async def get_stock(stock_name: str):
    ticker = await ensure_valid_ticker(stock_name)
    stock_document = await stock_price_collection.find_one({"name": ticker})

    if stock_document is None:
        raise HTTPException(status_code=404, detail=f"Price data for '{ticker}' was not found.")

    return stock_document


@app.get("/stocknews/{stock_name}", response_model=list[StockNewsModel], tags=["news"])
async def get_stock_news(stock_name: str):
    ticker = await ensure_valid_ticker(stock_name)
    cursor = stock_news_collection.find({"Stock": ticker}).sort("Date", -1)
    news_documents = await cursor.to_list(length=None)

    if not news_documents:
        raise HTTPException(status_code=404, detail=f"News data for '{ticker}' was not found.")

    return news_documents


@app.get("/tsne/{stock_name}", response_model=TSNEDataModel, tags=["tsne"])
async def get_tsne(stock_name: str):
    ticker = await ensure_valid_ticker(stock_name)
    tsne_document = await tsne_collection.find_one({"Stock": ticker})

    if tsne_document is None:
        raise HTTPException(status_code=404, detail=f"t-SNE data for '{ticker}' was not found.")

    return tsne_document


@app.get("/tsne", response_model=list[TSNEDataModel], tags=["tsne"])
async def get_all_tsne():
    return await tsne_collection.find().to_list(length=None)
