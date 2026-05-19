import { useState } from "react";

type NewsItem = {
  _id?: string;
  title?: string;
  date?: string;
  content?: string;
  url?: string;
};

type NewsListProps = {
  data: NewsItem[];
  selectedStock: string;
};

export default function NewsList({ data, selectedStock }: NewsListProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <div className="p-3 overflow-y-auto h-full">
      <h4 className="text-lg font-semibold mb-3">{selectedStock} News</h4>

      {data.length === 0 ? (
        <p className="text-gray-500">No news found.</p>
      ) : (
        data.map((article, index) => {
          const expanded = expandedIndex === index;

          return (
            <div
              key={article._id ?? index}
              className="border-b border-gray-300 pb-3 mb-3 cursor-pointer"
              onClick={() => setExpandedIndex(expanded ? null : index)}
            >
              <h5 className="font-semibold text-sm">
                {article.title || "Untitled News"}
              </h5>

              {article.date && (
                <p className="text-xs text-gray-500 mt-1">{article.date}</p>
              )}

              <p className="text-sm mt-2">
                {expanded
                  ? article.content || "No content available."
                  : `${(article.content || "No content available.").slice(0, 220)}...`}
              </p>

              <p className="text-blue-600 text-sm mt-1">
                {expanded ? "Show less" : "Click to expand"}
              </p>

              {expanded && article.url && (
                <a
                  href={article.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 text-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  Read more
                </a>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}