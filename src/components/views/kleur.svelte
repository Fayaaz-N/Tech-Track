<script>
    import ColorChart from '../graphs/colorchart.svelte';

    export let jaarOud;
    export let jaarNieuw;
    export let gekozenMerk;
    export let gekozenModel;

    // oude props kun je nog meekrijgen, maar we gebruiken nu vooral:
    export let kleurenOud = [];
    export let kleurenNieuw = [];

    // RANGE data uit fetchData:
    // [{ jaar, kleuren: [{ kleur, aantal }, ...] }]
    export let kleurenPerJaar = [];

    const topN = (list, n = 3) =>
        (list || [])
            .slice()
            .sort((a, b) => (b.aantal || 0) - (a.aantal || 0))
            .slice(0, n);

    const totaalVoorJaar = (jaarData) =>
        (jaarData?.kleuren || []).reduce(
            (sum, item) => sum + (item.aantal || 0),
            0
        );

    // netjes op volgorde van jaar
    $: kleurenPerJaarSorted = (kleurenPerJaar || [])
        .filter((d) => typeof d.jaar === 'number')
        .sort((a, b) => a.jaar - b.jaar);

    // actieve tab (jaar)
    let actieveJaar = null;

    // zodra er data is en er nog geen actieveJaar is, pak de eerste
    $: if (kleurenPerJaarSorted.length && !actieveJaar) {
        actieveJaar = kleurenPerJaarSorted[0].jaar;
    }

    // data voor de actieve tab
    $: actiefJaarData =
        kleurenPerJaarSorted.find((d) => d.jaar === actieveJaar) || null;
</script>

<section class="kleuren-view">
    <header class="kleuren-header">
        <h3>
            Kleurverdeling
            {#if gekozenMerk}
                – {gekozenMerk}
            {/if}
            {#if gekozenModel}
                – {gekozenModel}
            {/if}
        </h3>
        <p>
            Kies een jaar in de tabs om de kleurenkaart (treemap) voor dat jaar te
            zien. Onderaan staat een tekstueel overzicht per jaar in de periode
            {#if jaarOud && jaarNieuw}
                {jaarOud} t/m {jaarNieuw}
            {/if}
            .
        </p>
    </header>

    {#if kleurenPerJaarSorted.length}
        <!-- TABS met jaren -->
        <div class="kleuren-tabs">
            {#each kleurenPerJaarSorted as jaarData}
                <button
                        type="button"
                        class:selected={actieveJaar === jaarData.jaar}
                        on:click={() => (actieveJaar = jaarData.jaar)}
                >
                    {jaarData.jaar}
                </button>
            {/each}
        </div>

        <!-- ÉÉN ColorChart, op basis van de actieve tab -->
        <section class="kleuren-charts">
            {#if actiefJaarData}
                <div class="kleuren-chart-item">
                    <h4>{actiefJaarData.jaar}</h4>
                    <ColorChart data={actiefJaarData.kleuren} />
                </div>
            {:else}
                <p>Geen kleurdata gevonden voor de geselecteerde tab.</p>
            {/if}
        </section>
    {:else}
        <p>Geen kleurdata beschikbaar voor deze periode.</p>
    {/if}

    <!-- ONDERAAN: TEKST-OVERZICHT CARDS PER JAAR -->
    {#if kleurenPerJaarSorted.length}
        <section class="kleuren-per-jaar">
            <h4>Overzicht per jaar</h4>
            <div class="kleuren-year-grid">
                {#each kleurenPerJaarSorted as jaarData}
                    <article class="kleuren-year-card">
                        <h5>{jaarData.jaar}</h5>
                        <p>
                            Totaal voertuigen:
                            <strong>{totaalVoorJaar(jaarData)}</strong>
                        </p>

                        {#if (jaarData.kleuren || []).length}
                            <p>Top kleuren:</p>
                            <ol>
                                {#each topN(jaarData.kleuren, 3) as item}
                                    <li>{item.kleur} – {item.aantal}</li>
                                {/each}
                            </ol>
                        {:else}
                            <p>Geen kleurdata voor dit jaar.</p>
                        {/if}
                    </article>
                {/each}
            </div>
        </section>
    {/if}
</section>

<style>
    .kleuren-view {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .kleuren-header h3 {
        margin-bottom: 0.25rem;
    }

    /* tabs bovenaan */
    .kleuren-tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-top: 0.5rem;
        margin-bottom: 0.5rem;
    }

    .kleuren-tabs button {
        padding: 0.3rem 0.8rem;
        border: 1px solid #ccc;
        background: #f5f5f5;
        cursor: pointer;
        font-size: 0.9rem;
    }

    .kleuren-tabs button.selected {
        background: #222;
        color: #fff;
        border-color: #222;
        font-weight: 600;
    }

    /* chart wrapper voor de actieve tab */
    .kleuren-charts {
        margin-top: 0.5rem;
    }

    .kleuren-chart-item {
        max-width: 100%;
    }

    .kleuren-chart-item h4 {
        margin-bottom: 0.5rem;
    }

    /* onderaan: tekst-cards per jaar */
    .kleuren-per-jaar {
        margin-top: 1.5rem;
    }

    .kleuren-per-jaar h4 {
        margin-bottom: 0.7rem;
    }

    .kleuren-year-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
    }

    .kleuren-year-card {
        flex: 1 1 200px;
        min-width: 200px;
        border: 1px solid #e3e3e3;
        padding: 0.8rem 1rem;
        border-radius: 4px;
        box-sizing: border-box;
        background: #fafafa;
    }

    .kleuren-year-card h5 {
        margin-bottom: 0.4rem;
    }

    .kleuren-year-card ol {
        padding-left: 1.2rem;
        margin: 0.2rem 0 0;
    }
</style>
