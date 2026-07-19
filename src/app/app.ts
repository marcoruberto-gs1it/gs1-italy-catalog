import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SearchPaletteComponent } from './components/search-palette/search-palette';
import { JsonLdDrawerComponent } from './components/json-ld-drawer/json-ld-drawer';
import { SECTORS } from './data/sectors';
import { UiStateService } from './services/ui-state.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, SearchPaletteComponent, JsonLdDrawerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('gs1-catalog');
  protected uiState = inject(UiStateService);
  protected sectors = SECTORS;
  protected mobileNavOpen = signal(false);

  toggleMobileNav(): void {
    this.mobileNavOpen.update((v) => !v);
  }

  closeMobileNav(): void {
    this.mobileNavOpen.set(false);
  }
}
