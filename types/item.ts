export type ExchangeMode = 'borrow' | 'rent' | 'swap' | 'free';

export type NearbyItem = {
  id: string;
  title: string;
  ownerName: string;
  rating: number;
  distanceKm: number;
  availability: 'Vapaa tänään' | 'Vapaa huomenna' | 'Varattavissa viikonloppuna';
  mode: ExchangeMode;
  priceLabel: string;
  emoji: string;
  accentColor: string;
};
