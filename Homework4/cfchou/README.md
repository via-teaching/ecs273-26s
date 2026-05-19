# ECS 273 SQ26 Homework 4

Full-stack version of HW3.
The Mongo database name is **`stock_chifang`** with four collections:
`stock_list`, `stock_prices`, `stock_news`, `tsne`.

---

## 1. Backend setup

### Install Python dependencies

```bash
cd server
python -m venv venv
source venv/bin/activate   
pip install -r requirements.txt
```

### Start MongoDB

```bash
brew services start mongodb-community
```

The app expects MongoDB at the default `mongodb://localhost:27017`.

### Import the data

```bash
python import_data.py
```

### Run the FastAPI server

```bash
uvicorn main:app --reload --port 8000
```

## 2. Frontend setup

In a second terminal:

```bash
cd client
npm install
npm run dev
```

Open <http://localhost:5173>.

---

## 3. Notes

- Need Homebrew for using mongodb-community
- fixed mistakes mentioned in hw3 comment (x-axis)