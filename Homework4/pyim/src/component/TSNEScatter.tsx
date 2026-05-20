import * as d3 from "d3";
import { debounce } from "lodash";
import { useEffect, useRef, useState } from "react";
import { ComponentSize } from "../types";
import { fetchTSNE } from "../data/TSNE";


const SECTORS = [
    { key: "consumer" as const, label: "Consumer", color: "#0072B2" },
    { key: "energy" as const, label: "Energy", color: "#E69F00" },
    { key: "financial" as const, label: "Financial", color: "#009E73" },
    { key: "healthcare" as const, label: "Healthcare", color: "#D55E00" },
    { key: "industrial" as const, label: "Industrial", color: "#CC79A7" },
    { key: "technology" as const, label: "Technology", color: "#ddd126dd" },
];

type SectorKey = typeof SECTORS[number]["key"];

interface SectorPoint {
    x: number;
    y: number;
    sector: SectorKey;
    ticker: string;
}

interface TSNEScatterProps {
    selectedStock: string;
}

function normalizeSector(s: string): SectorKey {
    const overrides: Record<string, SectorKey> = {
        Finance: "financial",
        Industrials: "industrial",
    };
    return (overrides[s] ?? s.toLowerCase()) as SectorKey;
}

export function TSNEScatter({ selectedStock }: TSNEScatterProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const [data, setData] = useState<SectorPoint[]>([]);

    useEffect(() => {
        fetchTSNE().then((tsneData) => {
            const sectorData: SectorPoint[] = tsneData.map(d => ({
                x: d.x,
                y: d.y,
                sector: normalizeSector(d.sector),
                ticker: d.ticker,
            }));
            setData(sectorData);
        }).catch((error) => {
            console.error("Error loading t-SNE data:", error);
        });
    }, []);

    useEffect(() => {
        if (!containerRef.current || !svgRef.current || !data.length) {
            return;
        }

        const draw = () => {
            const { width, height } = containerRef.current!.getBoundingClientRect();
            if (width > 0 && height > 0) {
                drawScatterPlot(svgRef.current!, data, width, height, selectedStock);
            }
        };

        const resizeObserver = new ResizeObserver(
            debounce((entries: ResizeObserverEntry[]) => {
                for (const entry of entries) {
                    if (entry.target !== containerRef.current) continue;
                    const { width, height } = entry.contentRect as ComponentSize;
                    if (width && height && data.length) {
                        drawScatterPlot(svgRef.current!, data, width, height, selectedStock);
                    }
                }
            }, 100)
        );

        resizeObserver.observe(containerRef.current);
        draw();

        return () => resizeObserver.disconnect();
    }, [data, selectedStock]);

    return (
        <div ref={containerRef} className="flex min-h-0 w-full flex-1 flex-col" style={{ height: "100%", minHeight: 0 }}>
            <svg ref={svgRef} className="block" preserveAspectRatio="xMinYMin meet" style={{ width: "100%", height: "100%" }} />
        </div>
    );
}

function drawScatterPlot(
    svgEl: SVGSVGElement,
    data: SectorPoint[],
    width: number,
    height: number,
    selectedTicker: string,
) {
    const margin = { top: 20, right: 130, bottom: 50, left: 60 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgEl);
    svg.selectAll("*").remove();
    svg.attr("width", width).attr("height", height);

    const x = d3.scaleLinear().domain(d3.extent(data, d => d.x) as [number, number]).range([margin.left, margin.left + plotWidth]);
    const y = d3.scaleLinear().domain(d3.extent(data, d => d.y) as [number, number]).range([margin.top + plotHeight, margin.top]);

    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${margin.top + plotHeight})`)
        .call(d3.axisBottom(x));

    svg.append("text")
        .attr("class", "x-label")
        .attr("x", margin.left + plotWidth / 2)
        .attr("y", height - 8)
        .attr("text-anchor", "middle")
        .attr("font-size", "13px")
        .attr("fill", "#555")
        .text("t-SNE Dimension 1");

    svg.append("g")
        .attr("class", "y-axis")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));

    svg.append("text")
        .attr("class", "y-label")
        .attr("x", -(margin.top + plotHeight / 2))
        .attr("y", 16)
        .attr("text-anchor", "middle")
        .attr("font-size", "13px")
        .attr("fill", "#555")
        .attr("transform", "rotate(-90)")
        .text("t-SNE Dimension 2");

    const colorScale = d3.scaleOrdinal<SectorKey, string>()
        .domain(SECTORS.map(d => d.key))
        .range(SECTORS.map(d => d.color));

    svg.append("g")
        .selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.x))
        .attr("cy", d => y(d.y))
        .attr("r", d => d.ticker === selectedTicker ? 9 : 4)
        .attr("fill", d => colorScale(d.sector))
        .attr("opacity", d => d.ticker === selectedTicker ? 1 : 0.7)

    const selectedPoint = data.find(d => d.ticker === selectedTicker);
    if (selectedPoint) {
        svg.append("text")
            .datum(selectedPoint)
            .attr("class", "selected-label")
            .attr("x", x(selectedPoint.x))
            .attr("y", y(selectedPoint.y) - 13)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("font-weight", "bold")
            .attr("fill", "#111")
            .attr("pointer-events", "none")
            .text(selectedPoint.ticker);
    }

    const legend = svg.append("g").attr("transform", `translate(${width - margin.right + 10},${margin.top})`);

    const legendItem = legend
        .selectAll("g")
        .data(SECTORS)
        .enter()
        .append("g")
        .attr("transform", (_, i) => `translate(0, ${i * 22})`);

    legendItem
        .append("rect")
        .attr("width", 14)
        .attr("height", 14)
        .attr("fill", d => d.color)
        .attr("rx", 2);

    legendItem
        .append("text")
        .attr("x", 18)
        .attr("y", 11)
        .text(d => d.label)
        .attr("font-size", "12px")
        .attr("fill", "#333");

    const zoomSurface = svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "transparent")
        .attr("pointer-events", "all");

    const zoom = d3.zoom<SVGRectElement, unknown>()
        .scaleExtent([0.5, 20])
        .on("zoom", (event) => {
            const transform = event.transform;
            const zx = transform.rescaleX(x);
            const zy = transform.rescaleY(y);

            svg.selectAll<SVGCircleElement, SectorPoint>("circle")
                .attr("cx", d => zx(d.x))
                .attr("cy", d => zy(d.y));

            svg.selectAll<SVGTextElement, SectorPoint>(".selected-label")
                .attr("x", d => zx(d.x))
                .attr("y", d => zy(d.y) - 13);

            svg.select<SVGGElement>(".x-axis").call(d3.axisBottom(zx));
            svg.select<SVGGElement>(".y-axis").call(d3.axisLeft(zy));
        });

    zoomSurface.call(zoom);
}
