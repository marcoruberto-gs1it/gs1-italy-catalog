import { CommonModule } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';
import { IconComponent, IconName } from '../icon/icon';

interface LinkSegment {
  label: string;
  value: string;
  ai: string;
  description: string;
  color: string;
  icon: IconName;
}

@Component({
  selector: 'app-digital-link-visualizer',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './digital-link-visualizer.html',
  styleUrl: './digital-link-visualizer.css',
})
export class DigitalLinkVisualizerComponent {
  link = input.required<string>();
  gtin = input<string | null>(null);
  lot = input<string | null>(null);
  serial = input<string | null>(null);
  expiration = input<string | null>(null);
  sscc = input<string | null>(null);

  copied = signal(false);

  domain = computed(() => {
    try {
      return new URL(this.link()).origin;
    } catch {
      return this.link().split('/01/')[0] || '';
    }
  });

  segments = computed<LinkSegment[]>(() => {
    const segs: LinkSegment[] = [
      {
        label: 'Dominio Resolver',
        value: this.domain(),
        ai: 'host',
        description: 'Il resolver GS1 che instrada la richiesta verso i dati del prodotto.',
        color: 'var(--text-tertiary)',
        icon: 'globe',
      },
    ];

    if (this.sscc()) {
      segs.push({
        label: 'SSCC',
        value: this.sscc()!,
        ai: '(00)',
        description: 'Serial Shipping Container Code: identifica la singola unità logistica fisica e seriale (collo o pallet), distinta dalla classe di imballo.',
        color: 'var(--gs1-forest)',
        icon: 'truck',
      });
    }

    if (this.gtin()) {
      segs.push({
        label: 'GTIN',
        value: this.gtin()!,
        ai: '(01)',
        description: 'Global Trade Item Number: identifica in modo univoco il prodotto a livello mondiale.',
        color: 'var(--accent)',
        icon: 'hash',
      });
    }

    if (this.lot()) {
      segs.push({
        label: 'Lotto',
        value: this.lot()!,
        ai: '(10)',
        description: 'Numero di lotto di produzione, utile per tracciabilità e richiami.',
        color: 'var(--gs1-teal)',
        icon: 'box',
      });
    }

    if (this.serial()) {
      segs.push({
        label: 'Numero Seriale',
        value: this.serial()!,
        ai: '(21)',
        description: "Identifica un singolo articolo serializzato: insieme al GTIN forma l'identificativo univoco dell'istanza.",
        color: 'var(--gs1-purple)',
        icon: 'tag',
      });
    }

    if (this.expiration()) {
      segs.push({
        label: 'Scadenza',
        value: this.expiration()!,
        ai: '(17)',
        description: 'Data di scadenza nel formato AAMMGG, tipica dei prodotti deperibili.',
        color: 'var(--gs1-orange)',
        icon: 'calendar',
      });
    }

    return segs;
  });

  async copyLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.link());
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1800);
    } catch {
      /* clipboard unavailable — ignore */
    }
  }
}
