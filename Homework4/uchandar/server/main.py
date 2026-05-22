from fastapi import FastAPI, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi.middleware.cors import CORSMiddleware

from data_scheme import StockListModel, StockModelV2, StockNewsModel, tsneDataModel

client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.stock_uchandar

app = FastAPI(
    title="Stock tracking API",
    summary="An application tracking stock prices and respective news"
)

# Enables CORS to allow frontend apps to make requests to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/stock_list", response_model=StockListModel)
async def getStockList():
    """
    Get the list of stocks from the database
    """
    stockNameCollection = db.get_collection("stock_list")
    stockList = await stockNameCollection.find_one()
    return stockList


@app.get("/stock/{stock_name}", response_model=StockModelV2)
async def getStock(stock_name: str) -> StockModelV2:
    """
    Get the price series for a specific stock
    Parameters:
    - stock_name: Ticker symbol (e.g. AAPL)
    """
    stockCollection = db.get_collection("stock_price")
    stockDoc = await stockCollection.find_one({"name": stock_name})
    if stockDoc is None:
        raise HTTPException(status_code=404, detail=f"Stock '{stock_name}' not found")
    return stockDoc


@app.get("/stocknews/", response_model=list[StockNewsModel])
async def getStockNews(stock_name: str = "XOM") -> list[StockNewsModel]:
    """
    Get news articles for a specific stock, sorted by date ascending
    Parameters:
    - stock_name: Ticker symbol (e.g. AAPL)
    """
    newsCollection = db.get_collection("stock_news")
    cursor = newsCollection.find({"Stock": stock_name}).sort("Date", 1)
    newsList = await cursor.to_list(length=None)
    if not newsList:
        raise HTTPException(status_code=404, detail=f"No news found for stock '{stock_name}'")
    return newsList


@app.get("/tsne/", response_model=list[tsneDataModel])
async def getTsne() -> list[tsneDataModel]:
    """
    Get t-SNE coordinates for all stocks
    """
    tsneCollection = db.get_collection("tsne")
    tsneList = await tsneCollection.find().to_list(length=None)
    return tsneList
