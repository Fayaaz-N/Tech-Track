<script>
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();

    export let gekozenMerk = null;
    export let jaarOud = null;
    export let jaarNieuw = null;

    export let kleurenOud = [];
    export let kleurenNieuw = [];

    const gaVolgende = () => {
        dispatch('volgende');
    };

    const gaVorige = () => {
        dispatch('vorige');
    };
</script>

<div class="scherm-inhoud scherm-5-inhoud">
    <h2>Kleuren van {gekozenMerk} in {jaarOud} en {jaarNieuw}</h2>

    <p>
        Hier kun je zien of de kleuren van de auto’s zijn veranderd tussen
        de twee gekozen jaren.
    </p>

    <div class="kleuren-vergelijking">
        <div class="kleuren-blok">
            <h3>{jaarOud}</h3>

            <ul>
                {#each kleurenOud as rij}
                    <li>{rij.kleur} → {rij.aantal}</li>
                {/each}
            </ul>
        </div>

        <div class="kleuren-blok">
            <h3>{jaarNieuw}</h3>

            <ul>
                {#each kleurenNieuw as rij}
                    <li>{rij.kleur} → {rij.aantal}</li>
                {/each}
            </ul>
        </div>
    </div>

    <div class="navigatie-knoppen">
        <button type="button" on:click={gaVorige}>
            Vorige
        </button>

        <button type="button" on:click={gaVolgende}>
            Bekijk nu de verkoopaantallen
        </button>
    </div>
</div>
