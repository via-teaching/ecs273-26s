import { useEffect, useRef, useState } from "react";

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

    fetch('/data/stocknews.generated.json')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(newsByTicker => {
        if (!isCurrent) return;
        setNewsItems(newsByTicker[selectedStock] || []);
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
        <div 
          key={item.fileName}
          className="news-item border-b border-gray-200 last:border-b-0"
          style={{ marginBottom: '0.5rem' }}
        >
          <div 
            onClick={() => toggleExpand(index)}
            className="cursor-pointer p-2 hover:bg-gray-50 rounded"
          >
            <h4 
              className="text-sm font-medium text-gray-800"
              style={{ 
                display: '-webkit-box',
                WebkitLineClamp: expandedItem === index ? 'none' : 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              {item.title}
            </h4>
            <p className="text-xs text-gray-500 mt-1">{item.date}</p>
          </div>
          
          {expandedItem === index && (
            <div className="p-2 pt-0 text-sm text-gray-600">
              <p className="whitespace-pre-wrap">{item.body}</p>
              {item.url && (
                <a 
                  href={item.url} 
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
      ))}
    </div>
  );
}
