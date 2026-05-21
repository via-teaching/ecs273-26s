# Homework 4 Templates

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

Finally, start your api server by,

```
uvicorn main:app --reload --port 8000
```

## Client

For the client part, it should mostly the same as your Homework 4. The only difference in this template is the data fetching part, as the example shown in `App.tsx`, that fetch the data for the drop-down menu with 20 different stocks. You can easily transfer that part into `js` version if needed.

```
cd client
npm install
npm run dev
```

# Homework 4 Student Additions 

The additions for this assignment allow for a full-stack stock dashboard. This is completed with a FastAPI and MondoDB backend, and Reach + D3 frontend. 

Downloads required: 
- Node.js
- Python (3.10 and up)
- MondoDB Community Server 
- All packages listed at the top of each file

To install these, 'cd' to the server folder, then 'pip install  fastapi, uvicorn, motor, pymongo, pandas, pydantic' 

To install dependencies for the client is similar to above, cd client, then 'npm install'

# MongoDB

This assumes a windows system and installer. First install Mongo from its respective website, verify its running with Get-Service MongoDB, and you should see a connect button in your MongoDB Compass application. This will be updated with the file names and can act as a vertification that everything is running for this step. 

# Data collection 

In the server folder, import_data.y calls and recreates collections (safe to rerun at any point), with the database searchable as "stock_AF" 

# FastAPI 

From the server folder run uvicorn main:app --reload --port 8000 and a local host link will appear in the terminal. 

# React frontend

From the client folder, npm run dev will generate a default URL of http://localhost:5173, and will visualize the collected database. Ensure the backend is running first in a separate terminal for this to work properly. 

# Limitations

The backend URL is hardcoded in the front end, which limits future improvements and will have to be changed for more complex systems. 

Data only covers the past two years.

