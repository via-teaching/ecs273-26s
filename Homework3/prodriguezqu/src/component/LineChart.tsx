import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";

interface LineChartProps {
  selectedTicker: string;
}

interface StockRow {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
}

const stockFiles = import.meta.glob("../../data/stockdata/*.csv", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const margin = { top: 20, right: 120, bottom: 60, left: 60 };
const lineColors = {
  open: "#2563eb",
  high: "#16a34a",
  low: "#ea580c",
  close: "#dc2626",
};

export function LineChart({ selectedTicker }: LineChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [rows, setRows] = useState<StockRow[]>([]);
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [zoomMode, setZoomMode] = useState<"x" | "xy">("x");

  useEffect(() => {
    const filePath = `../../data/stockdata/${selectedTicker}.csv`;
    const csvText = stockFiles[filePath];

    if (!csvText) {
      setRows([]);
      return;
    }

    const parsedRows = d3.csvParse(csvText, (row) => ({
      date: new Date(row.Date as string),
      open: Number(row.Open),
      high: Number(row.High),
      low: Number(row.Low),
      close: Number(row.Close),
    })) as StockRow[];

    setRows(parsedRows);
  }, [selectedTicker]);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      const width = containerRef.current?.clientWidth ?? 0;
      const height = containerRef.current?.clientHeight ?? 0;
      setContainerWidth(width);
      setContainerHeight(height);
    };

    updateSize();

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || rows.length === 0 || containerWidth === 0 || containerHeight === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = containerWidth;
    const height = Math.max(containerHeight, 220);

    svg.attr("width", width).attr("height", height);

    const xExtent = d3.extent(rows, (d) => d.date) as [Date, Date];
    const yMin = d3.min(rows, (d) => Math.min(d.open, d.high, d.low, d.close)) ?? 0;
    const yMax = d3.max(rows, (d) => Math.max(d.open, d.high, d.low, d.close)) ?? 0;

    const xScale = d3.scaleTime()
      .domain(xExtent)
      .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
      .domain([yMin, yMax])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const xAxisGroup = svg.append("g")
      .attr("transform", `translate(0, ${height - margin.bottom})`);

    const yAxisGroup = svg.append("g")
      .attr("transform", `translate(${margin.left}, 0)`);

    xAxisGroup.call(d3.axisBottom(xScale));
    yAxisGroup.call(d3.axisLeft(yScale));

    const clipId = `line-chart-clip-${selectedTicker}`;

    svg.append("defs")
      .append("clipPath")
      .attr("id", clipId)
      .append("rect")
      .attr("x", margin.left)
      .attr("y", margin.top)
      .attr("width", width - margin.left - margin.right)
      .attr("height", height - margin.top - margin.bottom);

    // HW3 asks for Open, High, Low, and Close as four separate lines
    const lineGroup = svg.append("g")
      .attr("clip-path", `url(#${clipId})`);

    const drawLines = (
      currentXScale: d3.ScaleTime<number, number>,
      currentYScale: d3.ScaleLinear<number, number>,
    ) => {
      lineGroup.selectAll("*").remove();

      const currentLines = {
        open: d3.line<StockRow>().x((d) => currentXScale(d.date)).y((d) => currentYScale(d.open)),
        high: d3.line<StockRow>().x((d) => currentXScale(d.date)).y((d) => currentYScale(d.high)),
        low: d3.line<StockRow>().x((d) => currentXScale(d.date)).y((d) => currentYScale(d.low)),
        close: d3.line<StockRow>().x((d) => currentXScale(d.date)).y((d) => currentYScale(d.close)),
      };

      lineGroup.append("path")
        .datum(rows)
        .attr("fill", "none")
        .attr("stroke", lineColors.open)
        .attr("stroke-width", 2)
        .attr("d", currentLines.open);

      lineGroup.append("path")
        .datum(rows)
        .attr("fill", "none")
        .attr("stroke", lineColors.high)
        .attr("stroke-width", 2)
        .attr("d", currentLines.high);

      lineGroup.append("path")
        .datum(rows)
        .attr("fill", "none")
        .attr("stroke", lineColors.low)
        .attr("stroke-width", 2)
        .attr("d", currentLines.low);

      lineGroup.append("path")
        .datum(rows)
        .attr("fill", "none")
        .attr("stroke", lineColors.close)
        .attr("stroke-width", 2)
        .attr("d", currentLines.close);
    };

    drawLines(xScale, yScale);

    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height - 15)
      .attr("text-anchor", "middle")
      .text("Date");

    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 18)
      .attr("text-anchor", "middle")
      .text("Price");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .translateExtent([[margin.left, 0], [width - margin.right, height]])
      .extent([[margin.left, 0], [width - margin.right, height]])
      .on("zoom", (event) => {
        const newXScale = event.transform.rescaleX(xScale);
        const newYScale = zoomMode === "xy"
          ? event.transform.rescaleY(yScale)
          : yScale;

        xAxisGroup.call(d3.axisBottom(newXScale));
        yAxisGroup.call(d3.axisLeft(newYScale));
        drawLines(newXScale, newYScale);
      });

    svg.call(zoom);
  }, [rows, containerWidth, containerHeight, selectedTicker, zoomMode]);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      <div className="absolute right-3 top-3 z-10 rounded-md bg-white/90 px-3 py-2 text-sm shadow">
        <div className="mb-2 font-semibold">{selectedTicker}</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`rounded px-2 py-1 ${zoomMode === "x" ? "bg-zinc-700 text-white" : "bg-zinc-200 text-black"}`}
            onClick={() => setZoomMode("x")}
          >
            X zoom
          </button>
          <button
            type="button"
            className={`rounded px-2 py-1 ${zoomMode === "xy" ? "bg-zinc-700 text-white" : "bg-zinc-200 text-black"}`}
            onClick={() => setZoomMode("xy")}
          >
            X + Y zoom
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-600">
          drag to pan after zooming
        </div>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-block h-1 w-5" style={{ backgroundColor: lineColors.open }}></span>
            <span>Open</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-1 w-5" style={{ backgroundColor: lineColors.high }}></span>
            <span>High</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-1 w-5" style={{ backgroundColor: lineColors.low }}></span>
            <span>Low</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-1 w-5" style={{ backgroundColor: lineColors.close }}></span>
            <span>Close</span>
          </div>
        </div>
      </div>
      {rows.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          No stock data found.
        </div>
      ) : containerWidth === 0 || containerHeight === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          Loading chart...
        </div>
      ) : (
        <svg ref={svgRef} className="block h-full"></svg>
      )}
    </div>
  );
}
