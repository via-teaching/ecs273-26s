from typing import Annotated

from fastapi import FastAPI, HTTPException, Path, Query
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient

from data_scheme import (
    COLLECTION_STOCK_LIST,
    COLLECTION_STOCK_NEWS,
    COLLECTION_STOCK_PRICES,
    COLLECTION_TSNE,
    DATABASE_NAME,
    TICKERS,
    StockListModel,
    StockModelV2,
    StockNewsModel,
    StockNewsModelList,
    TsneDataModel,
)

client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client[DATABASE_NAME]

app = FastAPI(
    title="Stock tracking API",
    summary="An application tracking stock prices and respective news",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def normalize_ticker(ticker: str) -> str:
    return ticker.strip().upper()


async def get_valid_tickers() -> set[str]:
    doc = await db[COLLECTION_STOCK_LIST].find_one()
    if doc and doc.get("tickers"):
        return {normalize_ticker(t) for t in doc["tickers"]}
    return set(TICKERS)


async def require_valid_ticker(ticker: str) -> str:
    symbol = normalize_ticker(ticker)
    if symbol not in await get_valid_tickers():
        raise HTTPException(
            status_code=404,
            detail=f"Invalid ticker '{ticker}'. Choose from the /stock_list endpoint.",
        )
    return symbol


@app.get("/stock_list", response_model=StockListModel)
async def get_stock_list():
    """Return all stock tickers available in the database."""
    doc = await db[COLLECTION_STOCK_LIST].find_one()
    if not doc:
        raise HTTPException(status_code=404, detail="Stock list not found. Run import_data.py first.")
    return doc


@app.get("/stock/{stock_name}", response_model=StockModelV2)
async def get_stock(
    stock_name: Annotated[str, Path(description="Stock ticker symbol, e.g. NVDA")],
):
    """Return time-series for one stock."""
    symbol = await require_valid_ticker(stock_name)
    doc = await db[COLLECTION_STOCK_PRICES].find_one({"name": symbol})
    if not doc:
        raise HTTPException(status_code=404, detail=f"No price data found for '{symbol}'.")
    return doc


@app.get("/stocknews/", response_model=StockNewsModelList)
async def get_stock_news(
    stock_name: Annotated[str, Query(description="Stock ticker symbol, e.g. XOM")] = "XOM",
):
    """Return news articles for one stock"""
    symbol = await require_valid_ticker(stock_name)
    cursor = db[COLLECTION_STOCK_NEWS].find({"Stock": symbol})
    articles = await cursor.to_list(length=None)
    articles.sort(key=lambda a: a.get("Date", ""))
    return {"Stock": symbol, "News": articles}


@app.get("/tsne/", response_model=list[TsneDataModel])
async def get_tsne_all():
    """Return t-SNE coordinates for every stock (used by the scatter plot)."""
    cursor = db[COLLECTION_TSNE].find({})
    rows = await cursor.to_list(length=None)
    if not rows:
        raise HTTPException(status_code=404, detail="t-SNE data not found. Run import_data.py first.")
    rows.sort(key=lambda r: r.get("Stock", ""))
    return rows


@app.get("/tsne/{stock_name}", response_model=TsneDataModel)
async def get_tsne_for_stock(
    stock_name: Annotated[str, Path(description="Stock ticker symbol, e.g. NVDA")],
):
    """Return t-SNE coordinates for a single stock."""
    symbol = await require_valid_ticker(stock_name)
    doc = await db[COLLECTION_TSNE].find_one({"Stock": symbol})
    if not doc:
        raise HTTPException(status_code=404, detail=f"No t-SNE data found for '{symbol}'.")
    return doc
