// Token uit Vite (.env): VITE_RDW_APP_TOKEN=...
const APP_TOKEN = import.meta.env?.VITE_RDW_APP_TOKEN;


//Hier stel ik het verzoek en de criteria op voor de user en zijn keuze. .
export async function fetchRdwMPVs(
    merk,                                // alleen  het merk krijgt een value, de rest heb ik later nodig in de filtering
    startYear = 2020,
    endYear = 2025,
    limit = 150000,
    offset = 0
) {
    if (!merk) {
        throw new Error('fetchRdwMPVs: merk is verplicht');
    }

    //Hier connect ik met de API
    const url = new URL('https://opendata.rdw.nl/resource/m9d7-ebf2.json');

    // Hier roep ik de verschillende velden die ik wil ophalen.
    url.searchParams.set('$select', [
        'kenteken',
        'merk',
        'handelsbenaming',
        'voertuigsoort',
        'inrichting',
        'aantal_deuren',
        'datum_eerste_toelating',
        'datum_eerste_tenaamstelling_in_nederland',
        'hoogte_voertuig'
    ].join(','));

    url.searchParams.set('$limit', String(limit));
    url.searchParams.set('$offset', String(offset));

    //De datums komen anders binnen als 20250102 - 2 Januari 2025.
    const startDate = `${startYear}0101`;
    const endDate = `${endYear}1231`;

    //Hier filter in de API
    url.searchParams.set(
        '$where',
        [
            `merk = '${merk.toUpperCase()}'`,
            `datum_eerste_tenaamstelling_in_nederland between ${startDate} and ${endDate}`,
            `inrichting = 'MPV'`
        ].join(' AND ')
    );

    //Stuur app token mee
    const res = await fetch(url.toString(), {
        headers: APP_TOKEN ? { 'X-App-Token': APP_TOKEN } : undefined
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
    }

    //Zet alle data om
    const data = await res.json();

    //Extra filtering voor de zekerheid
    const filtered = data
        .filter((item) => item.inrichting === 'MPV')
        .filter((item) => !!item.datum_eerste_tenaamstelling_in_nederland);

    //Variabelen netjes
    return filtered.map((item) => ({
        kenteken: item.kenteken,
        merk: item.merk,
        handelsbenaming: item.handelsbenaming,
        voertuigsoort: item.voertuigsoort,
        inrichting: item.inrichting,
        aantalDeuren: item.aantal_deuren ? Number(item.aantal_deuren) : null,
        datumEersteToelating: item.datum_eerste_toelating,
        datumEersteTenaamstellingNL: item.datum_eerste_tenaamstelling_in_nederland,
        hoogteVoertuig: item.hoogte_voertuig ? Number(item.hoogte_voertuig) : null
    }));
}




//Deze functie zorgt er voor dat de input field voor het merk word gevuid met de beschikbare MPV's
export async function fetchRdwMpvMerken(startYear = 2020, endYear = 2025) {

    const url = new URL('https://opendata.rdw.nl/resource/m9d7-ebf2.json');

    const startDate = `${startYear}0101`;
    const endDate = `${endYear}1231`;

    url.searchParams.set('$select', 'merk');
    url.searchParams.set(
        '$where',
        [
            `inrichting = 'MPV'`,
            `datum_eerste_tenaamstelling_in_nederland between ${startDate} and ${endDate}`
        ].join(' AND ')
    );
    url.searchParams.set('$group', 'merk');
    url.searchParams.set('$limit', '50000');

    const res = await fetch(url.toString(), {
        headers: APP_TOKEN ? { 'X-App-Token': APP_TOKEN } : undefined
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
    }

    const data = await res.json();

    return data
        .map(item => item.merk)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
}



function maakJaarStats(vehicles) {
    // 1. eerst alle auto's met een datum pakken
    const autosMetDatum = vehicles.filter(function (auto) {
        return auto.datumEersteTenaamstellingNL;
    });

    // 2. daarna met map alleen het jaar uit de datum halen
    const jaren = autosMetDatum.map(function (auto) {
        const datumString = String(auto.datumEersteTenaamstellingNL); // "20200115"
        const jaarString = datumString.slice(0, 4); // "2020"
        const jaarNummer = Number(jaarString);      // 2020
        return jaarNummer;
    });

    // 3. nu met reduce tellen hoeveel auto's per jaar
    const tellingPerJaar = jaren.reduce(function (acc, jaar) {
        if (!acc[jaar]) {
            acc[jaar] = 0;
        }

        acc[jaar] = acc[jaar] + 1;
        return acc;
    }, {}); // start met leeg object

    // 4. object → array omzetten
    const jaarArray = Object.keys(tellingPerJaar).map(function (jaarKey) {
        return {
            jaar: Number(jaarKey),
            aantal: tellingPerJaar[jaarKey]
        };
    });

    // 5. sorteren op jaar
    jaarArray.sort(function (a, b) {
        return a.jaar - b.jaar;
    });

    return jaarArray;
}
