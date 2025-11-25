<script>
    import { createEventDispatcher, onMount } from 'svelte';

    const STORAGE_KEY = 'autoVergelijkingFilters';

    const dispatch = createEventDispatcher();

    // RDW helpers uit fetchData.js
    import {
        haalMerken,
        haalModellenVoorMerk,
        haalJarenVoorMerkEnModel
    } from '$lib/fetchData.js';

    // wat de gebruiker hier kiest
    let merk = '';
    let model = '';
    let inrichting = 'ALLE'; // blijft vast
    let jaarOud = '';        // "van"
    let jaarNieuw = '';      // "tot"
    let jarenReeks = [];     // echte range: [2000, 2001, ..., 2025]

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
    // Bij binnenkomen:
    // - merken ophalen
    // - proberen filters uit localStorage te restoren
    // - als er merk/model zijn: modellen + jaren ophalen
    // ----------------------------------------------------
    onMount(async () => {
        // 1. Merken ophalen
        try {
            const lijst = await haalMerken();
            merken = lijst;
        } catch (err) {
            console.error('Fout bij merken ophalen:', err);
            merken = [];
        } finally {
            ladenMerken = false;
        }

        // 2. Filters uit localStorage
        try {
            if (typeof localStorage !== 'undefined') {
                const raw = localStorage.getItem(STORAGE_KEY);
                if (raw) {
                    const saved = JSON.parse(raw);

                    merk = saved.merk || '';
                    model = saved.model || '';
                    inrichting = saved.inrichting ?? 'ALLE';
                    jaarOud = saved.jaarOud ? String(saved.jaarOud) : '';
                    jaarNieuw = saved.jaarNieuw ? String(saved.jaarNieuw) : '';
                    jarenReeks = Array.isArray(saved.jarenReeks)
                        ? saved.jarenReeks
                        : [];
                }
            }
        } catch (e) {
            console.warn('Kon opgeslagen filters niet lezen:', e);
        }

        // 3. Als we een merk hebben → modellen ophalen
        if (merk) {
            ladenModellen = true;
            try {
                const lijstModellen = await haalModellenVoorMerk(merk);
                modellen = lijstModellen;
            } catch (err) {
                console.error('Fout bij modellen ophalen (na restore):', err);
                modellen = [];
            } finally {
                ladenModellen = false;
            }
        }

        // 4. Als we ook een model hebben → jaren ophalen
        if (merk && model) {
            ladenJaren = true;
            try {
                const jaren = await haalJarenVoorMerkEnModel(merk, model);
                beschikbareJaren = jaren;

                if (jaarOud) {
                    const oudNum = Number(jaarOud);
                    beschikbareJarenNieuw = jaren.filter((y) => y >= oudNum);

                    if (jaarNieuw && Number(jaarNieuw) < oudNum) {
                        jaarNieuw = '';
                    }
                } else {
                    beschikbareJarenNieuw = jaren;
                }
            } catch (err) {
                console.error('Fout bij jaren ophalen (na restore):', err);
                beschikbareJaren = [];
                beschikbareJarenNieuw = [];
            } finally {
                ladenJaren = false;
            }
        }
    });

    // ----------------------------------------------------
    // Als merk verandert:
    // - modellen ophalen voor dit merk
    // - rest resetten (model, jaren, range)
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
            jarenReeks = [];
            return;
        }

        merk = trimmed;

        modellen = [];
        beschikbareJaren = [];
        beschikbareJarenNieuw = [];
        model = '';
        jaarOud = '';
        jaarNieuw = '';
        jarenReeks = [];

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
            jarenReeks = [];
            return;
        }

        ladenJaren = true;
        jaarOud = '';
        jaarNieuw = '';
        beschikbareJarenNieuw = [];
        jarenReeks = [];

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
    // - "tot"-jaren (jaarNieuw) mogen niet < "van"-jaar (jaarOud)
    // - filter beschikbareJarenNieuw op basis van jaarOud
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
    // - bouw hier de echte range (jarenReeks)
    // ----------------------------------------------------
    const doorNaarDashboard = () => {
        if (!merk || !model || !jaarOud || !jaarNieuw) {
            alert('Kies een merk, model en een periode (van en tot jaar) 😉');
            return;
        }

        let oud = Number(jaarOud);
        let nieuw = Number(jaarNieuw);

        // als iemand per ongeluk eerst het latere jaar kiest,
        // draaien we ze gewoon om.
        if (nieuw < oud) {
            const tmp = oud;
            oud = nieuw;
            nieuw = tmp;
        }

        // 👉 echte reeks bouwen: [oud, ..., nieuw]
        jarenReeks = [];
        for (let y = oud; y <= nieuw; y++) {
            jarenReeks.push(y);
        }

        // 👉 filters opslaan in localStorage
        try {
            const payload = {
                merk,
                model,
                inrichting,
                jaarOud: oud,
                jaarNieuw: nieuw,
                jarenReeks
            };

            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
            }
        } catch (e) {
            console.warn('Kon filters niet opslaan:', e);
        }

        // daarna door naar het dashboard
        dispatch('filters', {
            merk,
            model,
            inrichting,
            jaarOud: oud,
            jaarNieuw: nieuw,
            jarenReeks
        });
    };
</script>

<section class="informatie-scherm">
    <h2>Stel je vergelijking samen</h2>
    <p>
        Kies hieronder eerst een merk en model. Daarna kies je een periode met twee jaartallen
        (van en tot) die je met elkaar wilt vergelijken.
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

    <!-- PERIODE (JAREN) ------------------------------------- -->
    <div class="form-blok">
        <label>Periode</label>

        {#if !model}
            <p>Kies eerst een model.</p>
        {:else if ladenJaren}
            <p>Jaren worden geladen…</p>
        {:else}
            <div class="jaar-range">
                <div class="jaar-col">
                    <span class="jaar-label-klein">van</span>
                    <select bind:value={jaarOud}>
                        <option value="">-- kies jaar --</option>
                        {#each beschikbareJaren as y}
                            <option value={y}>{y}</option>
                        {/each}
                    </select>
                </div>

                <div class="jaar-col">
                    <span class="jaar-label-klein">tot</span>
                    <select bind:value={jaarNieuw}>
                        <option value="">-- kies jaar --</option>
                        {#each beschikbareJarenNieuw as y}
                            <option value={y}>{y}</option>
                        {/each}
                    </select>
                </div>
            </div>
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

    .jaar-range {
        display: flex;
        gap: 1rem;
    }

    .jaar-col {
        flex: 1;
    }

    .jaar-label-klein {
        display: block;
        font-size: 0.85rem;
        margin-bottom: 0.2rem;
        opacity: 0.8;
    }
</style>
