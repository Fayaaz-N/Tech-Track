<script>
    import { onMount } from 'svelte';
    import * as d3 from 'd3';

    // Data wordt van buiten meegegeven als een array van objecten:
    // [{ jaar: 2020, aantal: 123 }, { jaar: 2021, aantal: 98 }, ...]
    export let data = [];

    // Referentie naar de container <div> waar de SVG in komt
    let container;

    // Basis-afmetingen en marges voor de grafiek
    const width = 600;
    const height = 300;
    const margin = { top: 20, right: 20, bottom: 40, left: 40 };

    // Tekent of hertekent de hele grafiek op basis van de huidige data
    function drawChart() {
        if (!container) return;

        // Als er geen data is, maak de container leeg en stop
        if (!data || data.length === 0) {
            container.innerHTML = '';
            return;
        }

        // Eerst de container leegmaken, zodat we niet meerdere SVG's stapelen
        container.innerHTML = '';

        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        // Basis-SVG maken
        const svg = d3
            .select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        // Groep voor de “echte” grafiek, met marges toegepast
        const g = svg
            .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        // X-schaal: één bandje per jaar
        const x = d3
            .scaleBand()
            .domain(
                data.map(function (d) {
                    return d.jaar;
                })
            )
            .range([0, innerWidth])
            .padding(0.1);

        // Y-schaal: loopt van 0 tot max aantal
        const maxAantal = d3.max(data, function (d) {
            return d.aantal;
        }) || 0;

        const y = d3
            .scaleLinear()
            .domain([0, maxAantal])
            .nice() // maakt de as-nummers netter
            .range([innerHeight, 0]);

        // X-as onderaan de grafiek
        g.append('g')
            .attr('transform', 'translate(0,' + innerHeight + ')')
            .call(d3.axisBottom(x).tickFormat(d3.format('d'))); // jaar als 2020 i.p.v. 2,020

        // Y-as links
        g.append('g')
            .call(d3.axisLeft(y));

        // De balken zelf
        g.selectAll('rect')
            .data(data)
            .enter()
            .append('rect')
            .attr('x', function (d) {
                return x(d.jaar);
            })
            .attr('y', function (d) {
                return y(d.aantal);
            })
            .attr('width', x.bandwidth())
            .attr('height', function (d) {
                return innerHeight - y(d.aantal);
            });
    }

    // Eén keer tekenen als de component mount
    onMount(function () {
        drawChart();
    });

    // Wanneer `data` verandert, de grafiek opnieuw tekenen
    $: if (data) {
        drawChart();
    }
</script>

<!-- Hier komt de SVG in te staan -->
<div bind:this={container}></div>
