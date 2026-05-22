from pymongo import MongoClient
client = MongoClient()
db = client.stock_obimartin
print('stock_list:', db.stock_list.find_one())
print('stock_prices:', db.stock_prices.find_one({'name': 'AAPL'}))
print('stock_news:', db.stock_news.find_one({'Stock': 'AAPL'}))
print('tsne:', db.tsne.find_one({'Stock': 'AAPL'}))