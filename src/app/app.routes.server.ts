import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'catalog/:sector',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      // Array statico dei settori estratti dal tuo products.json
      return [
        { sector: 'fmcg' },
        { sector: 'apparel' }
      ];
    }
  },
  {
    path: '01/:gtin',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      // Elenco statico dei tuoi GTIN reali: qui puoi aggiungere a mano i nuovi codici
      return [
        { gtin: '08032089000147' }, // Confettura extra di fragole
        { gtin: '09506000164908' }, // The White T-Shirt
        { gtin: '08076809545471' }  // Barilla Pasta Tortiglioni Senza Glutine
      ];
    }
  },
  {
    path: '01/:gtin/10/:lot',
    // Spostiamo questa rotta su Client: evita crash di build legati alla mancanza di parametri
    // e permette al browser di decodificare lotti e scadenze al volo sull'HTML di base
    renderMode: RenderMode.Client
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];