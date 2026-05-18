import * as d3 from "d3";
import { debounce, isEmpty } from "lodash";
import { useEffect, useMemo, useRef } from "react";

import tsneCsv from "../../data/tsne.csv?raw";
import { ComponentSize, Margin } from "../types";

interface TSNEPoint {
  ticker: string;
  x: number;
  y: number;
  category: string;
}

interface TSNEScatterProps {
  selectedStock: string;
}

const margin = { left: 56, right: 156, top: 28, bottom: 48 } as Margin;

export default function TSNEScatter({ selectedStock }: TSNEScatterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const points = useMemo(() => parseTSNECsv(tsneCsv), []);

  useEffect(() => {
    if (!containerRef.current || !svgRef.current || isEmpty(points)) return;

    const redraw = (size: ComponentSize) => {
      drawScatter(svgRef.current!, points, selectedStock, size.width, size.height);
    };

    const resizeObserver = new ResizeObserver(
      debounce((entries: ResizeObserverEntry[]) => {
        for (const entry of entries) {
          if (entry.target === containerRef.current) {
            redraw(entry.contentRect as ComponentSize);
          }
        }
      }, 100)
    );

    resizeObserver.observe(containerRef.current);

    const { width, height } = containerRef.current.getBoundingClientRect();
    redraw({ width, height });

    return () => resizeObserver.disconnect();
  }, [points, selectedStock]);

  return (
    <div ref={containerRef} className="h-full w-full">
      <svg ref={svgRef} className="h-full w-full" />
    </div>
  );
}

function parseTSNECsv(csv: string): TSNEPoint[] {
  return d3
    .csvParse(csv)
    .map((row) => ({
      ticker: row.ticker ?? "",
      x: Number(row.x),
      y: Number(row.y),
      category: row.category ?? "Unknown",
    }))
    .filter(
      (point) =>
        point.ticker.length > 0 &&
        Number.isFinite(point.x) &&
        Number.isFinite(point.y)
    );
}

function drawScatter(
  svgElement: SVGSVGElement,
  points: TSNEPoint[],
  selectedStock: string,
  width: number,
  height: number
) {
  const svg = d3.select(svgElement);
  const innerWidth = Math.max(width - margin.left - margin.right, 40);
  const innerHeight = Math.max(height - margin.top - margin.bottom, 40);

  svg.selectAll("*").remove();
  svg.attr("viewBox", `0 0 ${width} ${height}`);

  const categories = Array.from(new Set(points.map((point) => point.category)));
  const color = d3
    .scaleOrdinal<string, string>()
    .domain(categories)
    .range(d3.schemeTableau10);

  const xScale = d3
    .scaleLinear()
    .domain(d3.extent(points, (point) => point.x) as [number, number])
    .nice()
    .range([margin.left, margin.left + innerWidth]);

  const yScale = d3
    .scaleLinear()
    .domain(d3.extent(points, (point) => point.y) as [number, number])
    .nice()
    .range([margin.top + innerHeight, margin.top]);

  const xAxis = svg
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${margin.top + innerHeight})`)
    .call(d3.axisBottom(xScale));

  const yAxis = svg
    .append("g")
    .attr("class", "y-axis")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(yScale));

  svg
    .append("text")
    .attr("x", margin.left + innerWidth / 2)
    .attr("y", height - 10)
    .attr("text-anchor", "middle")
    .attr("font-size", "12px")
    .text("t-SNE Dimension 1");

  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -(margin.top + innerHeight / 2))
    .attr("y", 16)
    .attr("text-anchor", "middle")
    .attr("font-size", "12px")
    .text("t-SNE Dimension 2");

  svg
    .append("text")
    .attr("x", margin.left)
    .attr("y", 18)
    .attr("font-size", "14px")
    .attr("font-weight", "700")
    .text("t-SNE Stock Similarity Map");

  svg
    .append("defs")
    .append("clipPath")
    .attr("id", "tsne-scatter-clip")
    .append("rect")
    .attr("x", margin.left)
    .attr("y", margin.top)
    .attr("width", innerWidth)
    .attr("height", innerHeight);

  const plot = svg.append("g").attr("clip-path", "url(#tsne-scatter-clip)");
  const labels = plot.append("g").attr("class", "labels");
  const dots = plot.append("g").attr("class", "dots");

  const renderPoints = (
    currentXScale: d3.ScaleLinear<number, number>,
    currentYScale: d3.ScaleLinear<number, number>
  ) => {
    dots
      .selectAll<SVGCircleElement, TSNEPoint>("circle")
      .data(points, (point) => point.ticker)
      .join("circle")
      .attr("cx", (point) => currentXScale(point.x))
      .attr("cy", (point) => currentYScale(point.y))
      .attr("r", (point) => (point.ticker === selectedStock ? 8 : 5))
      .attr("fill", (point) => color(point.category))
      .attr("stroke", (point) => (point.ticker === selectedStock ? "#111827" : "#ffffff"))
      .attr("stroke-width", (point) => (point.ticker === selectedStock ? 2.5 : 1.2))
      .attr("opacity", (point) => (point.ticker === selectedStock ? 1 : 0.85));

    labels
      .selectAll<SVGTextElement, TSNEPoint>("text")
      .data(
        points.filter((point) => point.ticker === selectedStock),
        (point) => point.ticker
      )
      .join("text")
      .attr("x", (point) => currentXScale(point.x) + 10)
      .attr("y", (point) => currentYScale(point.y) - 10)
      .attr("font-size", "13px")
      .attr("font-weight", "700")
      .attr("fill", "#111827")
      .text((point) => point.ticker);
  };

  renderPoints(xScale, yScale);

  const legend = svg
    .append("g")
    .attr("transform", `translate(${margin.left + innerWidth + 24},${margin.top})`);

  categories.forEach((category, index) => {
    const item = legend.append("g").attr("transform", `translate(0,${index * 24})`);

    item
      .append("circle")
      .attr("cx", 6)
      .attr("cy", 6)
      .attr("r", 6)
      .attr("fill", color(category));

    item
      .append("text")
      .attr("x", 18)
      .attr("y", 10)
      .attr("font-size", "12px")
      .text(category);
  });

  const zoom = d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent([1, 12])
    .translateExtent([
      [margin.left, margin.top],
      [margin.left + innerWidth, margin.top + innerHeight],
    ])
    .extent([
      [margin.left, margin.top],
      [margin.left + innerWidth, margin.top + innerHeight],
    ])
    .on("zoom", (event) => {
      const zoomedXScale = event.transform.rescaleX(xScale);
      const zoomedYScale = event.transform.rescaleY(yScale);

      xAxis.call(d3.axisBottom(zoomedXScale));
      yAxis.call(d3.axisLeft(zoomedYScale));
      renderPoints(zoomedXScale, zoomedYScale);
    });

  svg.call(zoom);
}
