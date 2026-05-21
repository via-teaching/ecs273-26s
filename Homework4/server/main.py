from typing import List
from fastapi import FastAPI, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi.middleware.cors import CORSMiddleware

from data_scheme import StockListModel, StockModelV2, StockNewsModel, tsneDataModel

client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.stock_lsd

app = FastAPI(
    title="Stock tracking API",
    summary="An application tracking stock prices and respective news",
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
    """Return the list of stock tickers."""
    collection = db.get_collection("stock_list")
    doc = await collection.find_one()
    if doc is None:
        raise HTTPException(status_code=404, detail="Stock list not found")
    return doc


@app.get("/stock/{stock_name}", response_model=StockModelV2)
async def get_stock(stock_name: str) -> StockModelV2:
    """Return price series (Open/High/Low/Close) for the given ticker."""
    collection = db.get_collection("stock_prices")
    doc = await collection.find_one({"name": stock_name.upper()})
    if doc is None:
        raise HTTPException(status_code=404, detail=f"Stock '{stock_name}' not found")
    return doc


@app.get("/stocknews/", response_model=List[StockNewsModel])
async def get_stock_news(stock_name: str = "XOM") -> List[StockNewsModel]:
    """Return news articles for the given ticker, sorted by date ascending."""
    collection = db.get_collection("stock_news")
    cursor = collection.find({"Stock": stock_name.upper()}).sort("Date", 1)
    articles = await cursor.to_list(length=None)
    return articles


@app.get("/tsne/", response_model=List[tsneDataModel])
async def get_tsne() -> List[tsneDataModel]:
    """Return t-SNE coordinates for all stocks."""
    collection = db.get_collection("tsne")
    docs = await collection.find().to_list(length=None)
    return docs
