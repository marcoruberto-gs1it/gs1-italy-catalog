import { Component, computed, inject, OnInit, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser, DOCUMENT } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DomSanitizer, Meta, SafeHtml, Title } from '@angular/platform-browser';
import { QRCodeComponent } from 'angularx-qrcode';
import { Product, ProductService, TraceEvent, isAiReady, isVerified, productImages, getVocabularies, buildEpcisEvent, discountPercent, formatEuro } from '../../services/product.service';
import { UiStateService } from '../../services/ui-state.service';
import { StarRatingComponent } from '../../components/star-rating/star-rating';
import { DigitalLinkVisualizerComponent } from '../../components/digital-link-visualizer/digital-link-visualizer';
import { DataMatrixComponent } from '../../components/data-matrix/data-matrix';
import { IconComponent, IconName } from '../../components/icon/icon';
import { onImageError } from '../../utils/image-fallback';
import { highlightJson } from '../../utils/json-highlight';
import { downloadBarcodePng, downloadBarcodeSvg } from '../../utils/barcode-download';

type ProductTab = 'details' | 'sustainability' | 'supply-chain' | 'gdsn' | 'structured-data';

// Chiavi = valori reali del code list CBV BizStep (https://ref.gs1.org/cbv/), usati anche
// come stringa "bizStep" negli eventi EPCIS di esempio (vedi buildEpcisEvent).
const BIZ_STEP_ICONS: Record<string, IconName> = {
  commissioning: 'map-pin',
  assembling: 'building',
  shipping: 'truck',
  inspecting: 'check-circle',
  retail_selling: 'flag',
  decommissioning: 'refresh',
  repairing: 'wrench',
};

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [CommonModule, RouterModule, QRCodeComponent, StarRatingComponent, DigitalLinkVisualizerComponent, DataMatrixComponent, IconComponent],
  templateUrl: './product.html',
  styleUrl: './product.css',
})
export class ProductComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  protected uiState = inject(UiStateService);

  private sanitizer = inject(DomSanitizer);
  private metaService = inject(Meta);
  private titleService = inject(Title);

  private platformId = inject(PLATFORM_ID);
  private document = inject(DOCUMENT);

  isBrowser = signal<boolean>(false);
  gtin = signal<string | null>(null);
  lot = signal<string | null>(null);
  serial = signal<string | null>(null);
  expiration = signal<string | null>(null);

  activeTab = signal<ProductTab>('details');
  activeImageIndex = signal(0);
  lightboxOpen = signal(false);
  expandedEvent = signal<number | null>(null);
  showLotSerialExample = signal(false);

  protected isAiReady = isAiReady;
  protected isVerified = isVerified;
  protected onImageError = onImageError;
  protected discountPercent = discountPercent;
  protected formatEuro = formatEuro;
  protected downloadBarcodePng = downloadBarcodePng;
  protected downloadBarcodeSvg = downloadBarcodeSvg;

  // Sanità: i dispositivi medici pubblicano un UDI (Unique Device Identification), il cui
  // Device Identifier (UDI-DI) coincide col GTIN — GS1 è una delle agenzie di emissione
  // accreditate FDA/EU MDR insieme a HIBCC e ICCBBA. Il GS1 DataMatrix è il data carrier
  // raccomandato per etichette di piccole dimensioni tipiche del settore.
  isHealthcare = computed(() => this.product()?.sectorId === 'healthcare');

  showGdsnExample = signal(false);
  showSsccExample = signal(false);

  toggleGdsnExample(): void {
    this.showGdsnExample.update((v) => !v);
  }

  toggleSsccExample(): void {
    this.showSsccExample.update((v) => !v);
  }

  vocabularies = computed(() => {
    const prod = this.product();
    return prod ? getVocabularies(prod) : [];
  });

  product = computed(() => {
    const currentGtin = this.gtin();
    return currentGtin ? this.productService.getProductByGtin(currentGtin) : undefined;
  });

  images = computed<string[]>(() => {
    const prod = this.product();
    return prod ? productImages(prod) : [];
  });

  activeImage = computed(() => this.images()[this.activeImageIndex()] ?? '');

  // Tab availability, derivata dai dati realmente presenti sul prodotto
  hasDetailsTab = computed(() => {
    const prod = this.product();
    return !!(prod?.logistics || prod?.food || prod?.apparel);
  });

  hasSustainabilityTab = computed(() => {
    const prod = this.product();
    return !!(prod?.certifications?.length || this.sustainabilityLinks().length || prod?.environmentalImpact);
  });

  packaging = computed(() => this.product()?.rawGs1Data?.['gs1:packaging'] ?? []);
  countryOfOrigin = computed(() => this.product()?.rawGs1Data?.['gs1:countryOfOrigin'] ?? []);

  sustainabilityLinks = computed(() =>
    (this.product()?.links ?? []).filter((l) => l.linkType.includes('sustainability'))
  );

  supplyChainLinks = computed(() =>
    (this.product()?.links ?? []).filter((l) => l.linkType.includes('trace') || l.linkType.includes('Retailer') || l.linkType.includes('retailer'))
  );

  otherLinks = computed(() => {
    const sustain = new Set(this.sustainabilityLinks());
    const supply = new Set(this.supplyChainLinks());
    return (this.product()?.links ?? []).filter((l) => !sustain.has(l) && !supply.has(l));
  });

  hasSupplyChainData = computed(
    () =>
      this.packaging().length > 0 ||
      this.countryOfOrigin().length > 0 ||
      this.supplyChainLinks().length > 0 ||
      !!this.product()?.logistics?.storage ||
      !!this.product()?.economicOperator ||
      !!this.product()?.traceability?.length
  );

  // Tab GDSN: solo per i prodotti che pubblicano dati in GS1 Web Vocabulary e hanno una
  // gerarchia di imballo (unità base / logistiche) di esempio.
  hasGdsnTab = computed(() => this.vocabularies().includes('gs1') && !!this.product()?.gdsn);

  gdsnJson = computed<SafeHtml>(() => {
    const gdsn = this.product()?.gdsn;
    if (!gdsn) return this.sanitizer.bypassSecurityTrustHtml('');
    const json = JSON.stringify({ 'gdsn:tradeItemHierarchy': gdsn }, null, 2);
    return this.sanitizer.bypassSecurityTrustHtml(highlightJson(json));
  });

  // Unità logistiche (cartone, pallet...) della gerarchia GDSN identificate anche da SSCC:
  // stesso principio "classe vs istanza" del lotto/seriale, applicato alla logistica.
  gdsnLogisticsUnits = computed(() =>
    (this.product()?.gdsn?.hierarchy ?? []).filter((item) => item.isDespatchUnit && item.sscc)
  );

  // Digital Link dell'unità logistica: /00/{sscc}, illustrativo (non instrada verso una pagina
  // prodotto reale, dato che ogni SSCC identifica una singola spedizione, non un catalogo).
  ssccDigitalLink(sscc: string): string {
    const baseHref = this.isBrowser()
      ? this.document.location.origin
      : 'https://tuodominio_produzione.it';
    return `${baseHref}/00/${sscc}`;
  }

  private readonly traceColors = ['var(--gs1-blue)', 'var(--gs1-teal)', 'var(--gs1-orange)', 'var(--gs1-forest)', 'var(--gs1-honey)'];

  traceDotColor(index: number): string {
    return this.traceColors[index % this.traceColors.length];
  }

  bizStepIcon(bizStep: string): IconName {
    return BIZ_STEP_ICONS[bizStep] ?? 'map-pin';
  }

  toggleEvent(index: number): void {
    this.expandedEvent.update((current) => (current === index ? null : index));
  }

  toggleLotSerialExample(): void {
    this.showLotSerialExample.update((v) => !v);
  }

  // Digital Link esteso con lotto (AI 10) e numero seriale (AI 21): identifica un'istanza
  // specifica del prodotto, a cui sono legati gli eventi EPCIS di filiera.
  exampleDigitalLink = computed<string>(() => {
    const ex = this.product()?.traceabilityExample;
    const base = this.gs1DigitalLink();
    return ex ? `${base}/10/${ex.lot}/21/${ex.serial}` : base;
  });

  epcisJson(event: TraceEvent, index: number): SafeHtml {
    const prod = this.product();
    const instance = prod?.traceabilityExample;
    if (!prod || !instance) return this.sanitizer.bypassSecurityTrustHtml('');
    const json = JSON.stringify(buildEpcisEvent(prod, event, index, instance), null, 2);
    return this.sanitizer.bypassSecurityTrustHtml(highlightJson(json));
  }

  // Cattura l'indirizzo web corrente dinamicamente senza rompere l'architettura SSG
  gs1DigitalLink = computed<string>(() => {
    const currentGtin = this.gtin();
    if (!currentGtin) return '';

    const baseHref = this.isBrowser()
      ? this.document.location.origin
      : 'https://tuodominio_produzione.it';

    return `${baseHref}/01/${currentGtin}`;
  });

  // Digital Link della pagina effettivamente visitata: riflette lotto/seriale/scadenza se
  // presenti nell'URL corrente (es. da scansione QR), altrimenti coincide col GTIN "nudo".
  currentDigitalLink = computed<string>(() => {
    let url = this.gs1DigitalLink();
    if (!url) return url;
    if (this.lot()) url += `/10/${this.lot()}`;
    if (this.serial()) url += `/21/${this.serial()}`;
    if (this.expiration()) url += `?17=${this.expiration()}`;
    return url;
  });

  // Generazione del JSON-LD iniettato conforme al GS1 Web Vocabulary
  jsonLdHtml = computed<SafeHtml | null>(() => {
    const prod = this.product();
    if (!prod) return null;

    // Se l'oggetto rawGs1Data esiste già strutturato nel DB lo usiamo (clonato, per non mutare
    // l'originale condiviso), altrimenti lo creiamo da zero
    let jsonLdData: any = prod.rawGs1Data ? JSON.parse(JSON.stringify(prod.rawGs1Data)) : {
      "@context": {
        "gs1": "https://ref.gs1.org/voc/",
        "xsd": "http://www.w3.org/2001/XMLSchema#",
        "@vocab": "https://ref.gs1.org/voc/"
      },
      "@type": "gs1:Offer",
      "itemOffered": {
        "@type": "gs1:FoodBeverageTobaccoProduct",
        "gtin": this.gtin(),
        "productName": [
          { "@value": prod.name, "@language": "it" }
        ],
        "brand": {
          "@type": "gs1:Brand",
          "brandName": [
            { "@value": prod.brand, "@language": "it" }
          ]
        }
      }
    };

    // Le iniezioni seguenti riguardano solo il payload nello "shape" GS1 (gs1:Offer > itemOffered).
    // I prodotti demo che pubblicano solo schema.org (o un mix) hanno una struttura diversa e
    // vengono pubblicati così come sono, senza queste arricchimenti specifici GS1.
    if (jsonLdData.itemOffered) {
      // Iniezione rigorosa dell'immagine strutturata (Standard GS1)
      if (prod.image) {
        jsonLdData.itemOffered.image = {
          "@type": "gs1:ReferencedFileDetails",
          "filePixelWidth": {
            "@value": "300",
            "@type": "xsd:integer"
          },
          "filePixelHeight": {
            "@value": "300",
            "@type": "xsd:integer"
          },
          "referencedFileURL": {
            "@id": prod.image
          }
        };
      }

      // Iniezione dinamica dei dati variabili (Lotto e Scadenza)
      if (!jsonLdData.itemOffered.additionalProperty) {
        jsonLdData.itemOffered.additionalProperty = [];
      }

      if (this.lot()) {
        jsonLdData.itemOffered.additionalProperty.push({
          "@type": "gs1:PropertyValue",
          "gs1:propertyName": "Lotto",
          "gs1:propertyValue": this.lot()
        });
      }

      if (this.expiration()) {
        jsonLdData.itemOffered.additionalProperty.push({
          "@type": "gs1:PropertyValue",
          "gs1:propertyName": "Scadenza",
          "gs1:propertyValue": this.expiration()
        });
      }
    }

    const jsonString = JSON.stringify(jsonLdData);
    const scriptHtml = `<script type="application/ld+json">\n${jsonString}\n</script>`;
    return this.sanitizer.bypassSecurityTrustHtml(scriptHtml);
  });

  ngOnInit(): void {
    // Risoluzione della piattaforma prima dell'esecuzione dei computed
    this.isBrowser.set(isPlatformBrowser(this.platformId));

    this.gtin.set(this.route.snapshot.paramMap.get('gtin'));
    this.lot.set(this.route.snapshot.paramMap.get('lot'));
    this.serial.set(this.route.snapshot.paramMap.get('serial'));
    this.expiration.set(this.route.snapshot.queryParamMap.get('17'));

    if (!this.hasDetailsTab()) {
      this.activeTab.set('structured-data');
    }

    const prod = this.product();
    if (prod) {
      this.titleService.setTitle(`${prod.name} | Digital Link`);
      this.metaService.updateTag({ name: 'description', content: prod.description });
      this.metaService.updateTag({ property: 'og:title', content: prod.name });
      this.metaService.updateTag({ property: 'og:image', content: prod.image });
    }
  }

  setTab(tab: ProductTab): void {
    this.activeTab.set(tab);
  }

  selectImage(index: number): void {
    this.activeImageIndex.set(index);
  }

  openLightbox(): void {
    this.lightboxOpen.set(true);
  }

  closeLightbox(): void {
    this.lightboxOpen.set(false);
  }

  openJsonLdDrawer(): void {
    const prod = this.product();
    if (prod) this.uiState.openJsonLd(prod);
  }

  async copyDigitalLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.currentDigitalLink());
    } catch {
      /* clipboard unavailable — ignore */
    }
  }
}
