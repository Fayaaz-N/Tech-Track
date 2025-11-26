# 🚗 Hoe snel veroveren Chinese EV’s de Nederlandse automarkt?

> ⚠️ Let op: de RDW-API is langzaam maar machtig.  
> De API bevat ~**16 miljoen registraties**.  
> Te snel achter elkaar filters veranderen of “rammen” op reload kan zorgen voor vertraging of tijdelijke timeouts.

**EV Story** is een interactieve datavisualisatie van de Nederlandse automarkt, gebouwd met **SvelteKit** en **D3.js**.  
De app vertelt het verhaal:
> **“Hoe snel veroveren Chinese EV’s de Nederlandse automarkt?”**

Dat doet ‘ie door **Chinese EV-merken** te vergelijken met **Westerse merken** op basis van officiële RDW-registraties.

---



## 🌐 Live demo

De applicatie is gemaakt als schoolproject voor de **Hogeschool van Amsterdam (HvA)**.

- 🔗 **Live**: https://rdw-data-api.vercel.app/

Op het **startscherm** kun je:

- Een uitleg lezen over de onderzoeksvraag
- Doorklikken naar het dashboard om zelf merken en jaartallen te kiezen

Of download het project via github: https://github.com/Fayaaz-N/Tech-Track/tree/main

Ga naar je terminal naar de map en typ: 
```npm run dev``` om de applicatie te starten. 

---

## 📖 Over dit project

**EV Story** gebruikt open data van de **RDW** om te onderzoeken:

- Hoe **Chinese EV-merken** zich ontwikkelen in Nederland
- Hoe die groei zich verhoudt tot **Westerse EV-merken**

De app is bedoeld als:

- Een **visueel verhaal** over de verschuiving op de automarkt
- Een **onderzoekstool** waarin je zelf merken en perioden kunt instellen
- Een **bewijsstuk** voor het beantwoorden van de centrale vraag:

> _“Hoe snel veroveren Chinese EV’s de Nederlandse automarkt?”_

---

## 📊 Functionaliteiten & schermen

De applicatie heeft grofweg twee hoofdschermen:  
een **intro-scherm** en een **dashboard** met grafiek + tabellen.

### 🟦 Scherm 1 – Intro

- Duidelijke introductie van de onderzoeksvraag
- Uitleg wat je in het dashboard kunt doen
- Een grote “Start je onderzoek” knop in Apple-achtige stijl
- Legt kort uit dat de data uit de **RDW-databank** komt

### 🟩 Scherm 2 – Dashboard

Het dashboard bestaat uit drie hoofdblokken:

#### 1. Controlepaneel (filters)

- Selecteer een **Chinees EV-merk**
    - Gebaseerd op een lijst met Chinese EV-merken
- Selecteer een **Westers EV-merk**
    - Gebaseerd op een lijst met Europese / Amerikaanse / Koreaanse merken
- Kies een **periode**:
    - `Jaar van`
    - `Jaar tot`
- Knop **“Laad data”** om de grafiek en tabellen te verversen
- Duidelijke feedback:
    - Loading state (tekst + spinner)
    - Foutmeldingen als:
        - Merken niet ingevuld
        - Jaren ongeldig zijn
        - De RDW-request faalt

#### 2. Visuele vergelijking (D3-grafiek)

- Een **D3 bar chart** (met auto-snelweg vibes):
    - X-as als een soort **weg**, met jaartallen als markeringen
    - Y-as met aantallen BEV-registraties
    - Voor elk jaar:
        - Een bar voor het Chinese merk
        - Een bar voor het Westerse merk
- In de legenda onder de titel zie je:
    - Naam van het Chinese merk
    - Naam van het Westerse merk
- Doel van de grafiek:
    - In één oogopslag zien **welk merk sneller groeit**
    - Of Chinese merken al “overheen” gaan in bepaalde jaren

#### 3. Tabelweergave per merk

- Linker kolom: **Chinese merk**
    - Merknaam en gekozen periode
    - Totaal aantal BEV-registraties in die periode
    - Tabel per jaar:
        - Jaar
        - Aantal BEV’s
- Rechter kolom: **Westers merk**
    - Zelfde structuur, voor het Westerse merk
- Duidelijke “geen data” meldingen als:
    - Er geen BEV-registraties zijn in die periode
    - Of als de RDW-dataset niets teruggeeft

---

## 🛠 Gebruikte technologieën

### Frontend & framework

- **SvelteKit** (Svelte + Vite)
- **D3.js** voor maatwerk datavisualisaties (bar chart / vergelijking)
- SVG voor de custom grafiek (bars, gridlines, “weg” als x-as)

### Data & API

- **RDW Open Data** (Nederlandse voertuigregistraties)
    - De gebruikte dataset bevat rond de **16.000.000 rijen**
    - Requests worden gefilterd op merk, brandstof/EV-criteria en jaar
- Fetch-logica in een eigen helper:
    - `src/lib/fetchData.js`
    - Functie: `haalBevVerkoopPerJaarVoorMerk(merk, jaarVan, jaarTot)`

### Deployed op

- Gebruikt om live tre zetten:
    - Vercel

---

## 🧱 Architectuur in het kort

Een beknopt overzicht van de belangrijkste onderdelen:

### `src/routes/+page.svelte`

- Regelt de **state** van de app:
    - Welk scherm je ziet (intro of dashboard)
- Toont:
    - `Intro` component
    - `Dashboard` component
- Luistert naar events:
    - `on:start` → van intro naar dashboard
    - `on:opnieuw` → van dashboard terug naar intro

### `src/components/Intro.svelte` (of vergelijkbare naam)

- Apple-achtig **welkomstscherm**
- Legt de onderzoeksvraag uit
- Knop: **“Start je onderzoek”**  
  → stuurt een Svelte event `start` naar de parent

### `src/components/Dashboard.svelte`

- Bevat:
    - Filter UI (merken + periode)
    - Knop **“Laad data”**
    - `AantallenChart.svelte` (D3-grafiek)
    - Tabelweergave voor beide merken
- Doet de data-calls via `fetchData.js`
- Stuurt een event `opnieuw` om terug naar de intro te gaan

### `src/components/graphs/AantallenChart.svelte`

- Pure D3/SVG-visualisatie:
    - Bars per jaar voor beide merken
    - Y-as met ticks en labels
    - “Weg” als X-as met streepjes en jaartallen
    - Responsieve `viewBox` zodat de grafiek schaalt met de container

### `src/lib/fetchData.js`

- Bevat logica voor het praten met de RDW-API:
    - Hulpfunctie om requests te doen (met optionele app token)
    - Functie `haalBevVerkoopPerJaarVoorMerk` die:
        - RDW-data ophaalt
        - Filtert op:
            - Merk
            - Elektrisch / BEV
            - Opgegeven periode
        - Het resultaat terugstuurt als:
          ```js
          {
            merkNetjes: 'BYD',
            jaarVan: 2020,
            jaarTot: 2025,
            totaalEVs: 1234,
            verkoopPerJaar: [
              { jaar: 2020, aantal: 12 },
              { jaar: 2021, aantal: 87 },
              ...
            ]
          }
          ```

---

[//]: # (## 💻 Installatie & ontwikkeling)

[//]: # ()
[//]: # (1. **Repo binnenhalen**)

[//]: # ()
[//]: # (   ```bash)

[//]: # (   git clone <jouw-repo-url>)

[//]: # (   cd <jouw-repo-map>)
