import { useEffect, useState } from "react";

const allNewsModules = import.meta.glob("../../data/stocknews/**/*.txt", {
  query: "?raw",
  import: "default",
});

const COINBASE_BOILERPLATE =
  "The above button links to Coinbase. Yahoo Finance is not a broker-dealer or investment adviser and does not offer securities or cryptocurrencies for sale or facilitate trading. Coinbase pays us for certain activity generated through this link. Prices displayed are informational.";

function stripBoilerplate(content) {
  if (content.startsWith(COINBASE_BOILERPLATE)) {
    return content.slice(COINBASE_BOILERPLATE.length).trimStart();
  }
  return content;
}

function parseArticle(text, path) {
  const lines = text.split("\n");
  let title = "";
  let date = "";
  const contentLines = [];
  let inContent = false;

  for (const line of lines) {
    if (line.startsWith("Title: ")) {
      title = line.slice(7).trim();
    } else if (line.startsWith("Date: ")) {
      date = line.slice(6).trim();
    } else if (line.startsWith("Content: ")) {
      inContent = true;
      const first = line.slice(9).trim();
      if (first) contentLines.push(first);
    } else if (inContent && line.trim()) {
      contentLines.push(line.trim());
    }
  }

  return { title, date, content: stripBoilerplate(contentLines.join(" ").trim()), key: path };
}

export function NewsList({ stock }) {
  const [articles, setArticles] = useState([]);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!stock) return;
    setExpanded(null);

    const stockEntries = Object.entries(allNewsModules).filter(([path]) =>
      path.includes(`/stocknews/${stock}/`)
    );

    Promise.allSettled(
      stockEntries.map(async ([path, load]) => {
        const text = await load();
        return parseArticle(text, path);
      })
    ).then((results) => {
      const parsed = results
        .filter((r) => r.status === "fulfilled")
        .map((r) => r.value);
      parsed.sort((a, b) => b.date.localeCompare(a.date));
      setArticles(parsed);
    });
  }, [stock]);

  const toggle = (key) => setExpanded((prev) => (prev === key ? null : key));

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "0.5rem 0.75rem" }}>
      {articles.length === 0 && (
        <p style={{ textAlign: "center", marginTop: "2rem", color: "#6c584c" }}>
          No news for {stock}
        </p>
      )}
      {articles.map((article) => (
        <div
          key={article.key}
          onClick={() => toggle(article.key)}
          style={{
            cursor: "pointer",
            borderBottom: "1px solid #c4a882",
            padding: "0.5rem 0.25rem",
          }}
        >
          <div style={{ fontWeight: 600, fontSize: "0.82rem", lineHeight: "1.3" }}>
            {article.title}
          </div>
          <div style={{ fontSize: "0.7rem", color: "#6c584c", marginTop: "2px" }}>
            {article.date}
          </div>
          {expanded === article.key && (
            <div
              style={{
                marginTop: "0.5rem",
                fontSize: "0.78rem",
                lineHeight: "1.6",
                color: "#3d2b1f",
              }}
            >
              {article.content || "No content available."}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
