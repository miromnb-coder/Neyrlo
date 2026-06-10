import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { Circle, Marker, PROVIDER_GOOGLE, type MapStyleElement, type Region } from 'react-native-maps';

import { MapPin } from '@/components/MapPin';
import { categoryIcon } from '@/lib/listings';
import { colors } from '@/constants/theme';
import type { Coordinates } from '@/lib/distance';
import type { NearbyItem } from '@/types/item';

type MapBackdropProps = {
  items?: NearbyItem[];
  userLocation?: Coordinates | null;
};

type Pin = {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  icon: keyof typeof Ionicons.glyphMap;
  id: string;
};

const fallbackMapCenter = {
  latitude: 60.1699,
  longitude: 24.9384,
};

const mapProvider = Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined;

const mapStyle: MapStyleElement[] = [
  { elementType: 'geometry', stylers: [{ color: '#F3F0E8' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', stylers: [{ visibility: 'off' }] },
  { featureType: 'landscape.man_made', elementType: 'geometry', stylers: [{ color: '#F5F1E9' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#EEF2E9' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#DDEBD8' }, { visibility: 'on' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#FFFDF7' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#E9E0D5' }, { weight: 0.45 }] },
  { featureType: 'road', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#F8F3EA' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#FFFDF7' }] },
  { featureType: 'road.local', elementType: 'geometry', stylers: [{ color: '#FCF8F0' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#CFE3EC' }] },
];

export function MapBackdrop({ items = [], userLocation = null }: MapBackdropProps) {
  const mapRef = useRef<MapView | null>(null);
  const mapCenter = userLocation ?? fallbackMapCenter;

  const region = useMemo<Region>(() => ({
    latitude: mapCenter.latitude,
    latitudeDelta: 0.014,
    longitude: mapCenter.longitude,
    longitudeDelta: 0.014,
  }), [mapCenter.latitude, mapCenter.longitude]);

  useEffect(() => {
    if (!userLocation) {
      return;
    }

    mapRef.current?.animateToRegion(region, 650);
  }, [region, userLocation]);

  const itemPins: Pin[] = items
    .filter((item) => item.latitude && item.longitude)
    .map((item) => ({
      coordinate: {
        latitude: item.latitude as number,
        longitude: item.longitude as number,
      },
      icon: categoryIcon(item.categoryId) as keyof typeof Ionicons.glyphMap,
      id: item.id,
    }));

  return (
    <View style={styles.map}>
      <MapView
        customMapStyle={mapStyle}
        initialRegion={region}
        mapType={Platform.OS === 'ios' ? 'mutedStandard' : 'standard'}
        pitchEnabled={false}
        provider={mapProvider}
        ref={mapRef}
        rotateEnabled={false}
        scrollEnabled
        showsBuildings={false}
        showsCompass={false}
        showsIndoors={false}
        showsMyLocationButton={false}
        showsPointsOfInterest={false}
        showsScale={false}
        showsTraffic={false}
        style={StyleSheet.absoluteFill}
        toolbarEnabled={false}
        zoomEnabled
      >
        <Circle
          center={mapCenter}
          fillColor="rgba(58, 142, 214, 0.1)"
          radius={230}
          strokeColor="rgba(58, 142, 214, 0.05)"
          strokeWidth={1}
        />
        <Marker anchor={{ x: 0.5, y: 0.5 }} coordinate={mapCenter} tracksViewChanges={false} zIndex={2}>
          <View style={styles.currentLocationDot} />
        </Marker>
        {itemPins.map((pin) => (
          <Marker
            anchor={{ x: 0.5, y: 0.92 }}
            coordinate={pin.coordinate}
            key={pin.id}
            tracksViewChanges={false}
            zIndex={3}
          >
            <MapPin icon={pin.icon} />
          </Marker>
        ))}
      </MapView>
      <View pointerEvents="none" style={styles.singleMapWash} />
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    backgroundColor: colors.mapBase,
    height: '100%',
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  singleMapWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 253, 247, 0.32)',
    zIndex: 1,
  },
  currentLocationDot: {
    backgroundColor: '#2C8CDD',
    borderColor: colors.surface,
    borderRadius: 11,
    borderWidth: 4,
    height: 22,
    shadowColor: '#2C8CDD',
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 13,
    width: 22,
  },
});
