<script>
    import Intro from '../components/intro.svelte';
    import Informatie from '../components/informatie.svelte';
    import Dashboard from '../components/dashboard.svelte';

    import { haalDataVoorMerkModelJarenInrichting } from '$lib/fetchData.js';

    // simpele "enum" voor welke stap we tonen
    const SCREEN = {
        INTRO: 1,
        INFO: 2,
        DASHBOARD: 3
    };

    let huidigScherm = SCREEN.INTRO;

    // filters die uit Informatie-scherm komen
    let gekozenMerk = null;
    let gekozenModel = null;
    let gekozenInrichting = 'ALLE';
    let jaarOud = null;
    let jaarNieuw = null;

    // ruwe lijsten voor alle views
    let voertuigenOud = [];
    let voertuigenNieuw = [];

    // alvast wat standaard info (kan Dashboard gebruiken)
    let gemHoogteOud = null;
    let gemHoogteNieuw = null;
    let kleurenOud = [];
    let kleurenNieuw = [];
    let verkoopOud = null;
    let verkoopNieuw = null;

    // -----------------------------------------
    // Navigatie helpers
    // -----------------------------------------
    const naarInfo = () => {
        huidigScherm = SCREEN.INFO;
    };

    const resetState = () => {
        huidigScherm = SCREEN.INTRO;
        gekozenMerk = null;
        gekozenModel = null;
        gekozenInrichting = 'ALLE';
        jaarOud = null;
        jaarNieuw = null;
        voertuigenOud = [];
        voertuigenNieuw = [];
        gemHoogteOud = null;
        gemHoogteNieuw = null;
        kleurenOud = [];
        kleurenNieuw = [];
        verkoopOud = null;
        verkoopNieuw = null;
    };

    const terugNaarIntro = () => {
        resetState();
    };

    const terugNaarInfo = () => {
        huidigScherm = SCREEN.INFO;
    };

    // -----------------------------------------
    // Binnenkomende filters van informatie.svelte
    // -----------------------------------------
    const filtersGekozen = async (event) => {
        const detail = event.detail;

        gekozenMerk = detail.merk;
        gekozenModel = detail.model;
        gekozenInrichting = detail.inrichting;
        jaarOud = detail.jaarOud;
        jaarNieuw = detail.jaarNieuw;

        await laadData();

        huidigScherm = SCREEN.DASHBOARD;
    };

    // -----------------------------------------
    // Grote fetch naar RDW (met jouw nieuwe functie)
    // -----------------------------------------
    const laadData = async () => {
        try {
            const resultaat = await haalDataVoorMerkModelJarenInrichting(
                gekozenMerk,
                gekozenModel,
                jaarOud,
                jaarNieuw,
                gekozenInrichting
            );

            voertuigenOud = resultaat.voertuigenOud;
            voertuigenNieuw = resultaat.voertuigenNieuw;

            gemHoogteOud = resultaat.gemHoogteOud;
            gemHoogteNieuw = resultaat.gemHoogteNieuw;
            kleurenOud = resultaat.kleurenOud;
            kleurenNieuw = resultaat.kleurenNieuw;
            verkoopOud = resultaat.verkoopOud;
            verkoopNieuw = resultaat.verkoopNieuw;
        } catch (err) {
            console.error('Fout bij RDW data laden:', err);
            voertuigenOud = [];
            voertuigenNieuw = [];
        }
    };
</script>

<main class="app">
    <section class="scherm-wrapper scherm-{huidigScherm}">

        {#if huidigScherm === SCREEN.INTRO}
            <!-- Intro-scherm: legt uit wat de tool doet -->
            <Intro on:start={naarInfo} />

        {:else if huidigScherm === SCREEN.INFO}
            <!-- Informatie/survey: merk, model, inrichting, jaren -->
            <Informatie on:filters={filtersGekozen} />

        {:else if huidigScherm === SCREEN.DASHBOARD}
            <!-- Dashboard: hier komen alle views (hoogte, gewicht, etc.) -->
            <Dashboard
                    gekozenMerk={gekozenMerk}
                    gekozenModel={gekozenModel}
                    gekozenInrichting={gekozenInrichting}
                    jaarOud={jaarOud}
                    jaarNieuw={jaarNieuw}
                    voertuigenOud={voertuigenOud}
                    voertuigenNieuw={voertuigenNieuw}
                    gemHoogteOud={gemHoogteOud}
                    gemHoogteNieuw={gemHoogteNieuw}
                    kleurenOud={kleurenOud}
                    kleurenNieuw={kleurenNieuw}
                    verkoopOud={verkoopOud}
                    verkoopNieuw={verkoopNieuw}
                    on:opnieuw={terugNaarIntro}
                    on:terug={terugNaarInfo}
            />
        {/if}

    </section>
</main>
