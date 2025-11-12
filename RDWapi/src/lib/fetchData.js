// // Token uit de env halen
// const APP_TOKEN = import.meta.env?.VITE_RDW_APP_TOKEN;
//
//
//
// //fetch naar de API
// export async function fetchRdw(limit = 100, offset = 0) {
//     const url = new URL('https://opendata.rdw.nl/resource/m9d7-ebf2.json');
//
//     //kier hier welke data ik in mijn request wil ophalen
//     url.searchParams.set('$select',
//         'kenteken,merk,handelsbenaming,voertuigsoort,inrichting,aantal_deuren,eerste_kleur,datum_eerste_tenaamstelling_in_nederland,hoogte_voertuig'
//     );
//     url.searchParams.set('$order', 'hoogte_voertuig desc');
//     //limiet instellen vanwege 16.000.000 rows haha
//     url.searchParams.set('$limit', String(limit));
//     url.searchParams.set('$offset', String(offset));
//
//     const res = await fetch(url.toString(), {
//         headers: { 'X-App-Token': APP_TOKEN }
//     });
//     if (!res.ok) throw new Error(`HTTP ${res.status}`);
//     return res.json(); // => array met objecten
// }


// Token uit Vite (.env): VITE_RDW_APP_TOKEN=...
const APP_TOKEN = import.meta.env?.VITE_RDW_APP_TOKEN;

export async function fetchRdwSUVs(limit = 15000, offset = 0) {
    const url = new URL('https://opendata.rdw.nl/resource/m9d7-ebf2.json');

    // velden die we willen tonen/benutten
    url.searchParams.set('$select', [
        'kenteken',
        'merk',
        'tellerstandoordeel',
        'handelsbenaming',
        'aantal_eigenaren',
        'voertuigsoort',
        'inrichting',
        'aantal_deuren',
        'eerste_kleur',
        'datum_eerste_toelating',
        'datum_eerste_tenaamstelling_in_nederland',
        'hoogte_voertuig'
    ].join(','));

    // filter: alleen SUV + hoogte aanwezig (niet null)
    // upper(...) maakt 'SUV' case-insensitive
    // url.searchParams.set('$where', "upper(inrichting) = 'MPV'");
    // url.searchParams.set('$where', "upper(kenteken) = 'JX445P'");
    url.searchParams.set(
        '$where',
        "upper(kenteken) IN ('JX445P','TG073B','GV399P')"
    );






    // sorteer bv. op hoogte (hoog naar laag)
    url.searchParams.set('$order', 'inrichting asc');

    // // paginatie
    // url.searchParams.set('$limit', String(limit));
    // url.searchParams.set('$offset', String(offset));

    const res = await fetch(url.toString(), {
        headers: APP_TOKEN ? { 'X-App-Token': APP_TOKEN } : undefined
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
    }
    const rows = await res.json();

    // client-side aanvulling: bouwjaar + kleur-fallback
    return rows
        .filter(r => r.hoogte_voertuig !== null && r.hoogte_voertuig !== '') // extra zekerheid
        .map(r => ({
            ...r,
            // jaar uit 'YYYY-MM-DD' (kan ook 'YYYYMMDD' zijn; slice(0,4) werkt op beide)
            bouwjaar: r?.datum_eerste_toelating?.slice(0, 4) ?? null,
            // kies eerste_kleur, anders tweede_kleur
            kleur: r?.eerste_kleur ?? r?.tweede_kleur ?? null,
            // alias voor leesbaarheid
            inschrijving_nl: r?.datum_eerste_tenaamstelling_in_nederland ?? null
        }));
}
