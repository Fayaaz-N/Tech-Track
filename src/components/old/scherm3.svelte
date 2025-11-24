<script>
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    export let beschikbareJaren = [1980, 1990, 2000, 2010, 2020];
    export let inrichtingen = [];
    export let inrichtingenLaden = false;

    let jaarOud = null;
    let jaarNieuw = null;
    let gekozenInrichting = 'ALLE';

    const bevestigJaren = () => {
        if (!jaarOud || !jaarNieuw) {
            return;
        }

        if (+jaarNieuw <= +jaarOud) {
            const tmp = jaarOud;
            jaarOud = jaarNieuw;
            jaarNieuw = tmp;
        }

        dispatch('jaren', {
            jaarOud,
            jaarNieuw,
            inrichting: gekozenInrichting
        });
    };

    const gaVorige = () => {
        dispatch('vorige');
    };
</script>

<div class="scherm-inhoud scherm-3-inhoud">
    <h2>Kies een inrichting en twee jaren</h2>

    <p>
        Kies eerst welke inrichting je wilt vergelijken
        (bijvoorbeeld hatchback of sedan).
        Daarna kies je een jaar van vroeger en een later jaar.
    </p>

    <div class="inrichting-keuze">
        <label for="inrichting-select">Inrichting</label>

        {#if inrichtingenLaden}
            <p>Inrichtingen worden geladen...</p>
        {:else}
            <select id="inrichting-select" bind:value={gekozenInrichting}>
                <option value="ALLE">Alle inrichtingen</option>
                {#each inrichtingen as inrichting}
                    <option value={inrichting}>{inrichting}</option>
                {/each}
            </select>
        {/if}
    </div>

    <div class="jaar-keuze">
        <div class="jaar-blok">
            <label for="jaar-oud">Jaar van vroeger</label>
            <select id="jaar-oud" bind:value={jaarOud}>
                <option value="">Kies een jaar...</option>
                {#each beschikbareJaren as jaar}
                    <option value={jaar}>{jaar}</option>
                {/each}
            </select>
        </div>

        <div class="jaar-blok">
            <label for="jaar-nieuw">Later jaar</label>
            <select id="jaar-nieuw" bind:value={jaarNieuw}>
                <option value="">Kies een jaar...</option>
                {#each beschikbareJaren as jaar}
                    <option value={jaar}>{jaar}</option>
                {/each}
            </select>
        </div>
    </div>

    <div class="navigatie-knoppen">
        <button type="button" on:click={gaVorige}>
            Vorige
        </button>

        <button type="button" on:click={bevestigJaren}>
            Ga door naar hoogte-vergelijking
        </button>
    </div>
</div>
