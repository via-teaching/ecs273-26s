# Homework 4
## Install server dependencies
Navigate to the `server` directory
```bash
cd server
```

Create virtual environment
```bash
python -m venv .venv
```

Activate virtual environment
```bash
.\.venv\Scripts\Activate.ps1
```

Install dependencies
```bash
pip install -r requirements.txt
```

If the command above doesn't work, try this
```bash
pip install fastapi motor uvicorn pydantic pandas asyncio
```

## Start MongoDB
After installing MongoDB, start MongoDB locally. I used MongoDB Compass with this command
```bash
mongodb://localhost:27017
```
The database used is `stock_noah`

## Import the data
From the `server` folder
```bash
python import_data.py
```
This imports the stock list, stock price data, news data, and t-SNE data into MongoDB.

## Run the FastAPI backend
From the `server` folder
```bash
uvicorn main:app --reload --port 8000
```

The backend runs at http://localhost:8000
Endpoints:
- /stock_list
- /stock/replace_with_ticker
- /stocknews/?stock_name=replace_with_ticker
- /tsne/?stock_name=replace_with_ticker
- /tsne_all/

## Install client dependencies
Open a second terminal
```bash
cd client-jsx
npm install
```

## Run the React frontend
```bash
npm run dev
```
Open the URL http://localhost:5173 in the browser.

## Assumptions / known issues
- Some news articles may contain scraper error text, such as "Oops, something went wrong" or bot/security verification messages.
- The data files need to be inside `server/data/` before you run `import_data.py`.
- MongoDB should be running locally at `mongodb://localhost:27017`.
- The frontend expects the FastAPI backend to be running on `http://localhost:8000`.