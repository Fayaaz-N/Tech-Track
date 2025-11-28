<script>
    import * as d3 from 'd3';

    // chinaData = { merkNetjes, verkoopPerJaar: [{ jaar, aantal }, ...] }
    // westData  = { merkNetjes, verkoopPerJaar: [{ jaar, aantal }, ...] }
    export let chinaData = null;
    export let westData = null;

    const HEIGHT = 420;
    const MARGIN = { top: 60, right: 40, bottom: 70, left: 80 };

    let data = [];
    let WIDTH = 800;
    let innerWidth = 0;
    let innerHeight = 0;

    let x0;
    let x1;
    let y;
    let ready = false;

    const brandKeyChina = 'china';
    const brandKeyWest = 'west';

    const brandMeta = {
        [brandKeyChina]: {
            kleur: '#e74c3c'
        },
        [brandKeyWest]: {
            kleur: '#2980b9'
        }
    };

    // Reactieve labels die direct aan de props hangen
    $: chinaLabel = chinaData?.merkNetjes || 'Chinees merk';
    $: westLabel = westData?.merkNetjes || 'Westers merk';

    $: {
        if (!chinaData || !westData) {
            data = [];
            ready = false;
        } else {
            const chinaMap = new Map(
                (chinaData.verkoopPerJaar || []).map((d) => [d.jaar, d.aantal])
            );
            const westMap = new Map(
                (westData.verkoopPerJaar || []).map((d) => [d.jaar, d.aantal])
            );

            const jaarSet = new Set([
                ...chinaMap.keys(),
                ...westMap.keys()
            ]);
            const jaren = Array.from(jaarSet).sort((a, b) => a - b);

            data = jaren.map((jaar) => ({
                jaar,
                china: chinaMap.get(jaar) ?? 0,
                west: westMap.get(jaar) ?? 0
            }));

            const maxValue =
                d3.max(data, (d) => Math.max(d.china, d.west)) || 0;

            const minWidth = 640;
            const perYear = 90;
            WIDTH =
                Math.max(minWidth, jaren.length * perYear) +
                MARGIN.left +
                MARGIN.right;

            innerWidth = WIDTH - MARGIN.left - MARGIN.right;
            innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

            if (data.length && maxValue > 0) {
                x0 = d3
                    .scaleBand()
                    .domain(jaren)
                    .range([0, innerWidth])
                    .padding(0.25);

                x1 = d3
                    .scaleBand()
                    .domain([brandKeyChina, brandKeyWest])
                    .range([0, x0.bandwidth()])
                    .padding(0.25);

                y = d3
                    .scaleLinear()
                    .domain([0, maxValue * 1.15])
                    .nice()
                    .range([innerHeight, 0]);

                ready = true;
            } else {
                ready = false;
            }
        }
    }
</script>

{#if !chinaData || !westData}
    <p>Geen data om te tonen.</p>
{:else if !ready}
    <p>Geen BEV-registraties gevonden in deze periode.</p>
{:else}
    <figure class="aantallen-figure">
        <svg
                {WIDTH}
                {HEIGHT}
                viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                <filter id="barShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow
                            dx="0"
                            dy="2"
                            stdDeviation="2"
                            flood-color="rgba(0,0,0,0.25)"
                    />
                </filter>
            </defs>

            <!-- hoofd-titel -->
            <text
                    x={WIDTH / 2}
                    y={24}
                    text-anchor="middle"
                    font-size="18"
                    font-weight="700"
            >
                Visuele vergelijking: BEV-registraties per jaar
            </text>

            <!-- legenda direct onder de titel, horizontaal -->
            <g transform={`translate(${WIDTH / 2 - 70}, 44)`}>
                <g>
                    <rect
                            x="0"
                            y="-10"
                            width="18"
                            height="18"
                            rx="4"
                            ry="4"
                            fill={brandMeta[brandKeyChina].kleur}
                    />
                    <text x="24" y="3" font-size="12">
                        {chinaLabel}
                    </text>
                </g>
                <g transform="translate(90,0)">
                    <rect
                            x="0"
                            y="-10"
                            width="18"
                            height="18"
                            rx="4"
                            ry="4"
                            fill={brandMeta[brandKeyWest].kleur}
                    />
                    <text x="24" y="3" font-size="12">
                        {westLabel}
                    </text>
                </g>
            </g>

            <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
                <!-- zebra-achtergrond per jaar -->
                {#each data as row, index}
                    <rect
                            x={x0(row.jaar)}
                            y={0}
                            width={x0.bandwidth()}
                            height={innerHeight}
                            fill={index % 2 === 0 ? '#f8f8f8' : '#f2f2f2'}
                            opacity="0.65"
                    />
                {/each}

                <!-- horizontale grid-lijnen -->
                {#each y.ticks(4) as tick}
                    <line
                            x1={0}
                            x2={innerWidth}
                            y1={y(tick)}
                            y2={y(tick)}
                            stroke="#ddd"
                            stroke-width="1"
                    />
                {/each}

                <!-- Y-as lijn -->
                <line
                        x1={0}
                        x2={0}
                        y1={0}
                        y2={innerHeight}
                        stroke="#555"
                        stroke-width="1.5"
                />

                <!-- Y-as ticks + labels -->
                {#each y.ticks(4) as tick}
                    <g>
                        <line
                                x1={-6}
                                x2={0}
                                y1={y(tick)}
                                y2={y(tick)}
                                stroke="#555"
                                stroke-width="1"
                        />
                        <text
                                x={-10}
                                y={y(tick) + 4}
                                text-anchor="end"
                                font-size="11"
                        >
                            {tick.toLocaleString('nl-NL')}
                        </text>
                    </g>
                {/each}

                <!-- weg (x-as) -->
                <rect
                        x={-MARGIN.left * 0.4}
                        y={innerHeight + 5}
                        width={innerWidth + MARGIN.left * 0.8}
                        height={18}
                        fill="#333"
                        rx="9"
                />
                {#each data as row}
                    <rect
                            x={(x0(row.jaar) || 0) + x0.bandwidth() / 2 - 18}
                            y={innerHeight + 13}
                            width="36"
                            height="3"
                            fill="#f5f5f5"
                            opacity="0.8"
                    />
                {/each}

                <!-- Y-as label -->
                <text
                        transform="rotate(-90)"
                        x={-innerHeight / 2}
                        y={-MARGIN.left + 20}
                        text-anchor="middle"
                        font-size="12"
                >
                    Aantal BEV-registraties
                </text>

                <!-- X-as label iets lager -->
                <text
                        x={innerWidth / 2}
                        y={innerHeight + 52}
                        text-anchor="middle"
                        font-size="12"
                >
                    Jaar
                </text>

                <!-- Jaar labels  -->
                {#each data as row}
                    <text
                            x={(x0(row.jaar) || 0) + x0.bandwidth() / 2}
                            y={innerHeight + 40}
                            text-anchor="middle"
                            font-size="12"
                    >
                        {row.jaar}
                    </text>
                {/each}

                <!-- Bars -->
                {#each data as row}
                    <g transform={`translate(${x0(row.jaar)},0)`}>
                        {#each [brandKeyChina, brandKeyWest] as key}
                            {#if row[key] > 0}
                                <g transform={`translate(${x1(key)},0)`}>
                                    <rect
                                            x={0}
                                            y={y(row[key])}
                                            width={x1.bandwidth()}
                                            height={innerHeight - y(row[key])}
                                            fill={brandMeta[key].kleur}
                                            rx="10"
                                            ry="10"
                                            filter="url(#barShadow)"
                                            opacity="0.9"
                                    />

                                    <!-- waarde-label -->
                                    <text
                                            x={x1.bandwidth() / 2}
                                            y={y(row[key]) - 8}
                                            text-anchor="middle"
                                            font-size="11"
                                            font-weight="600"
                                    >
                                        {row[key].toLocaleString('nl-NL')}
                                    </text>
                                </g>
                            {/if}
                        {/each}
                    </g>
                {/each}
            </g>
        </svg>
    </figure>
{/if}

<style>
    .aantallen-figure {
        margin: 1.5rem 0;
        max-width: 100%;
        overflow-x: auto;
    }

    svg {
        display: block;
        max-width: 100%;
        height: auto;
    }
</style>
