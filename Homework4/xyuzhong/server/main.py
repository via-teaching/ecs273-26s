from fastapi import FastAPI, HTTPException
from pydantic.functional_validators import BeforeValidator
from motor.motor_asyncio import AsyncIOMotorClient

from fastapi.middleware.cors import CORSMiddleware

from data_scheme import StockListModel, StockModelUnit, StockModelV2, StockNewsListModel, StockNewsModel, tsneDataModel

# MongoDB connection (localhost, default port)
client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.stock_xiaoyu # please replace the database name with stock_[your name] to avoid collision at TA's side
            
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

@app.get("/stocknews/{stock_name}", response_model=StockNewsListModel)

async def get_stock_news(stock_name: str) -> StockNewsModel:
    """
    Get the list of news for a specific stock from the database
    The news is sorted by date in ascending order
    """
    stock_news_collection = db.get_collection("stock_news")
    articles = await stock_news_collection.find({"Stock": stock_name}, sort=[("date", 1)]).to_list(length=None)

    if not articles:
        raise HTTPException(status_code=404, detail=f"No news found for stock {stock_name}")
    
    boilerplate = [
        "Content:\nOops, something went wrong\nTip: Try a valid symbol or a specific company name for relevant results\n",
        "Content:\n",
    ]
    for article in articles:
        content = article.get("content", "")
        for prefix in boilerplate:
            if content.startswith(prefix):
                content = content[len(prefix):]
                break
        article["content"] = content
    
    return {"Stock": stock_name, "articles": articles}

@app.get("/stock/{stock_name}", 
        response_model=StockModelV2
    )
async def get_stock(stock_name: str = 'XOM') -> StockModelV2:
    """
    Get the stock data for a specific stock
    Parameters:
    - stock_name: The name of the stock
    """
    stock_data_collection = db.get_collection("stock_prices")
    stock_data = await stock_data_collection.find_one({"name": stock_name})
    if stock_data is None:
        raise HTTPException(status_code=404, detail=f"{stock_name} not found")
    return stock_data

@app.get("/tsne", response_model=list[tsneDataModel])
async def get_tsne():
    """Get t-SNE data for all stocks"""
    docs = await db.get_collection("tsne_data").find().to_list(length=None)
    if not docs:
        raise HTTPException(status_code=404, detail="No t-SNE data found")
    return docs

@app.get("/tsne/{stock_name}", response_model=list[tsneDataModel])
async def get_tsne_by_stock(stock_name: str):
    """Get t-SNE data for a specific stock"""
    docs = await db.get_collection("tsne_data").find({"Stock": stock_name}).to_list(length=None)
    if not docs:
        raise HTTPException(status_code=404, detail=f"No t-SNE data found for {stock_name}")
    return docs

