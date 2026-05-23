import { useEffect, useRef, useState } from "react";

const API_BASE = "http://localhost:8000";

export function NewsList({ selectedStock }) {
  const containerRef = useRef(null);
  const [newsItems, setNewsItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedItem, setExpandedItem] = useState(null);

  useEffect(() => {
    if (!selectedStock) return;
    let isCurrent = true;
    
    setLoading(true);
    setExpandedItem(null);

    fetch(`${API_BASE}/stocknews/${selectedStock}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (!isCurrent) return;
        setNewsItems(data.News || []);
        setLoading(false);
      })
      .catch(err => {
        if (!isCurrent) return;
        console.error(`Error loading news for ${selectedStock}:`, err);
        setNewsItems([]);
        setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [selectedStock]);

  const toggleExpand = (index) => {
    setExpandedItem(expandedItem === index ? null : index);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <p className="text-gray-500">Loading news...</p>
      </div>
    );
  }

  if (!selectedStock) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <p className="text-gray-500">Select a stock to view news</p>
      </div>
    );
  }

  if (newsItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <p className="text-gray-500">No news available for {selectedStock}</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="news-container" 
      style={{ 
        width: '100%', 
        height: '100%', 
        overflowY: 'auto',
        padding: '0.5rem'
      }}
    >
      {newsItems.map((item, index) => (
        <NewsItem
          key={item._id || item.fileName || index}
          item={item}
          isExpanded={expandedItem === index}
          onToggle={() => toggleExpand(index)}
        />
      ))}
    </div>
  );
}

function NewsItem({ item, isExpanded, onToggle }) {
  const body = getNewsBody(item);
  const url = getNewsUrl(item);

  return (
    <div 
      className="news-item border-b border-gray-200 last:border-b-0"
      style={{ marginBottom: '0.5rem' }}
    >
      <div 
        onClick={onToggle}
        className="cursor-pointer p-2 hover:bg-gray-50 rounded"
      >
        <h4 
          className="text-sm font-medium text-gray-800"
          style={{ 
            display: '-webkit-box',
            WebkitLineClamp: isExpanded ? 'none' : 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {item.Title}
        </h4>
        <p className="text-xs text-gray-500 mt-1">{item.Date}</p>
      </div>
      
      {isExpanded && (
        <div className="p-2 pt-0 text-sm text-gray-600">
          <p className="whitespace-pre-wrap">{body}</p>
          {url && (
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline text-xs mt-2 block"
            >
              Read more
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function getNewsBody(item) {
  return (item.content || "")
    .split("\n")
    .filter(line => !line.startsWith("Title:") && !line.startsWith("Date:") && !line.startsWith("URL:"))
    .join("\n")
    .trim();
}

function getNewsUrl(item) {
  if (item.url) return item.url;
  const urlLine = (item.content || "").split("\n").find(line => line.startsWith("URL:"));
  return urlLine ? urlLine.replace("URL:", "").trim() : "";
}
