"""FastAPI backend for HW4 — exposes stock prices, news, and t-SNE from MongoDB."""

from typing import List

import motor.motor_asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from data_scheme import (
    DB_NAME,
    NEWS_COLLECTION,
    PRICES_COLLECTION,
    TSNE_COLLECTION,
    StockNewsModel,
    StockPriceModel,
    TsneModel,
)

MONGO_URI = "mongodb://localhost:27017"

app = FastAPI(
    title="HW4 Stock Analytics API",
    summary="Serves stock prices, news, and t-SNE coordinates for the HW3 frontend.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)

client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]
prices_coll = db[PRICES_COLLECTION]
news_coll = db[NEWS_COLLECTION]
tsne_coll = db[TSNE_COLLECTION]


async def ticker_exists(ticker: str) -> bool:
    return await tsne_coll.find_one({"ticker": ticker}) is not None


@app.get("/")
async def root():
    return {"message": "HW4 Stock Analytics API is running"}


@app.get("/tickers", response_model=List[str])
async def list_tickers():
    """Return all known ticker symbols (sourced from the t-SNE collection)."""
    docs = await tsne_coll.find({}, {"_id": 0, "ticker": 1}).to_list(length=1000)
    return sorted(d["ticker"] for d in docs)


@app.get("/stock/{ticker}/prices", response_model=List[StockPriceModel])
async def get_stock_prices(ticker: str):
    """OHLC time-series for one ticker, sorted by date ascending."""
    ticker = ticker.upper()
    if not await ticker_exists(ticker):
        raise HTTPException(status_code=404, detail=f"Ticker {ticker} not found")
    cursor = prices_coll.find(
        {"ticker": ticker},
        {"_id": 0},
    ).sort("date", 1)
    return await cursor.to_list(length=10000)


@app.get("/stock/{ticker}/news", response_model=List[StockNewsModel])
async def get_stock_news(ticker: str):
    """News articles for one ticker, newest first."""
    ticker = ticker.upper()
    if not await ticker_exists(ticker):
        raise HTTPException(status_code=404, detail=f"Ticker {ticker} not found")
    cursor = news_coll.find(
        {"ticker": ticker},
        {"_id": 0},
    ).sort("date", -1)
    return await cursor.to_list(length=1000)


@app.get("/tsne", response_model=List[TsneModel])
async def get_tsne():
    """All 20 stocks projected into t-SNE space."""
    cursor = tsne_coll.find({}, {"_id": 0})
    return await cursor.to_list(length=1000)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
