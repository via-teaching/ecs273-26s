# Homework 4 README

# What is this?

A web application designed to visualize stock market data, news, and t-SNE projections. 
The application features a FastAPI backend backed by MongoDB where the data is stored. 
There is a React-based interactive frontend where a TSNE plot, news article list, and stockprice line chart are.
---


### 0: Start MongoDB
MAKE SURE MongoDB IS RUNNING FIRST BEFORE DOING ANYTHING

ON WINDOWS, VERIFY BY GOING TO SERVICES AND SEEING IF MONGODB IS ACTIVE, IF NOT YOU CAN ACTIVATE IT THERE 

### 1: Open MongoDB and connect to the server
Open MongoDB, click on the add new connection button

Ensure the new connection URL is mongodb://localhost:27017 and name the server

Connect to the server

### 2: Install necessary dependencies for server
Open the Homework4 file using visual studio code

Open a new bash terminal

Navigate to the server folder using cd server  using the bash terminal

In the terminal, run the command:

pip install -r requirements.txt

Important: Ensure you are using the right virtual environment before hand

### 3: Import data into the mongoDB server
in the same bash terminal, run the command

python import_data.py

### 4: Run the FastAPI server
in the terminal, run the command:

uvicorn main:app --reload --port 8000

Then, use this link:

http://localhost:8000/docs 

to access the FastAPI  server

### 5: Install necessary dependencies for client
Open a new bash terminal and navigate to the client-jsx folder

in the terminal, run the command

npm install

### 6. Run the Application
Run the following command in the bash terminal to start the Vite development server:

npm run dev

### 7. Access the website
A link should appear in the terminal. 

example link: http://localhost:5173/

Copy paste the link into your browser or use crtl + click to directly open the link.

## Folder Structure

```text
├── client-jsx/                     # Frontend React application
|   └── src/
|        ├── component/
|        │   ├── NewsList.jsx       # News feed component
|        │   ├── options.jsx        # Dropdown menu stock component
|        │   ├── StockLineChart.jsx # Stockline plot component
|        │   └── TsnePlot.jsx       # T-SNE plot component
|        └── App.jsx                # Main dashboard layout
|
├── server/                         # Backend FastAPI application
│   ├── data/                       # Raw stock data source files
│   │   ├── stockdata/              # Ticker CSV files (e.g., AAPL.csv)
│   │   ├── stocknews/              # Ticker news folders containing CSV/JSON
│   │   └── tsne.csv                # Pre-calculated t-SNE coordinates
│   ├── import_data.py              # Database seeding script
│   └── main.py                     # FastAPI entry point
│   └── data_scheme.py              # Data format for database
│   └── requirements.txt            # Dependencies
└── README.md