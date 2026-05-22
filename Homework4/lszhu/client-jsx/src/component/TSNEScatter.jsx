import * as d3 from 'd3';
import { useState, useEffect, useRef } from 'react';
import { isEmpty, debounce } from 'lodash';

const API_BASE = 'http://localhost:8000';

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

async function loadData(perplexity) {
    const response = await fetch(API_BASE + '/tsne/?perplexity=' + perplexity);
    if (!response.ok) return [];
    const json = await response.json();
    return json.map(function(row) {
        return {
            ticker:       row.Stock,
            sector:       row.Category,
            Latent_TSNE1: row.latent_x,
            Latent_TSNE2: row.latent_y,
            Raw_TSNE1:    row.x,
            Raw_TSNE2:    row.y,
        };
    });
}

export function TSNEScatter() {
    const containerRef = useRef(null);
    const svgRef       = useRef(null);

    const [perplexity,     setPerplexity]     = useState(5);
    const [selectedTicker, setSelectedTicker] = useState('AAPL');
    const [scoreType,      setScoreType]      = useState('Raw');

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
        if (!containerRef.current || !svgRef.current) return;

        let resizeObserver;

        loadData(perplexity).then(function(data) {
            if (isEmpty(data)) return;

            function draw() {
                const rect = svgRef.current.getBoundingClientRect();
                if (rect.width && rect.height) {
                    drawScatter(svgRef.current, data, rect.width, rect.height, selectedTicker, scoreType);
                }
            }

            resizeObserver = new ResizeObserver(debounce(draw, 100));
            resizeObserver.observe(containerRef.current);
            draw();
        });

        return function() { if (resizeObserver) resizeObserver.disconnect(); };
    }, [perplexity, selectedTicker, scoreType]);

    return (
        <div ref={containerRef} style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            <div style={{ padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={{ fontSize: '.78rem', whiteSpace: 'nowrap' }}>Perplexity:</span>
                <select
                    value={perplexity}
                    onChange={function(event) { setPerplexity(+event.target.value); }}
                    style={{ fontSize: '.78rem', padding: '1px 4px', borderRadius: 4, border: '1px solid #ccc' }}
                >
                    {Array.from({ length: 17 }, function(_, i) { return i + 3; }).map(function(p) {
                        return <option key={p} value={p}>{p}</option>;
                    })}
                </select>
                <span style={{ fontSize: '.78rem', whiteSpace: 'nowrap' }}>Score:</span>
                {['Raw', 'Latent'].map(function(type) {
                    return (
                        <button
                            key={type}
                            onClick={function() { setScoreType(type); }}
                            style={{
                                fontSize: '.75rem', padding: '1px 8px', borderRadius: 4, cursor: 'pointer',
                                border: '1px solid #ccc',
                                background: scoreType === type ? '#334155' : '#f1f5f9',
                                color: scoreType === type ? 'white' : '#334155',
                            }}
                        >
                            {type}
                        </button>
                    );
                })}
                <span style={{ fontSize: '.68rem', color: '#888', whiteSpace: 'nowrap' }}>
                    Scroll to zoom · Drag to pan · Double-click to reset
                </span>
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

            <div style={{ flex: 1, overflow: 'hidden' }}>
                <svg ref={svgRef} style={{ width: '100%', height: '100%' }}></svg>
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

    const [xMin, xMax] = d3.extent(data, function(row) { return row[xField]; });
    const [yMin, yMax] = d3.extent(data, function(row) { return row[yField]; });
    const xPad = (xMax - xMin) * 0.1;
    const yPad = (yMax - yMin) * 0.1;

    const xScale = d3.scaleLinear()
        .domain([xMin - xPad, xMax + xPad])
        .range([0, plotWidth]);

    // range is reversed: plotHeight = bottom of screen, 0 = top
    const yScale = d3.scaleLinear()
        .domain([yMin - yPad, yMax + yPad])
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
