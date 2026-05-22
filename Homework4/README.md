# Homework 4 Templates

This folder contains two parts, client and server.

## Server

For the server part, make sure you have the respective packages installed.

```
cd server
pip install -r requirements.txt
```

To start MongoDB, run: 
#### Linux / WSL
```bash
sudo systemctl start mongo
```
#### Mac
```bash
brew services start mongodb-community
```

After you have started MongoDB, you can import data by runing:

```
python3 import_data.py
```

Finally, start your API server by:

```
uvicorn main:app --reload --port 8000
```

## Client


To run the React frontend, run:

```bash
cd client-jsx
npm install
npm run dev
```

## Assumptions:
This project assumes the following are already installed on the system:

- Node.js and npm
- Python 3.10+
- MongoDB (running locally on default port 27017)

Note:
This project was ran within a WSL system. 

## AI Usage:
AI was used to help set up the FastAPI logic, and to lightly refactor the dashboard components to retrieve data from API calls intead of from json files. 
