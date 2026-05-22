import { useEffect, useRef, useState } from 'react';
import { debounce } from 'lodash';

export function NewsList({ selectedStock }) {
  const containerRef = useRef(null);
  const [articles, setArticles] = useState([]);
  const [expandedIndex, setExpandedIndex] = useState(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(
      debounce((entries) => {
        for (const entry of entries) {
          if (entry.target !== containerRef.current) continue;
        }
      }, 100)
    );

    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    setExpandedIndex(null);
    setArticles([]);

    fetch(`http://localhost:8000/stocknews/?stock_name=${selectedStock}`)
      .then(res => res.json())
      .then(data => {
        const results = data.map(item => ({
          title: item.Title,
          date: item.Date,
          content: item.content,
        }));
        results.sort((a, b) => b.date.localeCompare(a.date));
        setArticles(results);
      })
      .catch(err => console.warn('News load error:', err));
  }, [selectedStock]);

  const toggleExpand = (index) => {
    setExpandedIndex(prev => prev === index ? null : index);
  };

  return (
    <div
      className="chart-container d-flex"
      ref={containerRef}
      style={{ width: '100%', height: '100%' }}
    >
      <div style={{ width: '100%', height: '100%', overflowY: 'auto', padding: '8px' }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 'bold' }}>
          News for {selectedStock} ({articles.length} articles)
        </h4>
        {articles.length === 0 && (
          <p style={{ color: '#888', fontSize: '13px' }}>No news found for {selectedStock}.</p>
        )}
        {articles.map((article, i) => (
          <div
            key={i}
            onClick={() => toggleExpand(i)}
            style={{
              marginBottom: '8px',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '6px',
              cursor: 'pointer',
              backgroundColor: expandedIndex === i ? '#e8f0fe' : '#fff',
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a1a' }}>
              {article.title}
            </div>
            <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
              {article.date}
            </div>
            {expandedIndex === i && (
              <div style={{
                marginTop: '8px',
                fontSize: '12px',
                color: '#333',
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap',
                borderTop: '1px solid #ddd',
                paddingTop: '8px'
              }}>
                {article.content}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
