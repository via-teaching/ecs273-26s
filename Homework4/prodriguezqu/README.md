# Homework 4

My HW4 folder is:

`prodriguezqu/`

For this homework I used:
- `client/` for the React frontend
- `server/` for the FastAPI + MongoDB backend

## How to install client dependencies

Go into the client folder:

```bash
cd Homework4/prodriguezqu/client
```

Install packages:

```bash
npm install
```

## How to install server dependencies

Go into the server folder:

```bash
cd Homework4/prodriguezqu/server
```

Make a virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Install packages:

```bash
pip install -r requirements.txt
```

## How to start MongoDB

MongoDB was installed in WSL for me.

Start it with:

```bash
sudo systemctl start mongod
```

Optional check:

```bash
sudo systemctl status mongod --no-pager
```

## How to import the data

From the server folder, with the venv active:

```bash
cd Homework4/prodriguezqu/server
source .venv/bin/activate
python import_data.py
```

This imports:
- stock list
- stock prices
- stock news
- tsne data

The database name I used is:

`stock_prrq`

I took "abbr of your name" to mean the first letters of my full name.

## How to run the FastAPI backend

From the server folder, with the venv active:

```bash
cd Homework4/prodriguezqu/server
source .venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

If running locally only, this also works:

```bash
uvicorn main:app --reload --port 8000
```

## How to run the React frontend

From the client folder:

```bash
cd Homework4/prodriguezqu/client
npm run dev -- --host
```

If running only on the same machine, this also works:

```bash
npm run dev
```

## Notes

- The data used for this homework is placed in `server/data/` as required by the homework.
- The frontend now fetches data from FastAPI instead of reading local csv/json/txt files directly.
- I kept the main Homework 3 visualizations and refactored the data loading to use the backend.
- Some of the HW1 news files contain Yahoo error-page text like `Oops, something went wrong`, so I still filter those in the news view.
- For the news panel, I kept the previous interaction behavior and only changed the data source to the backend.
