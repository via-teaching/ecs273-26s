import { useEffect, useState } from "react";

const newsFiles = import.meta.glob("../../data/stocknews/*/*.txt", {
  query: "?raw",
  import: "default",
});

export function NewsList({ selectedStock }) {
  const [news, setNews] = useState([]);
  const [openKey, setOpenKey] = useState(null);

  useEffect(() => {
    async function loadNews() {
      const stockEntries = Object.entries(newsFiles).filter(([path]) =>
        path.includes(`/stocknews/${selectedStock}/`)
      );
      const items = await Promise.all(
        stockEntries.map(async ([path, loadContent]) =>
          parseNews(path, await loadContent())
        )
      );

      items.sort((a, b) => b.date.localeCompare(a.date));

      setNews(items);
      setOpenKey(null);
    }

    loadNews();
  }, [selectedStock]);

  return (
    <div className="h-full overflow-y-auto p-2">
      {news.map((item) => {
        const key = `${item.date}-${item.title}`;
        return (
          <button
            key={key}
            type="button"
            className="mb-2 w-full border-b border-gray-200 pb-2 text-left"
            onClick={() => setOpenKey(openKey === key ? null : key)}
          >
            <div className="text-sm font-semibold text-black">{item.title}</div>
            <div className="text-xs text-gray-500">{item.date}</div>
            {openKey === key && (
              <div className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                {item.body}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

function parseNews(path, content) {
  const titleMatch = content.match(/^Title:\s*(.+)$/m);
  const dateMatch = content.match(/^Date:\s*(.+)$/m);

  return {
    title: titleMatch?.[1] || titleFromPath(path),
    date: dateMatch?.[1] || dateFromPath(path),
    body: content,
  };
}

function titleFromPath(path) {
  return path
    .split("/")
    .pop()
    .replace(".txt", "")
    .replace(/^\d{4}-\d{2}-\d{2} \d{2}-\d{2}_/, "");
}

function dateFromPath(path) {
  return path.split("/").pop().slice(0, 16).replace(/-(\d{2})$/, ":$1");
}
