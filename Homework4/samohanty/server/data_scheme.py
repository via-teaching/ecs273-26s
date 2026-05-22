"""
Pydantic schemas defining the shape of documents in MongoDB.

Three collections:
  - stocks: one document per (ticker, date) — OHLCV time series
  - news:   one document per article, with a `Stock` field for filtering
  - tsne:   one document per ticker — 2D projection + sector
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Stock price data
# ---------------------------------------------------------------------------
class StockPriceRecord(BaseModel):
    """One trading day for one ticker."""
    Ticker: str
    Date: datetime
    Open: float
    High: float
    Low: float
    Close: float
    Volume: float


# ---------------------------------------------------------------------------
# News data — all articles share one collection, filtered by `Stock`
# ---------------------------------------------------------------------------
class NewsArticle(BaseModel):
    Stock: str               # ticker the article relates to (e.g. "AAPL")
    Title: str
    Date: Optional[str] = None
    URL: Optional[str] = None
    Content: str = ""


# ---------------------------------------------------------------------------
# t-SNE projection
# ---------------------------------------------------------------------------
class TSNEPoint(BaseModel):
    Ticker: str
    x: float
    y: float
    Sector: str


# ---------------------------------------------------------------------------
# API response models
# ---------------------------------------------------------------------------
class StockTimeSeriesResponse(BaseModel):
    ticker: str
    rows: list[StockPriceRecord]


class NewsListResponse(BaseModel):
    ticker: str
    articles: list[NewsArticle]


class TSNEResponse(BaseModel):
    points: list[TSNEPoint]


class TickerListResponse(BaseModel):
    tickers: list[str]
    sectors: dict[str, str] = Field(default_factory=dict)  # ticker -> sector
