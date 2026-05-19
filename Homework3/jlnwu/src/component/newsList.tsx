import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";

// define the data structure for news items
interface NewsItem {
  title: string;
  date: string;
  url: string;
  content: string;
  filename: string;
}

// load all txt file contents at build time
const allNewsFiles = import.meta.glob("../../data/stocknews/**/*.txt", {
  as: "raw",
  eager: false,
});

export function NewsList() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<NewsItem[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  // listen to dropdown changes to load news for selected ticker
  useEffect(() => {
    const initialStock = (d3.select("#bar-select").node() as HTMLSelectElement)?.value ?? "";
    if (initialStock) loadNewsForTicker(initialStock).then(setItems);

    d3.select("#bar-select").on("change.newslist", function (event) {
      setExpanded(null);
      loadNewsForTicker(event.target.value).then(setItems);
    });

    return () => {
      d3.select("#bar-select").on("change.newslist", null);
    };
  }, []);

  // draw the news list using D3 whenever items or expanded changes
  useEffect(() => {
    if (!containerRef.current) return;
    drawList(containerRef.current, items, expanded, (key) => {
      setExpanded((prev) => (prev === key ? null : key));
    });
  }, [items, expanded]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", overflowY: "auto", padding: "0.5rem" }}
    />
  );
}

// draw the news list into the container
function drawList(
  container: HTMLDivElement,
  items: NewsItem[], // list of news items to show
  expanded: string | null,
  onToggle: (key: string) => void
) {
  const root = d3.select(container);
  root.selectAll("*").remove(); // clear previous rendered content

  // draw one card per news item
  items.forEach((item, i) => {
    const key = String(i);
    const isExpanded = expanded === key;

    // card container
    const card = root.append("div")
      .style("margin-bottom", "0.5rem")
      .style("border", "1px solid #ddd")
      .style("border-radius", "6px")
      .style("overflow", "hidden");

    // header and always visible, click to expand/collapse
    const header = card.append("div")
      .style("padding", "0.5rem 0.75rem")
      .style("cursor", "pointer")
      .style("background", isExpanded ? "#e8f0fe" : "#f9f9f9")
      .style("display", "flex")
      .style("justify-content", "space-between")
      .style("align-items", "flex-start")
      .style("gap", "0.5rem")
      .on("click", () => onToggle(key));

    // title + date
    const left = header.append("div");

    left.append("p")
      .style("margin", "0")
      .style("font-weight", "600")
      .style("font-size", "0.85rem")
      .text(item.title);

    left.append("p")
      .style("margin", "0")
      .style("font-size", "0.75rem")
      .style("color", "#666")
      .text(item.date);

    // expanded content — only shown when this item is expanded
    if (isExpanded) {
      const body = card.append("div")
        .style("padding", "0.75rem")
        .style("font-size", "0.8rem")
        .style("line-height", "1.5")
        .style("background", "#fff")
        .style("border-top", "1px solid #ddd")
        .style("white-space", "pre-wrap");

      body.append("p")
        .style("margin", "0")
        .text(item.content);

    }
  });
}

// load and parse news items for a given ticker
async function loadNewsForTicker(ticker: string): Promise<NewsItem[]> {
  const prefix = `../../data/stocknews/${ticker}/`;

  const matchingKeys = Object.keys(allNewsFiles).filter((k) =>
    k.startsWith(prefix)
  );

  const items: NewsItem[] = await Promise.all(
    matchingKeys.map(async (key) => {
      const raw = (await allNewsFiles[key]()) as string;
      return parseNewsFile(raw, key);
    })
  );

  items.sort((a, b) => b.date.localeCompare(a.date));
  return items;
}

// parse the raw content of a news txt file into a NewsItem object
function parseNewsFile(raw: string, filepath: string): NewsItem {
  const lines = raw.split("\n");
  let title = "";
  let date = "";
  let url = "";
  let contentStart = 0;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("Title: ")) {
      title = lines[i].replace("Title: ", "").trim();
    } else if (lines[i].startsWith("Date: ")) {
      date = lines[i].replace("Date: ", "").trim();
    } else if (lines[i].startsWith("URL: ")) {
      url = lines[i].replace("URL: ", "").trim();
    } else if (lines[i].trim() === "" && title && date) {
      contentStart = i + 1;
      break;
    }
  }

  const content = lines.slice(contentStart).join("\n").trim();
  return { title, date, url, content, filename: filepath };
}