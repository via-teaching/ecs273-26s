// For parsing csv files
import Papa from "papaparse"
import * as d3 from "d3"
import { useEffect, useRef } from "react";

const margins = { left: 50, right: 80, top: 20, bottom: 40 };

const tickerDataOrder = [
    'XOM', 'CVX', 'HAL', 'MMM', 'CAT',
    'DAL', 'MCD', 'NKE', 'KO', 'JNJ',
    'PFE', 'UNH', 'JPM', 'GS', 'BAC',
    'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META'
];

const tickerSectors = {
    Energy: ["XOM", "CVX", "HAL"],
    Industrial: ["MMM", "CAT", "DAL"],
    Staples: ["MCD", "NKE", "KO"],
    Healthcare: ["JNJ", "PFE", "UNH"],
    Financial: ["JPM", "GS", "BAC"],
    Technology: ["AAPL", "MSFT", "NVDA", "GOOGL", "META"]
};

const sectorColor = d3.scaleOrdinal()
    .domain(Object.keys(tickerSectors))
    .range(d3.schemeCategory10);

// So we can match each ticker with its sector
function fetchSector(ticker) {

    const sectors = Object.keys(tickerSectors);

    for (let i = 0; i < sectors.length; i++) {
        const sector = sectors[i];
        const tickers = tickerSectors[sector];

        for (let j = 0; j < tickers.length; j++) {
            if (tickers[j] == ticker)
                return sector
        }
    }
}

function loadScatterData(onLoadedCallback) {

    // If it is not in the cache (not previously loaded)
     fetch(`../../data/tsne.csv`)
        .then(res => res.text())
        .then(text => {
            const {data} = Papa.parse(text, {header: false});
            const parsedData = data
                .filter(row => row[0] && row[1])
                .map((row, i) => ({
                    dimension1: +row[0],
                    dimension2: +row[1],
                    ticker: tickerDataOrder[i],
                }));

            onLoadedCallback(parsedData)
        });
}


export default function ScatterPlot({selectedTicker}) {

    const svgRef = useRef(null);

    function generateScatterPlot(data) {

        // giving d3 access to our svg element
        const svg = d3.select(svgRef.current);

        // clear out everything in svg element before we plot anything
        svg.selectAll("*").remove();

        // Fetching element/section dimensions
        const trueWidth = svgRef.current.clientWidth;
        const trueHeight = svgRef.current.clientHeight;

        // Applying margins for that visual appeal
        const width = trueWidth - margins.left - margins.right;
        const height = trueHeight - margins.top - margins.bottom;

        svg.append("defs").append("clipPath")
            .attr("id", "scatter-area")
            .append("rect")
            .attr("width", width)
            .attr("height", height);


        // 'g' is a group element in SVG
        // position start of group element according to margins
        const groupElement = svg.append("g")
            .attr("transform",`translate(${margins.left},${margins.top})`);

        // We first have to scale our axes before we draw them
        const xScale = d3.scaleLinear()
            .domain(d3.extent(data, d => d.dimension1))
            .nice()
            .range([0, width]);
        const yScale = d3.scaleLinear()
            .domain(d3.extent(data, d => d.dimension2))
            .nice() // rounding to whole numbers
            .range([height, 0]);

        // handle x and y axes (saving into a variable allows for zooming)
        const xAxisGroup = groupElement.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(xScale));
        const yAxisGroup = groupElement.append("g")
            .call(d3.axisLeft(yScale));

        // handling dynamic x-axis labels
        groupElement.append("text")
            .attr("x", width/2)
            .attr("y", height + margins.bottom - 5)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .text("Dimension One");

        // handling dynamic y-axis labels
        groupElement.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -margins.left + 12)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .text("Dimension Two");

        // Group element containing dots on our ScatterPlot
        const pointsGroup = groupElement.append("g")
            .attr("clip-path", "url(#scatter-area)");

        pointsGroup.selectAll("circle")
            .data(data)
            .join("circle")
            .attr("cx", d => xScale(d.dimension1))
            .attr("cy", d => yScale(d.dimension2))
            .attr("r", 5)
            .attr("fill", d => sectorColor(fetchSector(d.ticker)))

        // Create our legend; one color per sector
        const sectors = Object.keys(tickerSectors);
        for (let i = 0; i < sectors.length; i++) {
            const sector = sectors[i];

            const legendGroup = svg.append("g")
                .attr("transform", `translate(${trueWidth - margins.right},${margins.top + i * 25})`);

            legendGroup.append("circle")
                .attr("r", 3)
                .attr("fill", sectorColor(sector));

            legendGroup.append("text")
                .attr("x", 12)
                .attr("y", 5)
                .style("font-size", "12px")
                .text(sector);
        }

        // we zoomin' (https://www.d3indepth.com/zoom-and-pan/)
        function handleZoom(e) {
            const newXScale = e.transform.rescaleX(xScale);
            const newYScale = e.transform.rescaleY(yScale);

            xAxisGroup.call(d3.axisBottom(newXScale));
            yAxisGroup.call(d3.axisLeft(newYScale));

            pointsGroup.selectAll("circle")
                .attr("cx", d => newXScale(d.dimension1))
                .attr("cy", d => newYScale(d.dimension2));

            pointsGroup.selectAll(".ticker-label")
                .attr("x", d => newXScale(d.dimension1) + 10)
                .attr("y", d => newYScale(d.dimension2) + 5);
        }



        const zoom = d3.zoom()
            .scaleExtent([1, 20])
            .translateExtent([[-width*0.1, -height*0.1], [width*1.25, height*1.25]])
            .on("zoom", handleZoom);

        svg.call(zoom);

    }

    // When a ticker is selected, we will make the corresponding circle/point/dot larger and display its label
    function displayTickerInfo() {

        // svg element contains the circles for each of the tickers
        const svg = d3.select(svgRef.current);

        // Reset everything (so we don't have to keep track of previous selections)
        svg.selectAll("circle")
            .attr("r", 5)
        svg.selectAll(".ticker-label")
            .remove();

        // Make circle larger & add label
        svg.selectAll("circle")
            .filter(d => d && d.ticker == selectedTicker)
            .attr("r", 8)

            // Apply the following to the filtered circle (point on ScatterPlot)
            .each(function(d) {

                // Fetch position of selected circle & convert to an integer
                const circleXPos = + d3.select(this).attr("cx");
                const circleYPos = + d3.select(this).attr("cy");

                // Make larger and add text label
                d3.select(this.parentNode)
                    .append("text")
                    .attr("class", "ticker-label")
                    .datum(d)
                    .attr("x", circleXPos + 10)
                    .attr("y", circleYPos + 5)
                    .style("font-size", "12px")
                    .style("font-weight", "bold")
                    .text(selectedTicker);
            });


    }

        // We generate/load the ScatterPlot at the very beginning
    useEffect(
        () => { loadScatterData(generateScatterPlot); },
        []);

    // When the user selects a different ticker, we make visual changes to the corresponding circle
    useEffect(
        () => {displayTickerInfo()},
        [selectedTicker]
    );


    // returns what gets displayed on the page
    return(
        <svg ref = {svgRef} style = {{ width: "100%", height: "100%"}} />
    );

}