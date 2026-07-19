import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SECTORS, Sector } from '../../data/sectors';
import { ProductService } from '../../services/product.service';
import { UiStateService } from '../../services/ui-state.service';
import { IconComponent } from '../../components/icon/icon';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink, IconComponent],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private productService = inject(ProductService);
  protected uiState = inject(UiStateService);

  sectors: Sector[] = SECTORS;

  productCount = this.productService.getAllProducts().length;
  sectorCount = this.sectors.length;
}
