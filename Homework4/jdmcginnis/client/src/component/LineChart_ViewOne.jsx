import * as d3 from "d3"
import { useEffect, useRef } from "react";


const margins = { left: 50, right: 80, top: 20, bottom: 35 };

// Once data for a ticker is loaded, we save it here to quickly load it again in the future
const cache = {};

// ticker <string>: name of ticker; ex: 'AAPL'
function loadTickerData(ticker, onLoadedCallback) {

    // If it was previously loaded (ticker was previously selected)
    if (cache[ticker]) {
        onLoadedCallback(cache[ticker]);
        return;
    }

    // If it is not in the cache (not previously loaded)
    // https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
    const url = `http://localhost:8000/stock/${ticker}`
    fetch(url)
        .then(res => res.json())
        .then(data => {
            const parsedData = data.date
                .map((date, i) => ({
                    date: new Date(date),
                    open: data.Open[i],
                    high: data.High[i],
                    low: data.Low[i],
                    close: data.Close[i],
                }));

            // Save to cache
            cache[ticker] = parsedData
            onLoadedCallback(parsedData)
        });
}


export default function LineChart({ticker}) {

    // holds the reference for the svg element in browser
    // we put it here because we require it in our nested function
    const svgRef = useRef(null);


    // Given 'data' for a ticker, generate the line graph
    function generateLineChart(data) {

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
            .attr("id", "chart-area")
            .append("rect")
            .attr("width", width)
            .attr("height", height);

        // 'g' is a group element in SVG
        // position start of group element according to margins
        const groupElement = svg.append("g")
            .attr("transform",`translate(${margins.left},${margins.top})`);

        // We first have to scale our axes before we draw them
        const xScale = d3.scaleTime()
            .domain(d3.extent(data, d => d.date))
            .range([0, width]);
        const yScale = d3.scaleLinear()
            .domain([
                // we get the min and max of all columns of our data (open, high, low, and close prices)
                d3.min(data, d => Math.min(d.open, d.high, d.low, d.close)),
                d3.max(data, d => Math.max(d.open, d.high, d.low, d.close)),
            ])
            .nice() // rounding to whole numbers
            .range([height, 0]);

        // now we can position and draw the x-axis
        //   - (save x-axis into variable so we can horizontally zoom)
        const xAxisGroup = groupElement.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(xScale));

        // position and draw y-axis
        groupElement.append("g")
            .call(d3.axisLeft(yScale));

        // handling dynamic x-axis labels (while zooming)
        groupElement.append("text")
            .attr("x", width/2)
            .attr("y", height + margins.bottom - 5)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .text("Date");

        // handling y-axis labels
        groupElement.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -margins.left + 12)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .text("Price (USD)");

        // Each feature -> color
        const features = [
            {key: "open", color: "blue"},
            {key: "close", color: "purple"},
            {key: "high", color: "green"},
            {key: "low", color: "red"},
        ];

        // Group element containing lines
        const linesGroup = groupElement.append("g")
            .attr("clip-path", "url(#chart-area)");

        // Handle plotting each line & creating a legend
        features.forEach(({key, color}, i) => {
            linesGroup.append("path")
                .datum(data)
                .attr("fill", "none")
                .attr("stroke", color)
                .attr("stroke-width", 2)
                .attr("d", d3.line()
                    .x(d => xScale(d.date))
                    .y(d => yScale(d[key]))
                );

            // Legend logic
            const legendGroup = svg.append("g")
                .attr("transform", `translate(${trueWidth - margins.right + 12}, ${margins.top + i * 24})`);

            // for a colored line in the legend
            legendGroup.append("line")
                .attr("x1", 0).attr("x2", 20)
                .attr("stroke", color).attr("stroke-width", 3);
            legendGroup.append("text")
                .attr("x", 25).attr("y", 5)
                .style("font-size", "12px")
                .text(key.charAt(0).toUpperCase() + key.slice(1));
        });

        // we zoomin' (https://www.d3indepth.com/zoom-and-pan/)
        function handleZoom(e) {
            const newXScale = e.transform.rescaleX(xScale);

            xAxisGroup.call(d3.axisBottom(newXScale));

            linesGroup.selectAll("path")
                .attr("d", function(d, i) {
                    return d3.line()
                        .x(p => newXScale(p.date))
                        .y(p => yScale(p[features[i].key]))(d);
                })
        }

        const zoom = d3.zoom()
            .scaleExtent([1, 20])
            .translateExtent([[0,0], [width*1.25, height*1.25]])
            .on("zoom", handleZoom);

        svg.call(zoom);

    }

    // Whenever the ticker selection changes (from the webapp), do this
        // First argument: code you want to run
        // Second argument: what useEffect responds to
    useEffect(
        () => { loadTickerData(ticker, generateLineChart); },
        [ticker]);

    // returns what gets displayed on the page
    return(
        <svg ref = {svgRef} style = {{ width: "100%", height: "100%"}} />
    );
}