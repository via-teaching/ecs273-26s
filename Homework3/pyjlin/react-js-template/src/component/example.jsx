import * as d3 from "d3";
import { useEffect, useRef } from "react";
import { isEmpty, debounce } from "lodash";

const margin = { left: 60, right: 120, top: 30, bottom: 100 };

export function BarChart({ selectedStock }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !svgRef.current || !selectedStock) return;

    async function loadAndDraw(width, height) {
      try {
        const data = await d3.csv(`/data/stockdata/${selectedStock}.csv`, (d) => ({
          Date: new Date(d.Date),
          Open: +d.Open,
          High: +d.High,
          Low: +d.Low,
          Close: +d.Close,
        }));

        if (width && height && !isEmpty(data)) {
          drawChart(svgRef.current, data, width, height, selectedStock);
        }
      } catch (error) {
        console.error(`Failed to load ${selectedStock}.csv`, error);
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
  }, [selectedStock]);

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

  // Make the SVG wider when there are many data points.
  // This creates horizontal scrolling.
  const chartWidth = Math.max(width, data.length * 8);

  svg.attr("width", chartWidth).attr("height", height);

  const xScale = d3
    .scaleTime()
    .domain(d3.extent(data, (d) => d.Date))
    .range([margin.left, chartWidth - margin.right]);

  //const yScale = d3
  //  .scaleLinear()
  //  .domain([
  //    d3.min(data, (d) => d3.min(lineKeys, (key) => d[key])),
  //    d3.max(data, (d) => d3.max(lineKeys, (key) => d[key])),
  //  ])
  //  .nice()
  //  .range([height - margin.bottom, margin.top]);
  const yMin = d3.min(data, (d) => d3.min(lineKeys, (key) => d[key]));
  const yMax = d3.max(data, (d) => d3.max(lineKeys, (key) => d[key]));

  const yScale = d3
    .scaleLinear()
    .domain([yMin * 0.98, yMax * 1.02])
    .nice()
    .range([height - margin.bottom, margin.top]);
  const colorScale = d3
    .scaleOrdinal()
    .domain(lineKeys)
    .range(["steelblue", "orange", "green", "red"]);

  const xAxisGroup = svg
    .append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(
      d3.axisBottom(xScale)
        .ticks(d3.timeMonth.every(1))
        .tickFormat(d3.timeFormat("%b %Y"))
    );
  const yAxisGroup = svg
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

  const chartArea = svg.append("g");

  const lineGenerator = d3
    .line()
    .x((d) => xScale(d.Date))
    .y((d) => yScale(d.value));

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

  // Horizontal zooming
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
        d3.axisBottom(newXScale)
          .ticks(d3.timeMonth.every(1))
          .tickFormat(d3.timeFormat("%b %Y"))
      );

      chartArea.selectAll("path").remove();

      lineKeys.forEach((key) => {
        const lineData = data.map((d) => ({
          Date: d.Date,
          value: d[key],
        }));

        const zoomedLine = d3
          .line()
          .x((d) => newXScale(d.Date))
          .y((d) => yScale(d.value));

        chartArea
          .append("path")
          .datum(lineData)
          .attr("fill", "none")
          .attr("stroke", colorScale(key))
          .attr("stroke-width", 2)
          .attr("d", zoomedLine);
      });
    });

  svg.call(zoom);
  // Brush for horizontal zooming
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
        d3.axisBottom(xScale)
          .ticks(d3.timeMonth.every(1))
          .tickFormat(d3.timeFormat("%b %Y"))
      );

      chartArea.selectAll("path").remove();

      lineKeys.forEach((key) => {
        const lineData = data.map((d) => ({
          Date: d.Date,
          value: d[key],
        }));

        const newLine = d3
          .line()
          .x((d) => xScale(d.Date))
          .y((d) => yScale(d.value));

        chartArea
          .append("path")
          .datum(lineData)
          .attr("fill", "none")
          .attr("stroke", colorScale(key))
          .attr("stroke-width", 2)
          .attr("d", newLine);
      });
    });

  svg
    .append("g")
    .attr("class", "brush")
    .call(brush);
}