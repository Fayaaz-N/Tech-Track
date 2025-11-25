<script>
    import PrijsChart from '../graphs/prijschart.svelte';

    export let voertuigenOud = [];
    export let voertuigenNieuw = [];
    export let jaarOud;
    export let jaarNieuw;
    export let gekozenMerk;
    export let gekozenModel;

    // range-data uit fetchData
    // [{ jaar, gemiddeldePrijs, minPrijs, maxPrijs, aantal }]
    export let prijsPerJaar = [];

    function extractPrices(list) {
        const values = (list || [])
            .map((v) => v.catalogusPrijs ?? v.catalogusprijs ?? null)
            .filter((x) => typeof x === 'number' && !Number.isNaN(x))
            .filter((x) => x >= 1000 && x <= 300000);

        if (!values.length) {
            return { avg: null, min: null, max: null, count: 0 };
        }

        const min = Math.min(...values);
        const max = Math.max(...values);
        const sum = values.reduce((t, v) => t + v, 0);
        const avg = sum / values.length;

        return { min, max, avg, count: values.length };
    }

    const formatEuro = (n) =>
        typeof n === 'number'
            ? `€ ${Math.round(n).toLocaleString('nl-NL')}`
            : '–';

    $: statsOud = extractPrices(voertuigenOud);
    $: statsNieuw = extractPrices(voertuigenNieuw);

    $: heeftRangeData = (prijsPerJaar || []).some(
        (d) =>
            typeof d.gemiddeldePrijs === 'number' &&
            !Number.isNaN(d.gemiddeldePrijs)
    );

    // lijst voor overzicht: alleen jaren met echte prijsdata
    $: prijsLijst = (prijsPerJaar || [])
        .filter(
            (d) =>
                typeof d.jaar === 'number' &&
                d.aantal &&
                typeof d.minPrijs === 'number' &&
                typeof d.maxPrijs === 'number'
        )
        .sort((a, b) => a.jaar - b.jaar);
</script>

<section class="prijs-view">
    <header class="prijs-header">
        <h3>
            Catalogusprijs
            {#if gekozenMerk} – {gekozenMerk}{/if}
            {#if gekozenModel} – {gekozenModel}{/if}
        </h3>
        <p>
            Elke verticale balk toont het bereik van catalogusprijzen
            (van goedkoop tot duur) in een jaar, met de stip op de
            <strong>gemiddelde prijs</strong>. Je ziet alle jaren tussen
            {jaarOud} en {jaarNieuw}.
        </p>
    </header>

    {#if heeftRangeData}
        <PrijsChart {prijsPerJaar} />
    {:else}
        <p>Geen catalogusprijs-data gevonden over deze periode.</p>
    {/if}

    <!-- NIEUW: overzicht voor alle jaren in de periode -->
    {#if prijsLijst.length}
        <section class="prijs-per-jaar">
            <h4>Overzicht per jaar in de periode</h4>
            <div class="prijs-per-jaar-grid">
                {#each prijsLijst as jaarData}
                    <article class="prijs-year-card">
                        <h5>{jaarData.jaar}</h5>
                        <p>
                            Gemiddelde prijs:
                            <strong>{formatEuro(jaarData.gemiddeldePrijs)}</strong>
                        </p>
                        <p>
                            Goedkoopste: {formatEuro(jaarData.minPrijs)}<br />
                            Duurste: {formatEuro(jaarData.maxPrijs)}<br />
                            Aantal voertuigen: {jaarData.aantal}
                        </p>
                    </article>
                {/each}
            </div>
        </section>
    {/if}
</section>

<style>
    .prijs-view {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .prijs-header h3 {
        margin-bottom: 0.3rem;
    }

    .prijs-insights {
        display: flex;
        gap: 2rem;
        flex-wrap: wrap;
        margin-top: 0.5rem;
    }

    .prijs-insights .kolom {
        flex: 1 1 220px;
    }

    .prijs-per-jaar {
        margin-top: 1.5rem;
    }

    .prijs-per-jaar-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
    }

    .prijs-year-card {
        flex: 1 1 200px;
        min-width: 200px;
        border: 1px solid #e3e3e3;
        padding: 0.8rem 1rem;
        border-radius: 4px;
        box-sizing: border-box;
    }

    .prijs-year-card h5 {
        margin-bottom: 0.4rem;
    }
</style>
