<script>
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    // als je op de knop klikt, ga je naar het volgende scherm
    function gaNaarVolgendScherm() {
        dispatch('volgende');
    }
</script>

<!-- alleen de inhoud, de wrapper-section komt in +page.svelte -->
<div class="scherm-inhoud scherm-1-inhoud">
    <h1>Zijn auto’s hoger geworden door de tijd heen?</h1>

    <p>
        In deze app ga je onderzoeken hoe personenauto’s van één automerk
        veranderen door de tijd.
    </p>

    <p>
        Eerst kies je een automerk. Daarna kies je twee jaren:
        een jaar van vroeger en een jaar van nu.
    </p>

    <p>
        We laten dan zien hoe de gemiddelde hoogte van de auto’s is veranderd.
        Daarna kun je ook nog kijken naar kleuren en verkoopaantallen.
    </p>

    <button type="button" on:click={gaNaarVolgendScherm}>
        Start met kiezen van een merk
    </button>
</div>
