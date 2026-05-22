import { useState, useEffect } from 'react';

// Fetch news data for the given ticker from our backend API instead of csv files
const API_BASE = 'http://localhost:8000';
// function to fetch from API
async function fetchNews(ticker) {
    const response = await fetch(API_BASE + '/stocknews/?stock_name=' + ticker);
    if (!response.ok) return [];
    return await response.json();
}

// Option format is "AAPL (Apple Inc.)", take only the ticker symbol
function getTicker(selectValue) {
    return selectValue.split(' ')[0];
}

export function NewsList() {
    const [newsItems, setNewsItems] = useState([]);
    const [expandedIndex, setExpandedIndex] = useState(null);

    useEffect(function() {
        const select = document.getElementById('bar-select');
        if (!select) return;

        // Load news for the current ticker on first render
        const initialTicker = getTicker(select.value);
        fetchNews(initialTicker).then(function(data) {
            setNewsItems(data);
            setExpandedIndex(0);
        });

        // Reload when the user picks a different stock
        function handleChange(event) {
            const newTicker = getTicker(event.target.value);
            fetchNews(newTicker).then(function(data) {
                setNewsItems(data);
                setExpandedIndex(0);
            });
        }

        select.addEventListener('change', handleChange);
        return function() { select.removeEventListener('change', handleChange); };
    }, []);

    // Click a row to expand it; click again to collapse
    function toggleRow(index) {
        if (expandedIndex === index) {
            setExpandedIndex(null);
        } else {
            setExpandedIndex(index);
        }
    }

    return (
        <div style={{ height: '100%', overflowY: 'auto', padding: '0.5rem' }}>

            {newsItems.length === 0 && (
                <p className='text-center text-gray-400 mt-10'>No news found.</p>
            )}

            {newsItems.map(function(item, index) {
                return (
                    <div
                        key={index}
                        className='border-b border-gray-200 py-2 cursor-pointer hover:bg-gray-50'
                        onClick={function() { toggleRow(index); }}
                    >
                        {/* Title and date shown on every row */}
                        <div className='flex justify-between items-start gap-2'>
                            <span className='text-sm font-semibold text-gray-800 leading-snug'>
                                {item.Title}
                            </span>
                            <span className='text-xs text-gray-400 whitespace-nowrap shrink-0'>
                                {item.Date}
                            </span>
                        </div>

                        {/* Full article content shown only when this row is expanded */}
                        {expandedIndex === index && (
                            <p className='mt-2 text-xs text-gray-600 leading-relaxed whitespace-pre-wrap'>
                                {item.content}
                            </p>
                        )}
                    </div>
                );
            })}

        </div>
    );
}
