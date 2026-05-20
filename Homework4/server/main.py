from fastapi import FastAPI, HTTPException
from pydantic.functional_validators import BeforeValidator
from motor.motor_asyncio import AsyncIOMotorClient

from fastapi.middleware.cors import CORSMiddleware

from data_scheme import StockListModel, StockModelV1, StockModelV2, StockNewsModel, StockNewsListModel, tsneDataModel

# MongoDB connection (localhost, default port)
client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.stock_py # please replace the database name with stock_[your name] to avoid collision at TA's side
            
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
    try:
        stock_name_collection = db.get_collection("stock_list")
        stock_list = await stock_name_collection.find_one()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch stock list: {e}")
    
    if stock_list is None:
        raise HTTPException(status_code=404, detail="Stock list not found")
    
    return stock_list

@app.get("/stocknews/", 
        response_model=StockNewsListModel
    )
async def get_stock_news(stock_name: str = 'XOM') -> StockNewsListModel:
    """
    Get the list of news for a specific stock from the database
    The news is sorted by date in ascending order
    """
    try:
        stock_news_list_collection = db.get_collection("stock_news_list")
        stock_news_list = await stock_news_list_collection.find_one({"stock": stock_name})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch stock news: {e}")

    if stock_news_list is None:
        raise HTTPException(status_code=404, detail=f"Stock news for {stock_name} not found")

    return stock_news_list

@app.get("/stock/{stock_name}", 
        response_model=StockModelV2
    )
async def get_stock(stock_name: str = 'XOM') -> StockModelV2:
    """
    Get the stock data for a specific stock
    Parameters:
    - stock_name: The name of the stock
    """

    try:
        stock_data_collection = db.get_collection("stock_data")
        stock_data = await stock_data_collection.find_one({"name": stock_name})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch stock data: {e}")

    if stock_data is None:
        raise HTTPException(status_code=404, detail=f"Stock data for {stock_name} not found")

    return stock_data

@app.get("/tsne/",
        response_model=tsneDataModel
    )
async def get_tsne(stock_name: str = 'XOM') -> tsneDataModel:
    """
    Get the t-SNE data for a specific stock
    """
    try:
        tsne_data_collection = db.get_collection("tsne_data")
        tsne_data = await tsne_data_collection.find_one({"stock": stock_name})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch t-SNE data: {e}")
    
    if tsne_data is None:
        raise HTTPException(status_code=404, detail=f"t-SNE data for stock {stock_name} not found")

    return tsne_data