// src/lib/fetchData.js
// ----------------------------------------------
// Dit bestand regelt ALLE RDW data die we nodig hebben.
// Ik hou 'm expres simpel: veel map/filter,
// en overal comments waarom iets gebeurt.
// ----------------------------------------------

// App token om meer data te mogen opvragen
const APP_TOKEN = import.meta.env?.VITE_RDW_APP_TOKEN || null;

// Kleine helper om requests te doen met de token
const fetchRdwJson = async (url) => {
    const headers = APP_TOKEN ? { 'X-App-Token': APP_TOKEN } : {};

    const res = await fetch(url.toString(), { headers });

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status}: ${text}`);
    }

    return res.json();
};

// Basis RDW endpoint
const RDW_URL = 'https://opendata.rdw.nl/resource/m9d7-ebf2.json';

// ----------------------------------------------
// Helper om dingen netjes te maken:
// "bmw" -> "Bmw", "MERCEDES-BENZ" -> "Mercedes-benz"
// ----------------------------------------------
const capitalize = (str) =>
    str
        .toString()
        .toLowerCase()
        .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());

// ----------------------------------------------
// Datum van RDW is zoiets: 20070513
// We pakken alleen de eerste 4 chars → 2007
// ----------------------------------------------
const bepaalJaar = (rawDatum) => {
    if (!rawDatum) return null;

    const jaarStr = String(rawDatum).slice(0, 4);
    const jaar = Number(jaarStr);

    return Number.isNaN(jaar) ? null : jaar;
};

// ----------------------------------------------
// Hoogte staat in cm → we willen meters
// ----------------------------------------------
const bepaalHoogteMeter = (v) => {
    const raw = v.hoogte_voertuig ?? v.hoogte ?? null;
    const n = Number(raw);
    return Number.isNaN(n) ? null : n / 10;
};

// ----------------------------------------------
// Gewoon getallen netjes parsen
// ----------------------------------------------
const pakGetal = (raw) => {
    const n = Number(raw);
    return Number.isNaN(n) ? null : n;
};

// ----------------------------------------------
// Catalogusprijs netjes parsen + sanity-filter
// (tussen 1.000 en 300.000 euro)
// ----------------------------------------------
const bepaalCatalogusPrijs = (raw) => {
    const n = Number(raw);
    if (Number.isNaN(n)) return null;
    if (n < 1000 || n > 300000) return null;
    return n;
};

// ----------------------------------------------
// Gemiddelde van een lijst (alleen echte nummers)
// ----------------------------------------------
const gemiddelde = (lijst) => {
    const values = lijst.filter((v) => typeof v === 'number');
    if (values.length === 0) return null;
    const som = values.reduce((t, v) => t + v, 0);
    return som / values.length;
};

// ----------------------------------------------
// Kleuren tellen (hier komt later jouw treemap)
// ----------------------------------------------
const telKleuren = (voertuigen) => {
    const kleurMap = new Map();

    voertuigen.forEach((v) => {
        const kleur = (v.eerste_kleur || 'ONBEKEND').trim().toUpperCase();

        kleurMap.set(kleur, (kleurMap.get(kleur) || 0) + 1);
    });

    return Array.from(kleurMap.entries())
        .map(([kleur, aantal]) => ({ kleur, aantal }))
        .sort((a, b) => b.aantal - a.aantal);
};

// ----------------------------------------------
// Inrichting filter doen we achteraf (want RDW
// geeft super rare lange teksten dus exact match
// in query werkt niet altijd fijn)
// ----------------------------------------------
const filterOpInrichting = (voertuigen, inrichting) => {
    if (!inrichting || inrichting === 'ALLE') return voertuigen;

    const needle = inrichting.trim().toUpperCase();

    return voertuigen.filter((v) => {
        const raw = (v.inrichting || '').trim().toUpperCase();
        return raw === needle;
    });
};

// ===============================================================
// MERKEN OPHALEN — alleen personenauto’s, en alles netjes maken
// ===============================================================
export const haalMerken = async () => {
    const params = new URLSearchParams({
        $select: 'merk, voertuigsoort',
        $where: "voertuigsoort = 'Personenauto'",
        $limit: '10000000'
    });

    const data = await fetchRdwJson(`${RDW_URL}?${params}`);

    // alle merken verzamelen en opschonen
    const alle = data
        .map((item) => item.merk)
        .filter((m) => typeof m === 'string')
        .map((m) => m.trim())
        .filter((m) => m.length > 0)
        .map(capitalize); // hier maken we de letters mooi

    // duplicates eruit
    const uniek = alle.reduce((lijst, merk) => {
        return lijst.includes(merk) ? lijst : [...lijst, merk];
    }, []);

    return uniek.sort();
};

// ===============================================================
// MODELLEN (handelsbenamingen) per merk
// (wordt ook gebruikt voor inrichting = 'ALLE')
// ===============================================================
export const haalModellenVoorMerk = async (merk) => {
    const merkClean = merk.toString().trim().toUpperCase().replace(/'/g, "''");

    const params = new URLSearchParams({
        $select: 'handelsbenaming, merk, voertuigsoort',
        $where: `voertuigsoort = 'Personenauto' AND merk = '${merkClean}'`,
        $limit: '10000000'
    });

    const data = await fetchRdwJson(`${RDW_URL}?${params}`);

    const alle = data
        .map((item) => item.handelsbenaming)
        .filter((m) => typeof m === 'string')
        .map((m) => m.trim())
        .filter((m) => m.length > 0)
        .map(capitalize);

    const uniek = alle.reduce((lijst, item) => {
        return lijst.includes(item) ? lijst : [...lijst, item];
    }, []);

    return uniek.sort();
};

// ===============================================================
// MODELLEN per MERK + INRICHTING
// - Als inrichting = 'ALLE' → alle modellen voor merk
// - Anders: we halen alles voor merk op en filteren
//   achteraf op inrichting (zodat rare teksten geen
//   probleem zijn in de RDW-query zelf)
// ===============================================================
export const haalModellenVoorMerkEnInrichting = async (merk, inrichting) => {
    // geen inrichting of ALLE → gewoon alle modellen van dit merk
    if (!inrichting || inrichting === 'ALLE') {
        return haalModellenVoorMerk(merk);
    }

    const merkClean = merk.toString().trim().toUpperCase().replace(/'/g, "''");

    const params = new URLSearchParams({
        $select: 'handelsbenaming, merk, voertuigsoort, inrichting',
        $where: `voertuigsoort = 'Personenauto' AND merk = '${merkClean}'`,
        $limit: '10000000'
    });

    const data = await fetchRdwJson(`${RDW_URL}?${params}`);

    // eerst op inrichting filteren met onze helper
    const gefilterd = filterOpInrichting(data, inrichting);

    const alle = gefilterd
        .map((item) => item.handelsbenaming)
        .filter((m) => typeof m === 'string')
        .map((m) => m.trim())
        .filter((m) => m.length > 0)
        .map(capitalize);

    const uniek = alle.reduce((lijst, item) => {
        return lijst.includes(item) ? lijst : [...lijst, item];
    }, []);

    return uniek.sort();
};

// ===============================================================
// JAREN per MERK + MODEL
// ===============================================================
export const haalJarenVoorMerkEnModel = async (merk, model) => {
    const merkClean = merk.toString().trim().toUpperCase().replace(/'/g, "''");
    const modelClean = model.toString().trim().toUpperCase().replace(/'/g, "''");

    const params = new URLSearchParams({
        $select: 'datum_eerste_toelating, merk, handelsbenaming, voertuigsoort',
        $where:
            "voertuigsoort = 'Personenauto'" +
            ` AND merk = '${merkClean}'` +
            ` AND handelsbenaming = '${modelClean}'`,
        $limit: '10000000'
    });

    const data = await fetchRdwJson(`${RDW_URL}?${params}`);

    const jaren = data
        .map((item) => bepaalJaar(item.datum_eerste_toelating))
        .filter((jaar) => typeof jaar === 'number' && !Number.isNaN(jaar));

    const uniek = jaren.reduce((lijst, jaar) => {
        return lijst.includes(jaar) ? lijst : [...lijst, jaar];
    }, []);

    return uniek.sort((a, b) => a - b);
};

// ===============================================================
// INRICHTINGEN OPHALEN PER MERK — ook opgeschoond
// ===============================================================
export const haalInrichtingenVoorMerk = async (merk) => {
    const merkClean = merk.toString().trim().toUpperCase().replace(/'/g, "''");

    const params = new URLSearchParams({
        $select: 'inrichting, merk, voertuigsoort',
        $where: `voertuigsoort = 'Personenauto' AND merk = '${merkClean}'`,
        $limit: '10000000'
    });

    const data = await fetchRdwJson(`${RDW_URL}?${params}`);

    const alle = data
        .map((item) => item.inrichting)
        .filter((i) => typeof i === 'string')
        .map((i) => i.trim())
        .filter((i) => i.length > 0)
        .map(capitalize);

    const uniek = alle.reduce((lijst, item) => {
        return lijst.includes(item) ? lijst : [...lijst, item];
    }, []);

    return uniek.sort();
};

// ===============================================================
// OUDE VERSIE: alles voor MERK + 2 jaren + inrichting
// (voor oude schermen; nieuwe flow gebruikt de functie eronder)
// ===============================================================
export const haalDataVoorMerkEnJaren = async (merk, jaarOud, jaarNieuw, inrichting) => {
    const jaarMin = Math.min(jaarOud, jaarNieuw);
    const jaarMax = Math.max(jaarOud, jaarNieuw);

    const merkClean = merk.toString().trim().toUpperCase().replace(/'/g, "''");

    const where = [
        `merk = '${merkClean}'`,
        `voertuigsoort = 'Personenauto'`,
        `datum_eerste_toelating >= ${jaarMin}0101`,
        `datum_eerste_toelating <= ${jaarMax}1231`
    ].join(' AND ');

    const params = new URLSearchParams({
        $where: where,
        $limit: '10000000'
    });

    // data ophalen
    const data = await fetchRdwJson(`${RDW_URL}?${params}`);

    // basis-opschoning van elk voertuig
    const voertuigen = data
        .map((v) => ({
            ...v,

            // jaar (via helper)
            jaar: bepaalJaar(v.datum_eerste_toelating),

            // hoogte in meters
            hoogteMeter: bepaalHoogteMeter(v),

            // wat de views fijn vinden:
            massaKg: pakGetal(v.massa_ledig_voertuig),
            vermogenKw: pakGetal(v.netto_maximumvermogen),
            catalogusPrijs: pakGetal(v.catalogusprijs)
        }))
        .filter((v) => v.jaar !== null);

    // inrichting-filter (achteraf)
    const gefilterd = filterOpInrichting(voertuigen, inrichting);

    // splitsen op jaar
    const voertuigenOud = gefilterd.filter((v) => v.jaar === Number(jaarOud));
    const voertuigenNieuw = gefilterd.filter((v) => v.jaar === Number(jaarNieuw));

    // alvast een paar standaard dingen (voor jouw oude schermen)
    const hoogteOud = voertuigenOud.map((v) => v.hoogteMeter).filter((x) => x !== null);
    const hoogteNieuw = voertuigenNieuw.map((v) => v.hoogteMeter).filter((x) => x !== null);

    return {
        // de twee ruwe lijsten
        voertuigenOud,
        voertuigenNieuw,

        // alvast wat basisinfo
        gemHoogteOud: gemiddelde(hoogteOud),
        gemHoogteNieuw: gemiddelde(hoogteNieuw),
        kleurenOud: telKleuren(voertuigenOud),
        kleurenNieuw: telKleuren(voertuigenNieuw),
        verkoopOud: voertuigenOud.length,
        verkoopNieuw: voertuigenNieuw.length
    };
};

// ===============================================================
// NIEUWE GROTE FETCH
// Alles voor MERK + MODEL + 2 jaren + inrichting
// → gebruikt jouw nieuwe flow (informatie → dashboard)
// ===============================================================
// ===============================================================
// NIEUWE GROTE FETCH
// Alles voor MERK + MODEL + 2 jaren + inrichting
// → gebruikt jouw nieuwe flow (informatie → dashboard)
// ===============================================================
// ===============================================================
// NIEUWE GROTE FETCH
// Alles voor MERK + MODEL + 2 jaren + inrichting
// → gebruikt jouw nieuwe flow (informatie → dashboard)
// ===============================================================
// ===============================================================
// NIEUWE GROTE FETCH
// Alles voor MERK + MODEL + 2 jaren + inrichting
// → gebruikt jouw nieuwe flow (informatie → dashboard)
// ===============================================================
export const haalDataVoorMerkModelJarenInrichting = async (
    merk,
    model,
    jaarOud,
    jaarNieuw,
    inrichting
) => {
    const jaarMin = Math.min(jaarOud, jaarNieuw);
    const jaarMax = Math.max(jaarOud, jaarNieuw);

    const merkClean = merk.toString().trim().toUpperCase().replace(/'/g, "''");
    const modelClean = model.toString().trim().toUpperCase().replace(/'/g, "''");

    const where = [
        `voertuigsoort = 'Personenauto'`,
        `merk = '${merkClean}'`,
        `handelsbenaming = '${modelClean}'`,
        `datum_eerste_toelating >= ${jaarMin}0101`,
        `datum_eerste_toelating <= ${jaarMax}1231`
    ].join(' AND ');

    const params = new URLSearchParams({
        $where: where,
        $limit: '10000000'
    });

    const data = await fetchRdwJson(`${RDW_URL}?${params}`);

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

    // inrichting achteraf filteren
    const gefilterd = filterOpInrichting(voertuigen, inrichting);

    // ---------------------------------------------
    // "oude" 2-punts data blijft werken
    // ---------------------------------------------
    const voertuigenOud = gefilterd.filter((v) => v.jaar === Number(jaarOud));
    const voertuigenNieuw = gefilterd.filter((v) => v.jaar === Number(jaarNieuw));

    const hoogteOud = voertuigenOud.map((v) => v.hoogteMeter).filter((h) => h !== null);
    const hoogteNieuw = voertuigenNieuw.map((v) => v.hoogteMeter).filter((h) => h !== null);

    // ---------------------------------------------
    // NIEUW: per-jaar aggregaties voor ALLES
    // ---------------------------------------------
    const perJaarMap = new Map();

    gefilterd.forEach((v) => {
        const jaar = v.jaar;
        if (jaar == null) return;

        if (!perJaarMap.has(jaar)) {
            perJaarMap.set(jaar, {
                jaar,
                aantal: 0,

                // hoogte
                hoogteSom: 0,
                hoogteCount: 0,

                // gewicht
                massaSom: 0,
                massaCount: 0,

                // prijs
                prijsSom: 0,
                prijsCount: 0,
                prijsMin: null,
                prijsMax: null
            });
        }

        const agg = perJaarMap.get(jaar);
        agg.aantal += 1;

        if (typeof v.hoogteMeter === 'number') {
            agg.hoogteSom += v.hoogteMeter;
            agg.hoogteCount += 1;
        }

        if (typeof v.massaKg === 'number') {
            agg.massaSom += v.massaKg;
            agg.massaCount += 1;
        }

        if (typeof v.catalogusPrijs === 'number') {
            const p = v.catalogusPrijs;
            agg.prijsSom += p;
            agg.prijsCount += 1;

            agg.prijsMin =
                agg.prijsMin === null ? p : Math.min(agg.prijsMin, p);
            agg.prijsMax =
                agg.prijsMax === null ? p : Math.max(agg.prijsMax, p);
        }
    });


    const hoogtePerJaar = [];
    const gewichtPerJaar = [];
    const prijsPerJaar = [];

    Array.from(perJaarMap.values())
        .sort((a, b) => a.jaar - b.jaar)
        .forEach((agg) => {
            hoogtePerJaar.push({
                jaar: agg.jaar,
                gemiddeldeHoogte:
                    agg.hoogteCount > 0 ? agg.hoogteSom / agg.hoogteCount : null,
                aantal: agg.aantal
            });

            gewichtPerJaar.push({
                jaar: agg.jaar,
                gemiddeldeGewicht:
                    agg.massaCount > 0 ? agg.massaSom / agg.massaCount : null,
                aantal: agg.aantal
            });

            prijsPerJaar.push({
                jaar: agg.jaar,
                gemiddeldePrijs:
                    agg.prijsCount > 0 ? agg.prijsSom / agg.prijsCount : null,
                minPrijs: agg.prijsMin,
                maxPrijs: agg.prijsMax,
                aantal: agg.prijsCount
            });
        });


    Array.from(perJaarMap.values())
        .sort((a, b) => a.jaar - b.jaar)
        .forEach((agg) => {
            hoogtePerJaar.push({
                jaar: agg.jaar,
                gemiddeldeHoogte:
                    agg.hoogteCount > 0 ? agg.hoogteSom / agg.hoogteCount : null,
                aantal: agg.aantal
            });

            gewichtPerJaar.push({
                jaar: agg.jaar,
                gemiddeldeGewicht:
                    agg.massaCount > 0 ? agg.massaSom / agg.massaCount : null,
                aantal: agg.aantal
            });

            prijsPerJaar.push({
                jaar: agg.jaar,
                gemiddeldePrijs:
                    agg.prijsCount > 0 ? agg.prijsSom / agg.prijsCount : null,
                aantal: agg.aantal
            });
        });

    // ---------------------------------------------
    // Kleuren per jaar
    // ---------------------------------------------
    const kleurenPerJaar = Array.from(perJaarMap.keys())
        .sort((a, b) => a - b)
        .map((jaar) => {
            const voertuigenInJaar = gefilterd.filter((v) => v.jaar === jaar);
            return {
                jaar,
                kleuren: telKleuren(voertuigenInJaar)
            };
        });

    // ---------------------------------------------
    // Verkoop per jaar (aantallen)
    // ---------------------------------------------
    const verkoopPerJaarMap = new Map();
    gefilterd.forEach((v) => {
        const jaar = v.jaar;
        if (jaar == null) return;
        verkoopPerJaarMap.set(jaar, (verkoopPerJaarMap.get(jaar) || 0) + 1);
    });

    const verkoopPerJaar = Array.from(verkoopPerJaarMap.entries())
        .map(([jaar, aantal]) => ({ jaar, aantal }))
        .sort((a, b) => a.jaar - b.jaar);

    return {
        // 2-punts (voor backward compatibility)
        voertuigenOud,
        voertuigenNieuw,
        gemHoogteOud: gemiddelde(hoogteOud),
        gemHoogteNieuw: gemiddelde(hoogteNieuw),
        kleurenOud: telKleuren(voertuigenOud),
        kleurenNieuw: telKleuren(voertuigenNieuw),
        verkoopOud: voertuigenOud.length,
        verkoopNieuw: voertuigenNieuw.length,

        // RANGE data voor ALLE views
        hoogtePerJaar,
        gewichtPerJaar,
        prijsPerJaar,
        kleurenPerJaar,
        verkoopPerJaar
    };
};
