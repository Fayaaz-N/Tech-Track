<script>
    import { onMount } from 'svelte';
    import * as d3 from 'd3';

    // we krijgen direct per-jaar stats binnen:
    // [{ jaar, gemiddeldePrijs, minPrijs, maxPrijs, aantal }]
    export let prijsPerJaar = [];

    let container;

    const WIDTH = 425;
    const HEIGHT = 560;
    const MARGIN = { top: 40, right: 30, bottom: 60, left: 90 };

    // gekozen punt voor de legenda onder de chart
    let activePoint = null;

    // zelfde sanity-filter als in de rest van je app:
    // alleen prijzen tussen 1.000 en 300.000 euro
    const clampPrice = (raw) => {
        const n = Number(raw);
        if (Number.isNaN(n)) return null;
        if (n < 1000 || n > 300000) return null;
        return n;
    };

    const formatEuro = (n) =>
        typeof n === 'number'
            ? `€ ${Math.round(n).toLocaleString('nl-NL')}`
            : '–';

    function draw() {
        if (!container) return;
        container.innerHTML = '';

        const raw = Array.isArray(prijsPerJaar) ? prijsPerJaar : [];

        // mappen naar vorm die de oude graph verwachtte,
        // maar nu MET dezelfde prijsfilter (1k–300k)
        const data = raw
            .map((d, i) => {
                const avg = clampPrice(d.gemiddeldePrijs ?? d.avg ?? null);
                if (avg === null) return null;

                let min = clampPrice(d.minPrijs ?? d.min ?? avg);
                let max = clampPrice(d.maxPrijs ?? d.max ?? avg);

                // als min/max wegvallen door filter → val terug op avg
                if (min === null) min = avg;
                if (max === null) max = avg;

                // veiligheid: max altijd ≥ min
                if (max < min) max = min;

                return {
                    jaar: d.jaar,
                    min,
                    max,
                    avg,
                    aantal: d.aantal ?? null,
                    label: String(d.jaar),
                    // kleuren afwisselen, eerste twee zoals je had
                    color: i % 2 === 0 ? '#1f77b4' : '#ff7f0e'
                };
            })
            .filter(Boolean);

        if (!data.length) {
            const p = document.createElement('p');
            p.textContent =
                'Geen catalogusprijs-data beschikbaar voor deze selectie.';
            container.appendChild(p);
            activePoint = null;
            return;
        }

        // standaard actief punt (eerste jaar) als er nog niets gekozen is
        if (!activePoint) {
            activePoint = data[0];
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

        // gemiddelde-dot (klikbaar)
        group
            .append('circle')
            .attr('cx', 0)
            .attr('cy', (d) => y(d.avg))
            .attr('r', 7)
            .attr('fill', (d) => d.color)
            .style('cursor', 'pointer')
            .append('title')
            .text(
                (d) =>
                    `${d.jaar}: gemiddeld € ${Math.round(d.avg).toLocaleString(
                        'nl-NL'
                    )}\n` +
                    `range: € ${Math.round(d.min).toLocaleString(
                        'nl-NL'
                    )} – € ${Math.round(d.max).toLocaleString('nl-NL')}`
            );

        // klik-handler om de legenda te updaten
        group
            .selectAll('circle')
            .on('click', (_event, d) => {
                activePoint = d;
            });

        // LET OP: geen tekstlabels meer naast de dot → geen overlap

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

    // opnieuw tekenen als de data verandert
    $: if (container && prijsPerJaar) {
        draw();
    }
</script>

<div bind:this={container} class="prijs-chart-container"></div>

<!-- legenda / info-panel onder de grafiek -->
<section class="prijs-legend">
    {#if activePoint}
        <h4>Jaar {activePoint.jaar}</h4>
        <p>
            Gemiddelde prijs:
            <strong>{formatEuro(activePoint.avg)}</strong>
        </p>
        <p>
            Bereik:
            {formatEuro(activePoint.min)} – {formatEuro(activePoint.max)}<br />
            Aantal voertuigen:
            {activePoint.aantal ?? 'onbekend'}
        </p>
        <p class="hint">Klik op een andere stip om dat jaar te bekijken.</p>
    {:else}
        <p class="hint">
            Klik op een stip in de grafiek voor details over dat jaar.
        </p>
    {/if}
</section>

<style>
    .prijs-chart-container {
        max-width: 100%;
        margin-left: -20px;
        overflow-x: visible;
    }

    svg {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
        sans-serif;
        font-size: 12px;
    }

    .prijs-legend {
        margin-top: 0.8rem;
        font-size: 0.9rem;
    }

    .prijs-legend h4 {
        margin-bottom: 0.3rem;
    }

    .prijs-legend .hint {
        margin-top: 0.3rem;
        color: #666;
        font-size: 0.85rem;
    }
</style>
