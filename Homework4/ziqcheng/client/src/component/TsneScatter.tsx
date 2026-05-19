import { useEffect, useRef } from "react";
import * as d3 from "d3";

type TsnePoint = {
  ticker: string;
  x: number | string;
  y: number | string;
  sector?: string;
  Sector?: string;
  category?: string;
  Category?: string;
};

type TsneScatterProps = {
  data: TsnePoint[];
  selectedStock: string;
};

export default function TsneScatter({ data, selectedStock }: TsneScatterProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const width = 980;
    const height = 390;
    const margin = { top: 35, right: 140, bottom: 50, left: 60 };

    const parsedData = data
      .map((d) => ({
        ticker: d.ticker,
        x: Number(d.x),
        y: Number(d.y),
        sector: d.sector ?? d.Sector ?? d.category ?? d.Category ?? "Unknown",
      }))
      .filter((d) => !isNaN(d.x) && !isNaN(d.y));

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    if (parsedData.length === 0) return;

    const clipId = "tsne-clip";

    svg
    .append("defs")
    .append("clipPath")
    .attr("id", clipId)
    .append("rect")
    .attr("x", margin.left)
    .attr("y", margin.top)
    .attr("width", width - margin.left - margin.right)
    .attr("height", height - margin.top - margin.bottom);

    const xScale = d3
      .scaleLinear()
      .domain(d3.extent(parsedData, (d) => d.x) as [number, number])
      .nice()
      .range([margin.left, width - margin.right]);

    const yScale = d3
      .scaleLinear()
      .domain(d3.extent(parsedData, (d) => d.y) as [number, number])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const sectors = Array.from(new Set(parsedData.map((d) => d.sector)));

    const colorScale = d3
      .scaleOrdinal<string>()
      .domain(sectors)
      .range(d3.schemeCategory10);

    const xAxisGroup = svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`);

    const yAxisGroup = svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`);

    const plotGroup = svg
    .append("g")
    .attr("clip-path", `url(#${clipId})`);

    function draw(
      currentXScale: d3.ScaleLinear<number, number>,
      currentYScale: d3.ScaleLinear<number, number>
    ) {
      xAxisGroup.call(d3.axisBottom(currentXScale));
      yAxisGroup.call(d3.axisLeft(currentYScale));

      const circles = plotGroup.selectAll<SVGCircleElement, any>("circle").data(parsedData);

      circles
        .join("circle")
        .attr("cx", (d) => currentXScale(d.x))
        .attr("cy", (d) => currentYScale(d.y))
        .attr("r", (d) => (d.ticker === selectedStock ? 9 : 5))
        .attr("fill", (d) => colorScale(d.sector) as string)
        .attr("stroke", (d) => (d.ticker === selectedStock ? "black" : "none"))
        .attr("stroke-width", (d) => (d.ticker === selectedStock ? 3 : 0))
        .attr("opacity", 0.8);

      const labels = plotGroup.selectAll<SVGTextElement, any>(".ticker-label").data(parsedData);

      labels
        .join("text")
        .attr("class", "ticker-label")
        .attr("x", (d) => currentXScale(d.x) + 7)
        .attr("y", (d) => currentYScale(d.y) - 7)
        .attr("font-size", (d) => (d.ticker === selectedStock ? 14 : 11))
        .attr("font-weight", (d) => (d.ticker === selectedStock ? "bold" : "normal"))
        .text((d) => d.ticker);
    }

    draw(xScale, yScale);

    // Axis labels
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height - 8)
      .attr("text-anchor", "middle")
      .attr("font-size", 12)
      .text("t-SNE Dimension 1");

    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 15)
      .attr("text-anchor", "middle")
      .attr("font-size", 12)
      .text("t-SNE Dimension 2");

    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", 18)
      .attr("text-anchor", "middle")
      .attr("font-size", 14)
      .text("t-SNE Stock Projection");

    // Legend
    const legend = svg
      .append("g")
      .attr("transform", `translate(${width - margin.right + 20}, ${margin.top})`);

    sectors.forEach((sector, i) => {
      const row = legend.append("g").attr("transform", `translate(0, ${i * 20})`);

      row
        .append("circle")
        .attr("cx", 5)
        .attr("cy", 5)
        .attr("r", 5)
        .attr("fill", colorScale(sector) as string);

      row
        .append("text")
        .attr("x", 16)
        .attr("y", 9)
        .attr("font-size", 11)
        .text(sector);
    });

    // Zooming
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 10])
      .on("zoom", (event) => {
        const newXScale = event.transform.rescaleX(xScale);
        const newYScale = event.transform.rescaleY(yScale);
        draw(newXScale, newYScale);
      });
    const zoomRect = svg
        .append("rect")
        .attr("x", margin.left)
        .attr("y", margin.top)
        .attr("width", width - margin.left - margin.right)
        .attr("height", height - margin.top - margin.bottom)
        .attr("fill", "none")
        .attr("pointer-events", "all");
    zoomRect.call(zoom);

    svg.call(zoom);
  }, [data, selectedStock]);

  return (
  <div className="w-full h-full flex justify-center items-center overflow-hidden">
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      viewBox={`0 0 ${980} ${390}`}
      preserveAspectRatio="xMidYMid meet"
    ></svg>
  </div>
);
}