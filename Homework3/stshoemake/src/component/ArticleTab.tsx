import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";
import { isEmpty } from 'lodash';

import Filenames from '../../data/stocknews/filenames.json'

const dataLocation = "../../data/stocknews";

export function ArticleTab() {

  // ----------> Instance Variables <----------
  // Ref for outer HTML object
  const containerRef = useRef<HTMLDivElement>(null);
  // State for Article Titles
  const [titles, setTitles] = useState<string[]>([]);
  // State for Article Content
  const [articleIndex, setArticleIndex] = useState<number>(-1);
  const [articleContent, setArticleContent] = useState<string[]>([]);

  // Easier to work with typing it like this
  const filenameDict: Record<string, string[]> = Filenames as Record<string, string[]>;




  // ----------> Draw: Retrieve Article Content (if relevant) <----------
  if (articleIndex != -1 && isEmpty(articleContent)) {
    const categorySelect = d3.select('#bar-select');
    const ticker = categorySelect.property('value');
    const articleTitle = filenameDict[ticker][articleIndex];

    d3.text(dataLocation + '/' + ticker + '/' + articleTitle)
      .then((text: string) => {
        let textArray: string[] = text.split(/\n+/);
        const headerData = textArray.slice(0, 3);
        textArray = textArray.slice(3);
        textArray = textArray.filter((paragraph: string) => paragraph != "Oops, something went wrong");
        textArray.unshift(findDate(headerData));
        setArticleContent(textArray);
      })
      .catch(err => {
        console.error(err);
        setArticleContent(["", "Error loading content for this aricle"]);
      });
  }

  useEffect(() => {
    // NOTE: This should always be called after mount, but it'll completely break if this is the case
    if (!containerRef.current) return;

    const categorySelect = d3.select('#bar-select');

    // ----------> Handle: Changing Selected ticker <----------
    // Get initial ticker
    const initialSelected = categorySelect.property('value');
    setTitles(filenameDict[initialSelected] ?? []);

    // Get ticker when changed
    categorySelect
      .on('change.second', function(event) {
        const ticker = event.target.value;
        setTitles(filenameDict[ticker] ?? []);
        setArticleIndex(-1);
        setArticleContent([]);
      });

    return;
  }, []);

  

  /* --- No Existing Articles View --- */
  if (isEmpty(titles)) {
    return (
      <div className="grid auto-rows-fr h-full w-full" ref={containerRef}>
        <div className="text-center"> No articles to display for current ticker.</div>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full" style={{ width: '100%', height: '100%' }} ref={containerRef}>
      {(articleIndex == -1) 
        /* --- All Articles View --- */
        ? <div className="h-full flex flex-col overflow-y-auto">
          {titles.map((text, index) => (
            // Background color is slate-300, the webpage itself uses slate-200
            <div className="max-h-[100px] flex-shrink-0 text-xl font-bold p-2 m-2 overflow-hidden line-clamp-3 border rounded-sm bg-slate-300 hover:bg-slate-100 cursor-pointer" 
              key={index} onClick={_ => setArticleIndex(index)}> 
              {cleanTitle(text)}
            </div>
          ))}
        </div>
        /* --- One Article View --- */
        : <div className="h-full flex flex-col overflow-y-auto">
          <div className="text-xl font-bold p-2 m-2 border rounded-sm bg-slate-300 hover:bg-slate-100 cursor-pointer" 
            onClick={_ => {setArticleIndex(-1); setArticleContent([])}}> 
            {cleanTitle(titles[articleIndex])}
          </div>
            <div className="p-1 font-bold" key={-1}> {articleContent[0]} </div>
          {articleContent.slice(1).map((text, index) => (
            <div className="p-1" key={index}> {text} </div>
          ))}
        </div>
      }
    </div>
  );
}

function cleanTitle(title: string): string {
  return title
    .replace(/^[\d_\- ]+/, "") // Replace date / whitespace at string start
    .replace(/\.txt$/, ""); // Replace stock extension at string end
}

function findDate(headers: string[]): string {
  const dateHeader = headers.find(header => header.startsWith('Date'))
  return dateHeader
    ? dateHeader
    : '(Article is undated)'
}