import { useEffect, useState } from "react";

export default function NewsList({ selectedStock }) {
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    if (!selectedStock) return;

    fetch(`http://localhost:8000/stocknews/${selectedStock}`)
      .then((res) => res.json())
      .then((data) => {
        const formatted = data.map((article, index) => ({
          id: index,
          title: article.Title,
          date: article.Date,
          content: article.content,
          expanded: false,
        }));

        setArticles(formatted);
      });
  }, [selectedStock]);

  function toggleArticle(id) {
    setArticles((prev) =>
      prev.map((article) =>
        article.id === id
          ? { ...article, expanded: !article.expanded }
          : article
      )
    );
  }

  return (
    <div className="h-full overflow-y-auto p-3 bg-gray-50">
      <h2 className="text-lg font-bold mb-4">{selectedStock} News</h2>

      <div className="space-y-3">
        {articles.map((article) => (
          <div
            key={article.id}
            className="bg-white border border-gray-300 rounded-lg shadow-sm"
          >
            <button
              onClick={() => toggleArticle(article.id)}
              className="w-full text-left p-3 hover:bg-gray-100 transition"
            >
              <div className="font-semibold text-sm">{article.title}</div>

              <div className="text-xs text-gray-500 mt-1">{article.date}</div>
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