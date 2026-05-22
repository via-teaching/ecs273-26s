# Homework 4: Full-Stack Stock Visualization

This project extends the Homework 3 React + D3 visualization into a full-stack web application. The application uses MongoDB to store stock price data, stock news data, and t-SNE projection data. The backend is implemented with FastAPI, and the frontend is implemented with React and D3. The React frontend fetches data from the FastAPI backend instead of directly reading local CSV or JSON files.

The project contains two main folders. The `server` folder contains the FastAPI backend, MongoDB data schema, and data import script. The `client-jsx` folder contains the React frontend used for this submission.

To install the client dependencies, go to the React client folder and install the npm packages:

```bash
cd client-jsx
npm install
```

To install the server dependencies, go to the server folder and install the Python packages:

```bash
cd server
pip install -r requirements.txt
```

Before running the backend or importing data, make sure the local MongoDB server is running. On Windows, you can check the MongoDB service status with:

```bash
net start MongoDB
```

```bash
python import_data.py
uvicorn main:app --reload --port 8000
cd client-jsx
npm run dev
```
front_end runs at http://localhost:5173