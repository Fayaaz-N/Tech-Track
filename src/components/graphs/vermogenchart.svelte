<script>
    // voertuigen + jaren komen uit het dashboard
    export let voertuigenOud = [];
    export let voertuigenNieuw = [];
    export let jaarOud;
    export let jaarNieuw;

    // SVG configuratie
    const WIDTH = 600;
    const HEIGHT = 300;
    const CENTER_Y = 200;
    const RADIUS = 90;

    // gauge-hoeken (in graden)
    const GAUGE_START = -120;
    const GAUGE_END = 120;

    // kW → pk
    const KW_TO_PK = 1.35962;

    // pk's eruit halen + sanity filter
    function extractPk(list) {
        const waardenKw = (list || [])
            .map((v) => v.vermogenKw ?? v.vermogen_kw ?? v.netto_maximumvermogen ?? null)
            .filter((x) => typeof x === 'number' && !Number.isNaN(x))
            // personenauto's: zeg tussen 20 en 800 kW
            .filter((x) => x >= 20 && x <= 800);

        if (!waardenKw.length) {
            return { avgPk: null, minPk: null, maxPk: null };
        }

        const waardenPk = waardenKw.map((kw) => kw * KW_TO_PK);

        const som = waardenPk.reduce((t, v) => t + v, 0);
        const avgPk = som / waardenPk.length;
        const minPk = Math.min(...waardenPk);
        const maxPk = Math.max(...waardenPk);

        return { avgPk, minPk, maxPk };
    }

    // helper: hoek (deg) → coord
    function polarToCartesian(cx, cy, r, angleDeg) {
        const rad = (angleDeg - 90) * (Math.PI / 180);
        return {
            x: cx + r * Math.cos(rad),
            y: cy + r * Math.sin(rad)
        };
    }

    // helper: SVG path voor een arc
    function describeArc(cx, cy, r, startAngle, endAngle) {
        const start = polarToCartesian(cx, cy, r, endAngle);
        const end = polarToCartesian(cx, cy, r, startAngle);

        const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

        const d = [
            'M', start.x, start.y,
            'A', r, r, 0, largeArcFlag, 0, end.x, end.y
        ].join(' ');

        return d;
    }

    // helpers om dingen in de template leesbaar te houden
    function getRatio(g) {
        if (!g || !g.avgPk || !g.maxPk) return 0;
        return Math.min(g.avgPk / g.maxPk, 1);
    }

    function getValueAngle(g) {
        const r = getRatio(g);
        return GAUGE_START + (GAUGE_END - GAUGE_START) * r;
    }

    function tickAngle(t) {
        return GAUGE_START + (GAUGE_END - GAUGE_START) * t;
    }

    function tickInnerX(g, t) {
        const angle = tickAngle(t);
        return polarToCartesian(g.cx, CENTER_Y, RADIUS - 6, angle).x;
    }
    function tickInnerY(g, t) {
        const angle = tickAngle(t);
        return polarToCartesian(g.cx, CENTER_Y, RADIUS - 6, angle).y;
    }
    function tickOuterX(g, t) {
        const angle = tickAngle(t);
        return polarToCartesian(g.cx, CENTER_Y, RADIUS + 4, angle).x;
    }
    function tickOuterY(g, t) {
        const angle = tickAngle(t);
        return polarToCartesian(g.cx, CENTER_Y, RADIUS + 4, angle).y;
    }

    function needleBaseX(g) {
        const angle = getValueAngle(g);
        return polarToCartesian(g.cx, CENTER_Y, 0, angle).x;
    }
    function needleBaseY(g) {
        const angle = getValueAngle(g);
        return polarToCartesian(g.cx, CENTER_Y, 0, angle).y;
    }
    function needleTipX(g) {
        const angle = getValueAngle(g);
        return polarToCartesian(g.cx, CENTER_Y, RADIUS - 10, angle).x;
    }
    function needleTipY(g) {
        const angle = getValueAngle(g);
        return polarToCartesian(g.cx, CENTER_Y, RADIUS - 10, angle).y;
    }

    // afleiding van data voor de twee gauges
    let statsOud;
    let statsNieuw;
    let gauges = [];
    let hasData = false;

    $: {
        statsOud = extractPk(voertuigenOud);
        statsNieuw = extractPk(voertuigenNieuw);

        if (!statsOud.avgPk && !statsNieuw.avgPk) {
            gauges = [];
            hasData = false;
        } else {
            const avgOud = statsOud.avgPk ?? statsNieuw.avgPk;
            const avgNieuw = statsNieuw.avgPk ?? statsOud.avgPk;

            const maxPk = (Math.max(avgOud, avgNieuw) || 200) * 1.2;

            gauges = [
                {
                    jaar: jaarOud,
                    avgPk: avgOud,
                    color: '#1f77b4',
                    cx: 200,
                    maxPk
                },
                {
                    jaar: jaarNieuw,
                    avgPk: avgNieuw,
                    color: '#ff7f0e',
                    cx: 400,
                    maxPk
                }
            ];

            hasData = true;
        }
    }
</script>

{#if !hasData}
    <p>Geen vermogensdata beschikbaar voor deze selectie.</p>
{:else}
    <svg
            width={WIDTH}
            height={HEIGHT}
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            xmlns="http://www.w3.org/2000/svg"
    >
        <!-- Titel -->
        <text
                x={WIDTH / 2}
                y="24"
                text-anchor="middle"
                font-size="16"
                font-weight="600"
        >
            Gemiddeld vermogen (pk)
        </text>

        {#each gauges as g (g.jaar)}
            {#if g.avgPk}
                <!-- volledige boog (achtergrond) -->
                <path
                        d={describeArc(g.cx, CENTER_Y, RADIUS, GAUGE_START, GAUGE_END)}
                        fill="none"
                        stroke="#ddd"
                        stroke-width="10"
                />

                <!-- ingevulde boog tot aan waarde -->
                <path
                        d={describeArc(
                        g.cx,
                        CENTER_Y,
                        RADIUS,
                        GAUGE_START,
                        getValueAngle(g)
                    )}
                        fill="none"
                        stroke={g.color}
                        stroke-width="10"
                        stroke-linecap="round"
                />

                <!-- ticks bij 0, 50%, 100% -->
                {#each [0, 0.5, 1] as t}
                    <line
                            x1={tickInnerX(g, t)}
                            y1={tickInnerY(g, t)}
                            x2={tickOuterX(g, t)}
                            y2={tickOuterY(g, t)}
                            stroke="#999"
                            stroke-width="1"
                    />
                {/each}

                <!-- pointer / naald -->
                <line
                        x1={needleBaseX(g)}
                        y1={needleBaseY(g)}
                        x2={needleTipX(g)}
                        y2={needleTipY(g)}
                        stroke={g.color}
                        stroke-width="3"
                />
                <circle
                        cx={g.cx}
                        cy={CENTER_Y}
                        r="4"
                        fill={g.color}
                />

                <!-- labels onder de meter -->
                <text
                        x={g.cx}
                        y={CENTER_Y + 50}
                        text-anchor="middle"
                        font-size="13"
                        font-weight="600"
                >
                    {g.jaar}
                </text>

                <text
                        x={g.cx}
                        y={CENTER_Y + 68}
                        text-anchor="middle"
                        font-size="12"
                >
                    {g.avgPk.toFixed(0)} pk
                </text>

                <text
                        x={g.cx}
                        y={CENTER_Y + 84}
                        text-anchor="middle"
                        font-size="11"
                        fill="#555"
                >
                    schaal 0 – {Math.round(g.maxPk)} pk
                </text>
            {/if}
        {/each}
    </svg>
{/if}
