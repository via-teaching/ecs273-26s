from typing import Annotated
from pydantic import BaseModel
from pydantic.functional_validators import BeforeValidator

PyObjectId = Annotated[str, BeforeValidator(str)]

SECTOR_MAP = {
    "XOM":"Energy","CVX":"Energy","HAL":"Energy",
    "MMM":"Industrials","CAT":"Industrials","DAL":"Industrials",
    "MCD":"Consumer","NKE":"Consumer","KO":"Consumer",
    "JNJ":"Healthcare","PFE":"Healthcare","UNH":"Healthcare",
    "JPM":"Financials","GS":"Financials","BAC":"Financials",
    "AAPL":"Technology","MSFT":"Technology","NVDA":"Technology",
    "GOOGL":"Technology","META":"Technology",
}
TICKERS = list(SECTOR_MAP.keys())

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

class StockNewsModel(BaseModel):
    Stock: str
    Title: str
    Date: str
    content: str

class StockNewsModelList(BaseModel):
    Stock: str
    News: list[StockNewsModel]

class tsneDataModel(BaseModel):
    Stock: str
    x: float
    y: float
    sector: str

class tsneDataListModel(BaseModel):
    data: list[tsneDataModel]
