from typing import Optional, List, Annotated
from pydantic import BaseModel, Field
from pydantic.functional_validators import BeforeValidator
from bson import ObjectId

PyObjectId = Annotated[str, BeforeValidator(str)]

class StockListModel(BaseModel):
    id: PyObjectId = Field(default=None, alias="_id")
    tickers: list[str]

    model_config = {"populate_by_name": True}

class StockModelUnit(BaseModel):
    date: str
    Open: float
    High: float
    Low: float
    Close: float

class StockModelV2(BaseModel):
    id: PyObjectId = Field(default=None, alias="_id")
    name: str
    stock_series: list[StockModelUnit]

    model_config = {"populate_by_name": True}

class StockNewsModel(BaseModel):
    Stock: str
    Title: str
    Date: str
    content: str

    model_config = {"populate_by_name": True}

class StockNewsListModel(BaseModel):
    Stock: str
    articles: list[StockNewsModel]

class tsneDataModel(BaseModel):
    id: PyObjectId = Field(default=None, alias="_id")
    Stock: str
    x: float
    y: float
    sector: str   

    model_config = {"populate_by_name": True}