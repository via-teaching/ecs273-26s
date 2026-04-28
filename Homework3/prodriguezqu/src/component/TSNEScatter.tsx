import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";

interface TSNEScatterProps {
  selectedTicker: string;
}

interface TSNERow {
  ticker: string;
  x: number;
  y: number;
  category: string;
}

const tsneFiles = import.meta.glob("../../data/tsne.csv", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const margin = { top: 20, right: 30, bottom: 60, left: 60 };

const categoryColors: Record<string, string> = {
  Tech: "#2563eb",
  Financials: "#9333ea",
  Industrials: "#ea580c",
  Energy: "#16a34a",
  Healthcare: "#dc2626",
  Consumer: "#ca8a04",
};

export function TSNEScatter({ selectedTicker }: TSNEScatterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [rows, setRows] = useState<TSNERow[]>([]);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const csvText = tsneFiles["../../data/tsne.csv"];

    if (!csvText) {
      setRows([]);
      return;
    }

    // Use the t-SNE coordinates generated from Homework 2 and visualize them in D3.
    const parsedRows = d3.csvParse(csvText, (row) => ({
      ticker: String(row.ticker),
      x: Number(row.x),
      y: Number(row.y),
      category: String(row.category),
    })) as TSNERow[];

    setRows(parsedRows);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      const width = containerRef.current?.clientWidth ?? 0;
      setContainerWidth(width);
    };

    updateSize();

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || rows.length === 0 || containerWidth === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = containerWidth;
    const height = 460;

    svg.attr("width", width).attr("height", height);

    const xExtent = d3.extent(rows, (d) => d.x) as [number, number];
    const yExtent = d3.extent(rows, (d) => d.y) as [number, number];

    const xScale = d3.scaleLinear()
      .domain([xExtent[0] - 10, xExtent[1] + 10])
      .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
      .domain([yExtent[0] - 10, yExtent[1] + 10])
      .range([height - margin.bottom, margin.top]);

    const xAxisGroup = svg.append("g")
      .attr("transform", `translate(0, ${height - margin.bottom})`);

    const yAxisGroup = svg.append("g")
      .attr("transform", `translate(${margin.left}, 0)`);

    xAxisGroup.call(d3.axisBottom(xScale));
    yAxisGroup.call(d3.axisLeft(yScale));

    const clipId = `tsne-clip-${selectedTicker}`;

    svg.append("defs")
      .append("clipPath")
      .attr("id", clipId)
      .append("rect")
      .attr("x", margin.left)
      .attr("y", margin.top)
      .attr("width", width - margin.left - margin.right)
      .attr("height", height - margin.top - margin.bottom);

    const pointGroup = svg.append("g")
      .attr("clip-path", `url(#${clipId})`);

    const labelGroup = svg.append("g")
      .attr("clip-path", `url(#${clipId})`);

    const drawPoints = (
      currentXScale: d3.ScaleLinear<number, number>,
      currentYScale: d3.ScaleLinear<number, number>,
    ) => {
      pointGroup.selectAll("*").remove();
      labelGroup.selectAll("*").remove();

      // each point represents one stock
      pointGroup.selectAll("circle")
        .data(rows)
        .join("circle")
        .attr("cx", (d) => currentXScale(d.x))
        .attr("cy", (d) => currentYScale(d.y))
        .attr("r", (d) => d.ticker === selectedTicker ? 10 : 6)
        // color points by sector/category from tsne.csv
        .attr("fill", (d) => categoryColors[d.category] ?? "#525252")
        .attr("stroke", (d) => d.ticker === selectedTicker ? "#111827" : "none")
        .attr("stroke-width", (d) => d.ticker === selectedTicker ? 2 : 0)
        .attr("opacity", 0.9);

      // HW3 says the selected stock should have a larger size and show the stock name
      const selectedRow = rows.find((d) => d.ticker === selectedTicker);
      if (selectedRow) {
        labelGroup.append("text")
          .attr("x", currentXScale(selectedRow.x) + 12)
          .attr("y", currentYScale(selectedRow.y) - 10)
          .attr("font-size", "12px")
          .attr("font-weight", "bold")
          .attr("fill", "#111827")
          .text(selectedRow.ticker);
      }
    };

    drawPoints(xScale, yScale);

    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height - 15)
      .attr("text-anchor", "middle")
      .text("t-SNE Dimension 1");

    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 18)
      .attr("text-anchor", "middle")
      .text("t-SNE Dimension 2");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .translateExtent([[margin.left, 0], [width - margin.right, height]])
      .extent([[margin.left, 0], [width - margin.right, height]])
      .on("zoom", (event) => {
        const newXScale = event.transform.rescaleX(xScale);
        const newYScale = event.transform.rescaleY(yScale);
        xAxisGroup.call(d3.axisBottom(newXScale));
        yAxisGroup.call(d3.axisLeft(newYScale));
        drawPoints(newXScale, newYScale);
      });

    svg.call(zoom);
  }, [rows, containerWidth, selectedTicker]);

  const legendEntries = Object.entries(categoryColors);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      <div className="absolute right-3 top-3 z-10 rounded-md bg-white/90 px-3 py-2 text-sm shadow">
        <div className="mb-2 font-semibold">t-SNE Scatter Plot</div>
        <div className="mb-2 text-xs text-gray-600">
          scroll to zoom, drag to pan
        </div>
        {/* keeping the legend fixed in the corner so it stays visible while zooming */}
        <div className="space-y-1">
          {legendEntries.map(([category, color]) => (
            <div key={category} className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: color }}
              ></span>
              <span>{category}</span>
            </div>
          ))}
        </div>
      </div>
      {rows.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          No t-SNE data found.
        </div>
      ) : containerWidth === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          Loading scatter plot...
        </div>
      ) : (
        <svg ref={svgRef} className="block h-full"></svg>
      )}
    </div>
  );
}
