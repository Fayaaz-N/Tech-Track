<script>
    import { createEventDispatcher, onMount } from 'svelte';

    // RDW helpers uit fetchData.js
    import {
        haalMerken,
        haalModellenVoorMerk,
        haalJarenVoorMerkEnModel
    } from '$lib/fetchData.js';

    const dispatch = createEventDispatcher();

    // wat de gebruiker hier kiest
    let merk = '';
    let model = '';
    let inrichting = 'ALLE'; // vast, we tonen dit niet meer in de UI
    let jaarOud = '';
    let jaarNieuw = '';

    // data voor velden
    let merken = [];
    let modellen = [];
    let beschikbareJaren = [];
    let beschikbareJarenNieuw = [];

    // loading flags
    let ladenMerken = true;
    let ladenModellen = false;
    let ladenJaren = false;

    // ----------------------------------------------------
    // Bij binnenkomen direct alle merken ophalen
    // ----------------------------------------------------
    onMount(async () => {
        try {
            const lijst = await haalMerken();
            merken = lijst;
        } catch (err) {
            console.error('Fout bij merken ophalen:', err);
            merken = [];
        } finally {
            ladenMerken = false;
        }
    });

    // ----------------------------------------------------
    // Als merk verandert:
    // - modellen ophalen voor dit merk
    // - rest resetten (model, jaren)
    // ----------------------------------------------------
    const merkVeranderd = async () => {
        const trimmed = merk ? merk.trim() : '';

        // als je merk weghaalt: alles weer leeg
        if (!trimmed) {
            modellen = [];
            beschikbareJaren = [];
            beschikbareJarenNieuw = [];
            model = '';
            jaarOud = '';
            jaarNieuw = '';
            return;
        }

        merk = trimmed;

        modellen = [];
        beschikbareJaren = [];
        beschikbareJarenNieuw = [];
        model = '';
        jaarOud = '';
        jaarNieuw = '';

        ladenModellen = true;
        try {
            const lijst = await haalModellenVoorMerk(merk);
            modellen = lijst;
        } catch (err) {
            console.error('Fout bij modellen ophalen:', err);
            modellen = [];
        } finally {
            ladenModellen = false;
        }
    };

    // ----------------------------------------------------
    // Als model verandert:
    // - jaren ophalen voor dit merk + model
    // ----------------------------------------------------
    const modelVeranderd = async () => {
        const trimmed = model ? model.trim() : '';
        model = trimmed;

        if (!model || !merk) {
            beschikbareJaren = [];
            beschikbareJarenNieuw = [];
            jaarOud = '';
            jaarNieuw = '';
            return;
        }

        ladenJaren = true;
        jaarOud = '';
        jaarNieuw = '';
        beschikbareJarenNieuw = [];

        try {
            const jaren = await haalJarenVoorMerkEnModel(merk, model);
            beschikbareJaren = jaren;
            beschikbareJarenNieuw = jaren;
        } catch (err) {
            console.error('Fout bij jaren ophalen:', err);
            beschikbareJaren = [];
            beschikbareJarenNieuw = [];
        } finally {
            ladenJaren = false;
        }
    };

    // ----------------------------------------------------
    // Jaar-logica:
    // - jaarNieuw mag niet < jaarOud
    // ----------------------------------------------------
    $: {
        if (jaarOud && beschikbareJaren.length > 0) {
            const oudNum = Number(jaarOud);
            beschikbareJarenNieuw = beschikbareJaren.filter((y) => y >= oudNum);

            if (jaarNieuw && Number(jaarNieuw) < oudNum) {
                jaarNieuw = '';
            }
        } else {
            beschikbareJarenNieuw = [...beschikbareJaren];
        }
    }

    // ----------------------------------------------------
    // Verder naar dashboard
    // ----------------------------------------------------
    const doorNaarDashboard = () => {
        if (!merk || !model || !jaarOud || !jaarNieuw) {
            alert('Je moet een merk, model en twee jaren kiezen 😉');
            return;
        }

        let oud = Number(jaarOud);
        let nieuw = Number(jaarNieuw);

        if (nieuw < oud) {
            const tmp = oud;
            oud = nieuw;
            nieuw = tmp;
        }

        dispatch('filters', {
            merk,
            model,
            inrichting, // altijd 'ALLE'
            jaarOud: oud,
            jaarNieuw: nieuw
        });
    };
</script>

<section class="informatie-scherm">
    <h2>Stel je vergelijking samen</h2>
    <p>
        Kies hieronder eerst een merk en model. Daarna kies je twee jaartallen
        die je met elkaar wilt vergelijken.
    </p>

    <!-- MERK ------------------------------------------------ -->
    <div class="form-blok">
        <label for="merk-input">Merk</label>

        {#if ladenMerken}
            <p>Merken worden geladen…</p>
        {:else}
            <input
                    id="merk-input"
                    type="text"
                    placeholder="Begin met typen…"
                    bind:value={merk}
                    list="merken-lijst"
                    on:change={merkVeranderd}
                    on:blur={merkVeranderd}
            />
            <datalist id="merken-lijst">
                {#each merken as m}
                    <option value={m} />
                {/each}
            </datalist>
        {/if}
    </div>

    <!-- MODEL ------------------------------------------------ -->
    <div class="form-blok">
        <label for="model-input">Model (handelsbenaming)</label>

        {#if !merk}
            <p>Kies eerst een merk.</p>
        {:else if ladenModellen}
            <p>Modellen worden geladen…</p>
        {:else}
            <input
                    id="model-input"
                    type="text"
                    placeholder="Begin met typen…"
                    bind:value={model}
                    list="modellen-lijst"
                    on:change={modelVeranderd}
                    on:blur={modelVeranderd}
            />
            <datalist id="modellen-lijst">
                {#each modellen as mdl}
                    <option value={mdl} />
                {/each}
            </datalist>
        {/if}
    </div>

    <!-- JAREN ------------------------------------------------ -->
    <div class="form-blok">
        <label for="jaar-oud-select">Ouder jaar</label>

        {#if !model}
            <p>Kies eerst een model.</p>
        {:else if ladenJaren}
            <p>Jaren worden geladen…</p>
        {:else}
            <select id="jaar-oud-select" bind:value={jaarOud}>
                <option value="">-- kies jaar --</option>
                {#each beschikbareJaren as y}
                    <option value={y}>{y}</option>
                {/each}
            </select>
        {/if}
    </div>

    <div class="form-blok">
        <label for="jaar-nieuw-select">Nieuwer jaar</label>

        {#if !model}
            <p>Kies eerst een model.</p>
        {:else if ladenJaren}
            <p>Jaren worden geladen…</p>
        {:else}
            <select id="jaar-nieuw-select" bind:value={jaarNieuw}>
                <option value="">-- kies jaar --</option>
                {#each beschikbareJarenNieuw as y}
                    <option value={y}>{y}</option>
                {/each}
            </select>
        {/if}
    </div>

    <!-- KNOP ------------------------------------------------- -->
    <button class="btn-volgende" type="button" on:click={doorNaarDashboard}>
        Verder naar dashboard
    </button>
</section>

<style>
    .informatie-scherm {
        max-width: 700px;
        margin: 0 auto;
        padding: 2rem;
    }

    .form-blok {
        margin-bottom: 1.4rem;
    }

    label {
        display: block;
        font-weight: 600;
        margin-bottom: 0.3rem;
    }

    input[type='text'],
    select {
        width: 100%;
        padding: 0.5rem;
        box-sizing: border-box;
    }

    .btn-volgende {
        margin-top: 1rem;
        padding: 0.8rem 1.6rem;
        cursor: pointer;
    }
</style>
