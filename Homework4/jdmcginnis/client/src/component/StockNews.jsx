import { useEffect, useState } from "react";



// Loads the news articles for the specified ticker
function loadTickerNews(ticker, onLoadedCallback) {

    // Prevents crashing when initially loaded and no ticker is selected
    if (!ticker)
        return

    const url = `http://localhost:8000/stocknews/?stock_name=${ticker}`
    fetch(url)
        .then(res => res.json())
        .then(data => {
            const parsedData = data.News
                .map(news => ({
                    title: news.Title,
                    date: news.Date,
                    content: news.content
                        .split("\n") // preserve the '\n'
                        .filter(line => line.trim() !== "")
                }));
            onLoadedCallback(parsedData)
        });
}





export default function StockNews( {selectedTicker}) {

    // https://react.dev/reference/react/useState
    // [current state, set function]
    const [articles, setArticles] = useState([]);
    const [expandedArticle, setExpandedArticle] = useState(null);


    function displayNews(data) {
        setArticles(data);
        setExpandedArticle(null);
    }

    // we want to expand an article if it's clicked, and minimize it if it's clicked again
    function handleArticleExpansion(articleInd) {
        if (expandedArticle === articleInd)
            setExpandedArticle(null)
        else
            setExpandedArticle(articleInd);
    }

    function renderArticles() {

        // Before any ticker is selected:
        if (!selectedTicker) {
            return <p> No Ticker Selected! </p>;
        }

        if (articles.length === 0) {
            return <p> No Articles Found! </p>
        }

        return (
            // horizontal full expansion; fills up vertical space and allows for scrolling to see what doesn't fit
            <div className="h-full overflow-y-auto">

                {/*each article will have its own <div>*/}
                {articles.map((article, index) => (
                    <div
                        className="cursor-pointer border p-2 mb-2 rounded"
                        key={index}
                        onClick={() => handleArticleExpansion(index)}
                    >

                        {/*Article title/preview/header*/}
                        <div>
                            <p className= "font-semibold">
                                {article.title}
                            </p>
                            <p className="mb-2">
                                {article.date}
                            </p>
                        </div>

                        {/*Article content/body*/}
                        {expandedArticle === index && (
                            <div>
                                {article.content.map((paragraph, ind) => (
                                    <p key={ind} className="mx-2 mt-2 mb-2">
                                        {paragraph}
                                    </p>
                                ))}
                            </div>
                        )}

                    </div>
                ))}


            </div>
        );

    }







    // When a ticker is selected, do this:
    useEffect(
        () => {loadTickerNews(selectedTicker, displayNews);},
        [selectedTicker]);


    return renderArticles();

}