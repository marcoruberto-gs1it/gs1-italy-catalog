import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Product, ProductService } from '../../services/product.service';

@Component({
  selector: 'app-sector',
  imports: [CommonModule, RouterLink],
  templateUrl: './sector.html',
  styleUrl: './sector.css',
})
export class Sector implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService); // Iniettiamo il nostro nuovo servizio!
  
  sectorId: string = '';
  sectorName: string = 'Catalogo Prodotti';
  filteredProducts: Product[] = [];

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.sectorId = params.get('sector') || '';
      
      // Chiediamo i dati al JSON tramite il servizio
      this.filteredProducts = this.productService.getProductsBySector(this.sectorId);
      
      // Estraiamo il primo prodotto e lo controlliamo
      const firstProduct = this.filteredProducts[0];
      
      if (firstProduct) {
        this.sectorName = firstProduct.sectorName;
      } else {
        this.sectorName = 'Settore non trovato';
      }
    });
  }
}