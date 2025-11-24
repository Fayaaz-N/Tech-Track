<script>
    import GewichtChart from '../graphs/gewichtchart.svelte';

    export let voertuigenOud = [];
    export let voertuigenNieuw = [];
    export let jaarOud;
    export let jaarNieuw;
    export let gekozenMerk;
    export let gekozenModel;

    function extractWeights(list) {
        const waarden = (list || [])
            .map((v) => v.massaKg ?? v.massa_kg ?? null)
            .filter((x) => typeof x === 'number' && !Number.isNaN(x) && x > 400 && x < 4000);

        if (!waarden.length) {
            return { avg: null, min: null, max: null };
        }

        const som = waarden.reduce((t, v) => t + v, 0);
        return {
            avg: som / waarden.length,
            min: Math.min(...waarden),
            max: Math.max(...waarden)
        };
    }

    $: statsOud = extractWeights(voertuigenOud);
    $: statsNieuw = extractWeights(voertuigenNieuw);
</script>

<section class="gewicht-view">
    <header class="gewicht-header">
        <h3>
            Gewicht
            {#if gekozenMerk} – {gekozenMerk}{/if}
            {#if gekozenModel} – {gekozenModel}{/if}
        </h3>
        <p>
            Dit histogram laat zien hoe het ledig gewicht van voertuigen verdeeld is in
            {jaarOud} en {jaarNieuw}. De blauwe balkjes zijn {jaarOud}, de oranje {jaarNieuw}.
        </p>
    </header>

    <GewichtChart
            {voertuigenOud}
            {voertuigenNieuw}
            {jaarOud}
            {jaarNieuw}
    />

    <section class="gewicht-insights">
        <div class="kolom">
            <h4>{jaarOud}</h4>
            {#if statsOud.avg}
                <p>Gemiddeld gewicht: <strong>{statsOud.avg.toFixed(0)} kg</strong></p>
                <p>
                    Lichtste: {statsOud.min.toFixed(0)} kg<br />
                    Zwaarste: {statsOud.max.toFixed(0)} kg
                </p>
            {:else}
                <p>Geen gewichtsdata gevonden voor dit jaar.</p>
            {/if}
        </div>

        <div class="kolom">
            <h4>{jaarNieuw}</h4>
            {#if statsNieuw.avg}
                <p>Gemiddeld gewicht: <strong>{statsNieuw.avg.toFixed(0)} kg</strong></p>
                <p>
                    Lichtste: {statsNieuw.min.toFixed(0)} kg<br />
                    Zwaarste: {statsNieuw.max.toFixed(0)} kg
                </p>
            {:else}
                <p>Geen gewichtsdata gevonden voor dit jaar.</p>
            {/if}
        </div>
    </section>
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
</style>
