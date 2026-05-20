from typing import Annotated, Optional
from pydantic import BaseModel
from pydantic.functional_validators import BeforeValidator

# Represents an ObjectId field in the database as a JSON-serializable string.
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

class StockModelV1(BaseModel):
    _id: PyObjectId
    name: str
    date: list[str]
    Open: list[float]
    High: list[float]
    Low: list[float]
    Close: list[float]

class StockModelV2(BaseModel):
    _id: PyObjectId
    name: str
    stock_series: list[StockModelUnit]

class StockNewsModel(BaseModel):
    _id: PyObjectId
    Stock: str
    Title: str
    Date: str
    URL: Optional[str] = None
    content: str

class StockNewsModelList(BaseModel):
    Stock: str
    News: list[StockNewsModel]

class TSNEDataModel(BaseModel):
    _id: PyObjectId
    Stock: str
    x: float
    y: float
    category: Optional[str] = None

tsneDataModel = TSNEDataModel
