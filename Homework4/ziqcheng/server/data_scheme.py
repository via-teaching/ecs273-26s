from typing import Annotated
from pydantic import BaseModel, Field
from pydantic.functional_validators import BeforeValidator
from pymongo import MongoClient

MONGO_URL = "mongodb://localhost:27017"

DB_NAME = "stock_zq"

client = MongoClient(MONGO_URL)
db = client[DB_NAME]

# Collections
stock_prices_collection = db["stock_prices"]
stock_news_collection = db["stock_news"]
tsne_collection = db["tsne"]


def create_indexes():
    """
    Create useful indexes for faster query and duplicate prevention.
    """
    stock_prices_collection.create_index("ticker", unique=True)
    stock_news_collection.create_index("ticker")
    tsne_collection.create_index("ticker", unique=True)

PyObjectId = Annotated[str, BeforeValidator(str)]


class StockPriceUnit(BaseModel):
    Date: str
    Open: float
    High: float
    Low: float
    Close: float
    Volume: float | int | None = None


class StockPriceModel(BaseModel):
    id: PyObjectId | None = Field(default=None, alias="_id")
    ticker: str
    records: list[StockPriceUnit]


class StockNewsModel(BaseModel):
    id: PyObjectId | None = Field(default=None, alias="_id")
    ticker: str
    title: str | None = None
    date: str | None = None
    content: str | None = None
    url: str | None = None


class TsneDataModel(BaseModel):
    id: PyObjectId | None = Field(default=None, alias="_id")
    ticker: str
    x: float
    y: float