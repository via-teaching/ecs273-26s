import * as d3 from "d3";
import { useEffect, useRef } from "react";
import { isEmpty, debounce } from "lodash";

const margin = { left: 60, right: 120, top: 30, bottom: 100 };

export function BarChart({ selectedStock, apiBase }) {
    const containerRef = useRef(null);
    const svgRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current || !svgRef.current || !selectedStock || !apiBase) return;

        async function loadAndDraw(width, height) {
            try {
                const response = await fetch(`${apiBase}/stock/${selectedStock}`);

                if (!response.ok) {
                    throw new Error(`Failed to fetch stock data for ${selectedStock}`);
                }

                const result = await response.json();

                const data = result.stock_series.map((d) => ({
                    Date: new Date(d.date),
                    Open: Number(d.Open),
                    High: Number(d.High),
                    Low: Number(d.Low),
                    Close: Number(d.Close),
                }));

                const cleanData = data.filter(
                    (d) =>
                        d.Date instanceof Date &&
                        !isNaN(d.Date) &&
                        !isNaN(d.Open) &&
                        !isNaN(d.High) &&
                        !isNaN(d.Low) &&
                        !isNaN(d.Close)
                );

                if (width && height && !isEmpty(cleanData)) {
                    drawChart(svgRef.current, cleanData, width, height, selectedStock);
                }
            } catch (error) {
                console.error(`Failed to load stock data for ${selectedStock}`, error);
            }
        }

        const resizeObserver = new ResizeObserver(
            debounce((entries) => {
                for (const entry of entries) {
                    if (entry.target !== containerRef.current) continue;

                    const { width, height } = entry.contentRect;

                    if (width && height) {
                        loadAndDraw(width, height);
                    }
                }
            }, 100)
        );

        resizeObserver.observe(containerRef.current);

        const { width, height } = containerRef.current.getBoundingClientRect();

        if (width && height) {
            loadAndDraw(width, height);
        }

        return () => resizeObserver.disconnect();
    }, [selectedStock, apiBase]);

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
            }}
        >
            <div
                className="chart-container d-flex"
                ref={containerRef}
                style={{
                    width: "100%",
                    height: "calc(100% - 28px)",
                    overflowX: "auto",
                    overflowY: "hidden",
                    marginBottom: "28px",
                }}
            >
                <svg ref={svgRef} height="100%"></svg>
            </div>

            <div
                style={{
                    position: "absolute",
                    top: "18px",
                    right: "18px",
                    backgroundColor: "white",
                    border: "1px solid #999",
                    borderRadius: "6px",
                    padding: "8px 12px",
                    fontSize: "1rem",
                    fontWeight: "bold",
                    zIndex: 10,
                    opacity: 0.95,
                }}
            >
                <div>
                    <span style={{ color: "steelblue", marginRight: "8px" }}>━</span>
                    Open
                </div>
                <div>
                    <span style={{ color: "orange", marginRight: "8px" }}>━</span>
                    High
                </div>
                <div>
                    <span style={{ color: "green", marginRight: "8px" }}>━</span>
                    Low
                </div>
                <div>
                    <span style={{ color: "red", marginRight: "8px" }}>━</span>
                    Close
                </div>
            </div>
        </div>
    );
}

function drawChart(svgElement, data, width, height, selectedStock) {
    const svg = d3.select(svgElement);
    svg.selectAll("*").remove();

    const lineKeys = ["Open", "High", "Low", "Close"];

    const chartWidth = Math.max(width, data.length * 8);

    svg.attr("width", chartWidth).attr("height", height);

    const xScale = d3
        .scaleTime()
        .domain(d3.extent(data, (d) => d.Date))
        .range([margin.left, chartWidth - margin.right]);

    const yMin = d3.min(data, (d) => d3.min(lineKeys, (key) => d[key]));
    const yMax = d3.max(data, (d) => d3.max(lineKeys, (key) => d[key]));

    const yScale = d3
        .scaleLinear()
        .domain([yMin * 0.98, yMax * 1.02])
        .nice()
        .range([height - margin.bottom, margin.top]);
    svg
        .append("defs")
        .append("clipPath")
        .attr("id", "line-chart-clip")
        .append("rect")
        .attr("x", margin.left)
        .attr("y", margin.top)
        .attr("width", chartWidth - margin.left - margin.right)
        .attr("height", height - margin.top - margin.bottom);
    const colorScale = d3
        .scaleOrdinal()
        .domain(lineKeys)
        .range(["steelblue", "orange", "green", "red"]);

    const xAxisGroup = svg
        .append("g")
        .attr("transform", `translate(0, ${height - margin.bottom})`)
        .call(
            d3
                .axisBottom(xScale)
                .ticks(d3.timeMonth.every(1))
                .tickFormat(d3.timeFormat("%b %Y"))
        );

    svg
        .append("g")
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(yScale));

    svg
        .append("text")
        .attr("x", chartWidth / 2)
        .attr("y", height - 10)
        .style("text-anchor", "middle")
        .style("font-size", "0.8rem")
        .text("Date");

    svg
        .append("text")
        .attr("transform", `translate(18, ${height / 2}) rotate(-90)`)
        .style("text-anchor", "middle")
        .style("font-size", "0.8rem")
        .text("Price");

    const chartArea = svg
        .append("g")
        .attr("clip-path", "url(#line-chart-clip)");

    const lineGenerator = d3
        .line()
        .x((d) => xScale(d.Date))
        .y((d) => yScale(d.value));

    function drawLines(currentXScale) {
        chartArea.selectAll("path").remove();

        lineKeys.forEach((key) => {
            const lineData = data.map((d) => ({
                Date: d.Date,
                value: d[key],
            }));

            const line = d3
                .line()
                .x((d) => currentXScale(d.Date))
                .y((d) => yScale(d.value));

            chartArea
                .append("path")
                .datum(lineData)
                .attr("fill", "none")
                .attr("stroke", colorScale(key))
                .attr("stroke-width", 2)
                .attr("d", line);
        });
    }

    lineKeys.forEach((key) => {
        const lineData = data.map((d) => ({
            Date: d.Date,
            value: d[key],
        }));

        chartArea
            .append("path")
            .datum(lineData)
            .attr("fill", "none")
            .attr("stroke", colorScale(key))
            .attr("stroke-width", 2)
            .attr("d", lineGenerator);
    });

    svg
        .append("text")
        .attr("x", chartWidth / 2)
        .attr("y", margin.top)
        .style("text-anchor", "middle")
        .style("font-weight", "bold")
        .text(`${selectedStock} Stock Overview`);

    const zoom = d3
        .zoom()
        .scaleExtent([1, 20])
        .translateExtent([
            [margin.left, 0],
            [chartWidth - margin.right, height],
        ])
        .extent([
            [margin.left, 0],
            [chartWidth - margin.right, height],
        ])
        .on("zoom", (event) => {
            const newXScale = event.transform.rescaleX(xScale);

            xAxisGroup.call(
                d3
                    .axisBottom(newXScale)
                    .ticks(d3.timeMonth.every(1))
                    .tickFormat(d3.timeFormat("%b %Y"))
            );

            drawLines(newXScale);
        });

    svg.call(zoom);

    const brushHeight = 25;

    const brush = d3
        .brushX()
        .extent([
            [margin.left, height - brushHeight - 5],
            [chartWidth - margin.right, height - 5],
        ])
        .on("end", (event) => {
            if (!event.selection) return;

            const [x0, x1] = event.selection;
            const newDomain = [xScale.invert(x0), xScale.invert(x1)];

            xScale.domain(newDomain);

            xAxisGroup.call(
                d3
                    .axisBottom(xScale)
                    .ticks(d3.timeMonth.every(1))
                    .tickFormat(d3.timeFormat("%b %Y"))
            );

            drawLines(xScale);
        });

    svg.append("g").attr("class", "brush").call(brush);
}