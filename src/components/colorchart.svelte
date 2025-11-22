<script>
    import * as d3 from 'd3';

    export let data = [];
    let container;

    const colorMap = {
        WIT: '#f5f5f5',
        ZWART: '#111111',
        GRIJS: '#b0b0b0',
        BLAUW: '#1565c0',
        ROOD: '#e53935',
        GROEN: '#43a047',
        GEEL: '#fdd835',
        ORANJE: '#fb8c00',
        BRUIN: '#8d6e63',
        PAARS: '#8e24aa'
    };

    function nameToColor(name) {
        const key = (name || '').trim().toUpperCase();
        return colorMap[key] || '#cccccc';
    }

    // ---- NIEUW: helpers voor contrastkleur ----
    function hexToRgb(hex) {
        const clean = hex.replace('#', '');
        const bigint = parseInt(clean, 16);
        return {
            r: (bigint >> 16) & 255,
            g: (bigint >> 8) & 255,
            b: bigint & 255
        };
    }

    function getContrastColor(hex) {
        const { r, g, b } = hexToRgb(hex);
        // relative luminance (simpel model)
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        // boven ~0.6 = licht → zwarte tekst, anders witte tekst
        return luminance > 0.6 ? '#000000' : '#ffffff';
    }

    function draw() {
        if (!container) return;

        container.innerHTML = '';
        if (!data || data.length === 0) return;

        const width = 700;
        const height = 400;
        const margin = { top: 10, right: 10, bottom: 10, left: 10 };

        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const rootData = {
            name: 'root',
            children: data.map((d) => ({
                name: d.kleur,
                value: +d.aantal || 0
            }))
        };

        const root = d3
            .hierarchy(rootData)
            .sum((d) => d.value)
            .sort((a, b) => b.value - a.value);

        d3.treemap()
            .size([innerWidth, innerHeight])
            .paddingInner(2)(root);

        const svg = d3
            .select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        const g = svg
            .append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);

        const leaves = root.leaves();

        const tiles = g
            .selectAll('g.tile')
            .data(leaves)
            .enter()
            .append('g')
            .attr('class', 'tile')
            .attr('transform', (d) => `translate(${d.x0}, ${d.y0})`);

        tiles
            .append('rect')
            .attr('width', (d) => d.x1 - d.x0)
            .attr('height', (d) => d.y1 - d.y0)
            .attr('fill', (d) => nameToColor(d.data.name))
            .attr('stroke', '#fff')
            .attr('stroke-width', 1);

        const labelTiles = tiles.filter(
            (d) => (d.x1 - d.x0) > 60 && (d.y1 - d.y0) > 30
        );

        labelTiles
            .append('text')
            .attr('x', 4)
            .attr('y', 16)
            .attr('font-size', 12)
            .attr('font-weight', '600')
            .attr('fill', (d) => {
                const bg = nameToColor(d.data.name);
                return getContrastColor(bg);
            })
            .text((d) => d.data.name);

        labelTiles
            .append('text')
            .attr('x', 4)
            .attr('y', 32)
            .attr('font-size', 11)
            .attr('fill', (d) => {
                const bg = nameToColor(d.data.name);
                return getContrastColor(bg);
            })
            .text((d) => d.data.value + ' Aantal auto`s');
    }

    $: if (container && data) {
        draw();
    }
</script>

<div bind:this={container}></div>
