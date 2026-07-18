import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Sector } from './pages/sector/sector';
import { ProductComponent } from './pages/product/product';

export const routes: Routes = [
  { path: '', component: Home },
  // Rotta per il catalogo settori (es. /catalog/fashion)
  { path: 'catalog/:sector', component: Sector },
  
  // Rotte GS1 Digital Link
  // 1. Solo GTIN (es. /01/08001111111114)
  { path: '01/:gtin', component: ProductComponent },
  
  // 2. GTIN + LOTTO (es. /01/08001111111114/10/ABC)
  { path: '01/:gtin/10/:lot', component: ProductComponent },

  // Rotta di fallback
  { path: '**', redirectTo: '' }
];
