<script>
    import * as d3 from 'd3';

    export let voertuigenOud = [];
    export let voertuigenNieuw = [];
    export let jaarOud;
    export let jaarNieuw;

    let container;

    const WIDTH = 300;
    const HEIGHT = 400;
    const MARGIN = { top: 40, right: 20, bottom: 60, left: 70 };

    // Gewichten uitlezen + simpele sanity filter
    function extractWeights(list) {
        const waarden = (list || [])
            .map((v) => v.massaKg ?? v.massa_kg ?? null)
            .filter((x) => typeof x === 'number' && !Number.isNaN(x))
            .filter((x) => x >= 400 && x <= 4000); // personenauto's ongeveer

        if (!waarden.length) {
            return { avg: null, values: [] };
        }

        const som = waarden.reduce((t, v) => t + v, 0);
        return {
            avg: som / waarden.length,
            values: waarden
        };
    }

    function draw() {
        if (!container) return;
        container.innerHTML = '';

        const oud = extractWeights(voertuigenOud);
        const nieuw = extractWeights(voertuigenNieuw);

        if (!oud.avg && !nieuw.avg) {
            const p = document.createElement('p');
            p.textContent = 'Geen gewicht-data beschikbaar voor deze selectie.';
            container.appendChild(p);
            return;
        }

        // als één van beide mist, gebruik de ander zodat de schaal niet crasht
        const avgOud = oud.avg ?? nieuw.avg;
        const avgNieuw = nieuw.avg ?? oud.avg;

        const data = [
            { jaar: jaarOud, avg: avgOud, kleur: '#1f77b4' },
            { jaar: jaarNieuw, avg: avgNieuw, kleur: '#ff7f0e' }
        ];

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
            .attr('fill', (d) => d.kleur)
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
            .text(`Gemiddeld gewicht ${jaarOud} vs ${jaarNieuw}`);
    }

    $: if (container && voertuigenOud && voertuigenNieuw) {
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
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 12px;
    }
</style>
