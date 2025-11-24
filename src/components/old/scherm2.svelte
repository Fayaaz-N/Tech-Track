<script>
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    // merken komen nu van de ouder
    export let merken = [];
    export let laden = false;

    let gekozenMerk = null;

    const kiesMerk = (merk) => {
        gekozenMerk = merk;
        dispatch('merk', { merk });
    };
</script>

<div class="scherm-inhoud scherm-2-inhoud">
    <h2>Kies een automerk</h2>

    <p>
        Kies een merk waarvoor je de hoogte door de tijd wilt onderzoeken.
    </p>

    {#if laden}
        <p>Merken worden geladen...</p>
    {:else}
        <div class="merken-lijst">
            {#each merken as merk}
                <button
                        type="button"
                        class:selected={gekozenMerk === merk}
                        on:click={() => kiesMerk(merk)}
                >
                    {merk}
                </button>
            {/each}
        </div>
    {/if}
</div>
