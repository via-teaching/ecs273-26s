from typing import Annotated, List, Optional

from pydantic import BaseModel, Field
from pydantic.functional_validators import BeforeValidator


PyObjectId = Annotated[str, BeforeValidator(str)]


class StockListModel(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    tickers: List[str]

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}


class StockModelV1(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    name: str
    date: List[str]
    Open: List[float]
    High: List[float]
    Low: List[float]
    Close: List[float]

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}


class StockModelUnit(BaseModel):
    date: str
    Open: float
    High: float
    Low: float
    Close: float
    Volume: Optional[float] = None


class StockModelV2(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    name: str
    stock_series: List[StockModelUnit]

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}


class StockNewsModel(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    Stock: str
    Title: str
    Date: str
    URL: Optional[str] = None
    content: str

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}


class StockNewsModelList(BaseModel):
    Stock: str
    News: List[StockNewsModel]


class tsneDataModel(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    Stock: str
    x: float
    y: float
    sector: Optional[str] = None

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}


class tsneDataModelList(BaseModel):
    points: List[tsneDataModel]
