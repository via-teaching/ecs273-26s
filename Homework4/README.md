# Homework 4 README

---

# BACKEND SETUP

### 0: Start MongoDB
MAKE SURE MongoDB IS RUNNING FIRST BEFORE DOING ANYTHING

ON WINDOWS, VERIFY BY GOING TO SERVICES AND SEEING IF MONGODB IS ACTIVE, IF NOT YOU CAN ACTIVATE IT THERE 

### 1: Open MongoDB and connect to the server
Open MongoDB, click on the add new connection button

Ensure the new connection URL is: 

mongodb://localhost:27017

Name the server and then connect to the server

IMPORTANT: DO NOT CLOSE MongoDB

### 2: Install necessary dependencies for server
Open the Homework4 file using visual studio code

Open a new bash terminal

Navigate to the server folder using the bash terminal

In the terminal, run the command:

pip install -r requirements.txt

Important: Ensure you are using the right virtual environment before hand

### 3: Import data into the mongoDB server
In the same bash terminal, run the command:

python import_data.py

This will import all the data into the MongoDB server. You can verify it is there by going to mongoDB and looking for: 

stock_ajoyuan

in mongoDB

IMPORTANT: DO NOT CLOSE MongoDB

### 5: Run the FastAPI server
in the terminal, run the command:

uvicorn main:app --reload --port 8000

IMPORTANT: DO NOT KILL THE BASH TERMINAL, KEEP THIS OPEN AND USE A NEW BASH TERMINAL FOR THE FOLLOWING STEPS

### 6: Access the FastAPI server

In your web-browser, Use this link:

http://localhost:8000/docs 

to access the FastAPI server where you can look at the data

# FRONTEND SETUP

### 5: Install necessary dependencies for client
Open a new bash terminal and navigate to the client-jsx folder

In the terminal, run the command:

npm install

IMPORTANT: DO NOT CLOSE OR USE THE PREVIOUS BASH TERMINAL WHERE YOU ACTIVATED YOUR FastAPI, YOU MUST USE A NEW BASH TERMINAL HERE

### 6. Run the Application
Run the following command in the bash terminal to start the Vite development server:

npm run dev

### 7. Access the website
A link should appear in the terminal. 

example link: http://localhost:5173/

Copy paste the link into your browser or use crtl + click to directly open the link.

### Additional assumptions and notes:

The Homework features a FastAPI backend backed by MongoDB where the data is stored and a React-based interactive frontend where a t-SNE plot, news article list, and stockprice line chart are.

Nothing SHOULD go wrong if the above steps are followed. However, because I am on Windows, not everything I said here may apply to a mac or any application outside of VScode.

This homework also assumes the user downloaded MongoDB compass and FastAPI before attempting to use these files.

### Endpoint visualizations

t-SNE Endpoint: Fetches the 2D coordinates for all tracked stocks to plot on an interactive cluster visualization layout on the frontend which can highlight the particular coordinate for a specific stock ticker.

Stock Prices Endpoint: Retrieves the historical pricing series for a specific stock ticker to render its line chart.

Stock News Endpoint: Fetches the scraped news articles and metadata for a specific stock ticker to put in an interactive news feed side-panel.

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