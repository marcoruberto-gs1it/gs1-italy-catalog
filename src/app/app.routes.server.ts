import { RenderMode, ServerRoute } from '@angular/ssr';
import productsData from './data/products.json';

const products = productsData as { gtin: string; sectorId: string }[];
const sectorIds = [...new Set(products.map((p) => p.sectorId))];

export const serverRoutes: ServerRoute[] = [
  {
    path: 'catalog/:sector',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return sectorIds.map((sector) => ({ sector }));
    }
  },
  {
    path: '01/:gtin',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return products.map((p) => ({ gtin: p.gtin }));
    }
  },
  {
    // Qualsiasi combinazione di lotto (AI 10) e/o seriale (AI 21) dopo il GTIN — riconosciuta
    // lato client dallo stesso gs1-digital-link.matcher.ts usato in app.routes.ts. Spostata su
    // Client: sono identificativi di istanza (potenzialmente infiniti) e non ha senso prerenderli,
    // oltre a evitare crash di build per parametri non enumerabili staticamente.
    path: '01/:gtin/10/:lot',
    renderMode: RenderMode.Client
  },
  {
    path: '01/:gtin/21/:serial',
    renderMode: RenderMode.Client
  },
  {
    path: '01/:gtin/10/:lot/21/:serial',
    renderMode: RenderMode.Client
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
