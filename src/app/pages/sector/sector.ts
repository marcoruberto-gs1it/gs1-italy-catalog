import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Product, ProductService, isAiReady, isVerified, getVocabularies, discountPercent, formatEuro } from '../../services/product.service';
import { UiStateService } from '../../services/ui-state.service';
import { SECTORS } from '../../data/sectors';
import { onImageError } from '../../utils/image-fallback';
import { IconComponent } from '../../components/icon/icon';

type FilterMode = 'all' | 'ai-ready' | 'verified';
type SortMode = 'name' | 'gtin';

@Component({
  selector: 'app-sector',
  imports: [CommonModule, RouterLink, IconComponent],
  templateUrl: './sector.html',
  styleUrl: './sector.css',
})
export class Sector {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  protected uiState = inject(UiStateService);

  protected isAiReady = isAiReady;
  protected isVerified = isVerified;
  protected getVocabularies = getVocabularies;
  protected onImageError = onImageError;
  protected discountPercent = discountPercent;
  protected formatEuro = formatEuro;

  private params = toSignal(this.route.paramMap);

  sectorId = computed(() => this.params()?.get('sector') || '');

  sectorInfo = computed(() => SECTORS.find((s) => s.id === this.sectorId()));

  allProducts = computed<Product[]>(() => this.productService.getProductsBySector(this.sectorId()));

  sectorName = computed(() => this.allProducts()[0]?.sectorName ?? this.sectorInfo()?.name ?? 'Settore non trovato');

  filter = signal<FilterMode>('all');
  sort = signal<SortMode>('name');

  filteredProducts = computed<Product[]>(() => {
    let list = this.allProducts();
    const mode = this.filter();
    if (mode === 'ai-ready') list = list.filter(isAiReady);
    if (mode === 'verified') list = list.filter(isVerified);

    const sortMode = this.sort();
    return [...list].sort((a, b) =>
      sortMode === 'name' ? a.name.localeCompare(b.name) : a.gtin.localeCompare(b.gtin)
    );
  });

  aiReadyCount = computed(() => this.allProducts().filter(isAiReady).length);
  verifiedCount = computed(() => this.allProducts().filter(isVerified).length);
  gs1VocabCount = computed(() => this.allProducts().filter((p) => getVocabularies(p).includes('gs1')).length);
  schemaVocabCount = computed(() => this.allProducts().filter((p) => getVocabularies(p).includes('schema')).length);

  setFilter(mode: FilterMode): void {
    this.filter.set(mode);
  }

  setSort(mode: SortMode): void {
    this.sort.set(mode);
  }

  viewJsonLd(product: Product, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.uiState.openJsonLd(product);
  }
}
