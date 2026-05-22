import { useEffect, useState } from "react";

export default function NewsList({ selectedStock }) {
  const [news, setNews] = useState([]);
  const [expandedIndex, setExpandedIndex] = useState(null);

  useEffect(() => {
    if (!selectedStock) return;

    fetch(`http://localhost:8000/stocknews/?stock_name=${selectedStock}`)
      .then((res) => res.json())
      .then((data) => {
        setNews(data);
        setExpandedIndex(null);
      })
      .catch((err) => {
        console.error("Error fetching news:", err);
        setNews([]);
      });
  }, [selectedStock]);

  return (
    <div className="space-y-3 max-h-[760px] overflow-y-auto">
      {news.map((item, index) => (
        <div
          key={item._id || index}
          className="border rounded p-3 cursor-pointer hover:bg-slate-50"
          onClick={() =>
            setExpandedIndex(expandedIndex === index ? null : index)
          }
        >
          <h3 className="font-semibold">
            {item.Title}
          </h3>

          <p className="text-sm text-gray-500">
            {item.Date}
          </p>

          {expandedIndex === index && (
            <p className="mt-2 text-sm whitespace-pre-wrap">
              {item.content}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}