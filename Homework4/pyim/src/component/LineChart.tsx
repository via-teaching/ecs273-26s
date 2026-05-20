import * as d3 from "d3";
import { debounce, isEmpty } from "lodash";
import { useEffect, useRef, useState } from "react";
import type { ComponentSize, Margin } from "../types";
import type { StockRow } from "../types";
import { fetchStockData } from "../data/Stock";
const margin = { left: 72, right: 120, top: 24, bottom: 72 } as Margin;

/** Minimum horizontal pixels per observation at 1× zoom so long series scrolls. */
const MIN_PX_PER_POINT = 3;

const SERIES = [
    { key: "close" as const, label: "Close", color: "#0072B2" },
    { key: "open" as const, label: "Open", color: "#E69F00" },
    { key: "high" as const, label: "High", color: "#009E73" },
    { key: "low" as const, label: "Low", color: "#D55E00" },
];



export function LineChart({ stock = "AAPL" }: { stock?: string }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const [data, setData] = useState<StockRow[] | null>(null);

    useEffect(() => {
        fetchStockData(stock).then((data: StockRow[]) => {
            setData(data);
        });
    }, [stock]);

    useEffect(() => {
        if (!containerRef.current || !scrollRef.current || !svgRef.current || !data?.length) {
            return;
        }

        const draw = () => {
            const { width: cw, height: ch } = containerRef.current!.getBoundingClientRect();
            if (cw > 0 && ch > 0) {
                drawLineChart(svgRef.current!, data, cw, ch);
            }
        };

        const resizeObserver = new ResizeObserver(
            debounce((entries: ResizeObserverEntry[]) => {
                for (const entry of entries) {
                    if (entry.target !== containerRef.current) continue;
                    const { width, height } = entry.contentRect as ComponentSize;
                    if (width && height && data?.length && !isEmpty(data)) {
                        drawLineChart(svgRef.current!, data, width, height);
                    }
                }
            }, 100)
        );

        resizeObserver.observe(containerRef.current);
        draw();

        return () => resizeObserver.disconnect();
    }, [data]);

    return (
        <div
            ref={containerRef}
            className="flex min-h-0 w-full flex-1 flex-col"
            style={{ height: "100%", minHeight: 0 }}
        >
            <div
                ref={scrollRef}
                className="min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-hidden"
                style={{ WebkitOverflowScrolling: "touch" }}
            >
                <svg ref={svgRef} className="block" preserveAspectRatio="xMinYMin meet" />
            </div>
        </div>
    );
}

function drawLineChart(
    svgEl: SVGSVGElement,
    data: StockRow[],
    containerWidth: number,
    containerHeight: number
) {
    const plotHeight = Math.max(300, containerHeight -  Math.min(40, containerHeight * 0.25) - margin.top - margin.bottom);

    const innerW = Math.max(
        containerWidth - margin.left - margin.right,
        data.length * MIN_PX_PER_POINT
    );
    const innerH = Math.max(100, plotHeight - margin.top - margin.bottom);

    const svg = d3.select(svgEl);
    svg.selectAll("*").remove();

    const totalW = margin.left + innerW + margin.right;
    svg.attr("width", totalW).attr("height", plotHeight);

    const x = d3
        .scaleUtc()
        .domain(d3.extent(data, (d) => d.date) as [Date, Date])
        .range([0, innerW]);

    const yMin = d3.min(data, (d) => Math.min(...[d.close, d.open, d.high, d.low])) ?? 0;
    const yMax = d3.max(data, (d) => Math.max(...[d.close, d.open, d.high, d.low])) ?? 1;
    const yPad = (yMax - yMin) * 0.06 || 1;
    const y = d3
        .scaleLinear()
        .domain([yMin - yPad, yMax + yPad])
        .nice()
        .range([innerH, 0]);

    const root = svg.append("g").attr("class", "line-chart-root");

    const inner = root.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const clipId = `line-clip-${Math.random().toString(36).slice(2)}`;
    inner
        .append("clipPath")
        .attr("id", clipId)
        .append("rect")
        .attr("width", innerW)
        .attr("height", innerH);

    const plotG = inner.append("g").attr("clip-path", `url(#${clipId})`);

    const pathFor = (xz: d3.ScaleTime<number, number>, field: (typeof SERIES)[number]["key"]) =>
        d3
            .line<StockRow>()
            .defined((d) => !Number.isNaN(+d.date) && !Number.isNaN(d[field]))
            .x((d) => xz(d.date))
            .y((d) => y(d[field]));

    const pathSel = plotG
        .selectAll<SVGPathElement, string>("path.line")
        .data(SERIES.map((s) => s.key))
        .join("path")
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke-width", 2)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round");

    const gx = inner.append("g").attr("transform", `translate(0,${innerH})`);
    const gy = inner.append("g");

    const xAxis = (g: d3.Selection<SVGGElement, unknown, null, undefined>, scale: d3.ScaleTime<number, number>) => {
        const ticks = Math.min(14, Math.max(4, Math.floor(innerW / 80)));
        g.call(
            d3
                .axisBottom(scale)
                .ticks(ticks)
                .tickFormat(d3.utcFormat("%Y-%m-%d") as (d: Date | d3.NumberValue, i: number) => string)
        );
        g.selectAll("text")
            .attr("transform", "rotate(-35)")
            .style("text-anchor", "end")
            .attr("dx", "-0.35em")
            .attr("dy", "0.35em");
    };

    const yAxis = (g: d3.Selection<SVGGElement, unknown, null, undefined>) => {
        g.call(
            d3
                .axisLeft(y)
                .ticks(8)
                .tickFormat((v) => `$${Number(v.valueOf()).toFixed(0)}`)
        );
    };

    const zoomSurface = inner
        .append("rect")
        .attr("class", "zoom-surface")
        .attr("width", innerW)
        .attr("height", innerH)
        .attr("fill", "transparent")
        .attr("cursor", "grab");

    const updatePaths = (xz: d3.ScaleTime<number, number>) => {
        pathSel.each(function (seriesKey: string) {
            const field = seriesKey as (typeof SERIES)[number]["key"];
            const color = SERIES.find((s) => s.key === seriesKey)?.color ?? "#333";
            d3.select(this)
                .attr("stroke", color)
                .attr("d", pathFor(xz, field)(data) ?? "");
        });
    };

    updatePaths(x);
    gx.call((g) => xAxis(g, x));
    gy.call(yAxis);

    svg
        .append("text")
        .attr("x", margin.left + innerW / 2)
        .attr("y", plotHeight - 18)
        .attr("text-anchor", "middle")
        .style("font-size", "13px")
        .text("Date (UTC)");

    svg
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -(margin.top + innerH / 2))
        .attr("y", 18)
        .attr("text-anchor", "middle")
        .style("font-size", "13px")
        .text("Stock Price (USD)");

    const legend = svg
        .append("g")
        .attr("transform", `translate(${margin.left + innerW + 10}, ${margin.top + 8})`);

    SERIES.forEach((s, i) => {
        const g = legend.append("g").attr("transform", `translate(0,${i * 22})`);
        g.append("rect").attr("width", 14).attr("height", 14).attr("rx", 2).attr("fill", s.color);
        g.append("text")
            .attr("x", 20)
            .attr("y", 11)
            .attr("dominant-baseline", "middle")
            .style("font-size", "12px")
            .text(s.label);
    });

    const zoom = d3
        .zoom<SVGRectElement, unknown>()
        .scaleExtent([1, 40])
        .extent([
            [0, 0],
            [innerW, innerH],
        ])
        .translateExtent([
            [-innerW * 10, 0],
            [innerW * 11, innerH],
        ])
        .on("zoom", (event: d3.D3ZoomEvent<SVGRectElement, unknown>) => {
            const t = event.transform;
            const horizontal = d3.zoomIdentity.translate(t.x, 0).scale(t.k);
            const xz = horizontal.rescaleX(x);
            updatePaths(xz);
            gx.call((g) => xAxis(g, xz));
            zoomSurface.style("cursor", event.sourceEvent?.type === "mousedown" ? "grabbing" : "grab");
        });

    zoomSurface.call(zoom);
}