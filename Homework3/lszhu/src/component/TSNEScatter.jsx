import * as d3 from 'd3';
import { useState, useEffect, useRef } from 'react';
import { isEmpty, debounce } from 'lodash';

// eager: true loads all matching CSVs at build time so no async fetch is needed at runtime
const tsneModules = import.meta.glob(
    '../../data/tsne_result/tsne_p*.csv',
    { query: '?raw', import: 'default', eager: true }
);

// ColorBrewer Dark2, intentionally different palette from the line chart
const SECTOR_COLORS = {
    'Technology':             '#1b9e77',
    'Financial Services':     '#d95f02',
    'Industrials':            '#7570b3',
    'Energy':                 '#e7298a',
    'Communication Services': '#66a61e',
    'Healthcare':             '#e6ab02',
    'Consumer Defensive':     '#a6761d',
    'Consumer Cyclical':      '#666666',
};
const SECTORS = Object.keys(SECTOR_COLORS);

const margin = { left: 45, right: 15, top: 28, bottom: 40 };

// dropdown value format is "AAPL (Apple Inc.)", take only the ticker symbol
function getTicker(selectValue) {
    return selectValue.split(' ')[0];
}

function loadData(perplexity) {
    const filePath = '../../data/tsne_result/tsne_p' + perplexity + '.csv';
    const csvText  = tsneModules[filePath];
    if (!csvText) return [];

    return d3.csvParse(csvText, function(row) {
        return {
            ticker:       row.Ticker,
            sector:       row.Category,
            Latent_TSNE1: +row.Latent_TSNE1,
            Latent_TSNE2: +row.Latent_TSNE2,
            Raw_TSNE1:    +row.Raw_TSNE1,
            Raw_TSNE2:    +row.Raw_TSNE2,
        };
    });
}

export function TSNEScatter() {
    const containerRef = useRef(null);
    const rawSvgRef    = useRef(null);
    const latentSvgRef = useRef(null);

    const [perplexity,     setPerplexity]     = useState(5);
    const [selectedTicker, setSelectedTicker] = useState('AAPL');

    useEffect(function() {
        const select = document.getElementById('bar-select');
        if (!select) return;
        setSelectedTicker(getTicker(select.value));

        function handleChange(event) {
            setSelectedTicker(getTicker(event.target.value));
        }
        select.addEventListener('change', handleChange);
        return function() { select.removeEventListener('change', handleChange); };
    }, []);

    useEffect(function() {
        if (!containerRef.current || !rawSvgRef.current || !latentSvgRef.current) return;

        const data = loadData(perplexity);
        if (isEmpty(data)) return;

        function draw() {
            const rawRect    = rawSvgRef.current.getBoundingClientRect();
            const latentRect = latentSvgRef.current.getBoundingClientRect();
            if (rawRect.width && rawRect.height) {
                drawScatter(rawSvgRef.current, data, rawRect.width, rawRect.height, selectedTicker, 'Raw');
            }
            if (latentRect.width && latentRect.height) {
                drawScatter(latentSvgRef.current, data, latentRect.width, latentRect.height, selectedTicker, 'Latent');
            }
        }

        const resizeObserver = new ResizeObserver(debounce(draw, 100));
        resizeObserver.observe(containerRef.current);
        draw();

        return function() { resizeObserver.disconnect(); };
    }, [perplexity, selectedTicker]);

    return (
        <div ref={containerRef} style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            <div style={{ padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={{ fontSize: '.78rem', whiteSpace: 'nowrap' }}>Perplexity: {perplexity}</span>
                <input
                    type='range' min={3} max={19} step={1} value={perplexity}
                    onChange={function(event) { setPerplexity(+event.target.value); }}
                    style={{ flex: 1 }}
                />
            </div>

            <div style={{ padding: '2px 10px 4px', display: 'flex', flexWrap: 'wrap', gap: '4px 14px', flexShrink: 0 }}>
                {SECTORS.map(function(sector) {
                    return (
                        <div key={sector} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <div style={{ width: 9, height: 9, borderRadius: '50%', background: SECTOR_COLORS[sector] }}></div>
                            <span style={{ fontSize: '.65rem' }}>{sector}</span>
                        </div>
                    );
                })}
            </div>

            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                <svg ref={rawSvgRef}    style={{ width: '50%', height: '100%' }}></svg>
                <svg ref={latentSvgRef} style={{ width: '50%', height: '100%' }}></svg>
            </div>

        </div>
    );
}

function drawScatter(svgElement, data, width, height, selectedTicker, scoreType) {
    const svg = d3.select(svgElement);
    svg.selectAll('*').remove();

    const plotWidth  = width  - margin.left - margin.right;
    const plotHeight = height - margin.top  - margin.bottom;
    if (plotWidth <= 0 || plotHeight <= 0) return;

    const xField = scoreType + '_TSNE1';
    const yField = scoreType + '_TSNE2';

    const xScale = d3.scaleLinear()
        .domain(d3.extent(data, function(row) { return row[xField]; })).nice()
        .range([0, plotWidth]);

    // range is reversed: plotHeight = bottom of screen, 0 = top
    const yScale = d3.scaleLinear()
        .domain(d3.extent(data, function(row) { return row[yField]; })).nice()
        .range([plotHeight, 0]);

    // clip path keeps dots inside the plot area during zoom/pan
    const clipPath = svg.append('defs').append('clipPath').attr('id', scoreType + '-clip');
    clipPath.append('rect').attr('width', plotWidth).attr('height', plotHeight);

    const mainGroup = svg.append('g');
    mainGroup.attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

    // invisible rect so zoom/pan events fire over empty space
    mainGroup.append('rect')
        .attr('width', plotWidth).attr('height', plotHeight)
        .attr('fill', 'none').attr('pointer-events', 'all');

    const dotsGroup = mainGroup.append('g');
    dotsGroup.attr('clip-path', 'url(#' + scoreType + '-clip)');

    const circles = dotsGroup.selectAll('circle')
        .data(data.filter(function(row) { return row.ticker !== selectedTicker; }))
        .join('circle')
        .attr('cx', function(row) { return xScale(row[xField]); })
        .attr('cy', function(row) { return yScale(row[yField]); })
        .attr('r', 5)
        .attr('fill', function(row) { return SECTOR_COLORS[row.sector] || '#aaa'; })
        .attr('opacity', 0.75);

    const selectedRow = data.find(function(row) { return row.ticker === selectedTicker; });

    const boxW    = 135;
    let   boxH    = 0;
    let   boxLines = [];
    let   highlightCircle = null;
    let   highlightLabel  = null;

    if (selectedRow) {
        boxLines = [
            selectedRow.ticker,
            selectedRow.sector,
            'TSNE1: ' + selectedRow[xField].toFixed(2),
            'TSNE2: ' + selectedRow[yField].toFixed(2),
        ];
        boxH = boxLines.length * 14 + 8;

        highlightCircle = dotsGroup.append('circle')
            .attr('cx', xScale(selectedRow[xField]))
            .attr('cy', yScale(selectedRow[yField]))
            .attr('r', 10)
            .attr('fill', SECTOR_COLORS[selectedRow.sector] || '#aaa')
            .attr('stroke', 'black')
            .attr('stroke-width', 2);

        // info box flips left if the dot is near the right edge
        const dotScreenX = margin.left + xScale(selectedRow[xField]);
        const dotScreenY = margin.top  + yScale(selectedRow[yField]);

        let boxX = dotScreenX + 14;
        let boxY = dotScreenY - boxH / 2;
        if (boxX + boxW > width)  boxX = dotScreenX - boxW - 14;
        if (boxY < 2)             boxY = 2;
        if (boxY + boxH > height) boxY = height - boxH - 2;

        highlightLabel = svg.append('g');
        highlightLabel.attr('transform', 'translate(' + boxX + ', ' + boxY + ')');
        highlightLabel.append('rect')
            .attr('width', boxW).attr('height', boxH)
            .attr('rx', 4).attr('fill', 'white')
            .attr('stroke', '#999').attr('stroke-width', 1);

        for (let index = 0; index < boxLines.length; index++) {
            const textEl = highlightLabel.append('text')
                .attr('x', 6).attr('y', 13 + index * 14)
                .style('font-size', '.7rem');
            if (index === 0) {
                textEl.style('font-weight', 'bold');
            }
            textEl.text(boxLines[index]);
        }
    }

    const xAxisGroup = mainGroup.append('g');
    xAxisGroup.attr('transform', 'translate(0, ' + plotHeight + ')');
    xAxisGroup.call(d3.axisBottom(xScale).ticks(5));

    const yAxisGroup = mainGroup.append('g');
    yAxisGroup.call(d3.axisLeft(yScale).ticks(5));

    svg.append('g')
        .attr('transform', 'translate(11, ' + (margin.top + plotHeight / 2) + ') rotate(-90)')
        .append('text').text('t-SNE 2').style('font-size', '.72rem');

    svg.append('g')
        .attr('transform', 'translate(' + (margin.left + plotWidth / 2) + ', ' + (height - 3) + ')')
        .append('text').text('t-SNE 1').style('font-size', '.72rem').style('text-anchor', 'middle');

    svg.append('text')
        .attr('x', margin.left + plotWidth / 2).attr('y', 16)
        .style('text-anchor', 'middle')
        .style('font-size', '.82rem').style('font-weight', 'bold')
        .text(scoreType + ' t-SNE');

    let currentXScale = xScale;
    let currentYScale = yScale;

    const zoom = d3.zoom()
        .scaleExtent([0.5, 20])
        .on('zoom', function(event) {
            currentXScale = event.transform.rescaleX(xScale);
            currentYScale = event.transform.rescaleY(yScale);

            circles.attr('cx', function(row) { return currentXScale(row[xField]); })
                   .attr('cy', function(row) { return currentYScale(row[yField]); });

            xAxisGroup.call(d3.axisBottom(currentXScale).ticks(5));
            yAxisGroup.call(d3.axisLeft(currentYScale).ticks(5));

            if (selectedRow && highlightCircle) {
                const newCx = currentXScale(selectedRow[xField]);
                const newCy = currentYScale(selectedRow[yField]);
                highlightCircle.attr('cx', newCx).attr('cy', newCy);

                if (highlightLabel) {
                    const dotScreenX = margin.left + newCx;
                    const dotScreenY = margin.top  + newCy;
                    let boxX = dotScreenX + 14;
                    let boxY = dotScreenY - boxH / 2;
                    if (boxX + boxW > width)  boxX = dotScreenX - boxW - 14;
                    if (boxY < 2)             boxY = 2;
                    if (boxY + boxH > height) boxY = height - boxH - 2;
                    highlightLabel.attr('transform', 'translate(' + boxX + ', ' + boxY + ')');
                }
            }
        });

    mainGroup.call(zoom);
    mainGroup.on('dblclick.zoom', function() {
        mainGroup.transition().duration(300).call(zoom.transform, d3.zoomIdentity);
    });
}
