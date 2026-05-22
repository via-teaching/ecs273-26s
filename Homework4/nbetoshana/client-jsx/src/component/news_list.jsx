import { useEffect, useState } from "react";

export default function NewsList({ selectedStock }) {
  const [news, setNews] = useState([]);
  const [openIndex, setOpenIndex] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:8000/stocknews/?stock_name=${selectedStock}`)
      .then((res) => res.json())
      .then((data) => {
        setNews(data.News || []);
        setOpenIndex(data.News && data.News.length ? 0 : null);
      });
  }, [selectedStock]);

  // this will show a simple message if there is no news for the stock
  if (!news.length) {
    return (
      <p className="p-4 text-gray-400">
        No news available
      </p>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-2">

      {/* this will loop through all news articles for the selected stock */}
      {news.map((item, i) => (
        <div
          key={i}
          className="border-b py-2 cursor-pointer"
          onClick={() =>
            setOpenIndex(openIndex === i ? null : i)
          }
        >

          {/* this will show the article title preview */}
          <div className="font-medium text-sm">
            {item.Title}
          </div>

          {/* this will show the article date preview */}
          <div className="text-xs text-gray-500">
            {item.Date}
          </div>

          {/* this will expand and show full article content when clicked */}
          {openIndex === i && (
            <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
              {item.content}
            </div>
          )}

        </div>
      ))}

    </div>
  );
}