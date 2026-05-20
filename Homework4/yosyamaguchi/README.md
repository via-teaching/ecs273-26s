# Homework4

This is a web application for tracking stock prices and related news. It uses a FastAPI backend, a MongoDB database, and a React/Vite frontend.

## Install Client Dependencies

From the project folder:

```bash
cd Homework4/yosyamaguchi/client-jsx
npm install
```

## Install Server Dependencies

From the project folder:

```bash
cd Homework4/yosyamaguchi/server
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

On Windows, activate the virtual environment with:

```bash
venv\Scripts\activate
```

## Start MongoDB

The backend expects MongoDB to be running locally at `mongodb://localhost:27017`.

On macOS with Homebrew:

```bash
brew services start mongodb-community
```

On Linux, depending on your installation:

```bash
sudo systemctl start mongod
```

You can also start MongoDB manually with:

```bash
mongod
```

## Import the Data

Make sure MongoDB is running first. Then run the import script from the `server` directory:

```bash
cd Homework4/yosyamaguchi/server
source venv/bin/activate
python import_data.py
```

The script imports stock tickers, stock price CSV files, news text files, and t-SNE data into the `stock_yosyamaguchi` database. It clears the existing collections before importing so duplicate records are not created.

## Run the FastAPI Backend

In a terminal, start the backend from the `server` directory:

```bash
cd Homework4/yosyamaguchi/server
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

The API will run at `http://localhost:8000`, and the interactive API documentation is available at `http://localhost:8000/docs`.

## Run the React Frontend

In a separate terminal, start the frontend from the `client-jsx` directory:

```bash
cd Homework4/yosyamaguchi/client-jsx
npm run dev
```

Open the URL shown by Vite, usually `http://localhost:5173`.

## Assumptions and Known Issues

- MongoDB must be installed and running locally on port `27017`.
- The backend uses the MongoDB database named `stock_yosyamaguchi`.
- The React frontend is hard-coded to call the backend at `http://localhost:8000`.
- `import_data.py` uses relative paths such as `data/stockdata`, `data/stocknews`, and `data/tsne.csv`, so it should be run from the `server` directory.
- Running `import_data.py` deletes and re-imports the existing documents in the target collections.
