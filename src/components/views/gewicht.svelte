<script>
    import GewichtChart from '../graphs/gewichtchart.svelte';

    export let voertuigenOud = [];
    export let voertuigenNieuw = [];
    export let jaarOud;
    export let jaarNieuw;
    export let gekozenMerk;
    export let gekozenModel;

    // range-data uit fetchData
    // [{ jaar, gemiddeldeGewicht, minGewicht, maxGewicht, aantal }]
    export let gewichtPerJaar = [];

    function extractWeights(list) {
        const waarden = (list || [])
            .map((v) => v.massaKg ?? v.massa_kg ?? null)
            .filter(
                (x) =>
                    typeof x === 'number' &&
                    !Number.isNaN(x) &&
                    x > 400 &&
                    x < 4000
            );

        if (!waarden.length) {
            return { avg: null, min: null, max: null, count: 0 };
        }

        const som = waarden.reduce((t, v) => t + v, 0);
        return {
            avg: som / waarden.length,
            min: Math.min(...waarden),
            max: Math.max(...waarden),
            count: waarden.length
        };
    }

    const formatKg = (n) =>
        typeof n === 'number' ? `${n.toFixed(0)} kg` : '–';

    $: statsOud = extractWeights(voertuigenOud);
    $: statsNieuw = extractWeights(voertuigenNieuw);

    // lijst voor cards: alleen jaren met een gemiddelde
    $: gewichtLijst = (gewichtPerJaar || [])
        .filter(
            (d) =>
                typeof d.jaar === 'number' &&
                typeof d.gemiddeldeGewicht === 'number' &&
                !Number.isNaN(d.gemiddeldeGewicht)
        )
        .sort((a, b) => a.jaar - b.jaar);
</script>

<section class="gewicht-view">
    <header class="gewicht-header">
        <h3>
            Gewicht
            {#if gekozenMerk} – {gekozenMerk}{/if}
            {#if gekozenModel} – {gekozenModel}{/if}
        </h3>
        <p>
            De balkgrafiek toont het <strong>gemiddelde ledig gewicht</strong> per jaar
            in je gekozen periode
            {#if jaarOud && jaarNieuw}
                ({jaarOud} t/m {jaarNieuw})
            {/if}.
            Daaronder zie je een overzicht per jaar.
        </p>
    </header>

    <!-- Barchart over alle jaren in de periode -->
    {#if gewichtLijst.length}
        <GewichtChart {gewichtPerJaar} />
    {:else}
        <p>Geen gewichtsdata beschikbaar voor deze periode.</p>
    {/if}

    <!-- Oud vs nieuw samenvatting -->
    <section class="gewicht-insights">
        <div class="kolom">
            <h4>{jaarOud}</h4>
            {#if statsOud.avg}
                <p>Gemiddeld gewicht: <strong>{formatKg(statsOud.avg)}</strong></p>
                <p>
                    Lichtste: {formatKg(statsOud.min)}<br />
                    Zwaarste: {formatKg(statsOud.max)}<br />
                    Aantal voertuigen: {statsOud.count}
                </p>
            {:else}
                <p>Geen gewichtsdata gevonden voor dit jaar.</p>
            {/if}
        </div>

        <div class="kolom">
            <h4>{jaarNieuw}</h4>
            {#if statsNieuw.avg}
                <p>Gemiddeld gewicht: <strong>{formatKg(statsNieuw.avg)}</strong></p>
                <p>
                    Lichtste: {formatKg(statsNieuw.min)}<br />
                    Zwaarste: {formatKg(statsNieuw.max)}<br />
                    Aantal voertuigen: {statsNieuw.count}
                </p>
            {:else}
                <p>Geen gewichtsdata gevonden voor dit jaar.</p>
            {/if}
        </div>
    </section>

    <!-- Cards per jaar -->
    {#if gewichtLijst.length}
        <section class="gewicht-per-jaar">
            <h4>Gemiddeld gewicht per jaar</h4>
            <div class="gewicht-year-grid">
                {#each gewichtLijst as jaarData}
                    <article class="gewicht-year-card">
                        <h5>{jaarData.jaar}</h5>
                        <p>
                            Gemiddeld gewicht:
                            <strong>
                                {formatKg(jaarData.gemiddeldeGewicht)}
                            </strong>
                        </p>
                        <p>
                            Lichtste: {formatKg(jaarData.minGewicht)}<br />
                            Zwaarste: {formatKg(jaarData.maxGewicht)}<br />
                            Aantal voertuigen:
                            {jaarData.aantal ?? 'onbekend'}
                        </p>
                    </article>
                {/each}
            </div>
        </section>
    {/if}
</section>

<style>
    .gewicht-view {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .gewicht-header h3 {
        margin-bottom: 0.3rem;
    }

    .gewicht-insights {
        display: flex;
        gap: 2rem;
        flex-wrap: wrap;
        margin-top: 0.5rem;
    }

    .gewicht-insights .kolom {
        flex: 1 1 220px;
    }

    .gewicht-per-jaar {
        margin-top: 1.5rem;
    }

    .gewicht-per-jaar h4 {
        margin-bottom: 0.7rem;
    }

    .gewicht-year-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
    }

    .gewicht-year-card {
        flex: 1 1 200px;
        min-width: 200px;
        border: 1px solid #e3e3e3;
        padding: 0.8rem 1rem;
        border-radius: 4px;
        box-sizing: border-box;
        background: #fafafa;
    }

    .gewicht-year-card h5 {
        margin-bottom: 0.4rem;
    }
</style>
