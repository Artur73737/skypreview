# Changelog

Tutti i cambiamenti rilevanti sono documentati qui.
Formato basato su [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added
- Supporto mobile: pannello a foglio inferiore, dock compatta, safe area per notch e barra gesti, crediti nascosti sugli schermi piccoli
- Gesti touch sulla mappa: pinch-to-zoom con due dita e trascinamento a un dito, senza selezione accidentale dopo il pinch
- Texture DSS2 a 1024 px sui dispositivi compatti per ridurre rete, memoria e tempo di stitching
- Preset Seestar S30 Plus: ottica 30/160 mm f/5.3 e sensore SC485SL impostati con un clic, anteprima del campo 2,66° × 1,50° nel cielo con zoom automatico
- Camera preset Seestar S30 Plus · SC485SL nel picker camere
- Viewport 3D prospettica circolare stile planetario con AltAz reale da lat/lon/data
- Foto deep-sky progressive da tile HiPS DSS2 color con stitching nel browser: lo zoom aumenta la risoluzione come Google Maps
- UI minimal dark: nero puro, dock e pannelli in vetro scuro, badge HD
- Toggle vista circolare e foto HD progressive

### Fixed
- Texture DSS2: caricamento diretto dei tile HiPS dai mirror con CORS (ESA Sky, STScI MAST, CSIRO CASDA) e stitching TAN nel browser, senza dipendere dal servizio HiPS2FITS CDS non raggiungibile
- Texture DSS2: ordine HiPS scelto in base al campo visivo, cache dei tile e fallback automatico tra i mirror
- Anteprima oggetto: texture 512 px invece di 2048 px, caricamento più rapido
- Foto HD: richieste piccole e veloci, niente più attese infinite a campo largo
- Foto HD: la rotazione terrestre in tempo reale non riavvia più il caricamento ogni secondo
- Linee costellazioni ora usano RA corretta da catalogo Stellarium via HIP
- Rimosso Sole dal catalogo stelle e normalizzati numeri Messier

### Changed
- Viewport mobile con `viewport-fit=cover`, altezza dinamica `100dvh` e input a 16 px per evitare lo zoom automatico di iOS
- Sky pack: il workflow Pages non scarica più texture alla build; il pack locale resta supportato se già presente
- Documentazione aggiornata con la nuova pipeline di texture, il supporto mobile e le fonti DSS2

### Removed
- Job GitHub Actions `sky-pack` e script `download:sky-pack`, dipendenti da HiPS2FITS CDS
- Download DSS2 all-sky inutilizzato da `download:data`
