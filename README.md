# ECS 273 Homework 4 — Full-Stack Stock Visual Analytics Dashboard

## Introduction

This project extends the Homework 3 interactive D3 stock dashboard into a full-stack web application.

The application uses:

- MongoDB for storing stock data
- FastAPI for backend API endpoints
- React + TypeScript for the frontend
- D3.js for interactive visualizations

The dashboard includes:

- Stock price line chart
- t-SNE scatter plot
- Stock news list
- Linked interactions between views

---

## Project Structure

```txt
Homework4/
└── akandya/
    ├── client/
    └── server/
        ├── data/
        │   ├── stockdata/
        │   ├── stocknews/
        │   └── tsne.csv
        ├── data_scheme.py
        ├── import_data.py
        ├── main.py
        └── requirements.txt