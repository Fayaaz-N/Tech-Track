<script>
    import * as d3 from 'd3';

    // range-data:
    // [{ jaar, gemiddeldeGewicht, aantal }]
    export let gewichtPerJaar = [];

    let container;

    const WIDTH = 700;
    const HEIGHT = 400;
    const MARGIN = { top: 40, right: 20, bottom: 60, left: 70 };

    function draw() {
        if (!container) return;
        container.innerHTML = '';

        const raw = Array.isArray(gewichtPerJaar) ? gewichtPerJaar : [];

        const data = raw
            .map((d) => ({
                jaar: d.jaar,
                avg: typeof d.gemiddeldeGewicht === 'number' ? d.gemiddeldeGewicht : null
            }))
            .filter((d) => d.avg !== null && !Number.isNaN(d.avg))
            .sort((a, b) => a.jaar - b.jaar);

        if (!data.length) {
            const p = document.createElement('p');
            p.textContent = 'Geen gewicht-data beschikbaar voor deze selectie.';
            container.appendChild(p);
            return;
        }


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

        const maxKg = d3.max(data, (d) => d.avg) || 2000;

        const x = d3
            .scaleBand()
            .domain(data.map((d) => String(d.jaar)))
            .range([0, innerWidth])
            .padding(0.4);

        const y = d3
            .scaleLinear()
            .domain([0, maxKg * 1.2])
            .nice()
            .range([innerHeight, 0]);

        // X-as (jaartallen)
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

        // Y-as (kg)
        const yAxis = d3.axisLeft(y).ticks(6);

        g.append('g').call(yAxis);

        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -innerHeight / 2)
            .attr('y', -50)
            .attr('text-anchor', 'middle')
            .attr('font-size', 12)
            .text('Gemiddeld gewicht (kg)');

        // Balken
        g.selectAll('.bar')
            .data(data)
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', (d) => x(String(d.jaar)))
            .attr('y', (d) => y(d.avg))
            .attr('width', x.bandwidth())
            .attr('height', (d) => innerHeight - y(d.avg))
            .attr('fill', '#1f77b4')
            .attr('opacity', 0.9)
            .append('title')
            .text((d) => `${d.jaar}: ${d.avg.toFixed(0)} kg gemiddeld`);

        // Label boven de balk
        g.selectAll('.bar-label')
            .data(data)
            .enter()
            .append('text')
            .attr('class', 'bar-label')
            .attr('x', (d) => (x(String(d.jaar)) || 0) + x.bandwidth() / 2)
            .attr('y', (d) => y(d.avg) - 8)
            .attr('text-anchor', 'middle')
            .attr('font-size', 12)
            .attr('font-weight', '600')
            .text((d) => `${d.avg.toFixed(0)} kg`);

        // Titel
        svg.append('text')
            .attr('x', WIDTH / 2)
            .attr('y', 24)
            .attr('text-anchor', 'middle')
            .attr('font-size', 16)
            .attr('font-weight', '600')
            .text('Gemiddeld gewicht per jaar');
    }

    $: if (container && gewichtPerJaar) {
        draw();
    }
</script>

<div bind:this={container} class="gewicht-chart-container"></div>

<style>
    .gewicht-chart-container {
        max-width: 100%;
        overflow-x: auto;
    }

    svg {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
        sans-serif;
        font-size: 12px;
    }
</style>
