from fastapi import FastAPI, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient

from fastapi.middleware.cors import CORSMiddleware

from data_scheme import StockListModel, StockModelV2, StockNewsModel, StockNewsModelList, tsneDataModel

# MongoDB connection (localhost, default port)
client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.stock_prrq
            
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


async def validate_stock_name(stock_name: str):
    stock_name_collection = db.get_collection("stock_list")
    stock_list = await stock_name_collection.find_one()

    if not stock_list or stock_name not in stock_list.get("tickers", []):
        raise HTTPException(status_code=404, detail="Invalid stock ticker")

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
        raise HTTPException(status_code=404, detail="Stock list not found")
    return stock_list

@app.get("/stocknews/", 
        response_model=list[StockNewsModel]
    )
async def get_stock_news(stock_name: str | None = None) -> list[StockNewsModel]:
    """
    Get the list of news from the database.
    If a stock name is provided, only that stock's news is returned.
    """
    stock_news_collection = db.get_collection("stock_news")
    query = {}

    if stock_name:
        await validate_stock_name(stock_name)
        query = {"Stock": stock_name}

    news_cursor = stock_news_collection.find(query).sort("Date", 1)
    news_list = await news_cursor.to_list(length=None)
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
    await validate_stock_name(stock_name)

    stock_price_collection = db.get_collection("stock_prices")
    stock_data = await stock_price_collection.find_one({"name": stock_name})

    if not stock_data:
        raise HTTPException(status_code=404, detail="Stock data not found")

    return stock_data

@app.get("/tsne/",
        response_model=list[tsneDataModel]
    )
async def get_tsne() -> list[tsneDataModel]:
    """
    Get the full t-SNE data for all stocks
    """
    tsne_collection = db.get_collection("tsne_data")
    tsne_list = await tsne_collection.find({}).to_list(length=None)
    return tsne_list
