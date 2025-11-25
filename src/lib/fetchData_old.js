// src/lib/fetchData_old2.js
// --------------------------------------------------------------
// Dit is de complete RDW data-laag van jouw project.
// Hier regelen we ALLES: merken, modellen, jaren, inrichtingen
// en natuurlijk de uiteindelijke voertuigen voor de vergelijking.
//
// Ik heb geprobeerd alles simpel, schoon en consistent te houden:
//
// - arrow functions
// - map / filter / reduce / replace
// - duidelijke comments (zoals jij dingen uitlegt)
// - APP token wrapper zodat je extra data mag opvragen
// --------------------------------------------------------------

// --------------------------------------------------------------
// 1: Token + fetch wrapper
// --------------------------------------------------------------

const APP_TOKEN = import.meta.env?.VITE_RDW_APP_TOKEN || null;

// kleine fetch helper zodat je niet overal die token hoeft te zetten
const fetchRdwJson = async (url) => {
    const headers = APP_TOKEN ? { 'X-App-Token': APP_TOKEN } : {};

    const res = await fetch(url.toString(), { headers });

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`RDW fout (${res.status}): ${text}`);
    }

    return res.json();
};

// RDW dataset die we gebruiken
const RDW_URL = 'https://opendata.rdw.nl/resource/m9d7-ebf2.json';

// --------------------------------------------------------------
// 2: Helpers
// --------------------------------------------------------------

// "bmw" → "Bmw", "MERCEDES-BENZ" → "Mercedes-benz"
const capitalize = (str) =>
    str
        .toString()
        .toLowerCase()
        .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());

// RDW datum → jaar
// voorbeeld: "19980513" → 1998
const bepaalJaar = (raw) => {
    if (!raw) return null;
    const jaarStr = String(raw).slice(0, 4);
    const jaar = Number(jaarStr);
    return Number.isNaN(jaar) ? null : jaar;
};

// hoogte_voertuig → meters
const bepaalHoogteMeter = (v) => {
    const raw = v.hoogte_voertuig ?? v.hoogte ?? null;
    const n = Number(raw);
    return Number.isNaN(n) ? null : n / 100;
};

// getallen parsen op een nette manier
const pakGetal = (raw) => {
    const n = Number(raw);
    return Number.isNaN(n) ? null : n;
};

// simpele gemiddelde helper
const gemiddelde = (arr) => {
    const values = arr.filter((n) => typeof n === 'number');
    if (values.length === 0) return null;
    return values.reduce((t, v) => t + v, 0) / values.length;
};

// kleuren tellen
const telKleuren = (voertuigen) => {
    const map = new Map();

    voertuigen.forEach((v) => {
        const kleur = (v.eerste_kleur || 'ONBEKEND').trim().toUpperCase();
        map.set(kleur, (map.get(kleur) || 0) + 1);
    });

    return Array.from(map.entries())
        .map(([kleur, aantal]) => ({ kleur, aantal }))
        .sort((a, b) => b.aantal - a.aantal);
};

// inrichtingen achteraf filteren (RDW matcht die strings super precies)
const filterOpInrichting = (voertuigen, inrichting) => {
    if (!inrichting || inrichting === 'ALLE') return voertuigen;

    const needle = inrichting.trim().toUpperCase();

    return voertuigen.filter((v) => {
        const raw = (v.inrichting || '').trim().toUpperCase();
        return raw === needle;
    });
};

// --------------------------------------------------------------
// 3: MERKEN ophalen (alleen personenauto’s)
// --------------------------------------------------------------

export const haalMerken = async () => {
    const params = new URLSearchParams({
        $select: 'merk, voertuigsoort',
        $where: "voertuigsoort = 'Personenauto'",
        $limit: '50000'
    });

    const data = await fetchRdwJson(`${RDW_URL}?${params}`);

    const alle = data
        .map((r) => r.merk)
        .filter((m) => typeof m === 'string')
        .map((m) => capitalize(m.trim()))
        .filter((m) => m.length > 0);

    const uniek = alle.reduce((acc, m) => {
        return acc.includes(m) ? acc : [...acc, m];
    }, []);

    return uniek.sort();
};

// --------------------------------------------------------------
// 4: MODELLEN (handelsbenamingen) ophalen per merk
// --------------------------------------------------------------

export const haalModellenVoorMerk = async (merk) => {
    const merkClean = merk.replace(/'/g, "''");

    const params = new URLSearchParams({
        $select: 'handelsbenaming, merk, voertuigsoort',
        $where: `voertuigsoort = 'Personenauto' AND merk = '${merkClean}'`,
        $limit: '50000'
    });

    const data = await fetchRdwJson(`${RDW_URL}?${params}`);

    const alle = data
        .map((r) => r.handelsbenaming)
        .filter((m) => typeof m === 'string')
        .map((m) => capitalize(m.trim()))
        .filter((m) => m.length > 0);

    const uniek = alle.reduce((acc, m) => {
        return acc.includes(m) ? acc : [...acc, m];
    }, []);

    return uniek.sort();
};

// --------------------------------------------------------------
// 5: JAREN ophalen per MERK + MODEL
// --------------------------------------------------------------

export const haalJarenVoorMerkEnModel = async (merk, model) => {
    const merkClean = merk.replace(/'/g, "''");
    const modelClean = model.replace(/'/g, "''");

    const params = new URLSearchParams({
        $select: 'datum_eerste_toelating, merk, handelsbenaming, voertuigsoort',
        $where: `
            voertuigsoort = 'Personenauto'
            AND merk = '${merkClean}'
            AND handelsbenaming = '${modelClean}'
        `,
        $limit: '50000'
    });

    const data = await fetchRdwJson(`${RDW_URL}?${params}`);

    const jaren = data
        .map((v) => bepaalJaar(v.datum_eerste_toelating))
        .filter((j) => typeof j === 'number' && !Number.isNaN(j));

    const uniek = jaren.reduce((acc, j) => {
        return acc.includes(j) ? acc : [...acc, j];
    }, []);

    return uniek.sort((a, b) => a - b);
};

// --------------------------------------------------------------
// 6: INRICHTINGEN per merk
// --------------------------------------------------------------

export const haalInrichtingenVoorMerk = async (merk) => {
    const merkClean = merk.replace(/'/g, "''");

    const params = new URLSearchParams({
        $select: 'inrichting, merk, voertuigsoort',
        $where: `voertuigsoort = 'Personenauto' AND merk = '${merkClean}'`,
        $limit: '50000'
    });

    const data = await fetchRdwJson(`${RDW_URL}?${params}`);

    const alle = data
        .map((r) => r.inrichting)
        .filter((i) => typeof i === 'string')
        .map((i) => capitalize(i.trim()))
        .filter((i) => i.length > 0);

    const uniek = alle.reduce((acc, i) => {
        return acc.includes(i) ? acc : [...acc, i];
    }, []);

    return uniek.sort();
};

// --------------------------------------------------------------
// 7: GROTE FETCH — echte data voor je dashboard
// --------------------------------------------------------------
//
// Deze functie geeft ALLES terug wat jouw views later nodig hebben:
// - voertuigenOud[]
// - voertuigenNieuw[]
// - gemiddelde hoogtes
// - kleuren
// - aantallen
//
// Jij kan ALLES hiermee doen in je views (gewicht, kleur, vermogen, etc.)
// --------------------------------------------------------------

export const haalDataVoorMerkModelJarenInrichting = async (
    merk,
    model,
    jaarOud,
    jaarNieuw,
    inrichting
) => {
    const jaarMin = Math.min(jaarOud, jaarNieuw);
    const jaarMax = Math.max(jaarOud, jaarNieuw);

    const merkClean = merk.replace(/'/g, "''");
    const modelClean = model.replace(/'/g, "''");

    const where = [
        `voertuigsoort = 'Personenauto'`,
        `merk = '${merkClean}'`,
        `handelsbenaming = '${modelClean}'`,
        `datum_eerste_toelating >= ${jaarMin}0101`,
        `datum_eerste_toelating <= ${jaarMax}1231`
    ].join(' AND ');

    const params = new URLSearchParams({
        $where: where,
        $limit: '50000'
    });

    const data = await fetchRdwJson(`${RDW_URL}?${params}`);

    // basis opschoning + verrijking
    const voertuigen = data
        .map((v) => ({
            ...v,
            jaar: bepaalJaar(v.datum_eerste_toelating),
            hoogteMeter: bepaalHoogteMeter(v),
            massaKg: pakGetal(v.massa_ledig_voertuig),
            vermogenKw: pakGetal(v.netto_maximumvermogen),
            catalogusPrijs: pakGetal(v.catalogusprijs)
        }))
        .filter((v) => v.jaar !== null);

    // inrichting achteraf doen
    const gefilterd = filterOpInrichting(voertuigen, inrichting);

    // opdelen in oud & nieuw
    const voertuigenOud = gefilterd.filter((v) => v.jaar === jaarOud);
    const voertuigenNieuw = gefilterd.filter((v) => v.jaar === jaarNieuw);

    // standaard dingen alvast
    const hoogtesOud = voertuigenOud.map((v) => v.hoogteMeter).filter((h) => h !== null);
    const hoogtesNieuw = voertuigenNieuw.map((v) => v.hoogteMeter).filter((h) => h !== null);

    return {
        voertuigenOud,
        voertuigenNieuw,

        gemHoogteOud: gemiddelde(hoogtesOud),
        gemHoogteNieuw: gemiddelde(hoogtesNieuw),

        kleurenOud: telKleuren(voertuigenOud),
        kleurenNieuw: telKleuren(voertuigenNieuw),

        verkoopOud: voertuigenOud.length,
        verkoopNieuw: voertuigenNieuw.length
    };
};
