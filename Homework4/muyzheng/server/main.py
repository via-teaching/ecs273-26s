from typing import List

from fastapi import FastAPI, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi.middleware.cors import CORSMiddleware

from data_scheme import StockListModel, StockModelV2, StockNewsModel, tsneDataModel

client = AsyncIOMotorClient("mongodb://localhost:27018")
db = client.stock_muyzheng

app = FastAPI(
    title="Stock Tracking API",
    summary="Full-stack stock dashboard backend serving price, news, and t-SNE data.",
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
    """Return the list of available stock tickers."""
    coll = db.get_collection("stock_list")
    doc = await coll.find_one({}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Stock list not found in database")
    return doc


@app.get("/stock/{stock_name}", response_model=StockModelV2)
async def get_stock(stock_name: str):
    """Return OHLC price time-series for the given ticker."""
    coll = db.get_collection("stock_prices")
    doc = await coll.find_one({"name": stock_name.upper()}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail=f"Ticker '{stock_name}' not found")
    return doc


@app.get("/stocknews/{stock_name}", response_model=List[StockNewsModel])
async def get_stock_news(stock_name: str):
    """Return all news articles for the given ticker, sorted by date ascending."""
    coll = db.get_collection("stock_news")
    cursor = coll.find({"Stock": stock_name.upper()}, {"_id": 0}).sort("Date", 1)
    articles = await cursor.to_list(length=None)
    return articles


@app.get("/tsne", response_model=List[tsneDataModel])
async def get_tsne():
    """Return t-SNE projection coordinates for all stocks."""
    coll = db.get_collection("tsne")
    cursor = coll.find({}, {"_id": 0})
    data = await cursor.to_list(length=None)
    return data
