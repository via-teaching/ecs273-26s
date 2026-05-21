# ECS 273 Homework 4
## Joe Morrison

## Introduction

This assignment extends the Homework 3 stock visualization dashboard into a full-stack web application.
Stock price data, news articles, and t-SNE projection coordinates from Homeworks 1 and 2 are imported into MongoDB via import_data.py.
A FastAPI backend then serves this data to the React frontend, which fetches all data from the backend rather than reading local files directly.

## Environment Setup

I used Anaconda to manage my Python environment for the server portions of this assignment.
The visualization is built in React with D3.js and run with Node.js.
To set up the same environment, please run the following commands.

Create and activate the environment

```
conda create -n ecs273 python=3.12
conda activate ecs273
```

## Setup Instruction

### Brief Note
I primarily use Anaconda, and the server was written and run through the Anaconda prompt.
I apologize for any difficulties with my script.
Most of my experience is in MATLAB, so I am still learning Python and JavaScript through these assignments.
This task builds on the stock data and t-SNE output from Homeworks 1 and 2.

### Backend

**1. Navigate to the backend folder**

```
cd Homework4/jcmorrison/server
```

**2. (Optional but recommended) Activate your Anaconda environment**

```
conda activate ecs273
```
**3. Install required Python packages**

Needed packages

fastapi

motor

uvicorn

pydantic

pandas

asyncio

pymongo

```
pip install -r requirements.txt
```

**4. Make sure MongoDB is running**

On Windows

```
net start MongoDB
```

**5. Verify data files are included in the data folder**

Since you're pulling from my repository, it should aready be included

Verify server/data/tsne.csv, server/data/stockdata/, and server/data/stocknews/ are present before importing

Again, this should already be correct, but I clear previous imports in my import_data.py script, so good to confirm

**6. Import data into the database**

```
python import_data.py
```

**7. Run the FastAPI server**

```
uvicorn main:app --reload --port 8000
```

API Docs available at: http://localhost:8000/docs

### Brief Note
The frontend is built in React with D3.js, the same as Homework 3.
You can find my note on GenAI use in D3 from Homework 3, but I reused much of the same script.
That means that GenAI was used in the development, as previously noted, to learn syntax and troubleshoot.
I initially left out error message warnings, but the places where I had issues I added them initially then added more.
The reasoning for that is for ensuring it works even if you use other data or warns you that it's not working.
I apologize for any odd formatting in the component files.
Again, I am primarily a MATLAB user, so python and JavaScript are still relatively new to me.

### Frontend

**1. Navigate to the frontend folder**

I did this portion in VS Code and used the command prompt

```
cd Homework4/jcmorrison/client-jsx
```

**2. Install required Node.js packages**

```
npm install
```

**3. Start the React development server**

```
npm run dev
```

**4. Visit the frontend in your browser**

Usually http://localhost:5173

## Additional Notes

The database is named stock_jcmorrison to avoid collision with other students as requested in instructions.
I had a bug in importing data stacking, so that is addressed in import_data.py if you run it more than once.
Running import_data.py more than once is safe as the script clears collections before reimporting.
The tsne.csv file must be copied in from Homework 2 before running import_data.py, which is already included.
The node_modules/ folder is excluded from submission via .gitignore and must be regenerated with npm install.

## A Note on AI Usage

I usually work in MATLAB first, but that wasn't applicable for this, and I reused much of my work from the previous homework.
I am not a CS student and my familiarity with Python and JavaScript is limited.
This means I designed the methodology, but had some help with syntax as a new coder in these languages, similar to Homework 3.
Also, as noted earlier in this, some of the syntax was learned using GenAI in Homework 3, so all reused material still has that.
I likely needed more help with basic syntax than the other students in this class, which is noted later.
The ideas are my own, and AI was primarily used for syntax to aid with me learning these languages for this.
Again, I am new to Python and JavaScript and not a CS student, so I apologize if my need for syntax assistance was a bit basic.
Thank you for grading!

### Specific Tasks with AI Assistance

***Backend***
I had some issues with getting the automated data extraction going, so I had some GenAI troubleshooting there.
This included needing help learning the FastAPI async patterns and MongoDB motor queries, which was some GenAI and forums.
This specifically included converting my approach to async Python.
I also got help learning syntax for how to structure the Pydantic models for the MongoDB documents.
I tried using the provided documents first with forums, then asked GenAI for help with syntax.
I have not used FastAPI or MongoDB before, so using GenAI was helpful for formatting requirements.
Finally, I designed the data schema and endpoint structure myself, with GenAI helping on the Python syntax.

***Frontend***
The LineChart, NewsList, and TSNEScatter are pulled from Homework 3 are very similar.
The use of GenAI for these was discussed in previous homework and is mostly unchanged.
I took what I learned from that homework and repeated most of it.
The main difference is where I pulled the data from, as determined by the assignment.
For TSNEScatter, I changed from const and => format to var and function style, and used GenAI to check my work.
For this task, the main challenge was replacing static file reads with fetch calls to the backend.
I used my Homework 3 material, which I noted syntax learning help on D3 zoom and tooltip development.
I also got help troubleshooting the ObjectId serialization issue between MongoDB and FastAPI, which I had issue with.
The component structure and linking logic between views reflect my own design decisions from Homework 3.

As requested, nothing was copied from GenAI in backend or frontend without being checked.
Instead, I tried the work myself first with learning support from GenAI for syntax and formatting requirements.
After that, I got help from GenAI with troubleshooting when there were errors.
Thank you for grading throughout the course, I appreciate your comments!
