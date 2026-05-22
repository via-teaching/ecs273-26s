import * as d3 from "d3";
import { useEffect, useRef } from "react";
import { isEmpty, debounce } from "lodash";

const margin = { left: 60, right: 150, top: 30, bottom: 60 };

export function TSNEScatterPlot({ selectedStock }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !svgRef.current) return;

    async function loadAndDraw(width, height) {
      try {
        const data = await d3.csv("/data/tsne.csv", (d) => ({
          Ticker: d.Ticker,
          TSNE_1: Number(d.TSNE_1),
          TSNE_2: Number(d.TSNE_2),
          Sector: d.Sector,
        }));

        const cleanData = data.filter(
          (d) =>
            d.Ticker &&
            d.Sector &&
            !isNaN(d.TSNE_1) &&
            !isNaN(d.TSNE_2)
        );

        if (width && height && !isEmpty(cleanData)) {
          drawScatter(svgRef.current, cleanData, width, height, selectedStock);
        }
      } catch (error) {
        console.error("Failed to load tsne.csv", error);
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
    <div ref={containerRef} style={{ width: "100%", height: "100%" }}>
      <svg ref={svgRef} width="100%" height="100%"></svg>
    </div>
  );
}

function drawScatter(svgElement, data, width, height, selectedStock) {
  const svg = d3.select(svgElement);
  svg.selectAll("*").remove();

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const xScale = d3
    .scaleLinear()
    .domain(d3.extent(data, (d) => d.TSNE_1))
    .nice()
    .range([0, innerWidth]);

  const yScale = d3
    .scaleLinear()
    .domain(d3.extent(data, (d) => d.TSNE_2))
    .nice()
    .range([innerHeight, 0]);

  const sectors = [...new Set(data.map((d) => d.Sector))];

  const colorScale = d3
    .scaleOrdinal()
    .domain(sectors)
    .range(d3.schemeTableau10);

  svg
    .append("text")
    .attr("x", margin.left + innerWidth / 2)
    .attr("y", 20)
    .style("text-anchor", "middle")
    .style("font-weight", "bold")
    .text("t-SNE Scatter Plot");

  const chartGroup = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  const xAxisGroup = chartGroup
    .append("g")
    .attr("transform", `translate(0, ${innerHeight})`)
    .call(d3.axisBottom(xScale));

  const yAxisGroup = chartGroup
    .append("g")
    .call(d3.axisLeft(yScale));

  svg
    .append("text")
    .attr("x", margin.left + innerWidth / 2)
    .attr("y", height - 15)
    .style("text-anchor", "middle")
    .style("font-size", "0.8rem")
    .text("t-SNE Dimension 1");

  svg
    .append("text")
    .attr(
      "transform",
      `translate(18, ${margin.top + innerHeight / 2}) rotate(-90)`
    )
    .style("text-anchor", "middle")
    .style("font-size", "1rem")
    .text("t-SNE Dimension 2");

  const pointsGroup = chartGroup.append("g");

  function updatePoints(currentXScale, currentYScale) {
    pointsGroup
      .selectAll("circle")
      .data(data, (d) => d.Ticker)
      .join("circle")
      .attr("cx", (d) => currentXScale(d.TSNE_1))
      .attr("cy", (d) => currentYScale(d.TSNE_2))
      .attr("r", (d) => (d.Ticker === selectedStock ? 9 : 5))
      .attr("fill", (d) => colorScale(d.Sector))
      .attr("stroke", (d) => (d.Ticker === selectedStock ? "black" : "white"))
      .attr("stroke-width", (d) => (d.Ticker === selectedStock ? 2.5 : 1))
      .attr("opacity", 0.85);

    pointsGroup
      .selectAll("text.stock-label")
      .data(
        data.filter((d) => d.Ticker === selectedStock),
        (d) => d.Ticker
      )
      .join("text")
      .attr("class", "stock-label")
      .attr("x", (d) => currentXScale(d.TSNE_1) + 10)
      .attr("y", (d) => currentYScale(d.TSNE_2) - 10)
      .text((d) => d.Ticker)
      .style("font-size", "0.8rem")
      .style("font-weight", "bold");
  }

  updatePoints(xScale, yScale);

  const legend = svg
    .append("g")
    .attr("transform", `translate(${width - margin.right + 20}, ${margin.top})`);

  sectors.forEach((sector, index) => {
    const legendRow = legend
      .append("g")
      .attr("transform", `translate(0, ${index * 22})`);

    legendRow
      .append("circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", 5)
      .attr("fill", colorScale(sector));

    legendRow
      .append("text")
      .attr("x", 12)
      .attr("y", 5)
      .style("font-size", "0.75rem")
      .text(sector);
  });

  const zoom = d3
    .zoom()
    .scaleExtent([1, 12])
    .extent([
      [0, 0],
      [innerWidth, innerHeight],
    ])
    .translateExtent([
      [-innerWidth, -innerHeight],
      [innerWidth * 2, innerHeight * 2],
    ])
    .on("zoom", (event) => {
      const newXScale = event.transform.rescaleX(xScale);
      const newYScale = event.transform.rescaleY(yScale);

      xAxisGroup.call(d3.axisBottom(newXScale));
      yAxisGroup.call(d3.axisLeft(newYScale));

      updatePoints(newXScale, newYScale);
    });

  svg.call(zoom);
}