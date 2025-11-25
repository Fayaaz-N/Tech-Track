<script>
    import { onMount, createEventDispatcher } from 'svelte';

    import {
        CHINESE_EV_MERKEN,
        WESTERSE_EV_MERKEN,
        haalBevVerkoopPerJaarVoorMerk
    } from '$lib/fetchData.js';

    import AantallenChart from './graphs/aantallenChart.svelte';

    const dispatch = createEventDispatcher();

    // default merken (eerste uit de arrays)
    let chinaMerk = CHINESE_EV_MERKEN[0] || '';
    let westersMerk = WESTERSE_EV_MERKEN[0] || '';

    // default periode
    let jaarVan = 2020;
    let jaarTot = 2025;

    // resultaat-objecten
    let chinaData = null;
    let westData = null;

    // UI-state
    let loading = false;
    let errorMsg = '';
    let firstLoadDone = false;

    // helper: zorg dat jaarVan <= jaarTot
    const normaliseerJaren = () => {
        const v = Number(jaarVan);
        const t = Number(jaarTot);

        if (!Number.isFinite(v) || !Number.isFinite(t)) {
            return null;
        }

        const jaarMin = Math.min(v, t);
        const jaarMax = Math.max(v, t);
        return { jaarMin, jaarMax };
    };

    const laadVerkoopData = async () => {
        errorMsg = '';

        if (!chinaMerk || !westersMerk) {
            errorMsg = 'Vul eerst beide merken in.';
            return;
        }

        const range = normaliseerJaren();
        if (!range) {
            errorMsg = 'Jaren zijn niet geldig.';
            return;
        }

        loading = true;

        try {
            const [chinaRes, westRes] = await Promise.all([
                haalBevVerkoopPerJaarVoorMerk(
                    chinaMerk,
                    range.jaarMin,
                    range.jaarMax
                ),
                haalBevVerkoopPerJaarVoorMerk(
                    westersMerk,
                    range.jaarMin,
                    range.jaarMax
                )
            ]);

            chinaData = chinaRes;
            westData = westRes;
            firstLoadDone = true;
        } catch (err) {
            console.error('Fout bij laden verkoopdata:', err);
            errorMsg = 'Er ging iets mis bij het ophalen van de data.';
        } finally {
            loading = false;
        }
    };

    const opnieuw = () => {
        // terug naar intro (de ouder vangt dit event op in +page.svelte)
        dispatch('opnieuw');
    };

    // bij het tonen van het dashboard meteen 1x data laden
    onMount(() => {
        laadVerkoopData();
    });
</script>

<main class="ev-dashboard-page">
    <section class="ev-dashboard-card">
        <!-- HEADER -->
        <header class="ev-dashboard-header">
            <p class="ev-label">Onderzoeksdashboard</p>
            <h1>Hoe snel veroveren Chinese EV’s de Nederlandse automarkt?</h1>
            <p class="ev-subtitle">
                Vergelijk BEV-registraties van een Chinees EV-merk met een Westers merk
                in de Nederlandse registraties. Kies de merken en periode, en bekijk
                direct hoe de lijnen zich ontwikkelen.
            </p>

            <div class="ev-summary">
                <p>
                    Huidige vergelijking:
                    <strong>{chinaMerk || 'Chinees merk onbekend'}</strong>
                    versus
                    <strong>{westersMerk || 'Westers merk onbekend'}</strong>
                    in de periode
                    {#if normaliseerJaren()}
                        <strong>{normaliseerJaren().jaarMin}–{normaliseerJaren().jaarMax}</strong>.
                    {:else}
                        <strong>onbekend</strong>.
                    {/if}
                </p>
            </div>
        </header>

        <!-- CONTROLES -->
        <section class="ev-controls">
            <!-- Linker kolom: Chinees merk -->
            <div class="ev-controls-column">
                <h2>Chinese EV-merken</h2>
                <p class="hint">Kies een Chinees merk om te volgen in de grafiek.</p>

                <label>
                    Merk (China)
                    <input
                            type="text"
                            bind:value={chinaMerk}
                            list="chinese-merken-lijst"
                            placeholder="Bijv. BYD, NIO, XPENG..."
                            disabled={loading}
                    />
                    <datalist id="chinese-merken-lijst">
                        {#each CHINESE_EV_MERKEN as m}
                            <option value={m} />
                        {/each}
                    </datalist>
                </label>
            </div>

            <!-- Midden: periode + knop -->
            <div class="ev-controls-center">
                <h2>Periode</h2>
                <p class="hint">Stel de jaartallen in voor je vergelijking.</p>

                <div class="jaar-range">
                    <label>
                        Jaar van
                        <input
                                type="number"
                                bind:value={jaarVan}
                                min="1990"
                                max="2100"
                                disabled={loading}
                        />
                    </label>

                    <span class="jaar-range-separator">tot</span>

                    <label>
                        Jaar tot
                        <input
                                type="number"
                                bind:value={jaarTot}
                                min="1990"
                                max="2100"
                                disabled={loading}
                        />
                    </label>
                </div>

                <button
                        class="btn-load"
                        type="button"
                        on:click={laadVerkoopData}
                        disabled={loading}
                >
                    {#if loading}
                        Data inladen…
                    {:else}
                        Laad data
                    {/if}
                </button>

                {#if errorMsg}
                    <p class="error-msg">{errorMsg}</p>
                {/if}

                {#if loading}
                    <p class="loading-hint">
                        Data wordt opgehaald bij de RDW…
                    </p>
                {/if}
            </div>

            <!-- Rechter kolom: Westers merk -->
            <div class="ev-controls-column">
                <h2>Westerse EV-merken</h2>
                <p class="hint">Kies een Europees, Amerikaans of Koreaans EV-merk.</p>

                <label>
                    Merk (Westers)
                    <input
                            type="text"
                            bind:value={westersMerk}
                            list="westerse-merken-lijst"
                            placeholder="Bijv. TESLA, VOLKSWAGEN..."
                            disabled={loading}
                    />
                    <datalist id="westerse-merken-lijst">
                        {#each WESTERSE_EV_MERKEN as m}
                            <option value={m} />
                        {/each}
                    </datalist>
                </label>
            </div>
        </section>

        <!-- GRAFIEK -->
        <section class="ev-chart-section">
            {#if chinaData && westData}
                <AantallenChart {chinaData} {westData} />
            {:else if loading && !firstLoadDone}
                <p class="chart-placeholder">
                    De grafiek wordt geladen…
                </p>
            {:else}
                <p class="chart-placeholder">
                    Nog geen data beschikbaar voor de grafiek.
                    Vul beide merken en de periode in en klik op
                    <strong>Laad data</strong>.
                </p>
            {/if}
        </section>

        <!-- RESULTATEN -->
        <section class="ev-results-wrapper">
            {#if loading && !firstLoadDone}
                <div class="ev-loading-full">
                    <div class="spinner"></div>
                    <p>De eerste data wordt opgehaald bij de RDW…</p>
                </div>
            {:else}
                <section class="ev-results">
                    <!-- LINKS: China -->
                    <div class="ev-results-column">
                        <h3>Chinese merk</h3>

                        {#if loading && firstLoadDone}
                            <p class="placeholder">Data wordt vernieuwd…</p>
                        {/if}

                        {#if chinaData}
                            <article class="ev-card">
                                <header>
                                    <h4>{chinaData.merkNetjes}</h4>
                                    <p class="periode">
                                        Periode: {chinaData.jaarVan}–{chinaData.jaarTot}
                                    </p>
                                </header>

                                <p class="totaal">
                                    Totaal aantal BEV-registraties:
                                    <strong>{chinaData.totaalEVs}</strong>
                                </p>

                                {#if chinaData.verkoopPerJaar.length}
                                    <table class="ev-table">
                                        <thead>
                                        <tr>
                                            <th>Jaar</th>
                                            <th>Aantal BEV’s</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {#each chinaData.verkoopPerJaar as rij}
                                            <tr>
                                                <td>{rij.jaar}</td>
                                                <td>{rij.aantal}</td>
                                            </tr>
                                        {/each}
                                        </tbody>
                                    </table>
                                {:else}
                                    <p class="no-data">
                                        Geen BEV-registraties gevonden voor dit merk
                                        in deze periode.
                                    </p>
                                {/if}
                            </article>
                        {:else if !loading}
                            <p class="placeholder">
                                Nog geen data geladen voor het Chinese merk.
                            </p>
                        {/if}
                    </div>

                    <!-- RECHTS: Westers -->
                    <div class="ev-results-column">
                        <h3>Westers merk</h3>

                        {#if loading && firstLoadDone}
                            <p class="placeholder">Data wordt vernieuwd…</p>
                        {/if}

                        {#if westData}
                            <article class="ev-card">
                                <header>
                                    <h4>{westData.merkNetjes}</h4>
                                    <p class="periode">
                                        Periode: {westData.jaarVan}–{westData.jaarTot}
                                    </p>
                                </header>

                                <p class="totaal">
                                    Totaal aantal BEV-registraties:
                                    <strong>{westData.totaalEVs}</strong>
                                </p>

                                {#if westData.verkoopPerJaar.length}
                                    <table class="ev-table">
                                        <thead>
                                        <tr>
                                            <th>Jaar</th>
                                            <th>Aantal BEV’s</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {#each westData.verkoopPerJaar as rij}
                                            <tr>
                                                <td>{rij.jaar}</td>
                                                <td>{rij.aantal}</td>
                                            </tr>
                                        {/each}
                                        </tbody>
                                    </table>
                                {:else}
                                    <p class="no-data">
                                        Geen BEV-registraties gevonden voor dit merk
                                        in deze periode.
                                    </p>
                                {/if}
                            </article>
                        {:else if !loading}
                            <p class="placeholder">
                                Nog geen data geladen voor het Westerse merk.
                            </p>
                        {/if}
                    </div>
                </section>
            {/if}
        </section>

        <!-- FOOTER -->
        <footer class="ev-footer">
            <button type="button" class="btn-terug" on:click={opnieuw}>
                Opnieuw beginnen (terug naar intro)
            </button>
        </footer>
    </section>
</main>

<style>
    /* Zelfde vibe als intro: Apple-achtige system font + zachte gradient */
    .ev-dashboard-page {
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text",
        "SF Pro Display", system-ui, sans-serif;
        min-height: 100vh;
        display: flex;
        align-items: stretch;
        justify-content: center;
        padding: 2.5rem 1.5rem;
        background: radial-gradient(circle at top, #f5f7ff 0, #e9edf7 40%, #dfe3ef 100%);
        box-sizing: border-box;
    }

    .ev-dashboard-card {
        max-width: 1200px;
        width: 100%;
        background: #ffffff;
        border-radius: 24px;
        padding: 2.5rem 2.5rem 2.2rem;
        box-shadow: 0 18px 45px rgba(0, 0, 0, 0.08);
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: 1.8rem;
    }

    @media (max-width: 960px) {
        .ev-dashboard-card {
            padding: 2rem 1.75rem;
        }
    }

    .ev-dashboard-header {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .ev-label {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.25rem 0.7rem;
        border-radius: 999px;
        background: #f5f7ff;
        color: #5060b8;
        font-size: 0.78rem;
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        margin: 0;
        align-self: flex-start;
    }

    h1 {
        font-size: 2rem;
        line-height: 1.25;
        margin: 0;
        color: #111117;
    }

    @media (min-width: 1100px) {
        h1 {
            font-size: 2.25rem;
        }
    }

    .ev-subtitle {
        margin: 0;
        font-size: 0.95rem;
        line-height: 1.6;
        color: #4a4f5c;
        max-width: 720px;
    }

    .ev-summary {
        margin-top: 0.2rem;
        font-size: 0.9rem;
        color: #30323a;
    }

    .ev-summary p {
        margin: 0;
    }

    /* CONTROLES */
    .ev-controls {
        display: grid;
        grid-template-columns: 1.1fr 1fr 1.1fr;
        gap: 1.4rem;
        align-items: stretch;
    }

    .ev-controls-column,
    .ev-controls-center {
        background: #f8f8fb;
        padding: 1rem 1.2rem 1.1rem;
        border-radius: 16px;
        border: 1px solid #e1e2ec;
        box-sizing: border-box;
    }

    .ev-controls-column h2,
    .ev-controls-center h2 {
        margin: 0 0 0.25rem;
        font-size: 1rem;
        color: #14151d;
    }

    .hint {
        margin: 0 0 0.75rem;
        font-size: 0.82rem;
        color: #6b6e7a;
    }

    label {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        font-size: 0.86rem;
        color: #262833;
    }

    input[type='text'],
    input[type='number'] {
        padding: 0.45rem 0.5rem;
        border-radius: 10px;
        border: 1px solid #d1d2dd;
        font-size: 0.9rem;
        outline: none;
        background: #ffffff;
        transition: border-color 0.12s ease-out, box-shadow 0.12s ease-out;
    }

    input[type='text']:focus,
    input[type='number']:focus {
        border-color: #5060b8;
        box-shadow: 0 0 0 1px rgba(80, 96, 184, 0.2);
    }

    input:disabled {
        background: #f1f1f5;
    }

    .ev-controls-center {
        text-align: center;
        min-width: 230px;
    }

    .jaar-range {
        display: flex;
        align-items: flex-end;
        justify-content: center;
        gap: 0.9rem;
        margin-bottom: 0.85rem;
    }

    .jaar-range label {
        min-width: 90px;
    }

    .jaar-range-separator {
        font-size: 0.9rem;
        color: #333;
        margin-bottom: 0.35rem;
    }

    .btn-load {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-top: 0.1rem;
        padding: 0.55rem 1.4rem;
        border-radius: 999px;
        border: none;
        background: #111117;
        color: #fff;
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.12s ease-out, box-shadow 0.12s ease-out,
        filter 0.12s ease-out;
        box-shadow: 0 10px 24px rgba(0, 0, 0, 0.18);
    }

    .btn-load:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 14px 30px rgba(0, 0, 0, 0.22);
        filter: brightness(1.03);
    }

    .btn-load:active:not(:disabled) {
        transform: translateY(0);
        box-shadow: 0 7px 18px rgba(0, 0, 0, 0.18);
        filter: brightness(0.97);
    }

    .btn-load:disabled {
        opacity: 0.6;
        cursor: default;
        box-shadow: none;
    }

    .error-msg {
        margin-top: 0.5rem;
        color: #c0392b;
        font-size: 0.82rem;
    }

    .loading-hint {
        margin-top: 0.35rem;
        font-size: 0.8rem;
        color: #555;
    }

    /* GRAFIEK */
    .ev-chart-section {
        border-radius: 20px;
        border: 1px solid #e1e2ec;
        padding: 1rem 1.1rem;
        background: #ffffff;
    }

    .chart-placeholder {
        font-size: 0.9rem;
        color: #666;
        margin: 0.2rem 0 0;
    }

    .chart-placeholder strong {
        font-weight: 600;
    }

    /* RESULTATEN */
    .ev-results-wrapper {
        position: relative;
        min-height: 180px;
    }

    .ev-loading-full {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem 1rem;
        gap: 0.75rem;
        border-radius: 20px;
        border: 1px solid #e1e2ec;
        background: #fafbff;
        font-size: 0.9rem;
        color: #444;
    }

    .spinner {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 3px solid #ccc;
        border-top-color: #111;
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    .ev-results {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
        align-items: flex-start;
    }

    .ev-results-column h3 {
        margin: 0 0 0.5rem;
        font-size: 1rem;
        color: #181923;
    }

    .ev-card {
        border-radius: 18px;
        border: 1px solid #e1e2ec;
        padding: 1rem 1.15rem 1.1rem;
        background: #ffffff;
        box-shadow: 0 10px 24px rgba(15, 23, 42, 0.03);
    }

    .ev-card header h4 {
        margin: 0;
        font-size: 1.05rem;
    }

    .ev-card .periode {
        margin: 0.15rem 0 0.55rem;
        font-size: 0.82rem;
        color: #666a76;
    }

    .totaal {
        margin: 0 0 0.75rem;
        font-size: 0.9rem;
    }

    .totaal strong {
        font-weight: 600;
    }

    .ev-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.82rem;
    }

    .ev-table th,
    .ev-table td {
        padding: 0.32rem 0.4rem;
        border-bottom: 1px solid #f0f1f6;
        text-align: left;
    }

    .ev-table th {
        font-weight: 600;
        background: #fafbff;
    }

    .no-data {
        margin: 0.4rem 0 0;
        font-size: 0.82rem;
        color: #666;
    }

    .placeholder {
        font-size: 0.86rem;
        color: #777;
    }

    /* FOOTER */
    .ev-footer {
        display: flex;
        justify-content: flex-end;
        margin-top: 0.4rem;
    }

    .btn-terug {
        padding: 0.45rem 1.1rem;
        border-radius: 999px;
        border: 1px solid #d1d2dd;
        background: #ffffff;
        font-size: 0.86rem;
        cursor: pointer;
        color: #262833;
        transition: background 0.12s ease-out, border-color 0.12s ease-out;
    }

    .btn-terug:hover {
        background: #f4f4fa;
        border-color: #c4c6d5;
    }

    @media (max-width: 1000px) {
        .ev-controls {
            grid-template-columns: 1fr;
        }
    }

    @media (max-width: 900px) {
        .ev-results {
            grid-template-columns: 1fr;
        }
    }

    @media (max-width: 640px) {
        .ev-dashboard-page {
            padding: 1.8rem 1rem;
        }

        .ev-dashboard-card {
            padding: 1.7rem 1.4rem;
            border-radius: 20px;
        }
    }
</style>
