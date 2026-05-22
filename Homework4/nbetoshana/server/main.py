from fastapi import FastAPI, HTTPException
from pydantic.functional_validators import BeforeValidator
from motor.motor_asyncio import AsyncIOMotorClient

from fastapi.middleware.cors import CORSMiddleware

from data_scheme import StockListModel, StockModelV1, StockModelV2, StockNewsModel, StockNewsModelList, tsneDataModel

# MongoDB connection (localhost, default port)
client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.stock_noah

# this section creates the FastAPI app
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

# this section gets the stock names for the dropdown
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

# this section gets the news for the selected stock
@app.get("/stocknews/", 
        response_model=StockNewsModelList
    )
async def get_stock_news(stock_name: str = 'XOM') -> StockNewsModelList:
    """
    Get the list of news for a specific stock from the database
    The news is sorted by date in ascending order
    """
    stock_news_collection = db.get_collection("stock_news")
    stock_name = stock_name.upper()

    news = await stock_news_collection.find({"Stock": stock_name}).sort("Date", 1).to_list(100)

    if len(news) == 0:
        raise HTTPException(status_code=404, detail="No news found for " + stock_name)

    return {
        "Stock": stock_name,
        "News": news
    }

# this section gets the price data for the line chart
@app.get("/stock/{stock_name}", 
        response_model=StockModelV2
    )
async def get_stock(stock_name: str) -> StockModelV2:
    """
    Get the stock data for a specific stock
    Parameters:
    - stock_name: The name of the stock
    """
    stock_data_collection = db.get_collection("stock_data")
    stock_name = stock_name.upper()

    stock_data = await stock_data_collection.find_one({"name": stock_name})

    if stock_data is None:
        raise HTTPException(status_code=404, detail="Stock not found: " + stock_name)

    return stock_data

# this section gets one t-SNE point if I need only one stock
@app.get("/tsne/",
        response_model=tsneDataModel
    )
async def get_tsne(stock_name: str = 'XOM') -> tsneDataModel:
    """
    Get the t-SNE data for a specific stock
    """
    tsne_collection = db.get_collection("tsne")
    stock_name = stock_name.upper()

    tsne_data = await tsne_collection.find_one({"Stock": stock_name})

    if tsne_data is None:
        raise HTTPException(status_code=404, detail="t-SNE data not found for " + stock_name)

    return tsne_data

# this section gets all t-SNE points for the scatter plot
@app.get("/tsne_all/",
        response_model=list[tsneDataModel]
    )
async def get_tsne_all():
    """
    Get all the t-SNE data
    """
    tsne_collection = db.get_collection("tsne")
    tsne_data = await tsne_collection.find().to_list(100)

    return tsne_data