from typing import List
from fastapi import FastAPI, HTTPException
from fastapi.encoders import jsonable_encoder
from pydantic.functional_validators import BeforeValidator
from motor.motor_asyncio import AsyncIOMotorClient

from fastapi.middleware.cors import CORSMiddleware

from data_scheme import (
    StockListModel, 
    StockModelV2, 
    StockNewsModel, 
    StockNewsModelList, 
    tsneDataModel, 
    tsneDataListModel
)

# MongoDB connection (localhost, default port)
client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.stock_jth # please replace the database name with stock_[your name] to avoid collision at TA's side
            
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

@app.get(
    "/stocknews/{stock_name}",
    response_model=StockNewsModelList
)
async def get_stock_news(stock_name: str):

    stock_news_collection = db.get_collection("stock_news")

    news_cursor = stock_news_collection.find({"Stock": stock_name})
    news_list = await news_cursor.to_list(length=None)

    if not news_list:
        raise HTTPException(
            status_code=404,
            detail=f"Ticker '{stock_name}' not found"
        )

    # 🔥 REMOVE ObjectId HERE
    cleaned_news = [
        {
            "Stock": item["Stock"],
            "Title": item["Title"],
            "Date": item["Date"],
            "content": item["content"],
        }
        for item in news_list
    ]

    return {
        "Stock": stock_name,
        "News": cleaned_news
    }

@app.get(
    "/stock/{stock_name}",
    response_model=StockModelV2
)
async def get_stock(stock_name: str):

    stock_series_collection = db.get_collection("stock_series")

    stock_data = await stock_series_collection.find_one({
        "name": stock_name
    })

    if not stock_data:
        raise HTTPException(status_code=404, detail="Ticker not found")

    stock_data["stock_series"] = [
        {
            "date": item["Date"],
            "Open": item["Open"],
            "High": item["High"],
            "Low": item["Low"],
            "Close": item["Close"],
            "Volume": item["Volume"],
        }
        for item in stock_data["stock_series"]
    ]

    return stock_data

@app.get("/tsne")
async def get_tsne():

    tsne_collection = db.get_collection("tsne")

    tsne_points = await tsne_collection.find().to_list(length=None)

    # 🔥 HARD FIX: remove ObjectId completely
    cleaned = [
        {
            "Stock": item["Stock"],
            "Category": item["Category"],
            "x": item["x"],
            "y": item["y"],
        }
        for item in tsne_points
    ]

    return cleaned