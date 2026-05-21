from fastapi import FastAPI, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi.middleware.cors import CORSMiddleware
from typing import List

from data_scheme import (
    StockListModel,
    StockModelV2,
    StockNewsModel,
    tsneDataModel,
)

# MongoDB connection (localhost, default port)
client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.stock_yl  # database name: stock_<your_initials>

app = FastAPI(
    title="Stock tracking API",
    summary="An application tracking stock prices and respective news",
)

# Enable CORS so the React frontend (different port) can talk to this backend
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
    Get the list of stocks from the database.
    Returns a single document containing the array of ticker strings.
    """
    coll = db.get_collection("stock_list")
    stock_list = await coll.find_one()
    if stock_list is None:
        raise HTTPException(status_code=404, detail="Stock list not found")
    return stock_list


@app.get("/stock/{stock_name}", response_model=StockModelV2)
async def get_stock(stock_name: str):
    """
    Get OHLC time series for a single stock.
    Returns 404 if the ticker is not in the database.
    """
    coll = db.get_collection("stock_prices")
    stock = await coll.find_one({"name": stock_name.upper()})
    if stock is None:
        raise HTTPException(
            status_code=404,
            detail=f"Stock '{stock_name}' not found",
        )
    return stock


@app.get("/stocknews/{stock_name}", response_model=List[StockNewsModel])
async def get_stock_news(stock_name: str):
    """
    Get all news items for a specific stock, sorted by date ascending.
    All news lives in a single collection; we filter by the Stock field.
    Returns an empty list if no news exists for that ticker.
    """
    coll = db.get_collection("stock_news")
    cursor = coll.find({"Stock": stock_name.upper()}).sort("Date", 1)
    news = await cursor.to_list(length=None)
    return news


@app.get("/tsne", response_model=List[tsneDataModel])
async def get_tsne():
    """
    Get the t-SNE 2D coordinates for all stocks.
    Frontend uses this to render the projection scatter plot.
    """
    coll = db.get_collection("tsne")
    cursor = coll.find({})
    points = await cursor.to_list(length=None)
    return points