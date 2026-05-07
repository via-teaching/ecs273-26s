import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// this will let us use __dirname in ES module format
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// this will point to the folder that has all the stock news folders
const baseDir = path.join(__dirname, "data", "stocknews");

// this will be the final output json file that is generated
const outputFile = path.join(__dirname, "data", "stocknews.json");

// this will store everything grouped by ticker
const data = {};

// this will get all ticker folder names
const tickers = fs.readdirSync(baseDir);

// this will loop through each ticker folder (like AAPL, TSLA, etc.)
for (let ticker of tickers) {
  const tickerFolder = path.join(baseDir, ticker);

  // this will skip anything that is not actually a folder
  if (!fs.lstatSync(tickerFolder).isDirectory()) {
    continue;
  }

  // this will create an empty list for each ticker
  data[ticker] = [];

  const files = fs.readdirSync(tickerFolder);

  // this will loop through all files inside the ticker folder
  for (let file of files) {

    // this will ignore non-txt files
    if (!file.endsWith(".txt")) {
      continue;
    }

    const filePath = path.join(tickerFolder, file);

    // this will read the actual news file
    const text = fs.readFileSync(filePath, "utf8");

    const lines = text.split("\n");

    // this will get the title from the first line
    const title = lines[0].replace("Title:", "").trim();

    // this will get the date from the second line
    const date = lines[1].replace("Date:", "").trim();

    // this will get the rest of the article as the content
    const content = lines.slice(3).join("\n").trim();

    // this will store one news article into the ticker list
    data[ticker].push({
      title,
      date,
      content,
    });
  }
}

// this will write everything into a single json file
fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));