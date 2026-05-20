from typing import Optional, List, Annotated
from pydantic import BaseModel
from pydantic.functional_validators import BeforeValidator
from bson import ObjectId

PyObjectId = Annotated[str, BeforeValidator(str)]

class StockListModel(BaseModel):
    _id: PyObjectId
    tickers: list[str]

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

class StockNewsItem(BaseModel):
    _id: PyObjectId
    Stock: str
    Title: str
    Date: str
    content: str

class tsneDataModel(BaseModel):
    _id: PyObjectId
    Stock: str
    x: float
    y: float
    sector: str
