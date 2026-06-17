from fastapi import FastAPI, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi.middleware.cors import CORSMiddleware

from data_scheme import StockListModel, StockModelV2


# MongoDB connection
client = AsyncIOMotorClient("mongodb://localhost:27017")

# Use the same database name as import_data.py
db = client.stock_pyl


app = FastAPI(
    title="Stock Tracking API",
    summary="An application tracking stock prices, news, and t-SNE data"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def convert_object_id(document):
    """
    Convert MongoDB ObjectId to string for JSON response.
    """
    if document is None:
        return None

    document["_id"] = str(document["_id"])
    return document


@app.get("/")
async def root():
    return {
        "message": "ECS 273 Homework 4 FastAPI backend is running"
    }


@app.get("/stock_list")
async def get_stock_list():
    """
    Get the list of stocks from MongoDB.
    Used by the frontend dropdown menu.
    """
    stock_name_collection = db.get_collection("stock_list")
    stock_list = await stock_name_collection.find_one({})

    if stock_list is None:
        raise HTTPException(
            status_code=404,
            detail="Stock list not found"
        )

    stock_list = convert_object_id(stock_list)
    return stock_list


@app.get("/stock/{stock_name}")
async def get_stock(stock_name: str):
    """
    Get stock price time-series data for a specific stock.
    Used by the line chart.
    """
    stock_name = stock_name.upper()

    stock_price_collection = db.get_collection("stock_prices")
    stock_data = await stock_price_collection.find_one({
        "name": stock_name
    })

    if stock_data is None:
        raise HTTPException(
            status_code=404,
            detail=f"Stock price data for {stock_name} not found"
        )

    stock_data = convert_object_id(stock_data)
    return stock_data


@app.get("/stocknews/{stock_name}")
async def get_stock_news(stock_name: str):
    """
    Get news articles for a specific stock.
    Used by the news list.
    """
    stock_name = stock_name.upper()

    stock_news_collection = db.get_collection("stock_news")

    cursor = stock_news_collection.find({
        "Stock": stock_name
    })

    news_list = []

    async for news in cursor:
        news["_id"] = str(news["_id"])
        news_list.append(news)

    return {
        "Stock": stock_name,
        "News": news_list
    }


@app.get("/tsne")
async def get_all_tsne():
    """
    Get all t-SNE projection data.
    Used by the t-SNE scatter plot.
    """
    tsne_collection = db.get_collection("tsne_projection")

    cursor = tsne_collection.find({})
    tsne_data = []

    async for item in cursor:
        item["_id"] = str(item["_id"])
        tsne_data.append(item)

    return {
        "data": tsne_data
    }


@app.get("/tsne/{stock_name}")
async def get_tsne_by_stock(stock_name: str):
    """
    Get t-SNE projection data for one stock.
    Optional endpoint.
    """
    stock_name = stock_name.upper()

    tsne_collection = db.get_collection("tsne_projection")
    item = await tsne_collection.find_one({
        "Stock": stock_name
    })

    if item is None:
        raise HTTPException(
            status_code=404,
            detail=f"t-SNE data for {stock_name} not found"
        )

    item = convert_object_id(item)
    return item