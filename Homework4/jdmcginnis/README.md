# Homework 4 README

This folder contains two parts, client and server.

## Server
For the server part, make sure you have the respective packages installed.

```
pip install -r requirements.txt
```

Secondly, make sure you have already installed and started your mongoDB local server.
For example, for mongodb managed with homebrew, run:

```
brew services start mongodb-community
```

Then, put your data into database with:

```
python import_data.py
```

Finally, start your FastAPI server by,

```
uvicorn main:app --reload --port 8000
```

## Client
For the client part, ensure you have npm installed, if not:
```angular2html
npm install
```

Start up the server (React frontend) using: 
```angular2html
cd client
npm run dev
```

### Notes
database is named 'stock_joshmcginnis'

### AI Usage Note:
- Used to understand how to set up MongoDB as the official docs were more confusing than helpful
- Used to understand how best to structure import_data.py (for best practices since we're using asyncs)
- Used to understand the first provided example in import_data.py and how it interacts with the database
- General bug fixes and help with formatting (especially with importing data into database)
- Used built-in AI-powered autocomplete (PyCharm IDE)
- Used for figuring out how the mapping between Javascript scripts and the server/API works as it was very confusing
- Used for debugging/figuring out how to adjust code to fit intended logic in ScatterPlot.jsx (also options.jsx)