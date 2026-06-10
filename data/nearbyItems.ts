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
    imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=320&h=240&fit=crop&auto=format',
    accentColor: '#EEF4EC',
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
    imageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=320&h=240&fit=crop&auto=format',
    accentColor: '#EEF5EA',
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
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=320&h=240&fit=crop&auto=format',
    accentColor: '#EEF4F5',
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
    imageUrl: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=320&h=240&fit=crop&auto=format',
    accentColor: '#F0F2EA',
  },
];

export const filters = ['Kaikki', 'Laina', 'Vuokra', 'Vaihda', 'Jaa', 'Kestävä'] as const;
