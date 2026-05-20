# Homework 4 - zhjzheng

## How to run

### MongoDB
Make sure MongoDB is installed and running on localhost:27017.
On Windows, start it with:
```
net start MongoDB
```

### Server
```
cd server

pip install -r requirements.txt
python import_data.py

uvicorn main:app --reload --port 8000
```
The database name is `stock_zjz`. Run `import_data.py` first to load data into MongoDB.

### Client
```
cd client
npm install
npm run dev
```
Then open http://localhost:5173

## Notes
- Backend needs to be running on port 8000 for frontend to work
- If API returns empty, make sure you ran `import_data.py`
