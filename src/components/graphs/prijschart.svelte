<script>
    import { onMount } from 'svelte';
    import * as d3 from 'd3';

    export let voertuigenOud = [];
    export let voertuigenNieuw = [];
    export let jaarOud;
    export let jaarNieuw;

    let container;

    const WIDTH = 275;
    const HEIGHT = 360;
    const MARGIN = { top: 40, right: 30, bottom: 60, left: 90 };

    // catalogusprijzen uitlezen + simpele sanity-filter
    function extractPrices(list) {
        const values = (list || [])
            .map((v) => v.catalogusPrijs ?? v.catalogusprijs ?? null)
            .filter((x) => typeof x === 'number' && !Number.isNaN(x))
            // ruwe filter: tussen 1.000 en 300.000 euro
            .filter((x) => x >= 1000 && x <= 300000);

        if (!values.length) {
            return { min: null, max: null, avg: null, count: 0 };
        }

        const min = d3.min(values);
        const max = d3.max(values);
        const sum = values.reduce((t, v) => t + v, 0);
        const avg = sum / values.length;

        return { min, max, avg, count: values.length };
    }

    function draw() {
        if (!container) return;
        container.innerHTML = '';

        const statsOud = extractPrices(voertuigenOud);
        const statsNieuw = extractPrices(voertuigenNieuw);

        if (!statsOud.avg && !statsNieuw.avg) {
            const p = document.createElement('p');
            p.textContent = 'Geen catalogusprijs-data beschikbaar voor deze selectie.';
            container.appendChild(p);
            return;
        }

        const data = [
            {
                jaar: jaarOud,
                ...statsOud,
                label: String(jaarOud),
                color: '#1f77b4'
            },
            {
                jaar: jaarNieuw,
                ...statsNieuw,
                label: String(jaarNieuw),
                color: '#ff7f0e'
            }
        ].filter((d) => d.avg); // alleen jaren met data

        const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
        const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

        const svg = d3
            .select(container)
            .append('svg')
            .attr('width', WIDTH)
            .attr('height', HEIGHT);

        const g = svg
            .append('g')
            .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

        const maxPrice = d3.max(data, (d) => d.max) || 50000;

        // X-as: jaren
        const x = d3
            .scaleBand()
            .domain(data.map((d) => d.label))
            .range([0, innerWidth])
            .padding(0.4);

        // Y-as: prijs
        const y = d3
            .scaleLinear()
            .domain([0, maxPrice * 1.1])
            .nice()
            .range([innerHeight, 0]);

        // X-as tekenen
        const xAxis = d3.axisBottom(x);

        g.append('g')
            .attr('transform', `translate(0,${innerHeight})`)
            .call(xAxis)
            .selectAll('text')
            .attr('font-size', 12);

        g.append('text')
            .attr('x', innerWidth / 2)
            .attr('y', innerHeight + 40)
            .attr('text-anchor', 'middle')
            .attr('font-size', 12)
            .text('Jaar');

        // Y-as tekenen
        const xFormatter = d3.format('~s');

        const yAxis = d3
            .axisLeft(y)
            .ticks(6)
            .tickFormat((v) => `€ ${xFormatter(v).replace('k', 'k')}`);

        g.append('g').call(yAxis);

        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -innerHeight / 2)
            .attr('y', -60)
            .attr('text-anchor', 'middle')
            .attr('font-size', 12)
            .text('Catalogusprijs');

        // groep per jaar
        const group = g
            .selectAll('.year-group')
            .data(data)
            .enter()
            .append('g')
            .attr('class', 'year-group')
            .attr('transform', (d) => {
                const cx = (x(d.label) || 0) + x.bandwidth() / 2;
                return `translate(${cx},0)`;
            });

        // verticale range-lijn (min → max)
        group
            .append('line')
            .attr('x1', 0)
            .attr('x2', 0)
            .attr('y1', (d) => y(d.min))
            .attr('y2', (d) => y(d.max))
            .attr('stroke', (d) => d.color)
            .attr('stroke-width', 8)
            .attr('stroke-linecap', 'round')
            .attr('opacity', 0.35);

        // gemiddelde-dot
        group
            .append('circle')
            .attr('cx', 0)
            .attr('cy', (d) => y(d.avg))
            .attr('r', 7)
            .attr('fill', (d) => d.color)
            .append('title')
            .text(
                (d) =>
                    `${d.jaar}: gemiddeld € ${Math.round(d.avg).toLocaleString('nl-NL')}\n` +
                    `range: € ${Math.round(d.min).toLocaleString('nl-NL')} – € ${Math.round(
                        d.max
                    ).toLocaleString('nl-NL')}`
            );

        // label rechts naast de dot
        group
            .append('text')
            .attr('x', 10)
            .attr('y', (d) => y(d.avg) + 4)
            .attr('font-size', 11)
            .text((d) => `€ ${Math.round(d.avg).toLocaleString('nl-NL')}`);

        // titel
        svg.append('text')
            .attr('x', WIDTH / 2)
            .attr('y', 24)
            .attr('text-anchor', 'middle')
            .attr('font-size', 16)
            .attr('font-weight', '600')
            .text('Catalogusprijs – spreiding per jaar');
    }

    onMount(draw);

    $: if (container && voertuigenOud && voertuigenNieuw) {
        draw();
    }
</script>

<div bind:this={container} class="prijs-chart-container"></div>

<style>
    .prijs-chart-container {
        max-width: 100%;
        overflow-x: auto;
    }

    svg {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 12px;
    }
</style>
