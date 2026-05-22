from fastapi import FastAPI, HTTPException
from pydantic.functional_validators import BeforeValidator
from motor.motor_asyncio import AsyncIOMotorClient

from fastapi.middleware.cors import CORSMiddleware

from data_scheme import StockListModel, StockModelV1, StockModelV2, StockNewsModel, tsneDataModel
from typing import List

# MongoDB connection (localhost, default port)
client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.stock_hz # please replace the database name with stock_[your name] to avoid collision at TA's side

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
    return stock_list

@app.get("/stocknews/",
        response_model=List[StockNewsModel]
    )
async def get_stock_news(stock_name: str = 'XOM') -> List[StockNewsModel]:
    """
    Get the list of news for a specific stock from the database
    The news is sorted by date in ascending order
    """
    # get stock news from the database
    news_collection = db.get_collection("stock_news")
    # sort the news by date in ascending order
    cursor = news_collection.find({"Stock": stock_name}).sort("Date", 1)
    # convert the cursor to a list of news
    news_list = await cursor.to_list(length=None)
    return news_list

@app.get("/stock/{stock_name}",
        response_model=StockModelV2
    )
async def get_stock(stock_name: str) -> StockModelV2:
    """
    Get the stock data for a specific stock
    Parameters:
    - stock_name: The name of the stock
    """
    # get stock price from the database
    stock_collection = db.get_collection("stock_price")
    # find the stock data by name
    stock = await stock_collection.find_one({"name": stock_name})
    if stock is None:
        raise HTTPException(status_code=404, detail=f"Stock '{stock_name}' not found")
    return stock

@app.get("/tsne/",
        response_model=List[tsneDataModel]
    )
async def get_tsne(perplexity: int = 5) -> List[tsneDataModel]:
    """
    Get the t-SNE data for all stocks at a given perplexity value, sorted by stock name and category
    Default perplexity value is 5, and the valid range is from 3 to 19
    """
    # get t-SNE data from the database
    tsne_collection = db.get_collection("tsne")
    # find the t-SNE data by perplexity and sort by stock name and category
    cursor = tsne_collection.find({"perplexity": perplexity})
    tsne_list = await cursor.to_list(length=None)
    if not tsne_list:
        raise HTTPException(status_code=404, detail=f"No t-SNE data found for perplexity {perplexity}")
    return tsne_list
