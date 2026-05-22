from fastapi import FastAPI, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient

from fastapi.middleware.cors import CORSMiddleware

from data_scheme import StockListModel, StockModelV2, tsneDataModel, StockNewsModelList

# MongoDB connection (localhost, default port)
client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.stock_jianxing
            
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

    if stock_list is None:
        raise HTTPException(status_code=404, detail="Stock list not found")

    return stock_list

@app.get("/stocknews/", 
        response_model=StockNewsModelList
    )
async def get_stock_news(stock_name: str = 'XOM') -> StockNewsModelList:
    """
    Get the list of news for a specific stock from the database
    The news is sorted by date in ascending order
    """
    stock_news_collection = db.get_collection("stock_news")
    cursor = stock_news_collection.find({"Stock": stock_name}).sort("Date", 1)
    news = await cursor.to_list(length=None)

    if not news:
        raise HTTPException(status_code=404, detail=f"Stock {stock_name} not found")

    return {"Stock": stock_name, "News": news}

@app.get("/stock/{stock_name}", 
        response_model=StockModelV2
    )
async def get_stock(stock_name: str = 'XOM') -> StockModelV2:
    """
    Get the stock data for a specific stock
    Parameters:
    - stock_name: The name of the stock
    """
    stock_v2_collection = db.get_collection("stock_v2")
    stock = await stock_v2_collection.find_one({"name": stock_name})

    if stock is None:
        raise HTTPException(status_code=404, detail=f"Stock {stock_name} not found")

    return stock

@app.get("/tsne/",
        response_model=list[tsneDataModel]
    )
async def get_all_tsne() -> list[tsneDataModel]:
    """
    Get all t-SNE data for all stocks
    """
    stock_tsne_collection = db.get_collection("tsne")
    cursor = stock_tsne_collection.find()
    tsne_list = await cursor.to_list(length=None)

    if not tsne_list:
        raise HTTPException(status_code=404, detail="t-SNE data not found")
    
    return tsne_list

@app.get("/tsne/{stock_name}",
        response_model= tsneDataModel
    )
async def get_tsne(stock_name: str) -> tsneDataModel:
    """
    Get the t-SNE data for a specific stock
    """
    stock_tsne_collection = db.get_collection("tsne")
    tsne = await stock_tsne_collection.find_one({"Stock": stock_name})
    
    if tsne is None:
        raise HTTPException(status_code=404, detail=f"Stock {stock_name} not found")
    
    return tsne

