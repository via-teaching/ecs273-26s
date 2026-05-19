from fastapi import FastAPI, HTTPException
from pydantic.functional_validators import BeforeValidator
from motor.motor_asyncio import AsyncIOMotorClient

from fastapi.middleware.cors import CORSMiddleware

from data_scheme import StockListModel, StockModelV2, StockNewsModelList, tsneDataModel
from typing import List

# MongoDB connection (localhost, default port)
client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.stock_jun_wu # please replace the database name with stock_[your name] to avoid collision at TA's side
            
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
    if stock_list is None:
        raise HTTPException(status_code=404, detail="Stock list not found")
    return stock_list

@app.get("/stocknews/{stock_name}", 
        response_model=StockNewsModelList
    )
async def get_stock_news(stock_name: str) -> StockNewsModelList:
    """
    Get the list of news for a specific stock from the database
    The news is sorted by date in ascending order
    """
    # check if the ticker exists
    stock = await db.stock_prices.find_one({"name": stock_name})
    if stock is None:
        raise HTTPException(status_code=404, detail=f"Stock '{stock_name}' not found")

    # return news, may be empty if no articles exist for this ticker
    newsCursor = db.stock_news.find({"Stock": stock_name}).sort("Date", 1)
    articles = await newsCursor.to_list(length=None)
    return {"Stock": stock_name, "News": articles}

@app.get("/stock/{stock_name}", 
        response_model=StockModelV2
    )
async def get_stock(stock_name: str) -> StockModelV2:
    """
    Get the stock data for a specific stock
    Parameters:
    - stock_name: The name of the stock
    """
    prices = await db.stock_prices.find_one({"name": stock_name})
    if prices is None:
        raise HTTPException(status_code=404, detail=f"Stock '{stock_name}' not found")
    return prices

@app.get("/tsne", response_model=List[tsneDataModel])
async def get_tsne():
    """Get t-SNE projection data for all stocks."""
    cursor = db["tsne_data"].find()
    rows = await cursor.to_list(length=None)
    if not rows:
        raise HTTPException(status_code=404, detail="t-SNE data not found")
    return rows
