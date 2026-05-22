from typing import Annotated, Optional
from pydantic import BaseModel, Field, ConfigDict
from pydantic.functional_validators import BeforeValidator

PyObjectId = Annotated[str, BeforeValidator(str)]


class StockListModel(BaseModel):
    """
    Model for ticker list.
    """
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    tickers: list[str]

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )


class StockModelUnit(BaseModel):
    """
    One row of stock price data.
    """
    date: str
    Open: float
    High: float
    Low: float
    Close: float


class StockModelV2(BaseModel):
    """
    Model for one stock's full time-series data.
    """
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    name: str
    stock_series: list[StockModelUnit]

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )


class StockNewsModel(BaseModel):
    """
    Model for one stock news article.
    """
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    Stock: str
    Title: str
    Date: str
    content: str

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )


class StockNewsModelList(BaseModel):
    """
    Model for list of news articles for one stock.
    """
    Stock: str
    News: list[StockNewsModel]


class TsneDataModel(BaseModel):
    """
    Model for one t-SNE point.
    """
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    Stock: str
    x: float
    y: float
    sector: Optional[str] = None

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )