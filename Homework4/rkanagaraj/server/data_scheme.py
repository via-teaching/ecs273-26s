from typing import List, Annotated, Optional
from pydantic import BaseModel
from pydantic.functional_validators import BeforeValidator

PyObjectId = Annotated[str, BeforeValidator(str)]


class StockListModel(BaseModel):
    id: Optional[PyObjectId] = None
    tickers: List[str]


class StockPriceUnit(BaseModel):
    date: str
    Open: float
    High: float
    Low: float
    Close: float


class StockPriceModel(BaseModel):
    id: Optional[PyObjectId] = None
    name: str
    stock_series: List[StockPriceUnit]


class StockNewsModel(BaseModel):
    id: Optional[PyObjectId] = None
    Stock: str
    title: str
    date: str
    url: str
    content: str


class StockNewsListModel(BaseModel):
    Stock: str
    news: List[StockNewsModel]


class TsneDataModel(BaseModel):
    id: Optional[PyObjectId] = None
    Stock: str
    x: float
    y: float
    sector: str


class TsneAllModel(BaseModel):
    data: List[TsneDataModel]
