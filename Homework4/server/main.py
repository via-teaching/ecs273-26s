from fastapi import FastAPI
from pydantic.functional_validators import BeforeValidator
from motor.motor_asyncio import AsyncIOMotorClient

from fastapi.middleware.cors import CORSMiddleware

from data_scheme import StockListModel, StockModelV1, StockModelV2, StockNewsModel, tsneDataModel

client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.stock_ajoyuan


app = FastAPI(title="Stock tracking API")


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
    data = await db.stock_list.find_one()
    return data


@app.get("/stocknews", response_model=list[StockNewsModel])
async def get_stock_news(stock_name: str):
    data = db.stock_news.find({"Stock": stock_name.upper()})
    return [doc async for doc in data]

@app.get("/stock/{stock_name}", 
        response_model=StockModelV2
    )
async def get_stock(stock_name) -> StockModelV2:
    """
    Get the stock data for a specific stock
    Parameters:
    - stock_name: The name of the stock
    """
    data = await db.stock_prices.find_one({"name": stock_name.upper()})
    return data

@app.get("/tsne/",
        response_model=list[tsneDataModel]
    )
async def get_tsne(stock_name: str = 'XOM') -> tsneDataModel:
    """
    Get the t-SNE data for a specific stock
    """
    data = db.tsne_data.find()
    return await data.to_list(length=20)

#uvicorn main:app --reload --port 8000
#http://localhost:8000/docs
