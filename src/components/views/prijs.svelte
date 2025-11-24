<script>
    import PrijsChart from '../graphs/prijschart.svelte';

    export let voertuigenOud = [];
    export let voertuigenNieuw = [];
    export let jaarOud;
    export let jaarNieuw;
    export let gekozenMerk;
    export let gekozenModel;

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

    $: statsOud = extractPrices(voertuigenOud);
    $: statsNieuw = extractPrices(voertuigenNieuw);
</script>

<section class="prijs-view">
    <header class="prijs-header">
        <h3>
            Catalogusprijs
            {#if gekozenMerk} – {gekozenMerk}{/if}
            {#if gekozenModel} – {gekozenModel}{/if}
        </h3>
        <p>
            Elke horizontale lijn toont het bereik van catalogusprijzen (van goedkoop tot duur)
            in een jaar, met de gekleurde stip op de <strong>gemiddelde prijs</strong>.
        </p>
    </header>

    <PrijsChart
            {voertuigenOud}
            {voertuigenNieuw}
            {jaarOud}
            {jaarNieuw}
    />

    <section class="prijs-insights">
        <div class="kolom">
            <h4>{jaarOud}</h4>
            {#if statsOud.avg}
                <p>Gemiddelde prijs: <strong>€ {Math.round(statsOud.avg).toLocaleString('nl-NL')}</strong></p>
                <p>
                    Goedkoopste: € {Math.round(statsOud.min).toLocaleString('nl-NL')}<br />
                    Duurste: € {Math.round(statsOud.max).toLocaleString('nl-NL')}<br />
                    Aantal voertuigen: {statsOud.count}
                </p>
            {:else}
                <p>Geen prijsdata gevonden voor dit jaar.</p>
            {/if}
        </div>

        <div class="kolom">
            <h4>{jaarNieuw}</h4>
            {#if statsNieuw.avg}
                <p>Gemiddelde prijs: <strong>€ {Math.round(statsNieuw.avg).toLocaleString('nl-NL')}</strong></p>
                <p>
                    Goedkoopste: € {Math.round(statsNieuw.min).toLocaleString('nl-NL')}<br />
                    Duurste: € {Math.round(statsNieuw.max).toLocaleString('nl-NL')}<br />
                    Aantal voertuigen: {statsNieuw.count}
                </p>
            {:else}
                <p>Geen prijsdata gevonden voor dit jaar.</p>
            {/if}
        </div>
    </section>
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
</style>
