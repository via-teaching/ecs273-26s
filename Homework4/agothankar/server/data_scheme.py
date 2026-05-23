from typing import Annotated, Optional

from pydantic import BaseModel, ConfigDict, Field
from pydantic.functional_validators import BeforeValidator

# Represents an ObjectId field in the database.
# It is represented as a str on the model so it can be serialized to JSON.
PyObjectId = Annotated[str, BeforeValidator(str)]


class MongoBaseModel(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )


class StockListModel(BaseModel):
    """
    Model for stock list.
    """
    tickers: list[str]


class StockModelUnit(BaseModel):
    """
    Model for one stock data row.
    """
    date: str
    Open: float
    High: float
    Low: float
    Close: float
    Volume: Optional[float] = None


class StockModelV2(MongoBaseModel):
    """
    Model for stock data stored as an array of row records.
    """
    name: str
    stock_series: list[StockModelUnit]


class StockNewsModel(MongoBaseModel):
    Stock: str
    Title: str
    Date: str
    content: str
    fileName: Optional[str] = None
    url: Optional[str] = None


class StockNewsModelList(BaseModel):
    Stock: str
    News: list[StockNewsModel]


class tsneDataModel(MongoBaseModel):
    """
    Model for t-SNE data.
    """
    Stock: str
    x: float
    y: float
    Sector: Optional[str] = None
