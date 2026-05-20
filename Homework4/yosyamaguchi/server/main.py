from fastapi import FastAPI, HTTPException
from pydantic.functional_validators import BeforeValidator
from motor.motor_asyncio import AsyncIOMotorClient
from typing import List

from fastapi.middleware.cors import CORSMiddleware

from data_scheme import StockListModel, StockModelV2, StockNewsModel, tsneDataModel

# MongoDB connection (localhost, default port)
client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.stock_yosyamaguchi 
            
app = FastAPI(
    title="Stock tracking API",
    summary="An aplication tracking stock prices and respective news"
)

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
    if stock_list:
        return stock_list
    # If no stock list is found in the database, raise a 404 error.
    raise HTTPException(status_code=404, detail="Stock list not found.")

@app.get("/stocknews/{stock_name}", 
        response_model=List[StockNewsModel]
    )
async def get_stock_news(stock_name: str) -> List[StockNewsModel]:
    """
    Get the list of news for a specific stock from the database.
    The news is sorted by date in descending order.
    """
    stock_news_collection = db.get_collection("stock_news")
    cursor = stock_news_collection.find({"Stock": stock_name.upper()}).sort("Date", -1)
    stock_news_list = await cursor.to_list()
    return stock_news_list

@app.get("/stock/{stock_name}", 
        response_model=StockModelV2
    )
async def get_stock(stock_name: str) -> StockModelV2:
    """
    Get the stock data for a specific stock
    Parameters:
    - stock_name: The name of the stock (e.g., AAPL)
    """
    stock_prices_collection = db.get_collection("stock_prices")
    # Find data that matches the requested stock name.
    stock_prices = await stock_prices_collection.find_one({"name": stock_name.upper()})
    if stock_prices:
        return stock_prices
    # Handle invalid ticker gracefully by raising a 404 error.
    raise HTTPException(status_code=404, detail=f"Stock with ticker '{stock_name}' not found.")

@app.get("/tsne/",
        response_model=List[tsneDataModel]
    )
async def get_tsne() -> List[tsneDataModel]:
    """
    Get all t-SNE projection data points for plotting.
    """
    tsne_data_collection = db.get_collection("tsne_data")
    cursor = tsne_data_collection.find({})
    tsne_data_list = await cursor.to_list() 
    return tsne_data_list