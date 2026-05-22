"""
MongoDB document shapes and collection names for Homework 4 (stock_ppk).

Import script writes lowercase field names. FastAPI models below keep the
course template names for the API layer.
"""

from typing import Annotated, List, Optional

from pydantic import BaseModel
from pydantic.functional_validators import BeforeValidator

# ---------------------------------------------------------------------------
# Database and collections
# ---------------------------------------------------------------------------

DB_NAME = "stock_ppk"

COLLECTION_STOCK_PRICES = "stock_prices"
COLLECTION_STOCK_NEWS = "stock_news"
COLLECTION_TSNE = "tsne_projection"

# ---------------------------------------------------------------------------
# Example documents (import / MongoDB)
# ---------------------------------------------------------------------------

EXAMPLE_STOCK_PRICE_DOC = {
    "ticker": "AAPL",
    "records": [
        {
            "date": "2025-01-01",
            "open": 123.4,
            "high": 125.0,
            "low": 122.9,
            "close": 124.5,
            "volume": 41516200,
        }
    ],
}

EXAMPLE_STOCK_NEWS_DOC = {
    "ticker": "AAPL",
    "title": "Watch These Apple Price Levels After Gains on Tech Tariff Exemptions",
    "date": "2025-04-15 15:14:15",
    "url": "https://www.example.com/article",
    "content": "Plain-text article body after HTML cleanup.",
}

EXAMPLE_TSNE_DOC = {
    "ticker": "AAPL",
    "x": -7.62931,
    "y": 50.984695,
    "sector": "Information Technology",
}


# Typed helpers for import code (optional validation)
class StockPriceRecord(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: Optional[float] = None


class StockPriceDocument(BaseModel):
    ticker: str
    records: List[StockPriceRecord]


class StockNewsDocument(BaseModel):
    ticker: str
    title: str
    date: str
    url: str = ""
    content: str = ""


class TsneDocument(BaseModel):
    ticker: str
    x: float
    y: float
    sector: str = "Unknown"


# ---------------------------------------------------------------------------
# FastAPI JSON response models (HW4 API)
# ---------------------------------------------------------------------------


class RootMessage(BaseModel):
    message: str


class StocksResponse(BaseModel):
    stocks: list[str]


class ApiPriceRecord(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: Optional[float] = None


class StockPricesResponse(BaseModel):
    ticker: str
    records: List[ApiPriceRecord]


class TsnePoint(BaseModel):
    ticker: str
    x: float
    y: float
    sector: str = "Unknown"


class TsneResponse(BaseModel):
    points: List[TsnePoint]


class NewsArticle(BaseModel):
    title: str
    date: str
    url: str = ""
    content: str = ""


class StockNewsResponse(BaseModel):
    ticker: str
    articles: List[NewsArticle]


class HealthResponse(BaseModel):
    status: str
    database: str
    mongodb: str
    collections: dict[str, int]


# ---------------------------------------------------------------------------
# Legacy course template models (kept for reference)
# ---------------------------------------------------------------------------

PyObjectId = Annotated[str, BeforeValidator(str)]


class StockListModel(BaseModel):
    _id: PyObjectId
    tickers: list[str]


class StockModelV1(BaseModel):
    _id: PyObjectId
    name: str
    date: list[str]
    Open: list[float]
    High: list[float]
    Low: list[float]
    Close: list[float]


class StockModelUnit(BaseModel):
    date: str
    Open: float
    High: float
    Low: float
    Close: float


class StockModelV2(BaseModel):
    _id: PyObjectId
    name: str
    stock_series: list[StockModelUnit]


class StockNewsModel(BaseModel):
    _id: PyObjectId
    Stock: str
    Title: str
    Date: str
    content: str


class StockNewsModelList(BaseModel):
    Stock: str
    News: list[StockNewsModel]


class tsneDataModel(BaseModel):
    _id: PyObjectId
    Stock: str
    x: float
    y: float
    sector: Optional[str] = None
