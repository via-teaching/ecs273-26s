from fastapi import FastAPI
from pydantic.functional_validators import BeforeValidator
from motor.motor_asyncio import AsyncIOMotorClient

from fastapi.middleware.cors import CORSMiddleware

from data_scheme import StockListModel, StockModelV1, StockModelV2, StockNewsModel, tsneDataModel

# MongoDB connection (localhost, default port)
client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.stock_hima # please replace the database name with stock_[your name] to avoid collision at TA's side
            
app = FastAPI(
    title="Stock tracking API",
    summary="An aplication tracking stock prices and respective news"
)

# Enables CORS to allow frontend apps to make requests to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/stock_list", 
         response_model=StockListModel
    )
async def get_stock_list():
    """
    Get the list of stocks from the database
    """
    stock_name_collection = db.get_collection("stock_list")
    stock_list = await stock_name_collection.find_one()
    if not stock_list:
        return {"tickers": []}
    return stock_list

@app.get("/stocknews/", 
        response_model=list[StockNewsModel]
    )
async def get_stock_news(stock_name: str = 'XOM') -> list[StockNewsModel]:
    """
    Get the list of news for a specific stock from the database
    The news is sorted by date in ascending order
    """
    news_collection = db.get_collection("stock_news")
    cursor = news_collection.find({"Stock": stock_name.upper()}).sort("Date", 1)
    news = await cursor.to_list(length=100)
    if not news:
        return []
    return news

@app.get("/stock/{stock_name}", 
        response_model=StockModelV1
    )
async def get_stock(stock_name: str) -> StockModelV1:
    """
    Get the stock data for a specific stock
    Parameters:
    - stock_name: The name of the stock
    """
    stock_collection = db.get_collection("stock_price")
    stock = await stock_collection.find_one({"name": stock_name.upper()})
    if not stock:
        return {
            "name": stock_name.upper(),
            "date": [],
            "Open": [],
            "High": [],
            "Low": [],
            "Close": [],
        }
    return stock

@app.get("/tsne/",
        response_model=list[tsneDataModel]
    )
async def get_tsne() -> list[tsneDataModel]:
    """
    Get the t-SNE data for a specific stock
    """
    tsne_collection = db.get_collection("stock_tsne")
    tsne = await tsne_collection.find({}).to_list(length=1000)
    if not tsne:
        return []
    return tsne
