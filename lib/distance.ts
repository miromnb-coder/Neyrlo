import type { NearbyItem } from '@/types/item';

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export function calculateDistanceKm(from: Coordinates, to: Coordinates) {
  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);

  const haversine =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDelta / 2) * Math.sin(longitudeDelta / 2);

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function addDistancesToItems(items: NearbyItem[], userLocation: Coordinates | null) {
  if (!userLocation) {
    return items;
  }

  return items
    .map((item) => {
      if (!item.latitude || !item.longitude) {
        return item;
      }

      return {
        ...item,
        distanceKm: calculateDistanceKm(userLocation, {
          latitude: item.latitude,
          longitude: item.longitude,
        }),
      };
    })
    .sort((a, b) => {
      const aHasDistance = a.latitude && a.longitude;
      const bHasDistance = b.latitude && b.longitude;

      if (aHasDistance && !bHasDistance) return -1;
      if (!aHasDistance && bHasDistance) return 1;
      return a.distanceKm - b.distanceKm;
    });
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}
