# ECS 273 Homework 4

An interactive full-stack web application tracking stock prices and respective news using React, FastAPI, and MongoDB.

---

## Folder Structure

```text
Homework4/
└── user/                  
    ├── data/              
    │   ├── stockdata/
    │   ├── stocknews/
    │   └── tsne.csv
    ├── server/            (Backend & MongoDB Scripts)
    │   ├── data_scheme.py
    │   ├── import_data.py
    │   └── main.py
    ├── client/             (React Frontend & Visualizations)
    │   ├── src
    │       ├── components/
    │       │   ├── LineChart.tsx
    │       │   ├── NewsList.tsx
    │       │   ├── TSNEScatter.tsx
    │       │   └── options.tsx
    │       └──App.tsx
    └── README.md          
```

## Setup Instruction

### Backend

1. Navigate to the server folder
   ```
   cd server
   ```
2. Install required Python packages
   ```
   pip install -r requirements.txt
   ```
3. Start your local MongoDB server  
   windows:
   ```
   net start MongoDB
   ```  
   macOS:
   ```
   brew services start mongodb-community
   ```
4. Import data into the database
    ```
    python import_data.py
    ```
6. Run the fastAPI server
   ```
    uvicorn main:app --reload --port 8000
    ```
   API Docs available at: http://localhost:8000/docs

## Frontend

1. Navigate to the frontend folder

    ```
    cd client
    ```

2. Install required Node.js packages

    ```
    npm install
    ```

3. Start the React development server

    ```
    npm run dev
    ```

4. Open the application   
Open your browser and navigate to the local server URL (usually: http://localhost:5173)