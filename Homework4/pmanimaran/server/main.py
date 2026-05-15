from fastapi import FastAPI, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi.middleware.cors import CORSMiddleware
from typing import List

from data_scheme import StockListModel, StockModelV2, StockNewsModel, tsneDataModel

client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.stock_pmanimaran

app = FastAPI(
    title="Stock Tracking API",
    summary="ECS 273 HW4 — Full-stack stock dashboard backend"
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
    doc = await db.stock_list.find_one({}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Stock list not found")
    return doc


@app.get("/stock/{stock_name}", response_model=StockModelV2)
async def get_stock(stock_name: str):
    """Return OHLC time-series data for a specific stock."""
    doc = await db.stock_prices.find_one({"name": stock_name.upper()}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail=f"Stock '{stock_name}' not found")
    return doc


@app.get("/stocknews/", response_model=List[StockNewsModel])
async def get_stock_news(stock_name: str = "AAPL"):
    """Return all news articles for a specific stock, sorted by date."""
    cursor = db.stock_news.find({"Stock": stock_name.upper()}, {"_id": 0}).sort("Date", 1)
    docs = await cursor.to_list(length=None)
    if not docs:
        raise HTTPException(status_code=404, detail=f"No news found for '{stock_name}'")
    return docs


@app.get("/tsne/", response_model=tsneDataModel)
async def get_tsne(stock_name: str = "AAPL"):
    """Return t-SNE coordinates for a specific stock."""
    doc = await db.tsne_data.find_one({"Stock": stock_name.upper()}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail=f"t-SNE data for '{stock_name}' not found")
    return doc


@app.get("/tsne/all", response_model=List[tsneDataModel])
async def get_tsne_all():
    """Return t-SNE coordinates for all stocks (used by the scatter plot)."""
    cursor = db.tsne_data.find({}, {"_id": 0})
    return await cursor.to_list(length=None)
