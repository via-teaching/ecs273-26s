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

There are now two client templates:

- `client`: TypeScript / TSX version
- `client-jsx`: JavaScript / JSX version

Both clients include the Homework 4 stock list fetch example for the dropdown menu.

TypeScript client:

```bash
cd client
npm install
npm run dev
```

JavaScript client:

```bash
cd client-jsx
npm install
npm run dev
```
