export interface Sector {
  id: string;
  name: string;
  icon: string;
  description: string;
  brandColor: string;
}

export const SECTORS: Sector[] = [
  {
    id: 'fmcg',
    name: 'Largo consumo',
    icon: '/icons/cpg.png',
    description: "Un solo codice a barre, letto in cassa, apre anche a prezzo, ingredienti, certificazioni e origine del prodotto — senza mai dover ristampare l'etichetta per aggiornarli.",
    brandColor: '#F26334', // GS1 Orange
  },
  {
    id: 'foodservice',
    name: 'Foodservice',
    icon: '/icons/foodservice.png',
    description: "Lo stesso identificativo che gestisce l'acquisto professionale segue il prodotto dal fornitore alla cucina, con formati, quantità e dati logistici pensati per la ristorazione.",
    brandColor: '#7AC143', // GS1 Grass
  },
  {
    id: 'healthcare',
    name: 'Sanità',
    icon: '/icons/healthcare.png',
    description: 'Il codice già presente su dispositivi e farmaci, tramite UDI e GS1 DataMatrix, diventa una via d\'accesso a informazioni di sicurezza del paziente e tracciabilità di filiera.',
    brandColor: '#00B6DE', // GS1 Sky
  },
  {
    id: 'apparel',
    name: 'Abbigliamento',
    icon: '/icons/textiles.png',
    description: "Un solo identificativo racconta la storia del capo — materiali, provenienza e cura — dallo scaffale all'armadio, in modo trasparente e verificabile.",
    brandColor: '#AF96D4', // GS1 Lavender
  },
  {
    id: 'fresh-foods',
    name: 'Alimenti freschi',
    icon: '/icons/fresh_foods.png',
    description: 'Lotto e scadenza si legano allo stesso identificativo di sempre, per garantire freschezza, qualità e tracciabilità dal campo alla tavola.',
    brandColor: '#FBB034', // GS1 Peach
  },
  {
    id: 'costruzioni',
    name: 'Costruzioni',
    icon: '/icons/construction.png',
    description: "Lo stesso identificativo che organizza la logistica di cantiere — dal singolo pezzo al pallet — apre anche a certificazioni di sicurezza e conformità del prodotto.",
    brandColor: '#B78B20', // GS1 Honey
  },
];
