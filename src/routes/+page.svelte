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
    let jarenReeks = [];          // range uit Informatie-component

    // ruwe lijsten voor alle views (2-punts)
    let voertuigenOud = [];
    let voertuigenNieuw = [];

    // standaard info (2-punts)
    let gemHoogteOud = null;
    let gemHoogteNieuw = null;
    let kleurenOud = [];
    let kleurenNieuw = [];
    let verkoopOud = null;
    let verkoopNieuw = null;

    // NIEUW: per-jaar data voor ALLE views
    let hoogtePerJaar = [];
    let gewichtPerJaar = [];
    let prijsPerJaar = [];
    let kleurenPerJaar = [];
    let verkoopPerJaar = [];

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
        jarenReeks = [];

        voertuigenOud = [];
        voertuigenNieuw = [];

        gemHoogteOud = null;
        gemHoogteNieuw = null;
        kleurenOud = [];
        kleurenNieuw = [];
        verkoopOud = null;
        verkoopNieuw = null;

        hoogtePerJaar = [];
        gewichtPerJaar = [];
        prijsPerJaar = [];
        kleurenPerJaar = [];
        verkoopPerJaar = [];
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
        jarenReeks = detail.jarenReeks || [];

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

            // per-jaar data:
            hoogtePerJaar = resultaat.hoogtePerJaar || [];
            gewichtPerJaar = resultaat.gewichtPerJaar || [];
            prijsPerJaar = resultaat.prijsPerJaar || [];
            kleurenPerJaar = resultaat.kleurenPerJaar || [];
            verkoopPerJaar = resultaat.verkoopPerJaar || [];
        } catch (err) {
            console.error('Fout bij RDW data laden:', err);
            voertuigenOud = [];
            voertuigenNieuw = [];
            hoogtePerJaar = [];
            gewichtPerJaar = [];
            prijsPerJaar = [];
            kleurenPerJaar = [];
            verkoopPerJaar = [];
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
                    jarenReeks={jarenReeks}
                    voertuigenOud={voertuigenOud}
                    voertuigenNieuw={voertuigenNieuw}
                    gemHoogteOud={gemHoogteOud}
                    gemHoogteNieuw={gemHoogteNieuw}
                    kleurenOud={kleurenOud}
                    kleurenNieuw={kleurenNieuw}
                    verkoopOud={verkoopOud}
                    verkoopNieuw={verkoopNieuw}
                    hoogtePerJaar={hoogtePerJaar}
                    gewichtPerJaar={gewichtPerJaar}
                    prijsPerJaar={prijsPerJaar}
                    kleurenPerJaar={kleurenPerJaar}
                    verkoopPerJaar={verkoopPerJaar}
                    on:opnieuw={terugNaarIntro}
                    on:terug={terugNaarInfo}
            />
        {/if}

    </section>
</main>
