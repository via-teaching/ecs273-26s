# Homework 4: Full-Stack Stock Visualization

## Introduction

This project extends Homework 3 into a full-stack application. Stock data is stored in MongoDB, served via a FastAPI backend, and visualized in a React + D3 frontend.

## Setup Instructions

### Backend

**1. Navigate to the server folder**

```
cd Homework4/server
```

**2. Set up a Python virtual environment**

```
python -m venv venv
venv\Scripts\activate
```

**3. Install required Python packages**

```
pip install -r requirements.txt
```

**4. Make sure MongoDB is running**

On Windows, open a separate terminal and run:

```
mongod --dbpath "C:\data\db"
```

Keep this terminal open.

**5. Import data into the database**

```
python import_data.py
```

**6. Run the FastAPI server**

```
uvicorn main:app --reload --port 8000
```

API Docs available at: http://localhost:8000/docs

### Frontend

**1. Navigate to the client folder**

```
cd Homework4/client-jsx
```

**2. Install required Node.js packages**

```
npm install
```

**3. Start the React development server**

```
npm run dev
```

**4. Visit the frontend in your browser**

http://localhost:5173

## Additional Notes

- Database name: `stock_hima`
- Collections: `stock_list`, `stock_price`, `stock_news`, `stock_tsne`
- Data is the same as Homework 3 (stock prices and news from HW1, t-SNE from HW2)
- The JavaScript client (`client-jsx`) is used for this submission
- Make sure MongoDB is running before starting the server
- Make sure the server is running before starting the client