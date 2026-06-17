from typing import Annotated
from pydantic import BaseModel
from pydantic.functional_validators import BeforeValidator

PyObjectId = Annotated[str, BeforeValidator(str)]
#定義出data的架構

class StockListModel(BaseModel):
    """
    Model for stock list
    """
    _id: PyObjectId
    tickers: list[str]


class StockModelUnit(BaseModel):
    """
    One daily stock price record
    """
    date: str
    Open: float
    High: float
    Low: float
    Close: float


class StockModelV2(BaseModel):
    """
    Stock time-series data using array of records
    """
    _id: PyObjectId
    name: str
    stock_series: list[StockModelUnit]


class StockNewsModel(BaseModel):
    """
    One news article
    """
    _id: PyObjectId
    Stock: str
    Title: str
    Date: str
    content: str


class StockNewsModelList(BaseModel):
    Stock: str
    News: list[StockNewsModel]


class tsneDataModel(BaseModel):
    """
    Model for t-SNE data
    """
    _id: PyObjectId
    Stock: str
    x: float
    y: float
    Sector: str