from fastapi import FastAPI, HTTPException
from pydantic.functional_validators import BeforeValidator
from motor.motor_asyncio import AsyncIOMotorClient

from fastapi.middleware.cors import CORSMiddleware

from data_scheme import StockListModel, StockModelV2, StockNewsModel, tsneDataModel

# MongoDB connection (localhost, default port)
client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.stock_jcmorrison # please replace the database name with stock_[your name] to avoid collision at TA's side
            
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
        response_model=list[StockNewsModel]
    )
async def get_stock_news(stock_name: str = 'XOM') -> list[StockNewsModel]:
    """
    Get the list of news for a specific stock from the database
    The news is sorted by date in ascending order
    """
    stock_news_collection = db.get_collection("stock_news")
    cursor = stock_news_collection.find({"Stock": stock_name}).sort("Date", 1)
    news = await cursor.to_list(length=None)
    if not news:
        raise HTTPException(status_code=404, detail=f"No news found for {stock_name}")
    for item in news:
        item["_id"] = str(item["_id"])
    return news

@app.get("/stock/{stock_name}", 
        response_model=StockModelV2
    )
async def get_stock(stock_name: str) -> StockModelV2:
    """
    Get the stock data for a specific stock
    Parameters:
    - stock_name: The name of the stock
    """
    stock_prices_collection = db.get_collection("stock_prices")
    stock = await stock_prices_collection.find_one({"name": stock_name})
    if not stock:
        raise HTTPException(status_code=404, detail=f"Stock {stock_name} not found")
    stock["_id"] = str(stock["_id"])
    return stock

@app.get("/tsne/",
        response_model=list[tsneDataModel]
    )
async def get_tsne(stock_name: str | None = None) -> list[tsneDataModel]:
    """
    Get the t-SNE data for a specific stock or all stocks
    """
    tsne_collection = db.get_collection("tsne")
    query = {} if stock_name is None else {"Stock": stock_name}
    cursor = tsne_collection.find(query)
    tsne_data = await cursor.to_list(length=None)
    if not tsne_data:
        raise HTTPException(status_code=404, detail="No t-SNE data found")
    for item in tsne_data:
        item["_id"] = str(item["_id"])
    return tsne_data
