from typing import Optional, List
from pydantic import BaseModel


class PriceRecord(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: int


class StockPricesResponse(BaseModel):
    ticker: str
    records: List[PriceRecord]


class NewsArticle(BaseModel):
    ticker: str
    title: str
    date: str
    content: str
    url: Optional[str] = None


class TSNERow(BaseModel):
    ticker: str
    x: float
    y: float
    sector: str


class HealthResponse(BaseModel):
    status: str
    mongodb: str
    database: str
