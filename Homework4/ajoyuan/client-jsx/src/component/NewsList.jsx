import { useState, useEffect } from "react";

export function NewsList({ selectedStock }) {
  const [newsItems, setNewsItems] = useState([]);
  const [expandedIndex, setExpandedIndex] = useState(null);

  useEffect(() => {
    setExpandedIndex(null);
    fetch(`http://localhost:8000/stocknews?stock_name=${selectedStock}`)
    
      .then(res => res.json())
      .then(data => setNewsItems(data));
  }, [selectedStock]);

  return (
    <div style={{ padding: '15px', height: '100%', overflowY: 'auto' }}>
      
      {newsItems.map((item, index) => (
        <div key={index} style={{ border: '2px solid #000', borderRadius: '10px', marginBottom: '15px' }}>
          
          <div 
            onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
            style={{ padding: '15px', cursor: 'pointer', backgroundColor: '#ffffff', borderRadius: '10px' }}
          >
            <h4 style={{ margin: '0' }}>{item.title}</h4>
            <p style={{ margin: '5px 0', fontSize: '14px', color: '#ffffff' }}>{item.date}</p>
            
            <div style={{ textAlign: 'center', fontSize: '12px' }}>
              {expandedIndex === index ? "Close" : "Click to Read"}
            </div>
          </div>

          {expandedIndex === index && (
            <div style={{ padding: '15px', borderTop: '1px solid #000' }}>
              <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                {item.content}
              </p>
            </div>
          )}

        </div>
      ))}

    </div>
  );
}