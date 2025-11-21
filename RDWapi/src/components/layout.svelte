<script>
    export let title = '';
    export let subtitle = '';
</script>

<div class="rdw-layout">
    <header class="rdw-header">
        <h1>{title}</h1>
        {#if subtitle}
            <p>{subtitle}</p>
        {/if}
    </header>

    <main class="rdw-main">
        <slot />
    </main>
</div>
