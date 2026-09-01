# Claude Code Prompt — Cornell Method Notities App (Nederlands)

Plak dit als opdracht in Claude Code om de app te bouwen.

---

Bouw een webapp voor het maken van notities volgens de **Cornell-methode**. De volledige interface, teksten en uitleg moeten in het **Nederlands** zijn. De app moet zowel een **licht als donker thema** ondersteunen, met een schone, kleurrijke, moderne uitstraling.

## Stack
- React + Vite (of Next.js), TypeScript
- Tailwind CSS voor styling (met CSS-variabelen voor thema's, zodat licht/donker makkelijk te wisselen is)
- LocalStorage (of IndexedDB) voor het opslaan van notities — geen backend nodig tenzij anders gevraagd
- Houd de code modulair: aparte componenten voor Home, Editor, Instellingen, Uitleg/Gids

## De Cornell-methode (context voor de uitleg-pagina)
Een Cornell-notitiepagina bestaat uit drie delen:
1. **Trefwoordenkolom** (links, smal) — kernwoorden en vragen, meestal achteraf ingevuld, gebruikt om jezelf te overhoren.
2. **Notitiekolom** (rechts, breed) — hoofdgedeelte waar tijdens de les/vergadering/het lezen aantekeningen worden gemaakt.
3. **Samenvatting** (onderaan, volledige breedte) — korte samenvatting in eigen woorden, geschreven direct na de sessie.

## Schermen

### 1. Startscherm (Home)
- Korte, vriendelijke uitleg van wat de Cornell-methode is en waarom het werkt (kort, met een "Meer lezen"-optie voor details).
- Visueel diagram van de drie secties zodat nieuwe gebruikers de indeling direct begrijpen.
- Duidelijke knop: **"Nieuwe notitie starten"**
- Knop: **"Vorige notitie uploaden"**
- Overzicht/grid van eerder opgeslagen notities (titel, datum, kleine preview)
- Toegang tot **Instellingen** (icoon, altijd bereikbaar)
- Thema-wissel knop (licht/donker) altijd zichtbaar

### 2. Notitie-editor (kernscherm)
- Live Cornell-indeling:
  - Links: trefwoorden/vragen
  - Rechts: hoofdnotities
  - Onderaan: samenvatting
  - Bovenaan: titel + datum (automatisch ingevuld, aanpasbaar)
- Duidelijke visuele scheiding tussen de drie secties (kleur, rand, subtiele schaduw)

### 3. Instellingen
- Thema kiezen: licht / donker / systeeminstelling
- Accentkleur kiezen
- Standaard lettergrootte + min/max grenzen voor automatische tekstschaling instellen
- Breedteverhouding tussen trefwoorden- en notitiekolom aanpassen
- Sneltoetsen bekijken en aanpassen
- Notities exporteren / importeren / alles wissen

### 4. Uitleg / Gids
- Uitleg van de Cornell-methode
- Uitleg van de functies van de app: sneltoetsen, uploaden, automatische tekstschaling
- Mag als los scherm of als overlay bij eerste bezoek

## Functionaliteit

### A. Vorige notities uploaden
- Gebruiker kan een eerder gemaakte Cornell-notitie uploaden (eigen exportformaat van deze app, bijvoorbeeld JSON of Markdown met duidelijke sectiemarkeringen zoals `## Trefwoorden`, `## Notities`, `## Samenvatting`).
- Geüploade notitie verschijnt daarna gewoon tussen de andere notities op het startscherm.
- Toon een foutmelding bij een ongeldig bestand, laat een voorbeeld zien voor het definitief importeren.

### B. Volledig toetsenbord-navigatie (geen muis nodig)
Implementeer globale sneltoetsen om tussen secties te wisselen zonder te klikken:
- `Tab` / `Shift+Tab` — door de secties heen springen: Trefwoorden → Notities → Samenvatting
- `Ctrl/Cmd + 1` — spring naar Trefwoorden
- `Ctrl/Cmd + 2` — spring naar Notities
- `Ctrl/Cmd + 3` — spring naar Samenvatting
- `Ctrl/Cmd + N` — nieuwe notitie
- `Ctrl/Cmd + S` — notitie opslaan (naast automatisch opslaan)
- `Esc` — terug naar startscherm
- `?` — toon overzicht van alle sneltoetsen
- Alle sneltoetsen moeten aanpasbaar zijn in Instellingen.
- Duidelijke visuele focus-indicator zodat de gebruiker altijd ziet in welke sectie hij/zij zit.

### C. Automatische tekstschaling
- Lettergrootte per sectie past zich automatisch aan naarmate er meer tekst wordt geschreven (kleiner bij veel tekst, groter terug bij weinig tekst).
- Elke sectie (Trefwoorden, Notities, Samenvatting) schaalt onafhankelijk van elkaar.
- Instelbare min/max grenzen in Instellingen zodat tekst nooit onleesbaar klein of overdreven groot wordt.
- Vloeiende overgang (geen abrupte sprongen).

### D. Automatisch opslaan
- Notities worden automatisch (debounced) opgeslagen tijdens het typen.
- Subtiele "opgeslagen"-indicator.

## Design
- Licht én donker thema, beide met een kleurrijke maar rustige uitstraling (niet steriel wit/grijs).
- Gebruik een duidelijke accentkleur per sectie zodat de driedeling altijd visueel herkenbaar is, ook in donker thema.
- Ronde hoeken, zachte schaduwen, duidelijke scheidingslijnen tussen de secties.
- Goed leesbaar lettertype, ruime regelafstand voor langere schrijfsessies.
- Responsive: op smalle schermen de kolommen onder elkaar i.p.v. naast elkaar, samenvatting altijd onderaan.

## Prioriteiten (in volgorde)
1. Startscherm met uitleg, instellingen en notitie-overzicht
2. Cornell-editor (trefwoorden / notities / samenvatting)
3. Volledige toetsenbord-navigatie tussen secties
4. Automatische tekstschaling
5. Uploaden van eerdere notities
6. Licht/donker thema, kleurrijk en overzichtelijk design
