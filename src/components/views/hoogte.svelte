<script>
    // Data van buiten:
    export let voertuigenOud = [];
    export let voertuigenNieuw = [];
    export let jaarOud;
    export let jaarNieuw;
    export let gekozenMerk;
    export let gekozenModel;
    export let gemHoogteOud = null;
    export let gemHoogteNieuw = null;

    const SVG_WIDTH = 520;
    const SVG_HEIGHT = 320;
    const CHART_BOTTOM = 260; // waar de "grond" ligt
    const CAR_WIDTH = 80;
    const WHEEL_RADIUS = 7;

    function berekenGemHoogte(list) {
        const waarden = (list || [])
            .map((v) => v.hoogteMeter ?? v.hoogte_meter ?? null)
            .filter((x) => typeof x === 'number' && !Number.isNaN(x));

        if (!waarden.length) return null;
        const som = waarden.reduce((t, v) => t + v, 0);
        return som / waarden.length;
    }

    let barData = [];

    $: {
        let hOud = gemHoogteOud ?? berekenGemHoogte(voertuigenOud);
        let hNieuw = gemHoogteNieuw ?? berekenGemHoogte(voertuigenNieuw);

        if (!hOud && !hNieuw) {
            barData = [];
        } else {
            if (!hOud && hNieuw) hOud = hNieuw;
            if (!hNieuw && hOud) hNieuw = hOud;

            const maxM = Math.max(hOud || 0, hNieuw || 0) || 1.8;
            const pxPerM = 180 / maxM; // max visuele hoogte ~ 180px

            const rawBars = [
                { jaar: jaarOud, heightM: hOud, color: '#1f77b4' },
                { jaar: jaarNieuw, heightM: hNieuw, color: '#ff7f0e' }
            ];

            barData = rawBars.map((d, idx) => {
                const iconHeightPx = d.heightM * pxPerM;
                const xCenter = 150 + idx * 220;

                return {
                    ...d,
                    iconHeightPx,
                    xCenter,
                    baseline: CHART_BOTTOM
                };
            });
        }
    }

    $: hasData = barData && barData.length === 2;
</script>

{#if !hasData}
    <p>Geen hoogte-data beschikbaar voor deze selectie.</p>
{:else}
    <svg
            width={SVG_WIDTH}
            height={SVG_HEIGHT}
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            xmlns="http://www.w3.org/2000/svg"
    >
        <!-- grond-lijn -->
        <line
                x1="80"
                y1={CHART_BOTTOM}
                x2={SVG_WIDTH - 40}
                y2={CHART_BOTTOM}
                stroke="#000"
                stroke-width="1"
        />

        {#each barData as bar}
            {#if bar.heightM}
                <!-- auto-body -->
                <rect
                        x={bar.xCenter - CAR_WIDTH / 2}
                        y={bar.baseline - WHEEL_RADIUS - bar.iconHeightPx * 0.55}
                        width={CAR_WIDTH}
                        height={bar.iconHeightPx * 0.55}
                        rx="10"
                        ry="10"
                        fill={bar.color}
                />

                <!-- dak -->
                <polygon
                        points={`
                        ${bar.xCenter - CAR_WIDTH * 0.25},${bar.baseline - WHEEL_RADIUS - bar.iconHeightPx * 0.55}
                        ${bar.xCenter - CAR_WIDTH * 0.10},${bar.baseline - WHEEL_RADIUS - bar.iconHeightPx * 0.70}
                        ${bar.xCenter + CAR_WIDTH * 0.10},${bar.baseline - WHEEL_RADIUS - bar.iconHeightPx * 0.70}
                        ${bar.xCenter + CAR_WIDTH * 0.25},${bar.baseline - WHEEL_RADIUS - bar.iconHeightPx * 0.55}
                    `}
                        fill={bar.color}
                />

                <!-- wielen -->
                <circle
                        cx={bar.xCenter - CAR_WIDTH * 0.25}
                        cy={bar.baseline - WHEEL_RADIUS}
                        r={WHEEL_RADIUS}
                        fill="#000"
                />
                <circle
                        cx={bar.xCenter + CAR_WIDTH * 0.25}
                        cy={bar.baseline - WHEEL_RADIUS}
                        r={WHEEL_RADIUS}
                        fill="#000"
                />

                <!-- hoogte-label boven de auto -->
                <text
                        x={bar.xCenter}
                        y={bar.baseline - bar.iconHeightPx - 10}
                        text-anchor="middle"
                        font-size="12"
                        font-weight="600"
                >
                    {bar.heightM.toFixed(2)} m
                </text>

                <!-- jaartal onder de auto -->
                <text
                        x={bar.xCenter}
                        y={bar.baseline + 18}
                        text-anchor="middle"
                        font-size="13"
                >
                    {bar.jaar}
                </text>
            {/if}
        {/each}

        <!-- uitleg onderaan -->
        <text
                x={SVG_WIDTH / 2}
                y={SVG_HEIGHT - 10}
                text-anchor="middle"
                font-size="11"
                fill="#555"
        >
            Hoogte-balk is schaalverhouding van de gemiddelde voertuighoogte (in meters)
        </text>
    </svg>
{/if}
