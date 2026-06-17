import { useEffect, useState } from "react";

export function NewsList({ selectedStock }) {
  const [newsList, setNewsList] = useState([]);
  const [expandedIndex, setExpandedIndex] = useState(null);

  useEffect(() => {
    async function loadNews() {
      try {
        const indexResponse = await fetch("/data/stocknews/news_index.json");
        const newsIndex = await indexResponse.json();

        const files = newsIndex[selectedStock] || [];

        const newsData = await Promise.all(
          files.map(async (file) => {
            const response = await fetch(
              `/data/stocknews/${selectedStock}/${file}`
            );

            const text = await response.text();
            return parseNewsText(text);
          })
        );

        setNewsList(newsData);
        setExpandedIndex(0);
      } catch (error) {
        console.error("Failed to load news:", error);
        setNewsList([]);
      }
    }

    if (selectedStock) {
      loadNews();
    }
  }, [selectedStock]);

  return (
    <div
      style={{
        height: "100%",
        overflowY: "auto",
        padding: "10px",
      }}
    >
      <h4 style={{ fontWeight: "bold", marginBottom: "10px" }}>
        News for {selectedStock}
      </h4>

      {newsList.length === 0 ? (
        <p style={{ color: "gray" }}>No news available.</p>
      ) : (
        newsList.map((news, index) => (
          <div
            key={index}
            onClick={() =>
              setExpandedIndex(expandedIndex === index ? null : index)
            }
            style={{
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "10px",
              marginBottom: "10px",
              backgroundColor: "white",
              cursor: "pointer",
            }}
          >
            <div style={{ fontWeight: "bold" }}>{news.title}</div>

            <div
              style={{
                fontSize: "0.85rem",
                color: "gray",
                marginTop: "4px",
              }}
            >
              {news.date}
            </div>

            {expandedIndex === index && (
              <div
                style={{
                  marginTop: "10px",
                  fontSize: "0.9rem",
                  lineHeight: "1.4",
                  whiteSpace: "pre-wrap",
                }}
              >
                {news.content}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

function parseNewsText(text) {
  const titleMatch = text.match(/Title:\s*(.*)/i);
  const dateMatch = text.match(/Date:\s*(.*)/i);
  const contentMatch = text.match(/Content:\s*([\s\S]*)/i);

  return {
    title: titleMatch ? titleMatch[1].trim() : "Untitled News",
    date: dateMatch ? dateMatch[1].trim() : "No date",
    content: contentMatch ? contentMatch[1].trim() : text,
  };
}