export interface Sector {
  id: string;
  name: string;
  icon: string;
  description: string;
  brandColor: string;
}

export const SECTORS: Sector[] = [
  {
    id: 'fmcg',
    name: 'Largo consumo',
    icon: '/icons/cpg.png',
    description: 'Standard GS1 per il largo consumo: dati di prodotto affidabili e coerenti lungo tutta la filiera, dal produttore al punto vendita.',
    brandColor: '#F26334', // GS1 Orange
  },
  {
    id: 'foodservice',
    name: 'Foodservice',
    icon: '/icons/foodservice.png',
    description: 'Standard GS1 per la ristorazione e il fuori casa, per una filiera degli approvvigionamenti più semplice e trasparente.',
    brandColor: '#7AC143', // GS1 Grass
  },
  {
    id: 'healthcare',
    name: 'Sanità',
    icon: '/icons/healthcare.png',
    description: 'Standard GS1 per la sanità, a supporto della sicurezza del paziente e di una filiera tracciabile.',
    brandColor: '#00B6DE', // GS1 Sky
  },
  {
    id: 'apparel',
    name: 'Abbigliamento',
    icon: '/icons/textiles.png',
    description: 'Standard GS1 per moda e tessile, per raccontare in modo trasparente la storia e la composizione di ogni prodotto.',
    brandColor: '#AF96D4', // GS1 Lavender
  },
  {
    id: 'fresh-foods',
    name: 'Alimenti freschi',
    icon: '/icons/fresh_foods.png',
    description: 'Standard GS1 per gli alimenti freschi, per garantire qualità e tracciabilità lungo tutta la filiera.',
    brandColor: '#FBB034', // GS1 Peach
  },
  {
    id: 'costruzioni',
    name: 'Costruzioni',
    icon: '/icons/construction.png',
    description: "Standard GS1 per l'edilizia, per una filiera dei materiali da costruzione più tracciabile e trasparente.",
    brandColor: '#B78B20', // GS1 Honey
  },
];
