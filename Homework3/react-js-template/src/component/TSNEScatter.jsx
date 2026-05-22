import * as d3 from "d3";
import { useEffect, useMemo, useRef, useState } from "react";
import tsneCsv from "../../data/tsne.csv?raw";

const margin = { top: 24, right: 220, bottom: 56, left: 68 };
const xKey = "tsne_coord1";
const yKey = "tsne_coord2";

export default function TSNEScatter({ selectedStock }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  const tsneData = useMemo(() => {
    return d3
      .csvParse(tsneCsv, (row) => ({
        stock: row.stock,
        x: Number(row[xKey]),
        y: Number(row[yKey]),
        sector: row.sector,
      }))
      .filter(
        (row) =>
          row.stock &&
          row.sector &&
          Number.isFinite(row.x) &&
          Number.isFinite(row.y)
      );
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      const bounds = containerRef.current.getBoundingClientRect();
      setSize({
        width: Math.max(0, bounds.width),
        height: Math.max(0, bounds.height),
      });
    };

    updateSize();

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || !size.width || !size.height || !tsneData.length) {
      return;
    }

    drawScatter(svgRef.current, {
      tsneData,
      selectedStock,
      width: size.width,
      height: size.height,
    });
  }, [tsneData, selectedStock, size]);

  return (
    <div ref={containerRef} className="h-full w-full overflow-hidden">
      <svg
        ref={svgRef}
        className="block h-full w-full"
        role="img"
        aria-label="t-SNE scatter plot of stocks colored by sector"
      />
    </div>
  );
}

function drawScatter(svgElement, { tsneData, selectedStock, width, height }) {
  const svg = d3.select(svgElement);
  svg.selectAll("*").remove();
  svg.attr("viewBox", `0 0 ${width} ${height}`);

  const plotWidth = Math.max(1, width - margin.left - margin.right);
  const plotHeight = Math.max(1, height - margin.top - margin.bottom);
  const plotRight = margin.left + plotWidth;
  const plotBottom = margin.top + plotHeight;
  const sectors = Array.from(new Set(tsneData.map((row) => row.sector))).sort();
  const colorScale = d3
    .scaleOrdinal()
    .domain(sectors)
    .range(d3.schemeTableau10);

  const xExtent = d3.extent(tsneData, (row) => row.x);
  const yExtent = d3.extent(tsneData, (row) => row.y);
  const xPadding = (xExtent[1] - xExtent[0]) * 0.12 || 1;
  const yPadding = (yExtent[1] - yExtent[0]) * 0.12 || 1;

  const xScale = d3
    .scaleLinear()
    .domain([xExtent[0] - xPadding, xExtent[1] + xPadding])
    .nice()
    .range([margin.left, plotRight]);
  const yScale = d3
    .scaleLinear()
    .domain([yExtent[0] - yPadding, yExtent[1] + yPadding])
    .nice()
    .range([plotBottom, margin.top]);

  svg
    .append("clipPath")
    .attr("id", "tsne-scatter-clip")
    .append("rect")
    .attr("x", margin.left)
    .attr("y", margin.top)
    .attr("width", plotWidth)
    .attr("height", plotHeight);

  const gridGroup = svg.append("g").attr("class", "tsne-grid");
  const pointsGroup = svg
    .append("g")
    .attr("clip-path", "url(#tsne-scatter-clip)");
  const xAxisGroup = svg
    .append("g")
    .attr("transform", `translate(0, ${plotBottom})`);
  const yAxisGroup = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, 0)`);

  svg
    .append("text")
    .attr("x", margin.left + plotWidth / 2)
    .attr("y", height - 14)
    .attr("text-anchor", "middle")
    .attr("fill", "#111827")
    .style("font-size", "13px")
    .text("t-SNE coordinate 1");

  svg
    .append("text")
    .attr("transform", `translate(18, ${margin.top + plotHeight / 2}) rotate(-90)`)
    .attr("text-anchor", "middle")
    .attr("fill", "#111827")
    .style("font-size", "13px")
    .text("t-SNE coordinate 2");

  const pointNodes = pointsGroup
    .selectAll("g")
    .data(tsneData)
    .join("g")
    .attr("class", "tsne-point");

  pointNodes
    .append("circle")
    .attr("r", (row) => (row.stock === selectedStock ? 8 : 5))
    .attr("fill", (row) => colorScale(row.sector))
    .attr("stroke", (row) => (row.stock === selectedStock ? "#111827" : "#ffffff"))
    .attr("stroke-width", (row) => (row.stock === selectedStock ? 2.5 : 1.5))
    .attr("opacity", 0.92);

  pointNodes
    .filter((row) => row.stock === selectedStock)
    .append("text")
    .attr("x", 12)
    .attr("y", -10)
    .attr("paint-order", "stroke")
    .attr("stroke", "#ffffff")
    .attr("stroke-width", 4)
    .attr("fill", "#111827")
    .style("font-size", "13px")
    .style("font-weight", "700")
    .text((row) => row.stock);

  const legend = svg
    .append("g")
    .attr("transform", `translate(${plotRight + 24}, ${margin.top})`);

  legend
    .append("text")
    .attr("x", 0)
    .attr("y", 0)
    .attr("fill", "#111827")
    .style("font-size", "13px")
    .style("font-weight", "700")
    .text("Sector");

  const legendItems = legend
    .selectAll("g")
    .data(sectors)
    .join("g")
    .attr("transform", (_, index) => `translate(0, ${22 + index * 24})`);

  legendItems
    .append("circle")
    .attr("cx", 6)
    .attr("cy", 0)
    .attr("r", 5)
    .attr("fill", (sector) => colorScale(sector));

  legendItems
    .append("text")
    .attr("x", 18)
    .attr("y", 4)
    .attr("fill", "#111827")
    .style("font-size", "12px")
    .text((sector) => sector);

  function renderGrid(scaleX, scaleY) {
    gridGroup
      .selectAll(".x-grid")
      .data(scaleX.ticks(6))
      .join("line")
      .attr("class", "x-grid")
      .attr("x1", (tick) => scaleX(tick))
      .attr("x2", (tick) => scaleX(tick))
      .attr("y1", margin.top)
      .attr("y2", plotBottom)
      .attr("stroke", "#e5e7eb");

    gridGroup
      .selectAll(".y-grid")
      .data(scaleY.ticks(6))
      .join("line")
      .attr("class", "y-grid")
      .attr("x1", margin.left)
      .attr("x2", plotRight)
      .attr("y1", (tick) => scaleY(tick))
      .attr("y2", (tick) => scaleY(tick))
      .attr("stroke", "#e5e7eb");
  }

  function renderAxes(scaleX, scaleY) {
    xAxisGroup.call(d3.axisBottom(scaleX).ticks(6).tickSizeOuter(0));
    yAxisGroup
      .call(d3.axisLeft(scaleY).ticks(6).tickSizeOuter(0))
      .call((group) => group.select(".domain").remove());
  }

  function renderPoints(scaleX, scaleY) {
    pointNodes.attr(
      "transform",
      (row) => `translate(${scaleX(row.x)}, ${scaleY(row.y)})`
    );
  }

  function handleZoom(event) {
    const zoomedXScale = event.transform.rescaleX(xScale);
    const zoomedYScale = event.transform.rescaleY(yScale);

    renderAxes(zoomedXScale, zoomedYScale);
    renderGrid(zoomedXScale, zoomedYScale);
    renderPoints(zoomedXScale, zoomedYScale);
  }

  renderAxes(xScale, yScale);
  renderGrid(xScale, yScale);
  renderPoints(xScale, yScale);

  const zoom = d3
    .zoom()
    .scaleExtent([1, 10])
    .translateExtent([
      [margin.left, margin.top],
      [plotRight, plotBottom],
    ])
    .extent([
      [margin.left, margin.top],
      [plotRight, plotBottom],
    ])
    .on("zoom", handleZoom);

  svg
    .append("rect")
    .attr("x", margin.left)
    .attr("y", margin.top)
    .attr("width", plotWidth)
    .attr("height", plotHeight)
    .attr("fill", "transparent")
    .attr("cursor", "grab")
    .call(zoom);
}
