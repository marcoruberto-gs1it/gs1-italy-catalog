import { Component, computed, effect, inject, PLATFORM_ID, signal } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SearchPaletteComponent } from './components/search-palette/search-palette';
import { JsonLdDrawerComponent } from './components/json-ld-drawer/json-ld-drawer';
import { SECTORS, localizeSector } from './data/sectors';
import { UiStateService } from './services/ui-state.service';
import { LanguageService } from './services/language.service';
import { I18nService } from './services/i18n.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, SearchPaletteComponent, JsonLdDrawerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('gs1-catalog');
  protected uiState = inject(UiStateService);
  protected languageService = inject(LanguageService);
  protected t = inject(I18nService).t;
  private platformId = inject(PLATFORM_ID);
  private document = inject(DOCUMENT);

  protected sectors = computed(() => SECTORS.map((s) => localizeSector(s, this.languageService.lang())));
  protected mobileNavOpen = signal(false);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      effect(() => {
        this.document.documentElement.lang = this.languageService.lang();
      });
    } else {
      this.document.documentElement.lang = this.languageService.lang();
    }
  }

  toggleMobileNav(): void {
    this.mobileNavOpen.update((v) => !v);
  }

  closeMobileNav(): void {
    this.mobileNavOpen.set(false);
  }
}
