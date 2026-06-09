import { useEffect, useState } from "react";

export default function NewsList({ selectedStock }) {

  const [articles, setArticles] = useState([]);

  useEffect(() => {

    async function loadArticles() {

      try {

        // Load article index
        const indexResponse = await fetch("/data/news_index.json");

        const indexData = await indexResponse.json();

        const filenames = indexData[selectedStock] || [];

        // Load all article files
        const loadedArticles = await Promise.all(

          filenames.map(async (filename, i) => {

            const response = await fetch(
              `/data/stocknews/${selectedStock}/${filename}`
            );

            const text = await response.text();

            // Split lines
            const lines = text.split("\n");

            // Parse title
            const titleLine = lines.find(line =>
              line.startsWith("Title:")
            );

            const title = titleLine
              ? titleLine.replace("Title:", "").trim()
              : "Untitled";

            // Parse date
            const dateLine = lines.find(line =>
              line.startsWith("Date:")
            );

            const date = dateLine
              ? dateLine.replace("Date:", "").trim()
              : "Unknown Date";

            // Remove metadata from content
            const content = lines
              .slice(2)
              .join("\n")
              .trim();

            return {
              id: i,
              title,
              date,
              content,
              expanded: false,
            };
          })
        );

        setArticles(loadedArticles);

      } catch (error) {

        console.error("Error loading articles:", error);

      }
    }

    loadArticles();

  }, [selectedStock]);

  // Toggle expand/collapse
  function toggleArticle(id) {

    setArticles(prev =>
      prev.map(article =>
        article.id === id
          ? { ...article, expanded: !article.expanded }
          : article
      )
    );
  }

  return (

    <div className="h-full overflow-y-auto p-3 bg-gray-50">

      <h2 className="text-lg font-bold mb-4">
        {selectedStock} News
      </h2>

      <div className="space-y-3">

        {articles.map(article => (

          <div
            key={article.id}
            className="bg-white border border-gray-300 rounded-lg shadow-sm"
          >

            <button
              onClick={() => toggleArticle(article.id)}
              className="w-full text-left p-3 hover:bg-gray-100 transition"
            >

              <div className="font-semibold text-sm">
                {article.title}
              </div>

              <div className="text-xs text-gray-500 mt-1">
                {article.date}
              </div>

            </button>

            {article.expanded && (

              <div className="border-t border-gray-200 p-3">

                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {article.content}
                </p>

              </div>
            )}

          </div>
        ))}

      </div>

    </div>
  );
}