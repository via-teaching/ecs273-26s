from typing import Annotated
from pydantic import BaseModel
from pydantic.functional_validators import BeforeValidator

PyObjectId = Annotated[str, BeforeValidator(str)]

class StockListModel(BaseModel):
    tickers: list[str]

class StockModelUnit(BaseModel):
    date: str
    Open: float
    High: float
    Low: float
    Close: float

class StockModelV2(BaseModel):
    name: str
    stock_series: list[StockModelUnit]

class StockNewsItem(BaseModel):
    Title: str
    Date: str
    content: str

class StockNewsResponse(BaseModel):
    Stock: str
    News: list[StockNewsItem]

class TsnePoint(BaseModel):
    Stock: str
    x: float
    y: float
    sector: str

class TsneResponse(BaseModel):
    points: list[TsnePoint]