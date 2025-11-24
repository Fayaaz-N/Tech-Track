<script>
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();

    export let gekozenMerk = null;
    export let jaarOud = null;
    export let jaarNieuw = null;

    export let verkoopOud = null;
    export let verkoopNieuw = null;

    const opnieuw = () => {
        dispatch('opnieuw');
    };

    const gaVorige = () => {
        dispatch('vorige');
    };
</script>

<div class="scherm-inhoud scherm-6-inhoud">
    <h2>Verkoopaantallen van {gekozenMerk}</h2>

    <p>
        Tot slot kun je zien hoeveel auto’s van {gekozenMerk} zijn verkocht
        (of geregistreerd) in de twee gekozen jaren.
    </p>

    <div class="verkoop-vergelijking">
        <div class="verkoop-blok">
            <h3>{jaarOud}</h3>
            <p>
                Aantal voertuigen:
                {#if verkoopOud !== null}
                    {verkoopOud}
                {:else}
                    (nog geen data)
                {/if}
            </p>
        </div>

        <div class="verkoop-blok">
            <h3>{jaarNieuw}</h3>
            <p>
                Aantal voertuigen:
                {#if verkoopNieuw !== null}
                    {verkoopNieuw}
                {:else}
                    (nog geen data)
                {/if}
            </p>
        </div>
    </div>

    <div class="verkoop-grafiek-placeholder">
        <p>Hier kun je later nog een grafiek van de aantallen maken.</p>
    </div>

    <div class="navigatie-knoppen">
        <button type="button" on:click={gaVorige}>
            Vorige
        </button>

        <button type="button" on:click={opnieuw}>
            Opnieuw beginnen met een ander merk
        </button>
    </div>
</div>
