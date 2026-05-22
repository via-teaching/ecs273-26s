"""
ECS 273 Homework 4 — FastAPI backend (MongoDB: stock_ppk).
"""

import logging
from typing import Any

from fastapi import FastAPI, HTTPException, Path
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient

from data_scheme import (
    COLLECTION_STOCK_NEWS,
    COLLECTION_STOCK_PRICES,
    COLLECTION_TSNE,
    DB_NAME,
    HealthResponse,
    NewsArticle,
    RootMessage,
    StockNewsResponse,
    StockPricesResponse,
    StocksResponse,
    TsneResponse,
)

logger = logging.getLogger("hw4_api")
logging.basicConfig(level=logging.INFO)

MONGO_URI = "mongodb://localhost:27017"

client = AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=5000)
db = client[DB_NAME]

app = FastAPI(
    title="ECS 273 HW4 Stock API",
    summary="Stock prices, news, and t-SNE data from MongoDB",
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


def strip_mongo_id(doc: dict[str, Any] | None) -> dict[str, Any] | None:
    """Drop MongoDB _id so it is not sent to the client."""
    if not doc:
        return None
    return {k: v for k, v in doc.items() if k != "_id"}


async def ticker_exists(ticker: str) -> bool:
    doc = await db[COLLECTION_STOCK_PRICES].find_one(
        {"ticker": ticker},
        projection={"ticker": 1},
    )
    return doc is not None


async def list_known_tickers() -> list[str]:
    cursor = db[COLLECTION_STOCK_PRICES].find({}, projection={"ticker": 1, "_id": 0})
    tickers = [doc["ticker"] async for doc in cursor if doc.get("ticker")]
    return sorted(set(tickers))


@app.on_event("startup")
async def on_startup() -> None:
    try:
        await client.admin.command("ping")
        logger.info("Connected to MongoDB database: %s", DB_NAME)
    except Exception as err:
        logger.warning("MongoDB not reachable at startup: %s", err)


@app.get("/", response_model=RootMessage)
async def root() -> RootMessage:
    return RootMessage(message="ECS 273 HW4 backend is running")


@app.get("/api/stocks", response_model=StocksResponse)
async def get_stocks() -> StocksResponse:
    stocks = await list_known_tickers()
    return StocksResponse(stocks=stocks)


@app.get("/api/stocks/{ticker}/prices", response_model=StockPricesResponse)
async def get_stock_prices(
    ticker: str = Path(..., description="Stock ticker symbol, e.g. AAPL"),
) -> StockPricesResponse:
    symbol = normalize_ticker(ticker)
    doc = await db[COLLECTION_STOCK_PRICES].find_one({"ticker": symbol})
    clean = strip_mongo_id(doc)

    if not clean or not clean.get("records"):
        logger.info("Prices not found for ticker: %s", symbol)
        raise HTTPException(
            status_code=404,
            detail=f"Ticker '{symbol}' was not found.",
        )

    return StockPricesResponse(ticker=symbol, records=clean["records"])


@app.get("/api/tsne", response_model=TsneResponse)
async def get_tsne() -> TsneResponse:
    cursor = db[COLLECTION_TSNE].find({}, projection={"ticker": 1, "x": 1, "y": 1, "sector": 1})
    points = []
    async for doc in cursor:
        clean = strip_mongo_id(doc)
        if clean and clean.get("ticker"):
            points.append(clean)
    points.sort(key=lambda p: p["ticker"])
    return TsneResponse(points=points)


@app.get("/api/stocks/{ticker}/news", response_model=StockNewsResponse)
async def get_stock_news(
    ticker: str = Path(..., description="Stock ticker symbol, e.g. AAPL"),
) -> StockNewsResponse:
    symbol = normalize_ticker(ticker)

    if not await ticker_exists(symbol):
        logger.info("News requested for unknown ticker: %s", symbol)
        raise HTTPException(
            status_code=404,
            detail=f"Ticker '{symbol}' was not found.",
        )

    cursor = (
        db[COLLECTION_STOCK_NEWS]
        .find({"ticker": symbol}, projection={"title": 1, "date": 1, "url": 1, "content": 1})
        .sort("date", 1)
    )

    articles: list[NewsArticle] = []
    async for doc in cursor:
        articles.append(
            NewsArticle(
                title=doc.get("title") or "",
                date=doc.get("date") or "",
                url=doc.get("url") or "",
                content=doc.get("content") or "",
            )
        )

    return StockNewsResponse(ticker=symbol, articles=articles)


@app.get("/api/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    try:
        await client.admin.command("ping")
        mongo_status = "connected"
    except Exception as err:
        logger.warning("Health check MongoDB ping failed: %s", err)
        mongo_status = "disconnected"

    counts = {}
    for name in (COLLECTION_STOCK_PRICES, COLLECTION_STOCK_NEWS, COLLECTION_TSNE):
        try:
            counts[name] = await db[name].count_documents({})
        except Exception:
            counts[name] = -1

    overall = "ok" if mongo_status == "connected" else "degraded"
    return HealthResponse(
        status=overall,
        database=DB_NAME,
        mongodb=mongo_status,
        collections=counts,
    )
