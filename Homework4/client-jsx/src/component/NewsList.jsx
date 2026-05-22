import { useEffect, useState } from "react";

export function NewsList({ selectedStock, apiBase }) {
  const [newsList, setNewsList] = useState([]);
  const [expandedIndex, setExpandedIndex] = useState(null);

  useEffect(() => {
    async function loadNews() {
      try {
        const response = await fetch(`${apiBase}/stocknews/${selectedStock}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch news for ${selectedStock}`);
        }

        const data = await response.json();

        const newsData = (data.News || []).map((news) => ({
          title: news.Title || "Untitled News",
          date: news.Date || "No date",
          content: news.content || "",
        }));

        setNewsList(newsData);
        setExpandedIndex(newsData.length > 0 ? 0 : null);
      } catch (error) {
        console.error("Failed to load news:", error);
        setNewsList([]);
        setExpandedIndex(null);
      }
    }

    if (selectedStock && apiBase) {
      loadNews();
    }
  }, [selectedStock, apiBase]);

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