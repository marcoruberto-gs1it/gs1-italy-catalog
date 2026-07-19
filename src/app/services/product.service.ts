import { Injectable } from '@angular/core';
import productsData from '../data/products.json';

// --- Interfacce Modulari ---
export interface Gs1Link {
  linkType: string; // es. gs1:traceability, gs1:recipe
  url: string;
  label: string;
}

export interface Logistics {
  netWeight?: string;
  grossWeight?: string;
  dimensions?: string;
  origin?: string;
  storage?: string;
}

export interface FoodProfile {
  ingredients?: string;
  allergens?: string;
  nutrition?: {
    calories?: string;
    fat?: string;
    carbohydrates?: string;
    sugars?: string;
    protein?: string;
    salt?: string;
  };
}

export interface ApparelProfile {
  material?: string;
  careInstructions?: string;
  color?: string;
  size?: string;
}

export interface Certification {
  agency: string;
  standard?: string;
  value?: string;
  id?: string;
}

export interface Rating {
  value: number; // 0-5
  count: number;
}

export interface EnvironmentalImpact {
  co2e?: string;
  waterConsumption?: string;
  energyConsumption?: string;
  chemicalConsumption?: string;
  recycledContent?: string;
  sustainabilityCertifiedContent?: string;
}

export interface EconomicOperator {
  companyName: string;
  gln: string;
  address: string;
  email?: string;
}

/** Evento di tracciabilità di filiera in stile EPCIS (vedi GS1 Digital Product Passport demo). */
export interface TraceEvent {
  bizStep: string;
  label: string;
  date: string; // ISO 8601
  company: string;
  gln: string;
  location: string;
}

/**
 * Istanza esempio (lotto + numero seriale) usata per mostrare come gli eventi EPCIS di filiera
 * si leghino sempre a un'istanza specifica del prodotto (AI 10 / AI 21), non al solo GTIN.
 * Vedi https://ref.gs1.org/epcis/.
 */
export interface TraceabilityExample {
  lot: string;
  serial: string;
}

export interface PriceInfo {
  amount: number;
  currency: string;
  vatRate: number;
  vatIncluded: boolean;
  listAmount?: number; // prezzo di listino, se in offerta
  discountLabel?: string;
  unit?: string; // es. "kg", "m²" per i prodotti a peso/misura variabile
}

/**
 * Un livello della gerarchia di imballo GDSN (Global Data Synchronisation Network): l'unità
 * base/di vendita e le relative unità logistiche (cartone, pallet...). Ogni livello ha un GTIN
 * proprio e un ruolo diverso nella filiera. Vedi https://www.gs1.org/standards/gdsn.
 */
export interface GdsnTradeItem {
  level: string; // es. "Unità Base", "Cartone", "Pallet"
  gtin: string;
  packagingTypeCode: string; // codice GS1, es. "EA", "CS", "PF"
  packagingTypeLabel: string;
  quantityContained?: number; // quante unità del livello inferiore contiene
  containedLevel?: string;
  netWeight?: string;
  grossWeight?: string;
  dimensions?: string;
  isBaseUnit: boolean;
  isConsumerUnit: boolean;
  isOrderableUnit: boolean;
  isDespatchUnit: boolean;
  isInvoiceUnit: boolean;
  /**
   * Serial Shipping Container Code (AI 00): identifica la singola unità logistica fisica e
   * seriale (un pallet o collo specifico) spedita, distinta dal GTIN che identifica solo la
   * classe di imballo. Presente solo sui livelli che sono unità logistiche (isDespatchUnit).
   * Vedi https://ref.gs1.org/standards/digital-link/uri-syntax/.
   */
  sscc?: string;
}

export interface GdsnInfo {
  targetMarket: string; // codice paese, es. "IT"
  dataPool: string;
  lastModified: string; // ISO 8601
  hierarchy: GdsnTradeItem[];
}

export interface Product {
  gtin: string;
  name: string;
  brand: string;
  image: string;
  images?: string[];
  description: string;
  sectorId: string;
  sectorName: string;
  rating?: Rating;

  // Moduli Opzionali
  links?: Gs1Link[];
  logistics?: Logistics;
  food?: FoodProfile;
  apparel?: ApparelProfile;
  certifications?: Certification[];
  environmentalImpact?: EnvironmentalImpact;
  economicOperator?: EconomicOperator;
  traceability?: TraceEvent[];
  traceabilityExample?: TraceabilityExample;
  price?: PriceInfo;
  gdsn?: GdsnInfo;

  // Il payload JSON-LD nativo per i bot (Google, Resolver GS1, ecc.)
  rawGs1Data?: any;
}

/** Il prodotto espone dati strutturati GS1 Web Vocabulary pronti per bot e AI agent. */
export function isAiReady(product: Product): boolean {
  return !!product.rawGs1Data;
}

/** Il prodotto ha almeno una certificazione/ente terzo che ne convalida i dati. */
export function isVerified(product: Product): boolean {
  return !!product.certifications && product.certifications.length > 0;
}

export type Vocabulary = 'gs1' | 'schema';

/**
 * Rileva quali ontologie sono realmente dichiarate nel @context del JSON-LD del prodotto:
 * GS1 Web Vocabulary, schema.org, entrambe o nessuna (dati non strutturati).
 */
export function getVocabularies(product: Product): Vocabulary[] {
  const context = product.rawGs1Data?.['@context'];
  if (!context) return [];
  const contextString = JSON.stringify(context);
  const vocabs: Vocabulary[] = [];
  if (contextString.includes('ref.gs1.org/voc')) vocabs.push('gs1');
  if (contextString.includes('schema.org')) vocabs.push('schema');
  return vocabs;
}

export function productImages(product: Product): string[] {
  if (product.images && product.images.length) return product.images;
  return product.image ? [product.image] : [];
}

/** Percentuale di sconto rispetto al prezzo di listino, se il prodotto è in offerta. */
export function discountPercent(price: PriceInfo): number | null {
  if (!price.listAmount || price.listAmount <= price.amount) return null;
  return Math.round((1 - price.amount / price.listAmount) * 100);
}

/** Formatta un importo in Euro secondo la convenzione italiana (es. "3,49 €"). */
export function formatEuro(amount: number): string {
  return `${amount.toFixed(2).replace('.', ',')} €`;
}

/**
 * Costruisce un evento EPCIS 2.0 (ObjectEvent) illustrativo a partire da un TraceEvent,
 * sul modello di quanto esposto dal demo GS1 UK Digital Product Passport (dpp.gs1uk.org).
 *
 * L'EPC in epcList fa sempre riferimento a un'istanza specifica del prodotto (GTIN + lotto +
 * numero seriale, AI 10/21), mai al solo GTIN: un evento di tracciabilità descrive un lotto o
 * un articolo serializzato, non l'intera classe di prodotto. Vedi https://ref.gs1.org/epcis/.
 */
export function buildEpcisEvent(product: Product, event: TraceEvent, index: number, instance: TraceabilityExample): object {
  return {
    '@context': 'https://ref.gs1.org/epcis/epcis-context.jsonld',
    eventID: `urn:uuid:demo-${product.gtin}-${index}`,
    type: 'ObjectEvent',
    action: 'OBSERVE',
    bizStep: event.bizStep,
    epcList: [`https://gs1.italy.example/01/${product.gtin}/10/${instance.lot}/21/${instance.serial}`],
    eventTime: event.date,
    eventTimeZoneOffset: '+00:00',
    readPoint: { id: `https://id.gs1.org/414/${event.gln}` },
  };
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private products: Product[] = productsData as Product[];

  constructor() {}

  getProductsBySector(sectorId: string): Product[] {
    return this.products.filter(p => p.sectorId === sectorId);
  }

  getProductByGtin(gtin: string): Product | undefined {
    return this.products.find(p => p.gtin === gtin);
  }

  getAllProducts(): Product[] {
    return this.products;
  }

  /** Ricerca istantanea su nome, marchio e GTIN. */
  search(query: string): Product[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return this.products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.gtin.includes(q) ||
      p.sectorName.toLowerCase().includes(q)
    );
  }
}