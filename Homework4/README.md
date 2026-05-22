# Homework 4

## Client Dependencies Installation

Navigate to client folder:

```bash
cd client
npm install
```

Run frontend:

```bash
npm run dev
```

---

## Server Dependencies Installation

Navigate to server folder:

```bash
cd server
pip install -r requirements.txt
```

---

## Start MongoDB

```bash
brew services start mongodb-community
```

---

## Import Data

Navigate to server folder:

```bash
cd server
python import_data.py
```

---

## Run FastAPI Backend

```bash
uvicorn main:app --reload --port 8000
```

Backend API:

```
http://127.0.0.1:8000
```

---

## Run React Frontend

Navigate to client folder:

```bash
cd client
npm run dev
```

Frontend:

```
http://localhost:5173
```

---

## Assumptions / Known Issues

- MongoDB must be running before importing data.
- MongoDB uses default local connection:
  ```
  mongodb://localhost:27017
  ```
- Backend runs on port 8000.
- Frontend runs on port 5173.
