import * as d3 from "d3";
import { debounce } from "lodash";
import { useEffect, useId, useRef, useState } from "react";

import { Margin, StockMetricKey, StockPriceRow } from "../types";

interface LineChartProps {
  series: StockPriceRow[];
}

const margin: Margin = { top: 24, right: 160, bottom: 56, left: 72 };
const metricColors: Record<StockMetricKey, string> = {
  open: "#2563eb",
  high: "#dc2626",
  low: "#059669",
  close: "#7c3aed",
};

const metrics: StockMetricKey[] = ["open", "high", "low", "close"];
const timeTickFormatter = d3.timeFormat("%b %Y");

export function LineChart({ series }: LineChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const clipPathId = useId().replace(/:/g, "");
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    const updateSize = debounce((entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        if (entry.target !== container) {
          continue;
        }

        const { width, height } = entry.contentRect;
        setContainerWidth(width);
        setContainerHeight(height);
      }
    }, 100);

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);

    const bounds = container.getBoundingClientRect();
    setContainerWidth(bounds.width);
    setContainerHeight(bounds.height);

    return () => {
      updateSize.cancel();
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!svgRef.current || !containerWidth || !containerHeight || !series.length) {
      return;
    }

    drawLineChart(svgRef.current, series, containerWidth, containerHeight, clipPathId);
  }, [clipPathId, containerHeight, containerWidth, series]);

  const chartWidth = Math.max(containerWidth, series.length * 8 + margin.left + margin.right);

  if (!series.length) {
    return <div className="flex h-full items-center justify-center text-gray-500">No stock data available.</div>;
  }

  return (
    <div ref={containerRef} className="h-full w-full overflow-x-auto overflow-y-hidden">
      <div style={{ width: `${chartWidth}px`, height: "100%" }}>
        <svg ref={svgRef} width={chartWidth} height={containerHeight || 0} />
      </div>
    </div>
  );
}

function drawLineChart(
  svgElement: SVGSVGElement,
  series: StockPriceRow[],
  containerWidth: number,
  containerHeight: number,
  clipPathId: string,
) {
  const width = Math.max(containerWidth, series.length * 8 + margin.left + margin.right);
  const height = containerHeight;
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  if (innerWidth <= 0 || innerHeight <= 0) {
    return;
  }

  const svg = d3.select(svgElement);
  svg.selectAll("*").remove();

  const minPrice = d3.min(series, (row) => row.low) ?? 0;
  const maxPrice = d3.max(series, (row) => row.high) ?? 0;
  const xScale = d3
    .scaleTime()
    .domain(d3.extent(series, (row) => row.date) as [Date, Date])
    .range([margin.left, width - margin.right]);
  const yScale = d3
    .scaleLinear()
    .domain([minPrice * 0.98, maxPrice * 1.02])
    .nice()
    .range([height - margin.bottom, margin.top]);

  const chartLayer = svg.append("g");

  svg
    .append("clipPath")
    .attr("id", clipPathId)
    .append("rect")
    .attr("x", margin.left)
    .attr("y", margin.top)
    .attr("width", innerWidth)
    .attr("height", innerHeight);

  const xAxisGroup = svg
    .append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`);
  const yAxisGroup = svg.append("g").attr("transform", `translate(${margin.left}, 0)`);

  const linesGroup = chartLayer.append("g").attr("clip-path", `url(#${clipPathId})`);

  const lineGenerator = (metric: StockMetricKey, scale: d3.ScaleTime<number, number>) =>
    d3
      .line<StockPriceRow>()
      .x((row) => scale(row.date))
      .y((row) => yScale(row[metric]))
      .curve(d3.curveMonotoneX)(series);

  const linePaths = new Map<StockMetricKey, d3.Selection<SVGPathElement, StockPriceRow[], null, undefined>>();

  metrics.forEach((metric) => {
    const path = linesGroup
      .append("path")
      .datum(series)
      .attr("fill", "none")
      .attr("stroke", metricColors[metric])
      .attr("stroke-width", 2)
      .attr("d", lineGenerator(metric, xScale) ?? "");

    linePaths.set(metric, path);
  });

  renderAxes(xAxisGroup, yAxisGroup, xScale, yScale, width, height);
  renderLabels(svg, width, tickerFromSeries(series));
  renderLegend(svg);

  const zoom = d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent([1, 12])
    .translateExtent([
      [margin.left, 0],
      [width - margin.right, height],
    ])
    .extent([
      [margin.left, margin.top],
      [width - margin.right, height - margin.bottom],
    ])
    .on("zoom", (event) => {
      const transform = d3.zoomIdentity.translate(event.transform.x, 0).scale(event.transform.k);
      const zoomedXScale = transform.rescaleX(xScale);

      xAxisGroup.call(
        d3.axisBottom<Date>(zoomedXScale).ticks(Math.max(4, Math.floor(innerWidth / 140))).tickFormat(timeTickFormatter),
      );
      xAxisGroup.selectAll<SVGTextElement, Date>(".tick text").attr("transform", "rotate(-25)").style("text-anchor", "end");
      styleAxis(xAxisGroup);

      metrics.forEach((metric) => {
        linePaths.get(metric)?.attr("d", lineGenerator(metric, zoomedXScale) ?? "");
      });
    });

  svg.call(zoom);
}

function renderAxes(
  xAxisGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  yAxisGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  xScale: d3.ScaleTime<number, number>,
  yScale: d3.ScaleLinear<number, number>,
  width: number,
  height: number,
) {
  xAxisGroup.call(
    d3.axisBottom<Date>(xScale).ticks(Math.max(4, Math.floor((width - margin.left - margin.right) / 140))).tickFormat(timeTickFormatter),
  );

  xAxisGroup
    .selectAll(".tick text")
    .attr("transform", "rotate(-25)")
    .style("text-anchor", "end");

  yAxisGroup.call(d3.axisLeft(yScale).ticks(6));
  styleAxis(xAxisGroup);
  styleAxis(yAxisGroup);

  xAxisGroup
    .append("text")
    .attr("x", width / 2)
    .attr("y", margin.bottom - 8)
    .attr("fill", "#ffffff")
    .attr("text-anchor", "middle")
    .style("font-size", "0.9rem")
    .text("Trading Date");

  yAxisGroup
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -(height / 2))
    .attr("y", -50)
    .attr("fill", "#ffffff")
    .attr("text-anchor", "middle")
    .style("font-size", "0.9rem")
    .text("Price (USD)");
}

function styleAxis(axisGroup: d3.Selection<SVGGElement, unknown, null, undefined>) {
  axisGroup.selectAll<SVGPathElement, unknown>(".domain").attr("stroke", "#ffffff");
  axisGroup.selectAll<SVGLineElement, unknown>(".tick line").attr("stroke", "#ffffff");
  axisGroup.selectAll<SVGTextElement, unknown>(".tick text").attr("fill", "#ffffff");
}

function renderLabels(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, width: number, ticker: string) {
  svg
    .append("text")
    .attr("x", width - margin.right)
    .attr("y", margin.top - 8)
    .attr("fill", "#0f172a")
    .attr("text-anchor", "end")
    .style("font-size", "0.95rem")
    .style("font-weight", "600")
    .text(`${ticker} OHLC Price History`);
}

function renderLegend(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) {
  const legend = svg
    .append("g")
    .attr("transform", `translate(${margin.left + 12}, ${margin.top + 10})`);

  metrics.forEach((metric, index) => {
    const row = legend.append("g").attr("transform", `translate(0, ${index * 22})`);

    row
      .append("line")
      .attr("x1", 0)
      .attr("x2", 22)
      .attr("y1", 8)
      .attr("y2", 8)
      .attr("stroke", metricColors[metric])
      .attr("stroke-width", 3);

    row
      .append("text")
      .attr("x", 28)
      .attr("y", 11)
      .style("font-size", "0.85rem")
      .text(metric.charAt(0).toUpperCase() + metric.slice(1));
  });
}

function tickerFromSeries(series: StockPriceRow[]) {
  return series[0]?.ticker ?? "Stock";
}
