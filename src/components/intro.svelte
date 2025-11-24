<script>
    import { createEventDispatcher } from 'svelte';

    // hiermee sturen we iets terug naar +page.svelte
    const dispatch = createEventDispatcher();

    // als je op de startknop klikt → door naar het informatie/survey scherm
    const start = () => {
        dispatch('start');
    };
</script>

<!--
    Ik hou de markup expres simpel.
    Jij kan later zelf je CSS erin gooien zoals je wilt.
-->

<section class="intro-scherm">
    <h1>Hoe zijn auto's veranderd door de jaren heen?</h1>

    <p>
        In deze mini-app kijk je hoe auto's groeien, veranderen en ontwikkelen.
        Je kiest zelf een merk, een type auto (inrichting) en twee jaartallen.
        Daarna laten we je meerdere vergelijkingen zien:
    </p>

    <ul>
        <li>Hoogte vergelijking</li>
        <li>Gewicht vergelijking</li>
        <li>Kleuren van het wagenpark</li>
        <li>Vermogen (kW)</li>
        <li>Catalogusprijzen</li>
        <li>Verkoopaantallen</li>
    </ul>

    <p>
        Klik hieronder om te beginnen met jouw gekozen merk.
    </p>

    <button class="btn-start" on:click={start}>
        Start onderzoek
    </button>
</section>

<style>
    /* simpele basisstijl zodat jij ‘t later zelf kan stylen */
    .intro-scherm {
        max-width: 700px;
        margin: 0 auto;
        padding: 2rem;
        text-align: center;
    }

    h1 {
        font-size: 2rem;
        margin-bottom: 1rem;
    }

    ul {
        list-style: disc;
        text-align: left;
        margin: 1.5rem auto;
        max-width: 400px;
    }

    .btn-start {
        padding: 0.8rem 1.5rem;
        font-size: 1.1rem;
        cursor: pointer;
    }
</style>
