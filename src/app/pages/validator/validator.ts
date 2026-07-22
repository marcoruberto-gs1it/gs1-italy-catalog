import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { I18nService } from '../../services/i18n.service';
import { SiteOriginService } from '../../services/site-origin.service';

interface AiEntry {
  ai: string;
  label: string;
  value: string;
}

const EXAMPLE_PATH_SIMPLE = '/01/08032089000024';
const EXAMPLE_PATH_INSTANCE = '/01/08032089000024/10/LOT231102/21/545519';

/**
 * Analizza un GS1 Digital Link (o una stringa AI tra parentesi) usando il vero GS1 Barcode
 * Syntax Engine di GS1 (https://github.com/gs1/gs1-syntax-engine), compilato in WASM e
 * pubblicato come pacchetto npm "gs1encoder" dallo stesso maintainer del progetto GS1. Non è
 * una reimplementazione: è la stessa libreria C usata dagli strumenti ufficiali GS1.
 */
@Component({
  selector: 'app-validator',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './validator.html',
  styleUrl: './validator.css',
})
export class ValidatorComponent implements OnInit {
  private platformId = inject(PLATFORM_ID);
  private titleService = inject(Title);
  private siteOrigin = inject(SiteOriginService);
  protected t = inject(I18nService).t;

  // validator.schema.org scarica davvero la pagina che gli si passa: gli esempi devono quindi
  // puntare a un URL realmente raggiungibile sul dominio corrente (vedi SiteOriginService),
  // non a un dominio fittizio o hardcodato.
  protected readonly exampleSimple = this.siteOrigin.value + EXAMPLE_PATH_SIMPLE;
  protected readonly exampleInstance = this.siteOrigin.value + EXAMPLE_PATH_INSTANCE;

  isBrowser = signal(false);
  input = signal('');
  loading = signal(false);
  analyzed = signal(false);
  error = signal<string | null>(null);
  errorDetail = signal<string | null>(null);
  aiEntries = signal<AiEntry[]>([]);
  canonicalUri = signal<string | null>(null);
  testableUri = signal<string | null>(null);
  ignoredParams = signal<string[]>([]);
  engineVersion = signal<string | null>(null);
  copied = signal(false);

  hasResult = computed(() => this.aiEntries().length > 0);

  schemaOrgUrl = computed(() => {
    // Se l'input è già un URL lo testiamo così com'è (è quello che l'utente vuole verificare
    // davvero); solo se ha incollato una stringa AI tra parentesi usiamo l'URI ricostruito su
    // QUESTO dominio (testableUri), l'unico che validator.schema.org può davvero scaricare —
    // il resolver ufficiale id.gs1.org non conosce i GTIN fittizi di questa demo.
    const raw = this.input().trim();
    const url = /^https?:\/\//i.test(raw) ? raw : (this.testableUri() ?? this.canonicalUri() ?? raw);
    return `https://validator.schema.org/#url=${encodeURIComponent(url)}`;
  });

  ngOnInit(): void {
    this.isBrowser.set(isPlatformBrowser(this.platformId));
    if (this.isBrowser()) {
      this.input.set(this.exampleInstance);
    }
    this.titleService.setTitle(this.t('validator.pageTitle'));
  }

  setInput(value: string): void {
    this.input.set(value);
  }

  loadExample(value: string): void {
    this.input.set(value);
    void this.analyze();
  }

  async analyze(): Promise<void> {
    const value = this.input().trim();
    this.error.set(null);
    this.errorDetail.set(null);
    this.aiEntries.set([]);
    this.canonicalUri.set(null);
    this.testableUri.set(null);
    this.ignoredParams.set([]);
    this.analyzed.set(true);
    if (!value) return;

    this.loading.set(true);
    try {
      const { GS1encoder } = await import('gs1encoder');
      const gs = await GS1encoder.create();
      try {
        this.engineVersion.set(gs.version);
        gs.includeDataTitlesInHRI = true;
        gs.dataStr = value;

        this.aiEntries.set(gs.hri.map(parseHriLine));

        try {
          this.canonicalUri.set(gs.getDLuri(null));
        } catch {
          this.canonicalUri.set(null);
        }

        // Deriviamo l'URL testabile sostituendo solo l'host nell'URI canonico già calcolato,
        // invece di richiamare di nuovo gs.getDLuri() sulla stessa istanza WASM con uno stem
        // diverso: quella seconda chiamata destabilizza il motore (nessun'eccezione JS
        // catturabile, ma le chiamate successive smettono di produrre risultati).
        const canonical = this.canonicalUri();
        this.testableUri.set(canonical ? canonical.replace(/^https?:\/\/[^/]+/, this.siteOrigin.value) : null);

        this.ignoredParams.set(gs.dlIgnoredQueryParams);
      } finally {
        gs.free();
      }
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : this.t('validator.unknownError'));
    } finally {
      this.loading.set(false);
    }
  }

  openSchemaValidator(): void {
    if (!this.isBrowser()) return;
    window.open(this.schemaOrgUrl(), '_blank', 'noopener');
  }

  async copyCanonicalUri(): Promise<void> {
    const uri = this.canonicalUri();
    if (!uri) return;
    try {
      await navigator.clipboard.writeText(uri);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1800);
    } catch {
      /* clipboard unavailable — ignore */
    }
  }
}

function parseHriLine(line: string): AiEntry {
  const match = line.match(/^(.*?)\s*\((\d+)\)\s*(.*)$/);
  if (match) {
    return { label: match[1], ai: match[2], value: match[3] };
  }
  return { label: '', ai: '', value: line };
}
