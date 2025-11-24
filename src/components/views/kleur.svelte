<script>
    import ColorChart from '../graphs/colorchart.svelte';

    export let jaarOud;
    export let jaarNieuw;
    export let gekozenMerk;
    export let gekozenModel;
    export let kleurenOud = [];
    export let kleurenNieuw = [];
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
        <p>Vergelijk de verdeling van lakkleuren tussen {jaarOud} en {jaarNieuw}.</p>
    </header>

    <div class="kleuren-grids">
        <div class="kleuren-kolom">
            <h4>{jaarOud}</h4>
            <ColorChart data={kleurenOud} />
        </div>

        <div class="kleuren-kolom">
            <h4>{jaarNieuw}</h4>
            <ColorChart data={kleurenNieuw} />
        </div>
    </div>

    <!-- Simpele lijst eronder, kun je later uitbreiden naar "Top 3" enz. -->
    <section class="kleuren-lijst">
        <div class="kolom">
            <h5>Top kleuren in {jaarOud}</h5>
            <ol>
                {#each (kleurenOud || []).slice(0, 5) as item}
                    <li>{item.kleur} – {item.aantal}</li>
                {/each}
            </ol>
        </div>

        <div class="kolom">
            <h5>Top kleuren in {jaarNieuw}</h5>
            <ol>
                {#each (kleurenNieuw || []).slice(0, 5) as item}
                    <li>{item.kleur} – {item.aantal}</li>
                {/each}
            </ol>
        </div>
    </section>
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

    .kleuren-grids {
        display: flex;
        flex-wrap: wrap;
        gap: 1.5rem;
    }

    .kleuren-kolom {
        flex: 1 1 320px;
        min-width: 320px;
    }

    .kleuren-kolom h4 {
        margin-bottom: 0.5rem;
    }

    .kleuren-lijst {
        display: flex;
        gap: 2rem;
        flex-wrap: wrap;
        margin-top: 1rem;
    }

    .kleuren-lijst .kolom {
        flex: 1 1 220px;
    }

    .kleuren-lijst ol {
        padding-left: 1.2rem;
    }
</style>
