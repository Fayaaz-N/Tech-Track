// RDW configuratie

const APP_TOKEN = import.meta.env?.VITE_RDW_APP_TOKEN;
const RDW_BASE_URL = 'https://opendata.rdw.nl/resource/m9d7-ebf2.json';


// Helpers

// Maakt een string veilig voor gebruik in een $where-filter
const escapeForWhere = (value) =>
    String(value).replace(/'/g, "''");

// Bouwt een datumrange in YYYYMMDD op basis van jaartallen
const getDateRange = (startYear, endYear) => ({
    startDate: `${startYear}0101`,
    endDate: `${endYear}1231`
});

// Maakt een RDW-URL met optioneel $select
const createRdwUrl = (selectFields) => {
    const url = new URL(RDW_BASE_URL);

    if (Array.isArray(selectFields)) {
        url.searchParams.set('$select', selectFields.join(','));
    } else if (typeof selectFields === 'string') {
        url.searchParams.set('$select', selectFields);
    }

    return url;
};

// Doet het RDW-verzoek en geeft JSON terug
const fetchRdwJson = async (url) => {
    const headers = APP_TOKEN ? { 'X-App-Token': APP_TOKEN } : {};

    const res = await fetch(url.toString(), { headers });

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status}: ${text}`);
    }

    return res.json();
};



/**
 * Haalt personenauto’s op bij de RDW op basis van filters.
 *
 * @param {string} merk
 * @param {number} startYear
 * @param {number} endYear
 * @param {string} [inrichting]
 * @param {number} [limit]
 * @param {number} [offset]
 * @returns {Promise<Array>}
 */
export const fetchRdwMPVs = async (
    merk,
    startYear = 2020,
    endYear = 2025,
    inrichting,
    limit = 15000000,
    offset = 0
) => {
    if (!merk) {
        throw new Error('fetchRdwMPVs: merk is verplicht');
    }

    // velden die nodig zijn voor lijsten en grafieken
    const url = createRdwUrl([
        'kenteken',
        'merk',
        'handelsbenaming',
        'voertuigsoort',
        'inrichting',
        'aantal_deuren',
        'datum_eerste_toelating',
        'datum_eerste_tenaamstelling_in_nederland',
        'hoogte_voertuig',
        'eerste_kleur',
        'tweede_kleur'
    ]);

    // paginering
    url.searchParams.set('$limit', String(limit));
    url.searchParams.set('$offset', String(offset));

    // jaarrange naar datumrange
    const { startDate, endDate } = getDateRange(startYear, endYear);

    // basisfilters
    const whereDelen = [
        `merk = '${escapeForWhere(merk).toUpperCase()}'`,
        `datum_eerste_tenaamstelling_in_nederland between ${startDate} and ${endDate}`,
        `voertuigsoort = 'Personenauto'`
    ];

    // inrichting (optioneel)
    if (inrichting && inrichting !== 'ALLE') {
        const netteInrichting = escapeForWhere(String(inrichting).trim());
        whereDelen.push(`inrichting = '${netteInrichting}'`);
    }

    url.searchParams.set('$where', whereDelen.join(' AND '));

    const data = await fetchRdwJson(url);

    // alleen records met datum in NL
    const filtered = data.filter(
        (item) => !!item.datum_eerste_tenaamstelling_in_nederland
    );

    // data normaliseren
    return filtered.map((item) => ({
        kenteken: item.kenteken,
        merk: item.merk,
        handelsbenaming: item.handelsbenaming,
        voertuigsoort: item.voertuigsoort,
        inrichting: item.inrichting,
        aantalDeuren: item.aantal_deuren ? Number(item.aantal_deuren) : null,
        datumEersteToelating: item.datum_eerste_toelating,
        datumEersteTenaamstellingNL: item.datum_eerste_tenaamstelling_in_nederland,
        hoogteVoertuig: item.hoogte_voertuig ? Number(item.hoogte_voertuig) : null,
        eersteKleur: item.eerste_kleur || null,
        tweedeKleur: item.tweede_kleur || null
    }));

};



/**
 * Haalt unieke merken op (personenauto’s) binnen een jaarrange.
 *
 * @param {number} startYear
 * @param {number} endYear
 * @returns {Promise<string[]>}
 */
export const fetchRdwMpvMerken = async (
    startYear = 2020,
    endYear = 2025
) => {
    const url = createRdwUrl('merk');

    const { startDate, endDate } = getDateRange(startYear, endYear);

    const whereDelen = [
        `datum_eerste_tenaamstelling_in_nederland between ${startDate} and ${endDate}`,
        `voertuigsoort = 'Personenauto'`
    ];

    url.searchParams.set('$where', whereDelen.join(' AND '));
    url.searchParams.set('$group', 'merk');

    const data = await fetchRdwJson(url);

    return data
        .map((item) => item.merk)
        .filter((merk) => !!merk)
        .sort((a, b) => a.localeCompare(b));
};



/**
 * Haalt unieke inrichtingen op voor een merk binnen een jaarrange.
 *
 * @param {string} merk
 * @param {number} startYear
 * @param {number} endYear
 * @returns {Promise<string[]>}
 */
export const fetchRdwInrichtingen = async (
    merk,
    startYear = 2020,
    endYear = 2025
) => {
    if (!merk) {
        throw new Error('fetchRdwInrichtingen: merk is verplicht');
    }

    const url = createRdwUrl('inrichting');

    const { startDate, endDate } = getDateRange(startYear, endYear);

    url.searchParams.set(
        '$where',
        [
            `merk = '${escapeForWhere(merk).toUpperCase()}'`,
            `datum_eerste_tenaamstelling_in_nederland between ${startDate} and ${endDate}`,
            `voertuigsoort = 'Personenauto'`
        ].join(' AND ')
    );

    url.searchParams.set('$group', 'inrichting');
    url.searchParams.set('$limit', '50000');

    const data = await fetchRdwJson(url);

    return data
        .map((item) => (item.inrichting || '').trim())
        .filter((inrichting) => inrichting.length > 0)
        .sort((a, b) => a.localeCompare(b));
};



/**
 * Maakt telling per jaar op basis van voertuigenlijst.
 * Output is geschikt voor meerdere soorten grafieken.
 *
 * @param {Array} vehicles
 * @returns {{ jaar: number, aantal: number }[]}
 */
export const maakJaarStats = (vehicles) => {
    // voertuigen met datum
    const autosMetDatum = vehicles.filter(
        (auto) => auto.datumEersteTenaamstellingNL
    );

    // jaartal uit datum halen
    const jaren = autosMetDatum.map((auto) => {
        const datumString = String(auto.datumEersteTenaamstellingNL); // YYYYMMDD
        const jaarString = datumString.slice(0, 4);
        return Number(jaarString);
    });

    // per jaar tellen
    const tellingPerJaar = jaren.reduce((acc, jaar) => {
        if (!acc[jaar]) {
            acc[jaar] = 0;
        }
        acc[jaar] += 1;
        return acc;
    }, {});

    // omzetten naar array
    const jaarArray = Object.keys(tellingPerJaar).map((jaarKey) => ({
        jaar: Number(jaarKey),
        aantal: tellingPerJaar[jaarKey]
    }));

    // sorteren op jaar
    jaarArray.sort((a, b) => a.jaar - b.jaar);

    return jaarArray;
};




//Kleuren kiezen vanuit de data
// normaliseert een kleurnaam zodat gelijksoortige varianten gelijk vallen
const normalizeColor = (raw) => {
    if (!raw) return null;

    let kleur = String(raw).trim().toUpperCase();

    // simpele voorbeelden van opschonen:
    // "BLAUW METALLIC" -> "BLAUW"
    // "ROOD PERLMOER"  -> "ROOD"
    const parts = kleur.split(' ');
    if (parts.length > 1) {
        kleur = parts[0]; // eerste woord pakken
    }

    return kleur;
};

/**
 * Maakt een telling per kleur op basis van voertuigen.
 * Output: [{ kleur: 'BLAUW', aantal: 123 }, ...]
 */
export const maakKleurStats = (vehicles) => {
    // alleen voertuigen met een (eerste) kleur
    const kleuren = vehicles
        .map((auto) => normalizeColor(auto.eersteKleur))
        .filter((kleur) => !!kleur);

    // per kleur tellen
    const tellingPerKleur = kleuren.reduce((acc, kleur) => {
        if (!acc[kleur]) {
            acc[kleur] = 0;
        }
        acc[kleur] += 1;
        return acc;
    }, {});

    // omzetten naar array
    const kleurArray = Object.keys(tellingPerKleur).map((kleurKey) => ({
        kleur: kleurKey,
        aantal: tellingPerKleur[kleurKey]
    }));

    // sorteren op aantal (hoog → laag)
    kleurArray.sort((a, b) => b.aantal - a.aantal);

    return kleurArray;
};
