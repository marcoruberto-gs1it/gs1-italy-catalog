# GS1 Digital Link Catalog

Demo Angular 22 (SSR) di un catalogo prodotti che mostra come **GS1 Digital Link** trasformi un
GTIN in una vera porta d'accesso ai dati di prodotto: lo stesso codice risolvibile via URL apre
tracciabilità di filiera, certificazioni, istruzioni d'uso e dati strutturati leggibili da motori
di ricerca e agenti AI — aggiornabili senza mai ristampare l'etichetta.

63 prodotti fittizi (brand "GS1 Italy", prefisso aziendale `8032089`) distribuiti su 6 settori
(largo consumo, foodservice, fresh food, sanità, abbigliamento, edilizia).

## Funzionalità principali

- **Routing GS1 Digital Link** — `/01/:gtin`, con estensioni opzionali `/10/:lot` e `/21/:serial`
  per lotto/seriale, risolte dallo stesso `ProductComponent`.
- **Dati strutturati reali** — JSON-LD pubblicato secondo **GS1 Web Vocabulary** e/o
  **schema.org** (ingredienti, allergeni con livello di contenimento, materiali tessili, GDSN,
  certificazioni, tracciabilità stile EPCIS), visibile in-pagina tramite un visualizzatore
  JSON-LD dedicato.
- **Validatore GS1 Digital Link** (`/validatore`) — analizza un Digital Link o una stringa AI
  usando il vero [GS1 Barcode Syntax Engine](https://github.com/gs1/gs1-syntax-engine) (WASM),
  con CTA verso [validator.schema.org](https://validator.schema.org).
- **Assistente AI** (`/assistente`) — chat che risponde a domande sul catalogo appoggiandosi ai
  dati strutturati; distingue sempre ciò che è testo generato dall'assistente da ciò che è dato
  verificato dal catalogo. In attesa di un backend LLM dedicato, include un motore di ricerca
  locale che sfrutta anche i livelli di contenimento allergeni strutturati (es. "prodotti senza
  glutine" vs "che contengono glutine").
- **Multilingua IT/EN** — rilevamento automatico da `Accept-Language`/browser con selettore
  manuale; dati prodotto e stringhe UI tradotte, JSON-LD con `langString` bilingue nativo.
- **QR code e GS1 DataMatrix** generati a runtime (download PNG/SVG) per GTIN, istanze
  lotto/seriale e SSCC logistici.

## Stack

Angular 22 (standalone components, signals, SSR/prerendering), TypeScript, `gs1encoder` (WASM),
`bwip-js` per il DataMatrix, `angularx-qrcode`.

## Sviluppo

```bash
npm install
npm start        # ng serve — http://localhost:4200
npm run build    # genera le rotte da products.json, poi build SSR + prerendering
npm test         # unit test (Vitest)
```

## Deploy

Pubblicato automaticamente su **GitHub Pages** a ogni push su `main`, tramite
[`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml):

**https://marcoruberto-gs1it.github.io/gs1-italy-catalog/**

La build per Pages usa `--base-href /gs1-italy-catalog/` (il sito vive sotto un sottopercorso,
non alla radice del dominio) e copia `index.html` in `404.html` per far gestire dal Router di
Angular, lato client, le rotte non prerenderizzabili (lotto/seriale) — il trucco standard per le
SPA su hosting statico. Solo il bundle browser viene pubblicato: il bundle SSR (Express) fa parte
della build ma non serve su Pages, che è hosting puramente statico.

## Struttura

```
src/app/
  pages/         home, sector (catalogo), product, validator, chat
  components/    json-ld-drawer, digital-link-visualizer, search-palette, data-matrix, ...
  services/      product, chat, language, i18n
  data/          products.json (dataset), products.en.ts (overlay traduzioni), sectors.ts
  i18n/          dizionario IT/EN
```
