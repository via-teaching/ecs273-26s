import { useEffect, useState } from "react";



// Loads the news articles for the specified ticker
function loadTickerNews(ticker, onLoadedCallback) {

    // Prevents crashing when initially loaded and no ticker is selected
    if (!ticker)
        return

    // Get the JSON file (tickernews.json) for the specified ticker
    //      - this JSON file contains the filenames for each .txt file under the appropriate ticker folder
    fetch(`../../data/stocknews/${ticker}/tickernews.json`)
        .then(response => response.json())
        .then(filenames => {

            // Parse through each txt file referred to by tickernews.json
            const articles = [];
            let numLoaded = 0;
            for (let i = 0; i < filenames.length; i++) {

                // Get the .json file we are referring to
                fetch(`../../data/stocknews/${ticker}/${encodeURIComponent(filenames[i])}`)
                    .then(response => response.text())
                    .then(text => {

                        // Trim whitespace/blank lines
                        const allLines = text.split("\n");
                        const lines = [];

                        // Go line-by-line and trim/ignore any blank entries
                        for (let j = 0; j < allLines.length; j++) {
                            if (allLines[j].trim() !== "") {
                                lines.push(allLines[j]);
                            }
                        }

                        // Once the article is parsed through and edited appropriately, save it
                        articles.push( {
                            title: lines[0],
                            date: lines[1],
                            content: lines.slice(2),
                        });

                        numLoaded++;

                        // If we are all done parsing through the saved articles
                        if (numLoaded === filenames.length) {
                            onLoadedCallback(articles);
                        }
                    });

            }
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
                                    <p key={ind} className="mx-2 mb-2">
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