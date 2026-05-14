from fastapi import FastAPI, HTTPException
from pydantic.functional_validators import BeforeValidator
from motor.motor_asyncio import AsyncIOMotorClient

from fastapi.middleware.cors import CORSMiddleware

from data_scheme import StockListModel, StockModelV1, StockModelV2, StockNewsModel, StockNewsModelList, tsneDataModel

# MongoDB connection (localhost, default port)
client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.stock_joshmcginnis # please replace the database name with stock_[your name] to avoid collision at TA's side

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
        response_model=StockNewsModelList # Note: Originally StockNewsModel
    )
async def get_stock_news(stock_name: str = 'XOM') -> StockNewsModelList: # Note: Originally StockNewsModel
    """
    Get the list of news for a specific stock from the database
    The news is sorted by date in ascending order
    """

    stock_news_collection = db.get_collection("stock_news")
    stock_news_list = await stock_news_collection.find({"Stock": stock_name}).to_list()

    if not stock_news_list:
        raise HTTPException(status_code=404, detail="Stock news not found")

    stock_news = {
        "Stock": stock_name,
        "News": stock_news_list
    }

    return stock_news

@app.get("/stock/{stock_name}", 
        response_model=StockModelV1
    )
async def get_stock(stock_name: str = 'XOM') -> StockModelV1:
    """
    Get the stock data for a specific stock
    Parameters:
    - stock_name: The name of the stock
    """

    # NOTE: originally there were no function arguments

    stock_data_collection = db.get_collection("stock_data")
    stock_data = await stock_data_collection.find_one({"name": stock_name})

    if stock_data is None:
        raise HTTPException(status_code=404, detail="Stock data not found")

    return stock_data

@app.get("/tsne/",
        response_model=tsneDataModel
    )
async def get_tsne(stock_name: str = 'XOM') -> tsneDataModel:
    """
    Get the t-SNE data for a specific stock
    """

    stock_tsne_collection = db.get_collection("stock_tsne")
    tsne_data = await stock_tsne_collection.find_one({"Stock": stock_name})

    if tsne_data is None:
        raise HTTPException(status_code=404, detail="Stock tsne data not found")

    return tsne_data
