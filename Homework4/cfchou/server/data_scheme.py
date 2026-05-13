from typing import Annotated
from pydantic import BaseModel
from pydantic.functional_validators import BeforeValidator

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
    Volume: float


class StockModelV2(BaseModel):
    _id: PyObjectId
    name: str
    stock_series: list[StockModelUnit]


class StockNewsModel(BaseModel):
    _id: PyObjectId
    Stock: str
    Title: str
    Date: str
    URL: str = ""
    content: str


class StockNewsModelList(BaseModel):
    Stock: str
    News: list[StockNewsModel]


class tsneDataModel(BaseModel):
    _id: PyObjectId
    Stock: str
    x: float
    y: float
    sector: str = ""
