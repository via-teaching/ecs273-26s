# Homework 4: Full-Stack Stock Visualization

## Backend Setup
**1. Navigate to the backend folder**
cd server

**2. (Optional but recommended) Set up a conda environment**
conda activate ecs273

**3. Install required Python packages**
pip install -r requirements.txt

**4. Make sure MongoDB is running**
If using Homebrew on macOS:
brew services start mongodb-community


**5. Import data into the database**
python import_data.py

**6. Run the FastAPI server**
uvicorn main:app --reload --port 8000

## Frontend Setup
**1. Navigate to the frontend folder**
cd client-jsx

**2. Install required Node.js packages**
npm install

**3. Start the React development server**
npm run dev

**4. Visit the frontend in your browser**
http://localhost:5173

## Additional Notes
API Docs available at: http://localhost:8000/docs

- The database is named "stock_jason".
- News data is available for all 20 required tickers.
- MongoDB must be running before importing data or starting the backend.
- The backend must be running before starting the frontend.
