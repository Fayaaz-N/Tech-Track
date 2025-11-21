<script>
    import { onMount, createEventDispatcher } from 'svelte';
    import {
        fetchRdwMPVs,
        fetchRdwMpvMerken,
        fetchRdwInrichtingen
    } from '$lib/fetchData.js';

    const dispatch = createEventDispatcher();

    // welke grafiek willen we tonen?
    const VIEW_SALES = 'sales';   // verkoopaantallen per jaar
    const VIEW_COLORS = 'colors'; // kleurverdeling

    let selectedView = VIEW_SALES;

    // filters
    let merken = [];
    let selectedMerk = '';

    const jaarOpties = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
    let startYear = 2020;
    let endYear = 2025;

    let inrichtingen = [];
    let selectedInrichting = 'ALLE';

    // ui-state
    let loading = false;
    let error = '';

    onMount(async () => {
        // ouder laten weten wat de start-view is
        dispatch('viewchange', { view: selectedView });

        await initMerken();
    });

    const selectView = (view) => {
        if (view === selectedView) return;
        selectedView = view;
        dispatch('viewchange', { view: selectedView });
    };

    const initMerken = async () => {
        loading = true;
        error = '';

        try {
            merken = await fetchRdwMpvMerken(startYear, endYear);

            if (merken.length > 0) {
                selectedMerk = merken[0];
                await updateInrichtingen();
            }
        } catch (e) {
            error = e?.message ?? String(e);
        } finally {
            loading = false;
        }
    };

    const updateInrichtingen = async () => {
        inrichtingen = [];
        selectedInrichting = 'ALLE';

        if (!selectedMerk) return;
        if (startYear > endYear) return;

        try {
            const ruweInrichtingen = await fetchRdwInrichtingen(
                selectedMerk,
                startYear,
                endYear
            );

            const uniek = ruweInrichtingen
                .reduce((acc, inrichting) => {
                    if (!acc.includes(inrichting)) {
                        acc.push(inrichting);
                    }
                    return acc;
                }, [])
                .sort((a, b) => a.localeCompare(b));

            inrichtingen = uniek;
        } catch (e) {
            console.error(e);
        }
    };

    const laadData = async () => {
        if (!selectedMerk) return;

        if (startYear > endYear) {
            error = 'Beginjaar mag niet groter zijn dan eindjaar.';
            return;
        }

        loading = true;
        error = '';

        try {
            const inrichtingParam =
                selectedInrichting === 'ALLE' ? null : selectedInrichting;

            const vehicles = await fetchRdwMPVs(
                selectedMerk,
                startYear,
                endYear,
                inrichtingParam
            );

            // alles doorgeven aan de ouder, inclusief huidige view
            dispatch('loaded', {
                view: selectedView,
                filters: {
                    merk: selectedMerk,
                    startYear,
                    endYear,
                    inrichting: selectedInrichting
                },
                vehicles
            });
        } catch (e) {
            error = e?.message ?? String(e);
        } finally {
            loading = false;
        }
    };
</script>

<!-- STAP 1: kies welke analyse / grafiek -->
<section style="margin-bottom: 1.5rem;">
    <h3>Stap 1: Wat wil je zien?</h3>
    <button
            type="button"
            on:click={() => selectView(VIEW_SALES)}
            disabled={loading}
            class:selected={selectedView === VIEW_SALES}
    >
        Verkoopaantallen per jaar
    </button>

    <button
            type="button"
            on:click={() => selectView(VIEW_COLORS)}
            disabled={loading}
            class:selected={selectedView === VIEW_COLORS}
            style="margin-left: 0.5rem;"
    >
        Kleurverdeling
    </button>
</section>

<!-- STAP 2: merk -->
<section style="margin-bottom: 1rem;">
    <h3>Stap 2: Kies een merk (personenauto)</h3>
    <label for="merk-select">Merk:</label>
    <select
            id="merk-select"
            bind:value={selectedMerk}
            disabled={loading || merken.length === 0}
            on:change={updateInrichtingen}
    >
        {#each merken as merk}
            <option value={merk}>{merk}</option>
        {/each}
    </select>
</section>

<!-- STAP 3: jaren -->
<section style="margin-bottom: 1rem;">
    <h3>Stap 3: Kies een tijdsbestek</h3>

    <label>
        Beginjaar:
        <select bind:value={startYear} on:change={updateInrichtingen}>
            {#each jaarOpties as jaar}
                <option value={jaar}>{jaar}</option>
            {/each}
        </select>
    </label>

    <label style="margin-left: 1rem;">
        Eindjaar:
        <select bind:value={endYear} on:change={updateInrichtingen}>
            {#each jaarOpties as jaar}
                <option value={jaar}>{jaar}</option>
            {/each}
        </select>
    </label>
</section>

<!-- STAP 4: inrichting -->
<section style="margin-bottom: 1rem;">
    <h3>Stap 4: Kies een inrichting</h3>
    <label for="inrichting-select">Inrichting:</label>
    <select
            id="inrichting-select"
            bind:value={selectedInrichting}
            disabled={inrichtingen.length === 0 || loading}
    >
        <option value="ALLE">Alle inrichtingen</option>
        {#each inrichtingen as inrichting}
            <option value={inrichting}>{inrichting}</option>
        {/each}
    </select>

    {#if inrichtingen.length === 0}
        <small style="margin-left: 0.5rem;">
            Aan het ophalen welke voertuigtypes er zijn...
        </small>
    {/if}
</section>

<!-- STAP 5: data ophalen -->
<section style="margin-top: 1rem;">
    <h3>Stap 5: Haal de gegevens op</h3>
    <button
            on:click={laadData}
            disabled={loading || !selectedMerk || startYear > endYear}
    >
        {#if loading}
            Bezig met laden...
        {:else}
            Laad gegevens
        {/if}
    </button>
</section>

{#if error}
    <p style="color: red; margin-top: 1rem;">
        Fout: {error}
    </p>
{/if}

<style>
    button.selected {
        font-weight: 600;
        text-decoration: underline;
    }
</style>
