# Homework 4 

# Homework 4: Full-Stack Stock Visualization

## 1. Install Client Dependencies

```bash
cd client
npm install
```
npm install will install all dependecies listed in package.json for the frontend

## 2. Install Server Dependencies

```bash
cd server
pip install fastapi uvicorn motor pymongo pydantic
```

## 3. Start MongoDB

### Install MongoDB

Mac:
```bash
brew tap mongodb/brew
brew install mongodb-community
```

Windows:

Download and install from: https://www.mongodb.com/try/download/community

### Start MongoDB

Mac:
```bash
brew services start mongodb-community
```

Windows:
```bash
mongod
```

## 4. Import the Data

ENsure MongoDB is running, then from the `server/` directory:
```bash
python import_data.py
```

There should be 4 collections imported MongoDB:
- `stock_list`
- `stock_prices`
- `stock_news`
- `tsne_data`

## 5. Run the FastAPI Backend

From the `server/` directory:
```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`.


## 6. Run the React Frontend

From the `client/` directory:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`, go to `http://localhost:5173` on the browser to see the app

## 7. Assumptions and Known Issues

- MongoDB must be running before starting the backend or importing data.
- The backend must be running before starting the frontend.
- Data files must be placed in `server/data/`
