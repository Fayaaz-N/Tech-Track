<script>
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    const start = () => {
        dispatch('start');
    };
</script>

<section class="intro-scherm">
    <div class="intro-card">
        <div class="intro-header">
            <p class="intro-label">Onderzoeksdashboard</p>
            <h1>Hoe snel veroveren Chinese EV’s de Nederlandse automarkt?</h1>
            <p class="intro-subtitle">
                In deze mini-app vergelijk je Chinese EV-merken met gevestigde merken op
                de Nederlandse markt. Je kiest een merkcombinatie en een periode, en het
                dashboard laat zien hoe hun registraties zich ontwikkelen.
            </p>
        </div>

        <div class="intro-content">
            <p>Met het dashboard kun je onder andere:</p>

            <ul class="intro-list">
                <li><span>📈</span> BEV-registraties per jaar vergelijken</li>
                <li><span>⚡️</span> Zien hoe snel een Chinees merk terrein wint</li>
                <li><span>🔁</span> Merken naast elkaar zetten in één grafiek</li>
            </ul>

            <p class="intro-help">
                Kies je merken, selecteer de jaren en ontdek hoe de markt verschuift.
            </p>

            <button class="btn-start" on:click={start}>
                Start je onderzoek
            </button>
        </div>
    </div>
</section>

<style>
    /* Basis: Apple-achtige system font */
    .intro-scherm {
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text",
        "SF Pro Display", system-ui, sans-serif;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2.5rem 1.5rem;
        background: radial-gradient(circle at top, #f5f7ff 0, #e9edf7 40%, #dfe3ef 100%);
    }

    .intro-card {
        max-width: 900px;
        width: 100%;
        background: #ffffff;
        border-radius: 24px;
        padding: 2.5rem 3rem;
        box-shadow: 0 18px 45px rgba(0, 0, 0, 0.08);
        display: grid;
        grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
        gap: 2.5rem;
    }

    @media (max-width: 820px) {
        .intro-card {
            grid-template-columns: 1fr;
            padding: 2rem 1.75rem;
        }
    }

    .intro-header {
        text-align: left;
    }

    .intro-label {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.25rem 0.7rem;
        border-radius: 999px;
        background: #f5f7ff;
        color: #5060b8;
        font-size: 0.78rem;
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        margin-bottom: 0.75rem;
    }

    h1 {
        font-size: 2rem;
        line-height: 1.2;
        margin: 0 0 0.6rem;
        color: #111117;
    }

    @media (min-width: 960px) {
        h1 {
            font-size: 2.3rem;
        }
    }

    .intro-subtitle {
        margin: 0;
        font-size: 0.95rem;
        line-height: 1.6;
        color: #4a4f5c;
    }

    .intro-content {
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 1.25rem;
        text-align: left;
        font-size: 0.95rem;
    }

    .intro-content > p {
        margin: 0;
        color: #50535f;
    }

    .intro-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.6rem 1.4rem;
        font-size: 0.9rem;
    }

    @media (max-width: 640px) {
        .intro-list {
            grid-template-columns: 1fr;
        }
    }

    .intro-list li {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        color: #30323a;
    }

    .intro-list li span {
        flex-shrink: 0;
        font-size: 1.1rem;
        line-height: 1.2;
        margin-top: 0.1rem;
    }

    .intro-help {
        margin-top: 0.4rem;
        font-weight: 500;
        color: #22252f;
    }

    .btn-start {
        margin-top: 0.25rem;
        align-self: flex-start;
        padding: 0.8rem 1.8rem;
        font-size: 0.98rem;
        font-weight: 600;
        border-radius: 999px;
        border: none;
        cursor: pointer;
        background: linear-gradient(135deg, #ff5e3a, #ff2f6d);
        color: #ffffff;
        box-shadow: 0 10px 25px rgba(255, 70, 90, 0.35);
        transition:
                transform 0.15s ease-out,
                box-shadow 0.15s ease-out,
                filter 0.15s ease-out;
    }

    .btn-start:hover {
        transform: translateY(-1px);
        box-shadow: 0 14px 30px rgba(255, 70, 90, 0.4);
        filter: brightness(1.03);
    }

    .btn-start:active {
        transform: translateY(0);
        box-shadow: 0 6px 16px rgba(255, 70, 90, 0.3);
        filter: brightness(0.98);
    }

    .btn-start:focus-visible {
        outline: 2px solid #222;
        outline-offset: 3px;
    }
</style>
