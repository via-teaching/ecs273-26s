from typing import Optional, List, Annotated
from pydantic import BaseModel
from pydantic.functional_validators import BeforeValidator
from bson import ObjectId

# Represents an ObjectId field in the database.
# It will be represented as a `str` on the model so that it can be serialized to JSON.

PyObjectId = Annotated[str, BeforeValidator(str)]

class StockListModel(BaseModel):
    """
    Model for stock list
    """
    _id: Optional[PyObjectId] = None
    tickers: list[str]

#Not used
class StockModelV1(BaseModel):
    """
    Model for stock data values
    """
    _id: Optional[PyObjectId] = None
    name: str
    date: list[str]
    Open: list[float]
    High: list[float]
    Low: list[float]
    Close: list[float]

class StockUnitModel(BaseModel):
    """
    Model for stock data values
    """
    date: str
    open: float
    high: float
    low: float
    close: float
    
class StockModelV2(BaseModel):
    """
    Model for stock data values
    """
    _id: Optional[PyObjectId] = None
    name: str
    stock_series: list[StockUnitModel]
    
class StockNewsModel(BaseModel):
    _id: Optional[PyObjectId] = None
    stock: str
    title: str
    date: str
    content: str
    
class StockNewsListModel(BaseModel):
    stock: str
    news: list[StockNewsModel]

class tsneDataModel(BaseModel):
    """
    Model for t-SNE data
    """
    _id: Optional[PyObjectId] = None
    stock: str
    sector: str
    x: float
    y: float