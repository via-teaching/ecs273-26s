from pydantic import BaseModel

class StockListModel(BaseModel):
    """
    Model for stock list
    """
    tickers: list[str]

class StockModelV1(BaseModel):
    """
    Model for stock data values
    """
    name: str
    date: list[str]
    Open: list[float]
    High: list[float]
    Low: list[float]
    Close: list[float]
    
class StockModelUnit(BaseModel):
    """
    Model for stock data values
    """
    date: str
    Open: float
    High: float
    Low: float
    Close: float
    
class StockModelV2(BaseModel):
    """
    Model for stock data values
    """
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
    """
    Model for t-SNE data
    """
    Stock: str
    x: float
    y: float
    sector: str