# ECS 273 Homework 3

This is the Homework 3 React/Vite project for `agothankar`, which is the short form of my student email.

## Running the Project

From the repository or homework folder, first change into the `agothankar` project directory:

```bash
cd C:\Users\ajink\Downloads\ECS273\hw3\ecs273-26s\Homework3\agothankar
```

Install the project dependencies:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

After the server starts, open the local URL shown in the terminal, usually:

```text
http://localhost:5173/
```

## Data Loading Note

News articles are stored as text files under `data/stocknews/<TICKER>/`. Because the article filenames contain spaces, symbols, and encoded characters that can make direct browser loading fragile, `vite.config.js` scans those folders during Vite dev startup, parses each file's title/date/URL/body, and generates `/data/stocknews.generated.json`. The React app then reads this single generated JSON file to display the news.
