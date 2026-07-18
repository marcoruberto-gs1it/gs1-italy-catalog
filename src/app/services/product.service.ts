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

export interface Product {
  gtin: string;
  name: string;
  brand: string;
  image: string;
  description: string;
  sectorId: string;
  sectorName: string;
  
  // Moduli Opzionali
  links?: Gs1Link[];
  logistics?: Logistics;
  food?: FoodProfile;
  apparel?: ApparelProfile;
  certifications?: Certification[];
  
  // Il payload JSON-LD nativo per i bot (Google, Resolver GS1, ecc.)
  rawGs1Data?: any;
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
}