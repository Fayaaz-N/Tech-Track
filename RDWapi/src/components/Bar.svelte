<script>
    import { onMount } from 'svelte';
    import { fetchRdwMPVs, fetchRdwMpvMerken } from '$lib/fetchData.js';
    // ↑ pad eventueel aanpassen

    // lijst met merken voor de <select>
    let merken = [];
    let selectedMerk = '';

    // ruwe voertuigen uit de API
    let vehicles = [];

    // samenvatting per jaar: [{ jaar: 2020, aantal: 123 }, ...]
    let jaarStats = [];

    let loading = false;
    let error = '';

    // bij het laden van de pagina: merken ophalen
    onMount(async function () {
        loading = true;
        error = '';

        try {
            // haalt alle merken op die een MPV hebben in jouw jaarrange
            merken = await fetchRdwMpvMerken(); // gebruikt default 2020–2025

            if (merken.length > 0) {
                selectedMerk = merken[0];
            }
        } catch (e) {
            error = e && e.message ? e.message : String(e);
        } finally {
            loading = false;
        }
    });

    // wordt aangeroepen als je op de knop klikt
    async function laadData() {
        if (!selectedMerk) {
            return;
        }

        loading = true;
        error = '';
        vehicles = [];
        jaarStats = [];

        try {
            // 1. auto's ophalen voor het gekozen merk
            vehicles = await fetchRdwMPVs(selectedMerk);

            // 2. samenvatting per jaar maken
            jaarStats = maakJaarStats(vehicles);
        } catch (e) {
            error = e && e.message ? e.message : String(e);
        } finally {
            loading = false;
        }
    }

    // maakt van de voertuigen een lijst met { jaar, aantal }
    function maakJaarStats(vehicles) {
        // 1. auto's met een datum pakken
        const autosMetDatum = vehicles.filter(function (auto) {
            return auto.datumEersteTenaamstellingNL;
        });

        // 2. per auto alleen het jaartal eruit halen
        const jaren = autosMetDatum.map(function (auto) {
            const datumString = String(auto.datumEersteTenaamstellingNL); // "20200115"
            const jaarString = datumString.slice(0, 4); // "2020"
            const jaarNummer = Number(jaarString);      // 2020
            return jaarNummer;
        });

        // 3. met reduce tellen hoeveel auto's per jaar
        const tellingPerJaar = jaren.reduce(function (acc, jaar) {
            if (!acc[jaar]) {
                acc[jaar] = 0;
            }

            acc[jaar] = acc[jaar] + 1;
            return acc;
        }, {}); // start met leeg object

        // 4. omzetten naar array zodat Svelte erover kan loopen
        const jaarArray = Object.keys(tellingPerJaar).map(function (jaarKey) {
            return {
                jaar: Number(jaarKey),
                aantal: tellingPerJaar[jaarKey]
            };
        });

        // 5. sorteren op jaar
        jaarArray.sort(function (a, b) {
            return a.jaar - b.jaar;
        });

        return jaarArray;
    }
</script>

<!-- MERK KIEZEN -->
<div>
    <label for="merk-select">Kies een merk (met MPV's):</label>
    <select
            id="merk-select"
            bind:value={selectedMerk}
            disabled={loading || merken.length === 0}
    >
        {#each merken as merk}
            <option value={merk}>{merk}</option>
        {/each}
    </select>
</div>

<!-- KNOP OM DATA TE LADEN -->
<div style="margin-top: 1rem;">
    <button on:click={laadData} disabled={loading || !selectedMerk}>
        {#if loading}
            Bezig met laden...
        {:else}
            Laad gegevens
        {/if}
    </button>
</div>

<!-- FOUTMELDING -->
{#if error}
    <p style="color: red; margin-top: 1rem;">
        Fout: {error}
    </p>
{/if}

<!-- AANTAL AUTO'S PER JAAR -->
{#if jaarStats.length > 0}
    <h2 style="margin-top: 2rem;">
        Aantal MPV's per jaar voor {selectedMerk}
    </h2>

    <ul>
        {#each jaarStats as rij}
            <li>
                {rij.jaar} → {rij.aantal} auto's
            </li>
        {/each}
    </ul>
{/if}

<!-- (extra) Geef de hele lijst met voertuigen weer. -->
<!--{#if vehicles.length > 0}-->
<!--    <h3 style="margin-top: 2rem;">Ruwe voertuigen (controle)</h3>-->
<!--    <ol>-->
<!--        {#each vehicles as v}-->
<!--            <li>-->
<!--                {v.kenteken} — {v.merk} {v.handelsbenaming}-->
<!--            </li>-->
<!--        {/each}-->
<!--    </ol>-->
<!--{/if}-->
