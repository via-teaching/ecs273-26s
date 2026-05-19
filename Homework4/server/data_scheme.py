from typing import Optional, List, Annotated
from pydantic import BaseModel, Field
from pydantic.functional_validators import BeforeValidator
from bson import ObjectId

# Represents an ObjectId field in the database.
# It will be represented as a `str` on the model so that it can be serialized to JSON.

PyObjectId = Annotated[str, BeforeValidator(str)]

# Models for the database collections
class StockListModel(BaseModel):
    """
    Model for stock list
    """
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    tickers: List[str]
    
class StockModelUnit(BaseModel):
    """
    Model for stock data values for a single trading day of a stock
    """
    date: str
    Open: float
    High: float
    Low: float
    Close: float
    
class StockModelV2(BaseModel):
    """
    Model for stock data values. Using an array of records for a single stock.
    """
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    name: str
    stock_series: list[StockModelUnit]
    
class StockNewsModel(BaseModel):
    """
    Model for a single stock news article
    """
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    Stock: str
    Title: str
    Date: str  
    content: str
    
class StockNewsModelList(BaseModel):
    """
    Model for a list of stock news articles
    """
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    Stock: str
    News: list[StockNewsModel]

class tsneDataModel(BaseModel):
    """
    Model for t-SNE data
    """
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    Stock: str
    x: float
    y: float
    sector: str