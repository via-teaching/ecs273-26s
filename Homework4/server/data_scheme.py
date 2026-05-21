from typing import Optional, List, Annotated
from pydantic import BaseModel, Field
from pydantic.functional_validators import BeforeValidator
from bson import ObjectId

# Represents an ObjectId field in the database.
# It will be represented as a `str` on the model so that it can be serialized to JSON.

PyObjectId = Annotated[str, BeforeValidator(str)]


class StockListModel(BaseModel):
    """Model for stock list"""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    tickers: list[str]

    model_config = {"populate_by_name": True}


class StockModelV1(BaseModel):
    """Model for stock data (parallel arrays variant)"""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    name: str
    date: list[str]
    Open: list[float]
    High: list[float]
    Low: list[float]
    Close: list[float]

    model_config = {"populate_by_name": True}


class StockModelUnit(BaseModel):
    """One row of OHLC data"""
    date: str
    Open: float
    High: float
    Low: float
    Close: float


class StockModelV2(BaseModel):
    """Model for stock data (array-of-records variant)"""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    name: str
    stock_series: list[StockModelUnit]

    model_config = {"populate_by_name": True}


class StockNewsModel(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    Stock: str
    Title: str
    Date: str
    content: str

    model_config = {"populate_by_name": True}


class StockNewsModelList(BaseModel):
    Stock: str
    News: list[StockNewsModel]


class tsneDataModel(BaseModel):
    """Model for t-SNE data"""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    Stock: str
    x: float
    y: float
    sector: Optional[str] = None

    model_config = {"populate_by_name": True}