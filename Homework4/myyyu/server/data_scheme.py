from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class StockPriceModel(BaseModel):
    """One day of OHLC + volume for a single ticker."""

    ticker: str
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: Optional[float] = None

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "ticker": "AAPL",
                "date": "2024-04-08",
                "open": 169.03,
                "high": 169.20,
                "low": 168.24,
                "close": 168.45,
                "volume": 37425500,
            }
        }
    )


class StockNewsModel(BaseModel):
    """One news article tagged with its ticker. All news live in one collection."""

    ticker: str
    title: str
    date: str
    url: Optional[str] = None
    content: str

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "ticker": "AAPL",
                "title": "Apple Foldable Timeline Slips On Engineering Challenges",
                "date": "2026-04-07 21:50 UTC",
                "url": "https://finance.yahoo.com/...",
                "content": "Apple is hitting a few bumps...",
            }
        }
    )


class TsneModel(BaseModel):
    """One row of the t-SNE projection per stock."""

    ticker: str
    x: float
    y: float
    sector: str

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "ticker": "AAPL",
                "x": -9.6287,
                "y": 22.3008,
                "sector": "Tech",
            }
        }
    )


class StockPriceList(BaseModel):
    prices: List[StockPriceModel]


class StockNewsList(BaseModel):
    news: List[StockNewsModel]


class TsneList(BaseModel):
    points: List[TsneModel]


DB_NAME = "stock_myyyu"
PRICES_COLLECTION = "stock_prices"
NEWS_COLLECTION = "stock_news"
TSNE_COLLECTION = "stock_tsne"
