from typing import List, Annotated
from pydantic import BaseModel
from pydantic.functional_validators import BeforeValidator

PyObjectId = Annotated[str, BeforeValidator(str)]


class StockListModel(BaseModel):
    tickers: List[str]


class StockModelUnit(BaseModel):
    date: str
    Open: float
    High: float
    Low: float
    Close: float


class StockModelV2(BaseModel):
    name: str
    stock_series: List[StockModelUnit]


class StockNewsModel(BaseModel):
    Stock: str
    Title: str
    Date: str
    content: str


class tsneDataModel(BaseModel):
    Stock: str
    x: float
    y: float
    sector: str