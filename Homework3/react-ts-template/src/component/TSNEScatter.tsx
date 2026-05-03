import * as d3 from "d3";
import { debounce } from "lodash";
import { useEffect, useMemo, useRef, useState } from "react";

import { getTSNEPoints } from "../data";
import { Margin, TSNEPoint } from "../types";

interface TSNEScatterProps {
  selectedTicker: string;
}

const margin: Margin = { top: 24, right: 180, bottom: 56, left: 68 };

export function TSNEScatter({ selectedTicker }: TSNEScatterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const points = useMemo(() => getTSNEPoints(), []);

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
        setSize({ width, height });
      }
    }, 100);

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);

    const bounds = container.getBoundingClientRect();
    setSize({ width: bounds.width, height: bounds.height });

    return () => {
      updateSize.cancel();
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!svgRef.current || !size.width || !size.height) {
      return;
    }

    drawScatterPlot(svgRef.current, points, selectedTicker, size.width, size.height);
  }, [points, selectedTicker, size.height, size.width]);

  return (
    <div ref={containerRef} className="h-full w-full">
      <svg ref={svgRef} width="100%" height="100%" />
    </div>
  );
}

function drawScatterPlot(
  svgElement: SVGSVGElement,
  points: TSNEPoint[],
  selectedTicker: string,
  width: number,
  height: number,
) {
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  if (innerWidth <= 0 || innerHeight <= 0) {
    return;
  }

  const svg = d3.select(svgElement);
  svg.selectAll("*").remove();

  const xExtent = d3.extent(points, (point) => point.x) as [number, number];
  const yExtent = d3.extent(points, (point) => point.y) as [number, number];
  const sectors = Array.from(new Set(points.map((point) => point.sector)));

  const xScale = d3
    .scaleLinear()
    .domain([xExtent[0] - 15, xExtent[1] + 15])
    .range([margin.left, width - margin.right]);
  const yScale = d3
    .scaleLinear()
    .domain([yExtent[0] - 15, yExtent[1] + 15])
    .range([height - margin.bottom, margin.top]);
  const colorScale = d3
    .scaleOrdinal<string, string>()
    .domain(sectors)
    .range(d3.schemeTableau10.slice(0, sectors.length));

  const xAxisGroup = svg.append("g").attr("transform", `translate(0, ${height - margin.bottom})`);
  const yAxisGroup = svg.append("g").attr("transform", `translate(${margin.left}, 0)`);
  const pointsGroup = svg.append("g");
  const labelsGroup = svg.append("g");

  const circles = pointsGroup
    .selectAll("circle")
    .data(points)
    .join("circle")
    .attr("cx", (point) => xScale(point.x))
    .attr("cy", (point) => yScale(point.y))
    .attr("r", (point) => (point.ticker === selectedTicker ? 9 : 6))
    .attr("fill", (point) => colorScale(point.sector))
    .attr("stroke", (point) => (point.ticker === selectedTicker ? "#0f172a" : "#ffffff"))
    .attr("stroke-width", (point) => (point.ticker === selectedTicker ? 2.5 : 1.5))
    .attr("opacity", (point) => (point.ticker === selectedTicker ? 1 : 0.85));

  const selectedPoints = points.filter((point) => point.ticker === selectedTicker);
  const labels = labelsGroup
    .selectAll("text")
    .data(selectedPoints)
    .join("text")
    .attr("x", (point) => xScale(point.x) + 10)
    .attr("y", (point) => yScale(point.y) - 10)
    .attr("fill", "#0f172a")
    .style("font-size", "0.85rem")
    .style("font-weight", "600")
    .text((point) => point.ticker);

  renderAxes(xAxisGroup, yAxisGroup, xScale, yScale, width, height);
  renderLegend(svg, sectors, colorScale, width);

  svg
    .append("text")
    .attr("x", width - margin.right)
    .attr("y", margin.top - 8)
    .attr("text-anchor", "end")
    .style("font-size", "0.95rem")
    .style("font-weight", "600")
    .text("Sector-colored t-SNE embedding");

  const zoom = d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent([1, 8])
    .translateExtent([
      [margin.left, margin.top],
      [width - margin.right, height - margin.bottom],
    ])
    .extent([
      [margin.left, margin.top],
      [width - margin.right, height - margin.bottom],
    ])
    .on("zoom", (event) => {
      const zoomedXScale = event.transform.rescaleX(xScale);
      const zoomedYScale = event.transform.rescaleY(yScale);

      xAxisGroup.call(d3.axisBottom(zoomedXScale).ticks(6));
      yAxisGroup.call(d3.axisLeft(zoomedYScale).ticks(6));

      circles
        .attr("cx", (point) => zoomedXScale(point.x))
        .attr("cy", (point) => zoomedYScale(point.y));

      labels
        .attr("x", (point) => zoomedXScale(point.x) + 10)
        .attr("y", (point) => zoomedYScale(point.y) - 10);
    });

  svg.call(zoom);
}

function renderAxes(
  xAxisGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  yAxisGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  xScale: d3.ScaleLinear<number, number>,
  yScale: d3.ScaleLinear<number, number>,
  width: number,
  height: number,
) {
  xAxisGroup.call(d3.axisBottom(xScale).ticks(6));
  yAxisGroup.call(d3.axisLeft(yScale).ticks(6));

  xAxisGroup
    .append("text")
    .attr("x", width / 2)
    .attr("y", margin.bottom - 8)
    .attr("fill", "currentColor")
    .attr("text-anchor", "middle")
    .style("font-size", "0.9rem")
    .text("t-SNE Dimension 1");

  yAxisGroup
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -(height / 2))
    .attr("y", -48)
    .attr("fill", "currentColor")
    .attr("text-anchor", "middle")
    .style("font-size", "0.9rem")
    .text("t-SNE Dimension 2");
}

function renderLegend(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  sectors: string[],
  colorScale: d3.ScaleOrdinal<string, string>,
  width: number,
) {
  const legend = svg
    .append("g")
    .attr("transform", `translate(${width - margin.right + 16}, ${margin.top + 12})`);

  sectors.forEach((sector, index) => {
    const row = legend.append("g").attr("transform", `translate(0, ${index * 22})`);

    row.append("circle").attr("r", 6).attr("cx", 6).attr("cy", 6).attr("fill", colorScale(sector));
    row
      .append("text")
      .attr("x", 20)
      .attr("y", 10)
      .style("font-size", "0.82rem")
      .text(sector);
  });
}
