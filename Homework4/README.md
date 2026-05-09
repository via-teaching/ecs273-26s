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
