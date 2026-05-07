## Getting Started

### 1. Open the Project
Open the project folder in your preferred code editor (I used Visual Studio Code).

### 2. Open the Terminal
Open an integrated Bash terminal at the root of the project directory (ajoyuan). 

To do so, create a new terminal and ensure "bash" is selected in the terminal dropdown.*

### 3. Ensure all necessary packages are installed
Enter the following command into the bash terminal:

npm install

### 4. Run the Application
Run the following command to start the Vite development server:

npm run dev

### 5. Access the website
A link should appear in the terminal. 

example link: http://localhost:5173/

Copy paste the link into your browser or use crtl + click to directly open the link.

### Folder Structure

```text
/
├── public/
│   └── data/
│       ├── stockdata/         # Individual CSV files for each ticker
│       ├── stocknews/         # Folders containing news.json for each ticker
│       └── tsne.csv           # Global coordinates for the cluster plot
├── src/
│   ├── component/
│   │   ├── NewsList.jsx       # News feed component
│   │   ├── options.jsx        # Dropdown menu stock component
│   │   ├── StockLineChart.jsx # Stockline plot component
│   │   └── TsnePlot.jsx       # T-SNE plot component
│   └── App.jsx               # Main dashboard layout
└── README.md                 # Project documentation
