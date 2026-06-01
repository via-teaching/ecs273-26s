from typing import Optional
from pydantic import BaseModel

# Represents MongoDB ObjectId as a string for JSON serialization.
PyObjectId = str


class StockListModel(BaseModel):
    """
    Model for a list of available stock tickers.
    """
    _id: Optional[PyObjectId] = None
    tickers: list[str]


class StockModelUnit(BaseModel):
    """
    Model for one stock price record.
    """
    Date: str
    Open: float
    High: float
    Low: float
    Close: float


class StockModelV2(BaseModel):
    """
    Model for stock time-series data stored as an array of records.
    """
    _id: Optional[PyObjectId] = None
    name: str
    stock_series: list[StockModelUnit]


class StockNewsModel(BaseModel):
    """
    Model for one stock news article.
    """
    _id: Optional[PyObjectId] = None
    Stock: str
    Title: str
    Date: str
    content: str


class StockNewsModelList(BaseModel):
    """
    Model for all news articles associated with one stock.
    """
    Stock: str
    News: list[StockNewsModel]


class TsneDataModel(BaseModel):
    """
    Model for one t-SNE point.
    Each row represents one stock.
    """
    _id: Optional[PyObjectId] = None
    Stock: str
    x: float
    y: float
    sector: str
