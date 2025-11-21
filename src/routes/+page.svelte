<script>
    import RdwFilterForm from '../components/RdwFilterForm.svelte';
    import BarChart from '../components/barchart.svelte';
    import { maakJaarStats, maakKleurStats } from '$lib/fetchData.js';

    let activeView = 'sales';   // zelfde als VIEW_SALES
    let filters = null;
    let vehicles = [];
    let jaarStats = [];
    let kleurStats = [];

    const handleViewChange = (event) => {
        activeView = event.detail.view;
    };

    const handleLoaded = (event) => {
        activeView = event.detail.view;      // voor de zekerheid gelijk houden
        filters = event.detail.filters;
        vehicles = event.detail.vehicles;

        if (activeView === 'sales') {
            jaarStats = maakJaarStats(vehicles);
            kleurStats = [];
        } else if (activeView === 'colors') {
            kleurStats = maakKleurStats(vehicles);
            jaarStats = [];
        }
    };
</script>

<main>
    <RdwFilterForm
            on:viewchange={handleViewChange}
            on:loaded={handleLoaded}
    />

    {#if activeView === 'sales' && jaarStats.length > 0 && filters}
        <!-- jouw verkoop-grafiek -->
        <h2>Verkoopaantallen per jaar voor {filters.merk}</h2>
        <BarChart data={jaarStats} />
    {/if}

    {#if activeView === 'colors' && kleurStats.length > 0 && filters}
        <!-- jouw kleuren weergave (nu bv. lijst, later eigen chart) -->
        <h2>Kleurverdeling voor {filters.merk}</h2>
        <ul>
            {#each kleurStats as rij}
                <li>{rij.kleur} → {rij.aantal}</li>
            {/each}
        </ul>
    {/if}
</main>
