import { Component, computed, inject, OnInit, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser, DOCUMENT } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DomSanitizer, Meta, SafeHtml, Title } from '@angular/platform-browser';
import { QRCodeComponent } from 'angularx-qrcode';
import { Product, ProductService } from '../../services/product.service';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [CommonModule, RouterModule, QRCodeComponent],
  templateUrl: './product.html',
  styleUrl: './product.css',
})
export class ProductComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  
  private sanitizer = inject(DomSanitizer);
  private metaService = inject(Meta);
  private titleService = inject(Title);
  
  private platformId = inject(PLATFORM_ID);
  private document = inject(DOCUMENT);
  
  isBrowser = signal<boolean>(false);
  gtin = signal<string | null>(null);
  lot = signal<string | null>(null);
  expiration = signal<string | null>(null);

  product = computed(() => {
    const currentGtin = this.gtin();
    return currentGtin ? this.productService.getProductByGtin(currentGtin) : undefined;
  });

  // Cattura l'indirizzo web corrente dinamicamente senza rompere l'architettura SSG
  gs1DigitalLink = computed<string>(() => {
    const currentGtin = this.gtin();
    if (!currentGtin) return '';

    const baseHref = this.isBrowser() 
      ? this.document.location.origin 
      : 'https://tuodominio_produzione.it'; 

    return `${baseHref}/01/${currentGtin}`;
  });

  // Generazione del JSON-LD iniettato conforme al GS1 Web Vocabulary
  jsonLdHtml = computed<SafeHtml | null>(() => {
    const prod = this.product();
    if (!prod) return null;

    // Se l'oggetto rawGs1Data esiste già strutturato nel DB lo usiamo, altrimenti lo creiamo da zero
    let jsonLdData: any = prod.rawGs1Data ? { ...prod.rawGs1Data } : {
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

    const jsonString = JSON.stringify(jsonLdData);
    const scriptHtml = `<script type="application/ld+json">\n${jsonString}\n</script>`;
    return this.sanitizer.bypassSecurityTrustHtml(scriptHtml);
  });

  ngOnInit(): void {
    // Risoluzione della piattaforma prima dell'esecuzione dei computed
    this.isBrowser.set(isPlatformBrowser(this.platformId));

    this.gtin.set(this.route.snapshot.paramMap.get('gtin'));
    this.lot.set(this.route.snapshot.paramMap.get('lot'));
    this.expiration.set(this.route.snapshot.queryParamMap.get('17'));

    const prod = this.product();
    if (prod) {
      this.titleService.setTitle(`${prod.name} | Digital Link`);
      this.metaService.updateTag({ name: 'description', content: prod.description });
      this.metaService.updateTag({ property: 'og:title', content: prod.name });
      this.metaService.updateTag({ property: 'og:image', content: prod.image });
    }
  }
}