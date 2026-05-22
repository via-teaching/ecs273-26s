import { useState } from "react";

const newsModules = import.meta.glob("../../data/stocknews/**/*.txt", {
  query: "?raw",
  import: "default",
  eager: true,
});

function parseNews(path, content) {
  const parts = path.split("/");
  const ticker = parts[parts.length - 2];
  const filename = parts[parts.length - 1];
  const name = filename.replace(".txt", "");
  const match = name.match(/^(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2})_(.*)$/);

  return {
    ticker,
    date: match ? `${match[1]} ${match[2].replace("-", ":")}` : "",
    title: match ? match[3].replaceAll("_", " ") : name.replaceAll("_", " "),
    content,
  };
}

const allNews = Object.entries(newsModules).map(([path, content]) =>
  parseNews(path, content)
);

export default function NewsList({ selectedStock }) {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const news = allNews
    .filter((item) => item.ticker === selectedStock)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-3 max-h-[760px] overflow-y-auto">

      {news.map((item, index) => (
        <div
          key={index}
          className="border rounded p-3 cursor-pointer hover:bg-slate-50"
          onClick={() =>
            setExpandedIndex(expandedIndex === index ? null : index)
          }
        >
          <h3 className="font-semibold">{item.title}</h3>
          <p className="text-sm text-gray-500">{item.date}</p>

          {expandedIndex === index && (
            <p>
              {item.content}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}