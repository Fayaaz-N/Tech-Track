<script>
    // LET OP: car.svg moet in src/lib/assets/car.svg staan
    import carIcon from '$lib/assets/car.svg';

    export let jaarOud;
    export let jaarNieuw;
    export let verkoopOud = 0;
    export let verkoopNieuw = 0;

    // Optioneel: zelf instellen hoeveel auto's per icoon
    export let autosPerIcoon = null;

    const MAX_ICONS_PER_YEAR = 60;

    let groepen = [];
    let schaal = 1;
    let geenData = false;

    function berekenSchaal(maxCount) {
        if (autosPerIcoon && autosPerIcoon > 0) {
            return autosPerIcoon;
        }

        const raw = maxCount / MAX_ICONS_PER_YEAR;

        if (raw <= 10) return 10;
        if (raw <= 50) return 50;
        if (raw <= 100) return 100;
        if (raw <= 500) return 500;
        if (raw <= 1000) return 1000;
        return Math.round(raw / 1000) * 1000 || 1;
    }

    $: {
        const baseGroups = [
            { jaar: jaarOud, count: verkoopOud, kleur: '#1f77b4' },
            { jaar: jaarNieuw, count: verkoopNieuw, kleur: '#ff7f0e' }
        ];

        const maxCount = Math.max(...baseGroups.map((g) => g.count || 0)) || 0;
        geenData = maxCount === 0;

        if (geenData) {
            groepen = [];
            schaal = 1;
        } else {
            schaal = berekenSchaal(maxCount);

            groepen = baseGroups.map((g) => {
                if (!g.count) {
                    return { ...g, iconCount: 0, icons: [] };
                }

                const iconCount = Math.max(1, Math.round(g.count / schaal));
                const icons = Array.from({ length: iconCount });

                return {
                    ...g,
                    iconCount,
                    icons
                };
            });
        }
    }
</script>

{#if geenData}
    <p>Geen verkoopaantallen beschikbaar voor deze selectie.</p>
{:else}
    <div class="icon-chart">
        {#each groepen as group}
            <div class="year-column">
                <div class="year-label">{group.jaar}</div>

                <div class="icons">
                    {#each group.icons as _, i}
                        <img
                                src={carIcon}
                                alt="auto"
                                class="car-icon"
                        />
                    {/each}
                </div>

                <div class="total">
                    {group.count.toLocaleString('nl-NL')} auto's
                </div>
            </div>
        {/each}
    </div>

    <p class="scale">
        1 icoon ≈ {schaal.toLocaleString('nl-NL')} auto's
    </p>
{/if}

<style>
    .icon-chart {
        display: flex;
        gap: 2rem;
        justify-content: center;
        align-items: flex-end;
        flex-wrap: wrap;
        margin-top: 0.5rem;
    }

    .year-column {
        text-align: center;
        max-width: 260px;
    }

    .year-label {
        font-weight: 600;
        margin-bottom: 0.4rem;
    }

    .icons {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        justify-content: center;
        margin-bottom: 0.4rem;
    }

    .car-icon {
        width: 32px;
        height: auto;
        display: block;
    }

    .total {
        font-size: 0.9rem;
    }

    .scale {
        margin-top: 0.5rem;
        text-align: center;
        font-size: 0.85rem;
        color: #555;
    }
</style>
