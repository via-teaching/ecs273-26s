"""
FastAPI backend for the HW4 stock dashboard.

Endpoints
---------
  GET /api/stocks            -> list of available tickers (+ sectors)
  GET /api/stock/{ticker}    -> OHLCV time series for one ticker
  GET /api/news/{ticker}     -> news articles for one ticker
  GET /api/tsne              -> all t-SNE points + sectors

Start with:
    uvicorn main:app --reload --port 8000
"""

from __future__ import annotations

import os
from datetime import datetime
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo import ASCENDING, MongoClient


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
DB_NAME = os.environ.get("DB_NAME", "stock_sm")
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017")

# Sectors that show up in the t-SNE legend; keep a stable order.
SECTOR_ORDER = [
    "Energy",
    "Industrials",
    "Consumer_Discretionary",
    "Consumer_Staples",
    "Healthcare",
    "Financials",
    "Information_Technology",
]


# ---------------------------------------------------------------------------
# App + MongoDB client
# ---------------------------------------------------------------------------
app = FastAPI(title="HW4 Stock Dashboard API", version="1.0.0")

# Allow the React dev server (any port) to call us from the browser.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=3000)
db = client[DB_NAME]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _serialize_date(d: Any) -> str:
    if isinstance(d, datetime):
        return d.strftime("%Y-%m-%d")
    return str(d)


def _ticker_exists(ticker: str) -> bool:
    return db["stock_prices"].find_one({"Ticker": ticker}) is not None


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/")
def root() -> dict:
    return {
        "service": "HW4 Stock Dashboard API",
        "db": DB_NAME,
        "endpoints": [
            "/api/stocks",
            "/api/stock/{ticker}",
            "/api/news/{ticker}",
            "/api/tsne",
        ],
    }


@app.get("/api/stocks")
def list_stocks() -> dict:
    """Return the list of available tickers, with sector lookup."""
    tickers = sorted(db["stock_prices"].distinct("Ticker"))
    sector_docs = list(db["stock_tsne"].find({}, {"_id": 0, "Ticker": 1, "Sector": 1}))
    sectors = {d["Ticker"]: d.get("Sector", "Other") for d in sector_docs}
    return {"tickers": tickers, "sectors": sectors, "sector_order": SECTOR_ORDER}


@app.get("/api/stock/{ticker}")
def stock_timeseries(ticker: str) -> dict:
    ticker = ticker.upper()
    if not _ticker_exists(ticker):
        raise HTTPException(status_code=404, detail=f"Unknown ticker '{ticker}'")
    cursor = (
        db["stock_prices"]
        .find({"Ticker": ticker}, {"_id": 0})
        .sort("Date", ASCENDING)
    )
    rows = []
    for r in cursor:
        rows.append({
            "Date": _serialize_date(r["Date"]),
            "Open": r["Open"],
            "High": r["High"],
            "Low": r["Low"],
            "Close": r["Close"],
            "Volume": r.get("Volume", 0),
        })
    return {"ticker": ticker, "rows": rows}


@app.get("/api/news/{ticker}")
def stock_news(ticker: str) -> dict:
    ticker = ticker.upper()
    # We check news directly — some tickers may have no news yet, which is fine.
    cursor = (
        db["stock_news"]
        .find({"Stock": ticker}, {"_id": 0})
        .sort("Date", -1)
    )
    articles = []
    for a in cursor:
        articles.append({
            "Stock": a.get("Stock", ticker),
            "Filename": a.get("Filename", ""),
            "Title": a.get("Title", ""),
            "Date": a.get("Date", ""),
            "URL": a.get("URL", ""),
            "Content": a.get("Content", ""),
        })
    if not articles and not _ticker_exists(ticker):
        raise HTTPException(status_code=404, detail=f"Unknown ticker '{ticker}'")
    return {"ticker": ticker, "articles": articles}


@app.get("/api/tsne")
def tsne_points() -> dict:
    cursor = db["stock_tsne"].find({}, {"_id": 0})
    points = [
        {"Ticker": p["Ticker"], "x": p["x"], "y": p["y"], "Sector": p.get("Sector", "Other")}
        for p in cursor
    ]
    return {"points": points, "sector_order": SECTOR_ORDER}
