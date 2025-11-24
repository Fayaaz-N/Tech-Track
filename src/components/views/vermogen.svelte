<script>
    import VermogenChart from '../graphs/vermogenchart.svelte';

    export let voertuigenOud = [];
    export let voertuigenNieuw = [];
    export let jaarOud;
    export let jaarNieuw;
    export let gekozenMerk;
    export let gekozenModel;

    const KW_TO_PK = 1.35962;

    function extractPkStats(list) {
        const waardenKw = (list || [])
            .map((v) => v.vermogenKw ?? v.vermogen_kw ?? v.netto_maximumvermogen ?? null)
            .filter((x) => typeof x === 'number' && !Number.isNaN(x))
            .filter((x) => x >= 20 && x <= 800);

        if (!waardenKw.length) {
            return { avgPk: null, minPk: null, maxPk: null };
        }

        const waardenPk = waardenKw.map((kw) => kw * KW_TO_PK);
        const som = waardenPk.reduce((t, v) => t + v, 0);

        return {
            avgPk: som / waardenPk.length,
            minPk: Math.min(...waardenPk),
            maxPk: Math.max(...waardenPk)
        };
    }

    $: statsOud = extractPkStats(voertuigenOud);
    $: statsNieuw = extractPkStats(voertuigenNieuw);
</script>

<section class="vermogen-view">
    <header class="vermogen-header">
        <h3>
            Vermogen
            {#if gekozenMerk} – {gekozenMerk}{/if}
            {#if gekozenModel} – {gekozenModel}{/if}
        </h3>
        <p>
            Elke snelheidsmeter toont het <strong>gemiddeld aantal pk</strong> van de voertuigen
            in {jaarOud} en {jaarNieuw}. De naald geeft aan waar het gemiddelde ligt op de schaal.
        </p>
    </header>

    <VermogenChart
            {voertuigenOud}
            {voertuigenNieuw}
            {jaarOud}
            {jaarNieuw}
    />

    <section class="vermogen-insights">
        <div class="kolom">
            <h4>{jaarOud}</h4>
            {#if statsOud.avgPk}
                <p>Gemiddeld: <strong>{statsOud.avgPk.toFixed(0)} pk</strong></p>
                <p>
                    Minimaal: {statsOud.minPk.toFixed(0)} pk<br />
                    Maximaal: {statsOud.maxPk.toFixed(0)} pk
                </p>
            {:else}
                <p>Geen vermogensdata gevonden voor dit jaar.</p>
            {/if}
        </div>

        <div class="kolom">
            <h4>{jaarNieuw}</h4>
            {#if statsNieuw.avgPk}
                <p>Gemiddeld: <strong>{statsNieuw.avgPk.toFixed(0)} pk</strong></p>
                <p>
                    Minimaal: {statsNieuw.minPk.toFixed(0)} pk<br />
                    Maximaal: {statsNieuw.maxPk.toFixed(0)} pk
                </p>
            {:else}
                <p>Geen vermogensdata gevonden voor dit jaar.</p>
            {/if}
        </div>
    </section>
</section>

<style>
    .vermogen-view {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .vermogen-header h3 {
        margin-bottom: 0.3rem;
    }

    .vermogen-insights {
        display: flex;
        gap: 2rem;
        flex-wrap: wrap;
        margin-top: 0.5rem;
    }

    .vermogen-insights .kolom {
        flex: 1 1 220px;
    }
</style>
