import { useEffect, useState } from 'react'

interface NewsItem {
  Title: string
  Date: string
  content: string
}

const API_URL = 'http://localhost:8000'

export default function NewsList({ ticker }: { ticker: string }) {
  const [newsList, setNewsList] = useState<NewsItem[]>([])
  const [expanded, setExpanded] = useState<number | null>(null)

  useEffect(() => {
    if (!ticker) return
    setExpanded(null)
    fetch(`${API_URL}/stocknews/${ticker}`)
      .then(res => res.json())
      .then(data => setNewsList(data))
      .catch(err => {
        console.error('failed to fetch news:', err)
        setNewsList([])
      })
  }, [ticker])

  if (!newsList.length) return <p className="p-4 text-gray-400">No news available.</p>

  return (
    <div className="p-2">
      {newsList.map((item, i) => (
        <div
          key={i}
          className="border-b border-gray-200 py-2 cursor-pointer"
          onClick={() => setExpanded(expanded === i ? null : i)}
        >
          <div className="font-medium text-sm">{item.Title || '(no title)'}</div>
          <div className="text-xs text-gray-500 mt-1">{item.Date}</div>
          {expanded === i && (
            <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {item.content}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
