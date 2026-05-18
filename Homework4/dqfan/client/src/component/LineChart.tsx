import * as d3 from "d3";
import { debounce, isEmpty } from "lodash";
import { useEffect, useRef, useState } from "react";

import { ComponentSize, Margin } from "../types";

interface StockSeriesRow {
  date: string;
  Open: number;
  High: number;
  Low: number;
  Close: number;
}

interface StockResponse {
  _id: string;
  name: string;
  stock_series: StockSeriesRow[];
}

interface StockRow {
  date: Date;
  Open: number;
  High: number;
  Low: number;
  Close: number;
}

interface LineChartProps {
  selectedStock: string;
}

const API_BASE = "http://localhost:8000";
const margin = { left: 56, right: 160, top: 24, bottom: 46 } as Margin;
const seriesKeys = ["Open", "High", "Low", "Close"] as const;
const colors = d3
  .scaleOrdinal<(typeof seriesKeys)[number], string>()
  .domain(seriesKeys)
  .range(["#2563eb", "#dc2626", "#16a34a", "#7c3aed"]);

function getTimeTickFormat(scale: d3.ScaleTime<number, number>) {
  const [start, end] = scale.domain();
  const spanDays = Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

  if (spanDays > 365 * 2) {
    return d3.timeFormat("%b %Y");
  }

  if (spanDays > 60) {
    return d3.timeFormat("%b %d");
  }

  return d3.timeFormat("%m/%d");
}

export default function LineChart({ selectedStock }: LineChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [rows, setRows] = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadStock() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_BASE}/stock/${encodeURIComponent(selectedStock)}`
        );

        if (!response.ok) {
          throw new Error(`Failed to load stock data for ${selectedStock}.`);
        }

        const data: StockResponse = await response.json();
        if (cancelled) return;
        setRows(
          data.stock_series
            .map((row) => ({
              date: new Date(row.date),
              Open: Number(row.Open),
              High: Number(row.High),
              Low: Number(row.Low),
              Close: Number(row.Close),
            }))
            .filter(
              (row) =>
                !Number.isNaN(row.date.getTime()) &&
                seriesKeys.every((key) => Number.isFinite(row[key]))
            )
        );
      } catch (err) {
        if (cancelled) return;
        setRows([]);
        setError(err instanceof Error ? err.message : "Failed to load stock data.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadStock();

    return () => {
      cancelled = true;
    };
  }, [selectedStock]);

  useEffect(() => {
    if (!containerRef.current || !svgRef.current || isEmpty(rows)) return;

    const redraw = (size: ComponentSize) => {
      drawLineChart(svgRef.current!, rows, selectedStock, size.width, size.height);
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
  }, [rows, selectedStock]);

  if (loading) {
    return <div className="flex h-full items-center justify-center text-gray-500">Loading stock data...</div>;
  }

  if (error) {
    return <div className="flex h-full items-center justify-center text-gray-500">{error}</div>;
  }

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-x-auto overflow-y-hidden"
    >
      <svg ref={svgRef} className="block h-full" />
    </div>
  );
}

function drawLineChart(
  svgElement: SVGSVGElement,
  rows: StockRow[],
  stock: string,
  visibleWidth: number,
  height: number
) {
  const chartWidth = Math.max(visibleWidth, rows.length * 8 + margin.left + margin.right);
  const innerHeight = Math.max(height - margin.top - margin.bottom, 20);
  const svg = d3.select(svgElement);

  svg.selectAll("*").remove();
  svg.attr("width", chartWidth).attr("height", height);

  const xScale = d3
    .scaleTime()
    .domain(d3.extent(rows, (d) => d.date) as [Date, Date])
    .range([margin.left, chartWidth - margin.right]);

  const renderXAxis = (scale: d3.ScaleTime<number, number>) =>
    d3
      .axisBottom(scale)
      .ticks(Math.max(4, Math.floor(chartWidth / 120)))
      .tickFormat(getTimeTickFormat(scale) as (domainValue: Date | d3.NumberValue, index: number) => string);

  const yScale = d3
    .scaleLinear()
    .domain([
      d3.min(rows, (d) => d.Low) ?? 0,
      d3.max(rows, (d) => d.High) ?? 1,
    ])
    .nice()
    .range([height - margin.bottom, margin.top]);

  const xAxis = svg
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(renderXAxis(xScale));

  svg
    .append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(yScale).ticks(Math.max(3, Math.floor(innerHeight / 40))));

  svg
    .append("text")
    .attr("x", margin.left)
    .attr("y", 16)
    .attr("font-weight", "700")
    .attr("font-size", "14px")
    .text(`${stock} Stock Overview`);

  svg
    .append("text")
    .attr("x", chartWidth / 2)
    .attr("y", height - 8)
    .attr("text-anchor", "middle")
    .attr("font-size", "12px")
    .text("Date");

  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", 14)
    .attr("text-anchor", "middle")
    .attr("font-size", "12px")
    .text("Price (USD)");

  svg
    .append("defs")
    .append("clipPath")
    .attr("id", "line-chart-clip")
    .append("rect")
    .attr("x", margin.left)
    .attr("y", margin.top)
    .attr("width", chartWidth - margin.left - margin.right)
    .attr("height", innerHeight);

  const lineGroup = svg.append("g").attr("clip-path", "url(#line-chart-clip)");

  const drawSeries = (currentXScale: d3.ScaleTime<number, number>) => {
    const line = d3
      .line<StockRow>()
      .x((d) => currentXScale(d.date))
      .y((d) => yScale(d.Open));

    seriesKeys.forEach((key) => {
      line.y((d) => yScale(d[key]));
      lineGroup
        .selectAll(`.line-${key}`)
        .data([rows])
        .join("path")
        .attr("class", `line-${key}`)
        .attr("fill", "none")
        .attr("stroke", colors(key))
        .attr("stroke-width", 2)
        .attr("d", line);
    });
  };

  drawSeries(xScale);

  const legend = svg
    .append("g")
    .attr("transform", `translate(${chartWidth - margin.right + 24},${margin.top})`);

  seriesKeys.forEach((key, index) => {
    const item = legend.append("g").attr("transform", `translate(0,${index * 22})`);

    item
      .append("line")
      .attr("x1", 0)
      .attr("x2", 24)
      .attr("y1", 7)
      .attr("y2", 7)
      .attr("stroke", colors(key))
      .attr("stroke-width", 3);

    item
      .append("text")
      .attr("x", 32)
      .attr("y", 11)
      .attr("font-size", "12px")
      .text(key);
  });

  const zoom = d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent([1, 12])
    .translateExtent([
      [margin.left, 0],
      [chartWidth - margin.right, height],
    ])
    .extent([
      [margin.left, 0],
      [chartWidth - margin.right, height],
    ])
    .on("zoom", (event) => {
      const zoomedXScale = event.transform.rescaleX(xScale);
      xAxis.call(renderXAxis(zoomedXScale));
      drawSeries(zoomedXScale);
    });

  svg.call(zoom);
}
