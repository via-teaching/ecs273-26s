import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";
import { isEmpty } from 'lodash';
import { NewsArticle, TIMEOUT_INTERVAL } from './../types'

export function ArticleTab() {

  // ----------> Instance Variables <----------
  // Ref for outer HTML object
  const containerRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  useEffect(() => {
    // NOTE: This should always be called after mount, but it'll completely break if this is the case
    if (!containerRef.current) return;

    const categorySelect = d3.select('#bar-select');

    let timeout: number;
    const fetchData = (ticker: string) => {
      fetch(`http://localhost:8000/stocknews/${ticker}`)
        .then(res => res.json())
        .then(data => data['News'])
        .then((data: any) => {
          const newsData = cleanNewsArticles(data);
          
          setArticles(newsData);
          setLoading(false);
        })
        .catch(_ => {
          console.log('Failed to fetch Article Data. Retrying in 3s...');
          timeout = setTimeout(() => fetchData(ticker), TIMEOUT_INTERVAL)
        });
    }

    // ----------> Handle: From Initial Ticker <----------
    const initialSelected = categorySelect.property('value');
    fetchData(initialSelected);


    // ----------> Handle: Changing Selected ticker <----------
    // Get ticker when changed
    categorySelect
      .on('change.second', function(event) {
        // Prevent data from getting set from previous loads
        clearTimeout(timeout);
        // Update the UI to reflect loading state
        setLoading(true);
        setSelectedArticle(null);
        // Gather new data and update UI when recieved
        const ticker = event.target.value;
        fetchData(ticker);
      });

    return () => clearTimeout(timeout);
  }, []);

  

  /* --- No Existing Articles View --- */
  if (loading || isEmpty(articles)) {
    return (
      <div className="grid auto-rows-fr h-full w-full" ref={containerRef}>
        {loading
          ? <div className="text-center"> Loading... </div>
          : <div className="text-center"> No articles to display for current ticker.</div>
        }
      </div>
    )
  }

  return (
    <div className="flex h-full w-full" style={{ width: '100%', height: '100%' }} ref={containerRef}>
      {(selectedArticle == null) 
        /* --- All Articles View --- */
        ? <div className="h-full flex flex-col overflow-y-auto">
          {articles.map((article: NewsArticle, index: number) => (
            // Background color is slate-300, the webpage itself uses slate-200
            <div className="max-h-[100px] flex-shrink-0 text-xl font-bold p-2 m-2 overflow-hidden line-clamp-3 border rounded-sm bg-slate-300 hover:bg-slate-100 cursor-pointer" 
              key={index} onClick={_ => setSelectedArticle(article)}> 
              {article.title}
            </div>
          ))}
        </div>
        /* --- One Article View --- */
        : <div className="h-full flex flex-col overflow-y-auto">
          <div className="text-xl font-bold p-2 m-2 border rounded-sm bg-slate-300 hover:bg-slate-100 cursor-pointer" 
            onClick={_ => setSelectedArticle(null)}> 
            {selectedArticle.title}
          </div>
            <div className="p-1 font-bold"> {selectedArticle.date} </div>
            <div className="p-1"> {selectedArticle.content} </div>
        </div>
      }
    </div>
  );
}

// NOTE: This is not compatible with data pulled from static files, those use a completely different system
function cleanNewsArticles(rawData: any[]): NewsArticle[] {
  return rawData.map((newsData: any) => {
    return {
      date: newsData['Date'],
      title: newsData['Title'],
      content: newsData['content']
    }
  });
}