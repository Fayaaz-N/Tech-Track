<script>
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();

    export let gekozenMerk = null;
    export let jaarOud = null;
    export let jaarNieuw = null;
    export let gemiddeldeHoogteOud = null;
    export let gemiddeldeHoogteNieuw = null;

    const gaVolgende = () => {
        dispatch('volgende');
    };

    const gaVorige = () => {
        dispatch('vorige');
    };
</script>

<div class="scherm-inhoud scherm-4-inhoud">
    <h2>Hoogte van {gekozenMerk} in {jaarOud} en {jaarNieuw}</h2>

    <p>
        Hier zie je hoe hoog de personenauto’s van {gekozenMerk} gemiddeld zijn
        in de twee gekozen jaren.
    </p>

    <div class="hoogte-waarden">
        <div class="hoogte-kaart">
            <h3>{jaarOud}</h3>
            <p>
                Gemiddelde hoogte:
                {#if gemiddeldeHoogteOud !== null}
                    {gemiddeldeHoogteOud} meter
                {:else}
                    (nog geen data)
                {/if}
            </p>
        </div>

        <div class="hoogte-kaart">
            <h3>{jaarNieuw}</h3>
            <p>
                Gemiddelde hoogte:
                {#if gemiddeldeHoogteNieuw !== null}
                    {gemiddeldeHoogteNieuw} meter
                {:else}
                    (nog geen data)
                {/if}
            </p>
        </div>
    </div>

    <div class="hoogte-grafiek-placeholder">
        <p>Hier komt later de grafiek / svg met de twee auto’s.</p>
    </div>

    <div class="navigatie-knoppen">
        <button type="button" on:click={gaVorige}>
            Vorige
        </button>

        <button type="button" on:click={gaVolgende}>
            Bekijk nu de kleuren
        </button>
    </div>
</div>
