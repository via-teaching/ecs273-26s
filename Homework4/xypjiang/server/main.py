from typing import List
from fastapi import FastAPI
from pydantic.functional_validators import BeforeValidator
from motor.motor_asyncio import AsyncIOMotorClient

from fastapi.middleware.cors import CORSMiddleware

from data_scheme import StockListModel, StockModelV1, StockModelV2, StockNewsModel, tsneDataModel

# MongoDB connection (localhost, default port)
client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.stock_xj
            
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

@app.get("/stock_list", response_model=StockListModel)
async def get_stock_list():
    """
    Get the list of stocks from the database
    """
    stock_name_collection = db.get_collection("stock_list")
    stock_list = await stock_name_collection.find_one()
    return stock_list

@app.get("/stocknews/", response_model=List[StockNewsModel])
async def get_stock_news(stock_name: str = 'XOM') -> List[StockNewsModel]:
    """
    Get the list of news for a specific stock from the database
    The news is sorted by date in ascending order
    """
    news_collection = db.get_collection("stock_news")
    cursor = news_collection.find({"Stock":stock_name}).sort("Date", 1)
    stock_news = await cursor.to_list(length=1000) # Adjust length as needed
    return stock_news


@app.get("/stock/{stock_name}", response_model=StockModelV2)
async def get_stock(stock_name: str):
    """
    Get the stock data for a specific stock
    Parameters:
    - stock_name: The name of the stock
    """
    price_collection = db.get_collection("stock_prices")
    stock_data = await price_collection.find_one({"name": stock_name})

    return stock_data

@app.get("/tsne/", response_model=List[tsneDataModel])
async def get_tsne(stock_name: str = 'XOM') -> List[tsneDataModel]:
    """
    Get the t-SNE data for a specific stock
    """
    tsne_collection = db.get_collection("tsne_data")
    cursor = tsne_collection.find({})
    tsne_data = await cursor.to_list(length=100)

    return tsne_data
