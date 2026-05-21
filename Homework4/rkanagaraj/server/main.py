from fastapi import FastAPI, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi.middleware.cors import CORSMiddleware

from data_scheme import (
    StockListModel,
    StockPriceModel,
    StockNewsListModel,
    TsneAllModel,
)

client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.stock_rk

app = FastAPI(
    title="Stock Dashboard API",
    summary="FastAPI backend for the ECS 273 stock dashboard",
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
    """Return the list of all available stock tickers."""
    doc = await db.stock_list.find_one()
    if not doc:
        raise HTTPException(status_code=404, detail="Stock list not found")
    return {"tickers": doc["tickers"]}


@app.get("/stock/{ticker}", response_model=StockPriceModel)
async def get_stock_price(ticker: str):
    """Return OHLC time-series for a single stock."""
    ticker = ticker.upper()
    doc = await db.stock_prices.find_one({"name": ticker})
    if not doc:
        raise HTTPException(status_code=404, detail=f"Ticker '{ticker}' not found")
    return {"name": doc["name"], "stock_series": doc["stock_series"]}


@app.get("/stocknews/", response_model=StockNewsListModel, response_model_exclude_none=True)
async def get_stock_news(stock_name: str):
    """Return all news articles for a given stock ticker."""
    ticker = stock_name.upper()
    cursor = db.stock_news.find({"Stock": ticker}, {"_id": 0})
    articles = await cursor.to_list(length=None)
    if not articles:
        raise HTTPException(status_code=404, detail=f"No news found for '{ticker}'")
    return {"Stock": ticker, "news": articles}


@app.get("/tsne/", response_model=TsneAllModel, response_model_exclude_none=True)
async def get_tsne():
    """Return t-SNE coordinates for all stocks."""
    cursor = db.tsne.find({}, {"_id": 0})
    docs = await cursor.to_list(length=None)
    return {"data": docs}
