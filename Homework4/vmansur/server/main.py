from __future__ import annotations

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient

from data_scheme import (
    StockListModel,
    StockModelV2,
    StockNewsModelList,
    tsneDataModel,
    tsneDataModelList,
)


MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "stock_vmansur"

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(
    title="Stock tracking API",
    summary="An application tracking stock prices and respective news (HW4).",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _strip_object_id(document: dict) -> dict:
    if document is None:
        return document
    if "_id" in document:
        document["_id"] = str(document["_id"])
    return document


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "database": DB_NAME}


@app.get("/stock_list", response_model=StockListModel)
async def get_stock_list() -> dict:
    stock_name_collection = db.get_collection("stock_list")
    stock_list = await stock_name_collection.find_one()
    if not stock_list:
        raise HTTPException(
            status_code=404,
            detail="stock_list collection is empty. Run `python import_data.py` first.",
        )
    return _strip_object_id(stock_list)


@app.get("/stock/{stock_name}", response_model=StockModelV2)
async def get_stock(stock_name: str) -> dict:
    normalized = (stock_name or "").upper().strip()
    if not normalized:
        raise HTTPException(status_code=400, detail="stock_name must be a non-empty string.")

    collection = db.get_collection("stock_prices")
    document = await collection.find_one({"name": normalized})
    if not document:
        raise HTTPException(
            status_code=404,
            detail=f"No stock price data found for ticker '{normalized}'.",
        )
    return _strip_object_id(document)


@app.get("/stocknews/", response_model=StockNewsModelList)
async def get_stock_news(
    stock_name: str = Query("XOM", description="Ticker symbol, e.g. AAPL"),
) -> dict:
    normalized = (stock_name or "").upper().strip()
    if not normalized:
        raise HTTPException(status_code=400, detail="stock_name query parameter is required.")

    collection = db.get_collection("stock_news")
    cursor = collection.find({"Stock": normalized}).sort("Date", -1)
    articles = [_strip_object_id(doc) async for doc in cursor]
    return {"Stock": normalized, "News": articles}


@app.get("/tsne/", response_model=tsneDataModelList)
async def get_tsne_all() -> dict:
    collection = db.get_collection("tsne")
    cursor = collection.find({})
    points = [_strip_object_id(doc) async for doc in cursor]
    return {"points": points}


@app.get("/tsne/{stock_name}", response_model=tsneDataModel)
async def get_tsne_for_stock(stock_name: str) -> dict:
    normalized = (stock_name or "").upper().strip()
    collection = db.get_collection("tsne")
    document = await collection.find_one({"Stock": normalized})
    if not document:
        raise HTTPException(
            status_code=404,
            detail=f"No t-SNE data found for ticker '{normalized}'.",
        )
    return _strip_object_id(document)
