import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Sector {
  id: string;
  name: string;
  icon: string;
  description: string;
  brandColor: string;
}

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
sectors: Sector[] = [
    {
      id: 'fmcg',
      name: 'Largo consumo',
      icon: '/icons/cpg.png',
      description: 'Soluzioni per il retail, tracciabilità dei prodotti alimentari e non, efficienza a scaffale e in cassa.',
      brandColor: '#F26334' // GS1 Orange[cite: 2]
    },
    {
      id: 'foodservice',
      name: 'Foodservice',
      icon: '/icons/foodservice.png',
      description: 'Ottimizzazione degli approvvigionamenti e informazioni per la ristorazione e l\'Ho.Re.Ca.',
      brandColor: '#7AC143' // GS1 Grass[cite: 2]
    },
    {
      id: 'healthcare',
      name: 'Sanità',
      icon: '/icons/healthcare.png',
      description: 'Identificazione univoca per farmaci e dispositivi medici, sicurezza del paziente ed e-PIL.',
      brandColor: '#00B6DE' // GS1 Sky[cite: 2]
    },
    {
      id: 'apparel',
      name: 'Abbigliamento',
      icon: '/icons/textiles.png',
      description: 'Gestione taglie, colori, composizione dei tessuti e passaporto digitale del prodotto (DPP).',
      brandColor: '#AF96D4' // GS1 Lavender[cite: 2]
    },
    {
      id: 'fresh-foods',
      name: 'Alimenti freschi',
      icon: '/icons/fresh_foods.png',
      description: 'Gestione del peso variabile, lotti, date di scadenza e tracciabilità della filiera corta.',
      brandColor: '#FBB034' // GS1 Peach[cite: 2]
    },
    {
      id: 'costruzioni',
      name: 'Costruzioni',
      icon: '/icons/construction.png',
      description: 'Tracciabilità dei materiali edili, identificazione dei componenti e gestione del ciclo di vita delle opere.',
      brandColor: '#B78B20' // GS1 Honey[cite: 2]
    }
  ];
}