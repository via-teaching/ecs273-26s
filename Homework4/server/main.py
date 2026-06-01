from fastapi import FastAPI, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi.middleware.cors import CORSMiddleware

from data_scheme import (
    StockListModel,
    StockModelV2,
    StockNewsModel,
    TsneDataModel,
)

client = AsyncIOMotorClient("mongodb://localhost:27017")

# IMPORTANT: match this with import_data.py
db = client.stock_msreza

app = FastAPI(
    title="Stock Tracking API",
    summary="An application tracking stock prices, stock news, and t-SNE projections",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/stock_list", response_model=StockListModel)
async def get_stock_list():
    """
    Get the list of available stock tickers.
    """
    collection = db.get_collection("stock_list")
    stock_list = await collection.find_one({}, {"_id": 0})

    if stock_list is None:
        raise HTTPException(status_code=404, detail="Stock list not found")

    return stock_list


@app.get("/stock/{stock_name}", response_model=StockModelV2)
async def get_stock(stock_name: str):
    """
    Get time-series price data for one stock.
    """
    collection = db.get_collection("stock_prices")

    stock = await collection.find_one(
        {"name": stock_name.upper()},
        {"_id": 0}
    )

    if stock is None:
        raise HTTPException(status_code=404, detail="Stock not found")

    return stock


@app.get("/stocknews/{stock_name}", response_model=list[StockNewsModel])
async def get_stock_news(stock_name: str):
    """
    Get all news articles for one stock.
    """
    collection = db.get_collection("stock_news")

    cursor = collection.find(
        {"Stock": stock_name.upper()},
        {"_id": 0}
    ).sort("Date", -1)

    news = await cursor.to_list(length=None)

    if len(news) == 0:
        raise HTTPException(status_code=404, detail="No news found for this stock")

    return news


@app.get("/tsne", response_model=list[TsneDataModel])
async def get_all_tsne():
    """
    Get all t-SNE projection data.
    """
    collection = db.get_collection("tsne_data")

    cursor = collection.find({}, {"_id": 0})
    tsne_data = await cursor.to_list(length=None)

    if len(tsne_data) == 0:
        raise HTTPException(status_code=404, detail="No t-SNE data found")

    return tsne_data


@app.get("/tsne/{stock_name}", response_model=TsneDataModel)
async def get_tsne_for_stock(stock_name: str):
    """
    Get t-SNE projection data for one stock.
    """
    collection = db.get_collection("tsne_data")

    point = await collection.find_one(
        {"Stock": stock_name.upper()},
        {"_id": 0}
    )

    if point is None:
        raise HTTPException(status_code=404, detail="t-SNE point not found")

    return point
