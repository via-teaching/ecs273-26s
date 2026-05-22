from pydantic import BaseModel


class StockListModel(BaseModel):
    tickers: list[str]


class StockPriceRowModel(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: int


class StockSeriesModel(BaseModel):
    ticker: str
    series: list[StockPriceRowModel]


class StockNewsModel(BaseModel):
    id: str
    ticker: str
    title: str
    date: str
    dateLabel: str
    url: str
    content: str


class StockNewsModelList(BaseModel):
    ticker: str
    news: list[StockNewsModel]


class TSNEPointModel(BaseModel):
    ticker: str
    x: float
    y: float
    sector: str


class TSNEListModel(BaseModel):
    points: list[TSNEPointModel]