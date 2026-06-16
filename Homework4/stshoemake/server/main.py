from fastapi import FastAPI, HTTPException
from pydantic.functional_validators import BeforeValidator
from motor.motor_asyncio import AsyncIOMotorClient

from fastapi.middleware.cors import CORSMiddleware

from data_scheme import StockListModel, StockModelV1, StockModelV2, StockNewsModel, StockNewsModelList, tsneDataModel

# MongoDB connection (localhost, default port)
client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.stock_sts

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
async def get_stock_list() -> StockListModel:
    """
    Get the list of stocks from the database
    """
    stock_name_collection = db.get_collection("stock_list")
    stock_list = await stock_name_collection.find_one()
    return stock_list


@app.get("/stocknews", response_model=StockNewsModelList)
@app.get("/stocknews/{stock_name}", response_model=StockNewsModelList)
async def get_stock_news(stock_name: str = 'XOM') -> StockNewsModelList:
    """
    Get the list of news for a specific stock from the database
    The news is sorted by date in ascending order
    """
    # Ensure stock_name is a valid ticker
    stock_list = await get_stock_list()
    tickers = stock_list['tickers']

    if (not stock_name in tickers):
        raise HTTPException(status_code=404, detail=f"{stock_name} is not a recognized ticker.")

    # Retrieve news for stock
    stock_news_collection = db.get_collection("stock_news")
    filter = {"Stock": stock_name}

    cursor = stock_news_collection.find(filter)

    # Same as doing cursor.toList, without specifying length
    news_list = []
    async for record in cursor:
        news_list.append(record)
        
    return {
        "Stock": stock_name,
        "News": news_list
    }


@app.get("/stock", response_model=StockModelV2)
@app.get("/stock/{stock_name}", response_model=StockModelV2)
async def get_stock(stock_name: str = 'XOM') -> StockModelV2:
    """
    Get the stock data for a specific stock
    Parameters:
    - stock_name: The name of the stock
    """
    # Ensure stock_name is a valid ticker
    stock_list = await get_stock_list()
    tickers = stock_list['tickers']

    if (not stock_name in tickers):
        raise HTTPException(status_code=404, detail=f"{stock_name} is not a recognized ticker.")

    # Retrieve trends for stock
    stock_price_collection = db.get_collection("stock_price")
    filter = {"name": stock_name}

    stock_model = await stock_price_collection.find_one(filter)

    return stock_model


@app.get("/tsne", response_model=list[tsneDataModel])
async def get_tsne_single() -> list[tsneDataModel]:
    """
    Get the t-SNE data for all stocks
    """
    tsne_collection = db.get_collection("tsne")

    cursor = tsne_collection.find({})

    # Same as doing cursor.toList, without specifying length
    tsne_list = []
    async for record in cursor:
        tsne_list.append(record)

    return tsne_list

@app.get("/tsne/{stock_name}", response_model=tsneDataModel)
async def get_tsne_single(stock_name: str = 'XOM') -> tsneDataModel:
    """
    Get the t-SNE data for a specific stock
    """
    # Ensure stock_name is a valid ticker
    stock_list = await get_stock_list()
    tickers = stock_list['tickers']

    if (not stock_name in tickers):
        raise HTTPException(status_code=404, detail=f"{stock_name} is not a recognized ticker.")

    # Retrieve tsne for stock
    tsne_collection = db.get_collection("tsne")
    filter = {"Stock": stock_name}

    tsne_data = await tsne_collection.find_one(filter)

    return tsne_data
