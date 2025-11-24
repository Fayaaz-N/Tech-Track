<script>
    import { createEventDispatcher } from 'svelte';

    // losse views (mag je later invullen)
    import HoogteView from './views/hoogte.svelte';
    import GewichtView from './views/gewicht.svelte';
    import KleurenView from './views/kleur.svelte';
    import VermogenView from './views/vermogen.svelte';
    import PrijsView from './views/prijs.svelte';
    import VerkoopView from './views/verkoop.svelte';

    const dispatch = createEventDispatcher();

    // filters en data die uit +page.svelte komen
    export let gekozenMerk = null;
    export let gekozenModel = null;
    export let gekozenInrichting = 'ALLE';
    export let jaarOud = null;
    export let jaarNieuw = null;

    export let voertuigenOud = [];
    export let voertuigenNieuw = [];

    export let gemHoogteOud = null;
    export let gemHoogteNieuw = null;
    export let kleurenOud = [];
    export let kleurenNieuw = [];
    export let verkoopOud = null;
    export let verkoopNieuw = null;

    // welke vergelijking staat nu “aan” in het dashboard
    let actieveView = 'hoogte';

    // alle opties die je als knop wilt laten zien
    const opties = [
        { key: 'hoogte', label: 'Hoogte' },
        { key: 'gewicht', label: 'Gewicht' },
        { key: 'kleuren', label: 'Kleuren' },
        { key: 'vermogen', label: 'Vermogen' },
        { key: 'prijs', label: 'Catalogusprijs' },
        { key: 'verkoop', label: 'Verkoopaantallen' }
    ];

    // simpele helper om view te wisselen
    const kiesView = (key) => {
        actieveView = key;
    };

    const terug = () => {
        // terug naar informatie scherm
        dispatch('terug');
    };

    const opnieuw = () => {
        // helemaal opnieuw beginnen (naar intro)
        dispatch('opnieuw');
    };
</script>

<section class="dashboard">
    <!-- bovenste stukje: samenvatting van de gekozen filters -->
    <header class="dashboard-header">
        <h2>
            Vergelijking voor {gekozenMerk}
            {#if gekozenModel}
                – {gekozenModel}
            {/if}
        </h2>

        <p class="dashboard-sub">
            Je bekijkt voertuigen uit {jaarOud} en {jaarNieuw}
            {#if gekozenInrichting && gekozenInrichting !== 'ALLE'}
                , inrichting: {gekozenInrichting}
            {/if}
            .
        </p>
    </header>

    <!-- knoppen om tussen views te wisselen -->
    <div class="dashboard-tabs">
        {#each opties as optie}
            <button
                    type="button"
                    class:active={actieveView === optie.key}
                    on:click={() => kiesView(optie.key)}
            >
                {optie.label}
            </button>
        {/each}
    </div>

    <!-- hier tonen we de geselecteerde view -->
    <div class="dashboard-content">
        {#if actieveView === 'hoogte'}
            <HoogteView
                    voertuigenOud={voertuigenOud}
                    voertuigenNieuw={voertuigenNieuw}
                    jaarOud={jaarOud}
                    jaarNieuw={jaarNieuw}
                    gekozenMerk={gekozenMerk}
                    gekozenModel={gekozenModel}
                    gemHoogteOud={gemHoogteOud}
                    gemHoogteNieuw={gemHoogteNieuw}
            />

        {:else if actieveView === 'gewicht'}
            <GewichtView
                    voertuigenOud={voertuigenOud}
                    voertuigenNieuw={voertuigenNieuw}
                    jaarOud={jaarOud}
                    jaarNieuw={jaarNieuw}
                    gekozenMerk={gekozenMerk}
                    gekozenModel={gekozenModel}
            />

        {:else if actieveView === 'kleuren'}
            <KleurenView
                    voertuigenOud={voertuigenOud}
                    voertuigenNieuw={voertuigenNieuw}
                    jaarOud={jaarOud}
                    jaarNieuw={jaarNieuw}
                    gekozenMerk={gekozenMerk}
                    gekozenModel={gekozenModel}
                    kleurenOud={kleurenOud}
                    kleurenNieuw={kleurenNieuw}
            />

        {:else if actieveView === 'vermogen'}
            <VermogenView
                    voertuigenOud={voertuigenOud}
                    voertuigenNieuw={voertuigenNieuw}
                    jaarOud={jaarOud}
                    jaarNieuw={jaarNieuw}
                    gekozenMerk={gekozenMerk}
                    gekozenModel={gekozenModel}
            />

        {:else if actieveView === 'prijs'}
            <PrijsView
                    voertuigenOud={voertuigenOud}
                    voertuigenNieuw={voertuigenNieuw}
                    jaarOud={jaarOud}
                    jaarNieuw={jaarNieuw}
                    gekozenMerk={gekozenMerk}
                    gekozenModel={gekozenModel}
            />

        {:else if actieveView === 'verkoop'}
            <VerkoopView
                    voertuigenOud={voertuigenOud}
                    voertuigenNieuw={voertuigenNieuw}
                    jaarOud={jaarOud}
                    jaarNieuw={jaarNieuw}
                    gekozenMerk={gekozenMerk}
                    gekozenModel={gekozenModel}
                    verkoopOud={verkoopOud}
                    verkoopNieuw={verkoopNieuw}
            />
        {/if}
    </div>

    <!-- onderaan navigatie voor terug / opnieuw -->
    <footer class="dashboard-footer">
        <button type="button" on:click={terug}>
            Terug naar instellingen
        </button>

        <button type="button" on:click={opnieuw}>
            Opnieuw beginnen
        </button>
    </footer>
</section>

<style>
    .dashboard {
        max-width: 1000px;
        margin: 0 auto;
        padding: 2rem;
    }

    .dashboard-header {
        margin-bottom: 1.5rem;
    }

    .dashboard-sub {
        margin-top: 0.4rem;
        color: #555;
    }

    .dashboard-tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-bottom: 1.5rem;
    }

    .dashboard-tabs button {
        padding: 0.4rem 0.9rem;
        cursor: pointer;
        border: 1px solid #ccc;
        background: #f5f5f5;
    }

    .dashboard-tabs button.active {
        border-color: #000;
        font-weight: 600;
    }

    .dashboard-content {
        margin-bottom: 2rem;
    }

    .dashboard-footer {
        display: flex;
        gap: 1rem;
    }
</style>
