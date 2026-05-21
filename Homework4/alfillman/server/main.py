from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient

from data_scheme import (
    StockListModel,
    StockModelV2,
    StockNewsResponse,
    TsneResponse,
)

client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.stock_xx  # <-- replace xx with your initials (must match import_data.py)

app = FastAPI(
    title="Stock tracking API",
    summary="An application tracking stock prices and respective news",
)

# CORS lets your React dev server (e.g. localhost:5173) call this API at localhost:8000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/stock_list", response_model=StockListModel)
async def get_stock_list():
    """Return the master list of tickers."""
    doc = await db.stock_list.find_one()
    if not doc:
        raise HTTPException(status_code=404, detail="Stock list not found")
    return {"tickers": doc["tickers"]}


@app.get("/stock/{stock_name}", response_model=StockModelV2)
async def get_stock(stock_name: str):
    """Return OHLC time-series for one ticker."""
    doc = await db.stock_prices.find_one({"name": stock_name.upper()})
    if not doc:
        raise HTTPException(status_code=404, detail=f"Stock '{stock_name}' not found")
    return {"name": doc["name"], "stock_series": doc["stock_series"]}


@app.get("/stocknews/{stock_name}", response_model=StockNewsResponse)
async def get_stock_news(stock_name: str):
    """Return all news articles for one ticker, newest first."""
    ticker = stock_name.upper()
    cursor = db.stock_news.find({"Stock": ticker}).sort("Date", -1)
    news = []
    async for n in cursor:
        news.append({"Title": n["Title"], "Date": n["Date"], "content": n["content"]})
    return {"Stock": ticker, "News": news}


@app.get("/tsne", response_model=TsneResponse)
async def get_tsne():
    """Return ALL t-SNE points. Frontend handles highlighting the selected one."""
    cursor = db.tsne.find()
    points = []
    async for p in cursor:
        points.append({"Stock": p["Stock"], "x": p["x"], "y": p["y"], "sector": p["sector"]})
    return {"points": points}