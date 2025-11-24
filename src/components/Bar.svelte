<script>
    import RdwFilterForm from './RdwFilterForm.svelte';
    import BarChart from './graphs/barchart.svelte';
    import ColorChart from './graphs/colorchart.svelte';
    import { maakJaarStats, maakKleurStats } from '$lib/fetchData_old.js';

    const VIEW_SALES = 'sales';
    const VIEW_COLORS = 'colors';

    let activeView = VIEW_SALES;

    let filters = null;
    let vehicles = [];

    let jaarStats = [];
    let kleurStats = [];

    const handleViewChange = (event) => {
        activeView = event.detail.view;
        console.log('View change:', activeView);
    };

    const handleLoaded = (event) => {
        activeView = event.detail.view;
        filters = event.detail.filters;
        vehicles = event.detail.vehicles;

        console.log('Loaded view:', activeView);
        console.log('Vehicles count:', vehicles.length);

        if (activeView === VIEW_SALES) {
            jaarStats = maakJaarStats(vehicles);
            kleurStats = [];
        } else if (activeView === VIEW_COLORS) {
            kleurStats = maakKleurStats(vehicles);
            jaarStats = [];
        }

        console.log('kleurStats:', kleurStats);
    };
</script>

<main>
    <RdwFilterForm
            on:viewchange={handleViewChange}
            on:loaded={handleLoaded}
    />

    {#if activeView === VIEW_SALES && jaarStats.length > 0 && filters}
        <section style="margin-top: 2rem;">
            <h2>
                Verkoopaantallen per jaar voor {filters.merk}
                ({filters.startYear}–{filters.endYear}
                {#if filters.inrichting !== 'ALLE'}
