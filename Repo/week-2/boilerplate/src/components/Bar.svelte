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

<script>
    import { onMount } from 'svelte';
    import { fetchRdw } from '$lib/fetchData.js';

    let rows = [];

    onMount(async () => {
        rows = await fetchRdw(1000); // 10 regels
        console.log('Eerste 10:', rows);
    });
</script>

<h3>Eerste 10 voertuigen</h3>
<ul>
    {#each rows as r}
        <li>
            <strong>{r.kenteken}</strong> — {r.merk} {r.handelsbenaming} - {r.eerste_kleur} - {r.datum_eerste_tenaamstelling_in_nederland}
        </li>
    {/each}
</ul>
