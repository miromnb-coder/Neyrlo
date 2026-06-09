import type { NearbyItem } from '@/types/item';

export const nearbyItems: NearbyItem[] = [
  {
    id: 'drill-1',
    title: 'Akkuporakone',
    ownerName: 'Laura',
    rating: 4.9,
    distanceKm: 0.3,
    availability: 'Vapaa tänään',
    mode: 'borrow',
    priceLabel: 'Lainaa',
    emoji: '🔩',
    accentColor: '#DDEBDD',
  },
  {
    id: 'chairs-1',
    title: 'Retkituolit 2 kpl',
    ownerName: 'Mikko',
    rating: 4.8,
    distanceKm: 0.5,
    availability: 'Vapaa tänään',
    mode: 'rent',
    priceLabel: 'Vuokraa',
    emoji: '🪑',
    accentColor: '#E7F0DC',
  },
  {
    id: 'suitcase-1',
    title: 'Matkalaukku',
    ownerName: 'Sanna',
    rating: 4.9,
    distanceKm: 0.7,
    availability: 'Vapaa huomenna',
    mode: 'rent',
    priceLabel: 'Vuokraa',
    emoji: '🧳',
    accentColor: '#EAF1F3',
  },
  {
    id: 'speaker-1',
    title: 'Bluetooth-kaiutin',
    ownerName: 'Jari',
    rating: 4.8,
    distanceKm: 0.6,
    availability: 'Vapaa tänään',
    mode: 'swap',
    priceLabel: 'Vaihda',
    emoji: '🔊',
    accentColor: '#E7E3F3',
  },
];

export const filters = ['Kaikki', 'Lainaa', 'Vuokraa', 'Vaihda', 'Ilmainen'] as const;
