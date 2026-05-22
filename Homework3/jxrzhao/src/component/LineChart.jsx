import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";

const stockFiles = import.meta.glob("../../data/stockdata/*.csv", {
  query: "?raw",
  import: "default",
});

const seriesKeys = ["Open", "High", "Low", "Close"];
const seriesColors = {
  Open: "#2563eb",
  High: "#16a34a",
  Low: "#dc2626",
  Close: "#7c3aed",
};
const margin = { top: 18, right: 28, bottom: 46, left: 64 };
const parseDate = d3.timeParse("%Y-%m-%d");

export default function LineChart({ selectedStock }) {
  const containerRef = useRef(null);
  const scrollRef = useRef(null);
  const svgRef = useRef(null);
  const zoomRef = useRef(null);
  const [stockData, setStockData] = useState([]);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [status, setStatus] = useState("Loading stock data...");

  useEffect(() => {
    let isCurrent = true;
    const loadStock = stockFiles[`../../data/stockdata/${selectedStock}.csv`];

    if (!loadStock) {
      setStockData([]);
      setStatus(`No CSV found for ${selectedStock}.`);
      return;
    }

    setStatus("Loading stock data...");

    loadStock()
      .then((csvText) => {
        if (!isCurrent) return;

        const parsedData = d3
          .csvParse(csvText, (row) => ({
            date: parseDate(row.Date),
            Open: Number(row.Open),
            High: Number(row.High),
            Low: Number(row.Low),
            Close: Number(row.Close),
          }))
          .filter(
            (row) =>
              row.date &&
              seriesKeys.every((key) => Number.isFinite(row[key]))
          )
          .sort((a, b) => d3.ascending(a.date, b.date));

        setStockData(parsedData);
        setStatus(
          parsedData.length ? "" : `No valid OHLC rows found for ${selectedStock}.`
        );

        if (scrollRef.current) {
          scrollRef.current.scrollLeft = 0;
        }
      })
      .catch(() => {
        if (!isCurrent) return;
        setStockData([]);
        setStatus(`Could not load ${selectedStock}.csv.`);
      });

    return () => {
      isCurrent = false;
    };
  }, [selectedStock]);

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
    if (!svgRef.current || !size.width || !size.height || !stockData.length) {
      return;
    }

    drawChart(svgRef.current, {
      stockData,
      selectedStock,
      visibleWidth: size.width,
      visibleHeight: size.height,
      zoomRef,
    });
  }, [stockData, selectedStock, size]);

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden">
      {status ? (
        <p className="pt-10 text-center text-sm text-gray-500">{status}</p>
      ) : (
        <>
          <div className="absolute right-3 top-2 z-10 flex flex-wrap justify-end gap-x-3 gap-y-1 rounded bg-white/90 px-2 py-1 text-xs shadow-sm">
            {seriesKeys.map((key) => (
              <span key={key} className="inline-flex items-center gap-1">
                <span
                  className="h-0.5 w-5"
                  style={{ backgroundColor: seriesColors[key] }}
                />
                {key}
              </span>
            ))}
          </div>
          <div
            ref={scrollRef}
            className="h-full w-full overflow-x-auto overflow-y-hidden"
            aria-label={`${selectedStock} stock overview line chart with horizontal scrolling`}
          >
            <svg ref={svgRef} className="block h-full" role="img" />
          </div>
        </>
      )}
    </div>
  );
}

function drawChart(
  svgElement,
  { stockData, selectedStock, visibleWidth, visibleHeight, zoomRef }
) {
  const svg = d3.select(svgElement);
  svg.selectAll("*").remove();

  const height = Math.max(160, visibleHeight);
  const basePlotWidth = Math.max(1, visibleWidth - margin.left - margin.right);
  const plotWidth = Math.max(basePlotWidth, stockData.length * 6);
  const width = plotWidth + margin.left + margin.right;
  const plotHeight = Math.max(1, height - margin.top - margin.bottom);
  const plotRight = margin.left + plotWidth;
  const plotBottom = margin.top + plotHeight;

  svg.attr("width", width).attr("height", height);

  const dateExtent = d3.extent(stockData, (d) => d.date);
  const valueExtent = d3.extent(
    stockData.flatMap((row) => seriesKeys.map((key) => row[key]))
  );
  const valuePadding = (valueExtent[1] - valueExtent[0]) * 0.08 || 1;

  const xScale = d3
    .scaleTime()
    .domain(dateExtent)
    .range([margin.left, plotRight]);
  const yScale = d3
    .scaleLinear()
    .domain([valueExtent[0] - valuePadding, valueExtent[1] + valuePadding])
    .nice()
    .range([plotBottom, margin.top]);

  const xAxisGroup = svg
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${plotBottom})`);
  const yAxisGroup = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, 0)`);
  const gridGroup = svg.append("g").attr("class", "grid-lines");
  const linesGroup = svg.append("g").attr("clip-path", "url(#line-chart-clip)");

  svg
    .append("clipPath")
    .attr("id", "line-chart-clip")
    .append("rect")
    .attr("x", margin.left)
    .attr("y", margin.top)
    .attr("width", plotWidth)
    .attr("height", plotHeight);

  const yAxis = d3.axisLeft(yScale).ticks(5).tickFormat(d3.format("$.2f"));
  yAxisGroup.call(yAxis).call((group) => group.select(".domain").remove());

  svg
    .append("text")
    .attr("x", margin.left + plotWidth / 2)
    .attr("y", height - 8)
    .attr("text-anchor", "middle")
    .attr("fill", "#111827")
    .style("font-size", "12px")
    .text("Date");

  svg
    .append("text")
    .attr("transform", `translate(16, ${margin.top + plotHeight / 2}) rotate(-90)`)
    .attr("text-anchor", "middle")
    .attr("fill", "#111827")
    .style("font-size", "12px")
    .text(`${selectedStock} price (USD)`);

  const lineGenerator = d3
    .line()
    .defined((d) => d.date && Number.isFinite(d.value))
    .x((d) => xScale(d.date))
    .y((d) => yScale(d.value));

  const paths = linesGroup
    .selectAll("path")
    .data(seriesKeys)
    .join("path")
    .attr("fill", "none")
    .attr("stroke", (key) => seriesColors[key])
    .attr("stroke-width", 2)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr("d", (key) =>
      lineGenerator(stockData.map((row) => ({ date: row.date, value: row[key] })))
    );

  function renderXAxis(scale) {
    const ticks = Math.max(4, Math.floor(plotWidth / 180));
    xAxisGroup.call(d3.axisBottom(scale).ticks(ticks).tickSizeOuter(0));
  }

  function renderGrid() {
    gridGroup
      .selectAll("line")
      .data(yScale.ticks(5))
      .join("line")
      .attr("x1", margin.left)
      .attr("x2", plotRight)
      .attr("y1", (d) => yScale(d))
      .attr("y2", (d) => yScale(d))
      .attr("stroke", "#e5e7eb")
      .attr("stroke-width", 1);
  }

  function applyZoom(event) {
    const transform = event.transform;
    const zoomedXScale = transform.rescaleX(xScale);
    renderXAxis(zoomedXScale);

    paths.attr("d", (key) => {
      const zoomedLine = d3
        .line()
        .defined((d) => d.date && Number.isFinite(d.value))
        .x((d) => zoomedXScale(d.date))
        .y((d) => yScale(d.value));

      return zoomedLine(
        stockData.map((row) => ({ date: row.date, value: row[key] }))
      );
    });
  }

  renderXAxis(xScale);
  renderGrid();

  const zoom = d3
    .zoom()
    .scaleExtent([1, 12])
    .translateExtent([
      [margin.left, margin.top],
      [plotRight, plotBottom],
    ])
    .extent([
      [margin.left, margin.top],
      [plotRight, plotBottom],
    ])
    .filter((event) => {
      return !event.ctrlKey || event.type === "wheel";
    })
    .on("zoom", applyZoom);

  zoomRef.current = zoom;

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
