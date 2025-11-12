<!--<script>-->
<!--  import * as d3 from "d3";-->
<!--  import { onMount } from 'svelte';-->

<!--  onMount(() => {-->
<!--    d3.select('p')-->
<!--    .text('Test')-->
<!--  });-->



<!--</script>-->

<!--<p></p>-->

<!--<style>-->
<!--  p {-->
<!--    font-size: 5em;-->
<!--    color: orange;-->
<!--  }-->
<!--</style>-->

<!--<script>-->
<!--    import { onMount } from 'svelte';-->
<!--    import { fetchRdw } from '../lib/fetchData.js';-->

<!--    let rows = [];-->

<!--    onMount(async () => {-->
<!--        rows = await fetchRdw(1000); // 10 regels-->
<!--        console.log('Eerste 10:', rows);-->
<!--    });-->
<!--</script>-->

<!--<h3>Eerste 10 voertuigen</h3>-->
<!--<ul>-->
<!--    {#each rows as r}-->
<!--        <li>-->
<!--            <strong>{r.kenteken}</strong> — {r.merk} {r.handelsbenaming} - {r.eerste_kleur} - {r.datum_eerste_tenaamstelling_in_nederland} - {r.hoogte_voertuig}-->
<!--        </li>-->
<!--    {/each}-->
<!--</ul>-->




<script>
    import { onMount } from 'svelte';
    import { fetchRdwSUVs } from '$lib/fetchData.js';

    let rows = [];
    let error = '';

    onMount(async () => {
        try {
            rows = await fetchRdwSUVs(15000, 0);
            console.log('SUVs:', rows);
        } catch (e) {
            error = e.message || String(e);
            console.error(e);
        }
    });
</script>

{#if error}<p style="color:red">{error}</p>{/if}

<h3>Top 10 SUV’s met hoogte</h3>
<ol>
    {#each rows as r}
        <li>
            <strong>{r.kenteken}</strong> — {r.merk} {r.handelsbenaming} - {r.voertuigsoort} - {r.inrichting} - {r.tellerstandoordeel}
            <strong>{r.aantal_eigenaren}</strong>
            <small>
                | bouwjaar: {r.bouwjaar ?? '-'}
                | kleur: {r.kleur ?? '-'}
                | hoogte: {r.hoogte_voertuig ?? '-'}
                | deurs: {r.aantal_deuren ?? '-'}
                | inschrijving NL: {r.inschrijving_nl ?? '-'}
            </small>
        </li>
    {/each}
</ol>
