from typing import Annotated, Optional

from pydantic import BaseModel, ConfigDict, Field
from pydantic.functional_validators import BeforeValidator

# Represents an ObjectId field in the database.
# It will be represented as a `str` on the model so that it can be serialized to JSON.
PyObjectId = Annotated[str, BeforeValidator(str)]

DATABASE_NAME = "stock_priramachandran"

COLLECTION_STOCK_LIST = "stock_list"
COLLECTION_STOCK_PRICES = "stock_prices"
COLLECTION_STOCK_NEWS = "stock_news"
COLLECTION_TSNE = "tsne"

TICKERS = [
    "XOM",
    "CVX",
    "HAL",
    "MMM",
    "CAT",
    "DAL",
    "MCD",
    "NKE",
    "KO",
    "JNJ",
    "PFE",
    "UNH",
    "JPM",
    "GS",
    "BAC",
    "AAPL",
    "MSFT",
    "NVDA",
    "GOOGL",
    "META",
]


class StockListModel(BaseModel):
    """Model for the list of available stock tickers."""

    model_config = ConfigDict(populate_by_name=True)

    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    tickers: list[str]


class StockModelV1(BaseModel):
    """
    Stock price time-series stored as parallel arrays (one value per date).
    """

    model_config = ConfigDict(populate_by_name=True)

    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    name: str
    date: list[str]
    Open: list[float]
    High: list[float]
    Low: list[float]
    Close: list[float]


class StockModelUnit(BaseModel):
    """Single OHLC observation for array-of-records storage."""

    date: str
    Open: float
    High: float
    Low: float
    Close: float


class StockModelV2(BaseModel):
    """
    Stock price time-series stored as an array of daily records.
    """

    model_config = ConfigDict(populate_by_name=True)

    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    name: str
    stock_series: list[StockModelUnit]


class StockNewsModel(BaseModel):
    """One news article (all stocks share the stock_news collection)."""

    model_config = ConfigDict(populate_by_name=True)

    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    Stock: str
    Title: str
    Date: str
    content: str


class StockNewsModelList(BaseModel):
    """Grouped news response for a single ticker."""

    Stock: str
    News: list[StockNewsModel]


class TsneDataModel(BaseModel):
    """t-SNE coordinates for one stock (one document per ticker)."""

    model_config = ConfigDict(populate_by_name=True)

    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    Stock: str
    x: float
    y: float
    category: Optional[str] = None

tsneDataModel = TsneDataModel
