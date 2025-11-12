// Token uit de env halen
const APP_TOKEN = import.meta.env?.VITE_RDW_APP_TOKEN;



//fetch naar de API
export async function fetchRdw(limit = 10, offset = 0) {
    const url = new URL('https://opendata.rdw.nl/resource/m9d7-ebf2.json');

    //kier hier welke data ik in mijn request wil ophalen
    url.searchParams.set('$select',
        'kenteken,merk,handelsbenaming,voertuigsoort,inrichting,aantal_deuren,eerste_kleur,tweede_kleur,datum_eerste_toelating,datum_eerste_tenaamstelling_in_nederland'
    );
    url.searchParams.set('$order', 'datum_eerste_tenaamstelling_in_nederland desc');
    //limiet instellen vanwege 16.000.000 rows haha
    url.searchParams.set('$limit', String(limit));
    url.searchParams.set('$offset', String(offset));

    const res = await fetch(url.toString(), {
        headers: { 'X-App-Token': APP_TOKEN }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json(); // => array met objecten
}
