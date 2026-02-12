// src/lib/fetchData.js
// ------------------------------------------------------
// Nieuwe versie, gefocust op:
// - BEV's (Battery Electric Vehicles)
// - Chinese EV-merken vs Westerse EV-merken
// - Verkoop (aantal geregistreerde voertuigen) per jaar
//
// Belangrijkste datasets:
//
// 1) m9d7-ebf2.json  → voertuigen op kenteken
//    https://opendata.rdw.nl/resource/m9d7-ebf2.json
//
// 2) 8ys7-d773.json  → brandstof per kenteken
//    https://opendata.rdw.nl/resource/8ys7-d773.json
//
// We koppelen die twee via `kenteken` en filteren daarna
// op BEV's door te kijken welke kentekens alléén
// brandstof "Elektriciteit" hebben.
// ------------------------------------------------------

// App token om meer data te mogen opvragen (optioneel)
const APP_TOKEN = import.meta.env?.VITE_RDW_APP_TOKEN || null;

// Basis RDW endpoints
const RDW_VEHICLES_URL = 'https://opendata.rdw.nl/resource/m9d7-ebf2.json';
const RDW_FUEL_URL = 'https://opendata.rdw.nl/resource/8ys7-d773.json';

// ------------------------------------------------------
// Globale performance keuze:
// we willen NIET langer dan nodig in het verleden zoeken.
// Alles vóór 2020 negeren we gewoon in onze queries.
// ------------------------------------------------------
const MIN_JAAR_DEFAULT = 2023;

// ------------------------------------------------------
// Chinese EV-merken (ruwe lijst die je zelf mag tunen)
// Let op: zo dicht mogelijk bij de RDW-merknaam houden
// ------------------------------------------------------
export const CHINESE_EV_MERKEN = [
    'BYD',
    'NIO',
    'XPENG',
    'AIWAYS',
    'HONGQI',
    'MAXUS',
    'SERES',
    'ORA',
    'WEY',
    'DFSK',
    'LYNK & CO',
    'MG'
];

// ------------------------------------------------------
// Westerse EV-merken (ook gewoon een handmatige lijst)
// Ook deze kun je later zelf uitbreiden of tweaken.
// ------------------------------------------------------
export const WESTERSE_EV_MERKEN = [
    'TESLA',
    'VOLKSWAGEN',
    'AUDI',
    'BMW',
    'MERCEDES-BENZ',
    'VOLVO',
    'POLESTAR',
    'RENAULT',
    'PEUGEOT',
    'OPEL',
    'CITROEN',
    'FIAT',
    'KIA',
    'HYUNDAI',
    'SKODA',
    'FORD'
];

// ------------------------------------------------------
// Kleine HTTP helper: 1 plek waar we de fetch doen.
// Als RDW ooit iets verandert, fix je het hier.
// ------------------------------------------------------
const fetchRdwJson = async (url) => {
    const headers = APP_TOKEN ? { 'X-App-Token': APP_TOKEN } : {};

    const res = await fetch(url.toString(), { headers });

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`RDW HTTP ${res.status}: ${text}`);
    }

    return res.json();
};

// ------------------------------------------------------
// "bmw" → "Bmw", "MERCEDES-BENZ" → "Mercedes-benz"
// Handig als je merknaam netjes wilt tonen in de UI.
// ------------------------------------------------------
const capitalize = (str) =>
    str
        .toString()
        .toLowerCase()
        .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());

// ------------------------------------------------------
// Datum uit RDW (bijv. "20231205") → jaar (2023)
// ------------------------------------------------------
const bepaalJaar = (rawDatum) => {
    if (!rawDatum) return null;
    const jaarStr = String(rawDatum).slice(0, 4);
    const jaar = Number(jaarStr);
    return Number.isNaN(jaar) ? null : jaar;
};

// ------------------------------------------------------
// Helper om een jaar-range WHERE te maken
// jaarVan / jaarTot zijn gewone getallen, zoals 2015 / 2024
// ------------------------------------------------------
const maakJaarWhere = (jaarVan) => {
    const min = Number.isFinite(jaarVan) ? jaarVan : null;

    const parts = [];

    if (min != null) {
        parts.push(`datum_eerste_toelating >= ${min}0101`);
        parts.push(`datum_eerste_toelating <= ${min}1231`);
    }

    return parts.join(' AND ');
};

// ------------------------------------------------------
// RDW houdt merknamen in hoofdletters bij.
// We zorgen dat wat jij invult netjes wordt opgeschoond,
// en dat quotes in namen geen SQL-bug veroorzaken.
// ------------------------------------------------------
const maakMerkWhere = (merkRaw) => {
    const merkClean = merkRaw
        .toString()
        .trim()
        .toUpperCase()
        .replace(/'/g, "''");

    return `merk = '${merkClean}'`;
};

// ------------------------------------------------------
//  BRANDSTOF: BEV bepalen
//  ---------------------
//  In 8ys7-d773 heeft elk kenteken 1..n brandstofregels.
//  We vinden BEV's door te kijken naar het totaalpakket
//  per kenteken:
//
//  - We verzamelen alle brandstof_omschrijving waarden
//    per kenteken
//  - Als dat setje exact ["ELEKTRICITEIT"] is
//    → dan zien we 'm als BEV.
//  - Kentekens zonder brandstof-info of met combinatie
//    (Benzine + Elektriciteit) tellen we niet als BEV.
// ------------------------------------------------------
const MAX_KENTEKENS_PER_BRANDSTOF_QUERY = 50;

// split een array in kleine chunks zodat onze IN(...) query niet te groot wordt
const chunk = (arr, size) => {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
        result.push(arr.slice(i, i + size));
    }
    return result;
};

// bepaalt voor een lijst kentekens welke echt BEV zijn
const bepaalBevKentekens = async (kentekens) => {
    const bevSet = new Set();
    const brandstoffenPerKenteken = new Map();

    const uniekeKentekens = Array.from(new Set(kentekens.filter(Boolean)));
    if (uniekeKentekens.length === 0) return bevSet;

    const batches = chunk(uniekeKentekens, MAX_KENTEKENS_PER_BRANDSTOF_QUERY);

    for (const batch of batches) {
        // kentekens netjes in 'A','B','C' vorm
        const inList = batch
            .map((k) => `'${k.replace(/'/g, "''")}'`)
            .join(',');

        const params = new URLSearchParams({
            $select: 'kenteken, brandstof_omschrijving',
            $where: `kenteken IN (${inList})`,
            $limit: '300000'
        });

        const rows = await fetchRdwJson(`${RDW_FUEL_URL}?${params}`);

        rows.forEach((r) => {
            const k = r.kenteken;
            if (!k) return;

            const arr = brandstoffenPerKenteken.get(k) || [];
            if (r.brandstof_omschrijving) {
                arr.push(r.brandstof_omschrijving.trim());
            }
            brandstoffenPerKenteken.set(k, arr);
        });
    }

    // nu per kenteken checken of de set precies ["ELEKTRICITEIT"] is
    brandstoffenPerKenteken.forEach((list, kenteken) => {
        const unique = Array.from(
            new Set(list.map((x) => x.toUpperCase()))
        );

        // pure BEV → alleen Elektriciteit
        if (unique.length === 1 && unique[0] === 'ELEKTRICITEIT') {
            bevSet.add(kenteken);
        }
    });

    return bevSet;
};

// ------------------------------------------------------
// VOERTUIGEN per MERK + JAAR ophalen
// (nog zonder te filteren op BEV / brandstof)
//
// LET OP: hier klemmen we ook nog even tegen MIN_JAAR_DEFAULT,
// voor het geval iemand deze helper los gebruikt.
// ------------------------------------------------------
const haalVoertuigenVoorMerkEnJaar = async (merk, jaar) => {
    const norm = Math.max(MIN_JAAR_DEFAULT, Number(jaar));

    const whereParts = [
        "voertuigsoort = 'Personenauto'",
        maakMerkWhere(merk)
    ];

    const jaarWhere = maakJaarWhere(norm);
    if (jaarWhere) {
        whereParts.push(jaarWhere);
    }

    const params = new URLSearchParams({
        $select: 'kenteken, merk, datum_eerste_toelating',
        $where: whereParts.join(' AND '),
        $limit: '300000'
    });

    const data = await fetchRdwJson(`${RDW_VEHICLES_URL}?${params}`);

    // we voegen alvast het jaar toe, dan kunnen we later makkelijk aggregeren
    return (data || [])
        .map((v) => ({
            kenteken: v.kenteken,
            merk: v.merk,
            jaar: bepaalJaar(v.datum_eerste_toelating)
        }))
        .filter((v) => v.kenteken && v.jaar != null);
};

// ------------------------------------------------------
// PUBLIEKE API #1
// haalBevVerkoopPerJaarVoorMerk(merk, jaar)
//
// - Haalt alle voertuigen voor dat merk in dat jaar op
// - Checkt via brandstof-tabel welke kentekens BEV zijn
// - Telt het aantal BEV's
// ------------------------------------------------------
export const haalBevVerkoopPerJaarVoorMerk = async (merk, jaar) => {
    // 0) basis-normalisatie van het ingevoerde jaar
    const v = Number(jaar);
    const jaarMin = Number.isFinite(v) ? v : MIN_JAAR_DEFAULT;

    // 1) voertuigen voor dit merk + jaar ophalen
    const voertuigen = await haalVoertuigenVoorMerkEnJaar(merk, jaarMin);

    if (!voertuigen.length) {
        return {
            merkRuw: merk,
            merkNetjes: capitalize(merk),
            jaar: jaarMin,
            totaalEVs: 0,
            verkoopPerJaar: [{ jaar: jaarMin, aantal: 0 }],
            bevKentekens: []
        };
    }

    const alleKentekens = voertuigen.map((v) => v.kenteken);

    // 2) checken welke kentekens BEV zijn (pure "Elektriciteit")
    const bevSet = await bepaalBevKentekens(alleKentekens);

    // 3) filter voertuigen naar alleen BEV's
    const bevVoertuigen = voertuigen.filter((v) =>
        bevSet.has(v.kenteken)
    );

    return {
        merkRuw: merk,
        merkNetjes: capitalize(merk),
        jaar: jaarMin,
        totaalEVs: bevVoertuigen.length,
        verkoopPerJaar: [{ jaar: jaarMin, aantal: bevVoertuigen.length }],
        bevKentekens: bevVoertuigen.map((v) => v.kenteken)
    };
};

// ------------------------------------------------------
// PUBLIEKE API #2
// haalBevVerkoopVoorMerken(merken[], jaar)
//
// Dit is basic een "batch" versie van de vorige,
// handig als je straks meerdere merken tegelijk wilt plotten in één grafiek.
// ------------------------------------------------------
export const haalBevVerkoopVoorMerken = async (merken, jaar) => {
    const lijst = Array.isArray(merken) ? merken : [];
    const resultaten = [];

    for (const merk of lijst) {
        try {
            const res = await haalBevVerkoopPerJaarVoorMerk(merk, jaar);
            resultaten.push(res);
        } catch (err) {
            console.error('Fout bij EV-verkoop ophalen voor merk:', merk, err);
            resultaten.push({
                merkRuw: merk,
                merkNetjes: capitalize(merk),
                jaar,
                totaalEVs: 0,
                verkoopPerJaar: [],
                bevKentekens: [],
                error: String(err)
            });
        }
    }

    return resultaten;
};