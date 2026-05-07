import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";
import { debounce } from "lodash";
import { stocks, Ticker } from "../stocks";
import { ComponentSize, Margin } from "../types";

interface Point {
  ticker: Ticker;
  x: number;
  y: number;
  sector: string;
}

const sectorMap: Record<Ticker, string> = {
  AAPL: "Technology",
  BAC:  "Financials",
  CAT:  "Industrials",
  CVX:  "Energy",
  DAL:  "Industrials",
  GOOG: "Communication Services",
  GS:   "Financials",
  HAL:  "Energy",
  JNJ:  "Healthcare",
  JPM:  "Financials",
  KO:   "Consumer Staples",
  MCD:  "Consumer Discretionary",
  META: "Communication Services",
  MMM:  "Industrials",
  MSFT: "Technology",
  NKE:  "Consumer Discretionary",
  NVDA: "Technology",
  PFE:  "Healthcare",
  UNH:  "Healthcare",
  XOM:  "Energy",
};

const margin: Margin = { top: 24, right: 140, bottom: 40, left: 48 };

export default function TSNEScatter({
  selected,
  onSelect,
}: {
  selected: Ticker;
  onSelect?: (t: Ticker) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<Point[]>([]);

  // fetch once
  useEffect(() => {
    d3.csv("/data/tsne.csv").then((raw) => {
      const parsed: Point[] = raw.map((r, i) => ({
        ticker: stocks[i],
        x: +(r.tsne_dim_1 ?? "0"),
        y: +(r.tsne_dim_2 ?? "0"),
        sector: sectorMap[stocks[i]],
      }));
      setData(parsed);
    });
  }, []);

  // redraw when data, selection, or container size changes
  useEffect(() => {
    if (!containerRef.current || !svgRef.current || !data.length) return;

    const draw = (w: number, h: number) => {
      if (!svgRef.current) return;
      drawChart(svgRef.current, data, w, h, selected, onSelect);
    };

    const resizeObserver = new ResizeObserver(
      debounce((entries: ResizeObserverEntry[]) => {
        for (const entry of entries) {
          if (entry.target !== containerRef.current) continue;
          const { width, height } = entry.contentRect as ComponentSize;
          if (width && height) draw(width, height);
        }
      }, 100)
    );

    resizeObserver.observe(containerRef.current);
    const { width, height } = containerRef.current.getBoundingClientRect();
    if (width && height) draw(width, height);

    return () => resizeObserver.disconnect();
  }, [data, selected, onSelect]);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%", overflow: "hidden" }}>
      <svg ref={svgRef} width="100%" height="100%" />
    </div>
  );
}

function drawChart(
  svgEl: SVGSVGElement,
  data: Point[],
  width: number,
  height: number,
  selected: Ticker,
  onSelect?: (t: Ticker) => void,
) {
  const svg = d3.select(svgEl);
  svg.selectAll("*").remove();

  const sectors = Array.from(new Set(data.map(r => r.sector)));
  const color = d3.scaleOrdinal<string>()
    .domain(sectors)
    .range([...d3.schemeTableau10]);

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  svg.append("defs").append("clipPath")
    .attr("id", "tsne-clip")
    .append("rect")
    .attr("x", margin.left)
    .attr("y", margin.top)
    .attr("width", innerWidth)
    .attr("height", innerHeight);

  const xScale = d3.scaleLinear()
    .domain(d3.extent(data, d => d.x) as [number, number])
    .nice()
    .range([margin.left, width - margin.right]);

  const yScale = d3.scaleLinear()
    .domain(d3.extent(data, d => d.y) as [number, number])
    .nice()
    .range([height - margin.bottom, margin.top]);

  const xAxis = svg.append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(xScale));

  const yAxis = svg.append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(yScale));

  svg.append("text")
    .attr("x", margin.left + innerWidth / 2)
    .attr("y", height - 2)
    .attr("text-anchor", "middle")
    .style("font-size", "0.75rem")
    .text("t-SNE 1");

  svg.append("text")
    .attr("transform", `translate(12, ${margin.top + innerHeight / 2}) rotate(-90)`)
    .attr("text-anchor", "middle")
    .style("font-size", "0.75rem")
    .text("t-SNE 2");

  svg.append("text")
    .attr("x", margin.left + innerWidth / 2)
    .attr("y", margin.top - 6)
    .attr("text-anchor", "middle")
    .style("font-size", "0.875rem")
    .style("font-weight", "bold")
    .text("t-SNE Projection (20 stocks)");

  const dotsGroup = svg.append("g").attr("clip-path", "url(#tsne-clip)");
  const labelsGroup = svg.append("g").attr("clip-path", "url(#tsne-clip)");

  const dots = dotsGroup.selectAll<SVGCircleElement, Point>("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", d => xScale(d.x))
    .attr("cy", d => yScale(d.y))
    .attr("r", d => d.ticker === selected ? 10 : 5)
    .attr("fill", d => color(d.sector))
    .attr("stroke", d => d.ticker === selected ? "#000" : "none")
    .attr("stroke-width", d => d.ticker === selected ? "2" : "0")
    .style("cursor", onSelect ? "pointer" : "default")
    .on("click", (_, d) => { if (onSelect) onSelect(d.ticker); });

  const tickerLabels = labelsGroup.selectAll<SVGTextElement, Point>("text")
    .data(data.filter(d => d.ticker === selected))
    .enter()
    .append("text")
    .attr("x", d => xScale(d.x) + 13)
    .attr("y", d => yScale(d.y) + 4)
    .style("font-size", "0.75rem")
    .style("font-weight", "bold")
    .text(d => d.ticker);

  const legend = svg.append("g")
    .attr("transform", `translate(${width - margin.right + 12}, ${margin.top})`);

  sectors.forEach((s, i) => {
    const g = legend.append("g").attr("transform", `translate(0, ${i * 18})`);
    g.append("rect").attr("width", 12).attr("height", 12).attr("fill", color(s) as string);
    g.append("text").attr("x", 16).attr("y", 10).style("font-size", "0.68rem").text(s);
  });

  const zoom = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.5, 8])
    .on("zoom", (e) => {
      const zx = e.transform.rescaleX(xScale);
      const zy = e.transform.rescaleY(yScale);
      xAxis.call(d3.axisBottom(zx));
      yAxis.call(d3.axisLeft(zy));
      dots.attr("cx", d => zx(d.x)).attr("cy", d => zy(d.y));
      tickerLabels.attr("x", d => zx(d.x) + 13).attr("y", d => zy(d.y) + 4);
    });

  svg.call(zoom);
}
