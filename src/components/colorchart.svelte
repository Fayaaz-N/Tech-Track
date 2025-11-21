<script>
    import { onMount } from 'svelte';
    import * as d3 from 'd3';

    // verwacht: [{ kleur: 'GRIJS', aantal: 540 }, ...]
    export let data = [];

    let container;

    onMount(() => {
        draw();
    });

    // opnieuw tekenen als data verandert én er data is
    $: if (container && data && data.length > 0) {
        draw();
    }

    const draw = () => {
        if (!container) return;

        // even checken wat er binnenkomt
        console.log('Treemap data:', data);

        if (!data || data.length === 0) {
            container.innerHTML = '';
            return;
        }

        // container leegmaken
        container.innerHTML = '';

        const width = 700;
        const height = 400;
        const margin = { top: 10, right: 10, bottom: 10, left: 10 };

        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        // treemap werkt met een hiërarchie: root → children
        const rootData = {
            name: 'root',
            children: data.map((d) => ({
                name: d.kleur,
                value: d.aantal
            }))
        };

        const root = d3
            .hierarchy(rootData)
            .sum((d) => d.value)
            .sort((a, b) => b.value - a.value);

        const treemapLayout = d3
            .treemap()
            .size([innerWidth, innerHeight])
            .paddingInner(2);

        treemapLayout(root);

        const svg = d3
            .select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        const g = svg
            .append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);

        const leaves = root.leaves();

        // kleurenschaal op basis van naam
        const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

        // tiles
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
            .attr('fill', (d) => colorScale(d.data.name))
            .attr('stroke', '#fff')
            .attr('stroke-width', 1);

        // text: kleurnaam + waarde, alleen tonen als er een beetje ruimte is
        const minFontSize = 10;

        tiles
            .append('text')
            .attr('x', 4)
            .attr('y', 16)
            .attr('fill', 'white')
            .attr('font-size', (d) => {
                const w = d.x1 - d.x0;
                const h = d.y1 - d.y0;
                if (w < 50 || h < 20) {
                    return 0; // te klein, geen tekst
                }
                return minFontSize;
            })
            .text((d) => `${d.data.name} (${d.data.value})`);
    };
</script>

<div bind:this={container}></div>
