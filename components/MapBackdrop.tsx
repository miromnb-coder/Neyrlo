import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { Circle, Marker, PROVIDER_GOOGLE, type MapStyleElement } from 'react-native-maps';

import { MapPin } from '@/components/MapPin';
import { colors } from '@/constants/theme';

type Pin = {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  icon: keyof typeof Ionicons.glyphMap;
  id: string;
};

const mapCenter = {
  latitude: 60.1699,
  longitude: 24.9384,
};

const mapProvider = Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined;

const pins: Pin[] = [
  { id: 'drill', icon: 'construct-outline', coordinate: { latitude: 60.1726, longitude: 24.9286 } },
  { id: 'chairs', icon: 'shirt-outline', coordinate: { latitude: 60.1683, longitude: 24.9317 } },
  { id: 'suitcase', icon: 'briefcase-outline', coordinate: { latitude: 60.1664, longitude: 24.9448 } },
  { id: 'plant', icon: 'leaf-outline', coordinate: { latitude: 60.1692, longitude: 24.9537 } },
  { id: 'ticket', icon: 'ticket-outline', coordinate: { latitude: 60.1652, longitude: 24.9274 } },
  { id: 'restaurant', icon: 'restaurant-outline', coordinate: { latitude: 60.1714, longitude: 24.9475 } },
];

const mapStyle: MapStyleElement[] = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#F2EFE8' }],
  },
  {
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9A988F' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#F8F5EE' }],
  },
  {
    featureType: 'administrative',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#E3DDD1' }],
  },
  {
    featureType: 'landscape.man_made',
    elementType: 'geometry',
    stylers: [{ color: '#F4F0E8' }],
  },
  {
    featureType: 'landscape.natural',
    elementType: 'geometry',
    stylers: [{ color: '#EEF1E7' }],
  },
  {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [{ color: '#E4EEDC' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#DDEBD8' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#FFFDF7' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#E5DDD2' }],
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry',
    stylers: [{ color: '#FFFDF7' }],
  },
  {
    featureType: 'road.local',
    elementType: 'geometry',
    stylers: [{ color: '#FBF8F1' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#E7E1D6' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#C9DEE9' }],
  },
];

export function MapBackdrop() {
  return (
    <View style={styles.map}>
      <MapView
        customMapStyle={mapStyle}
        initialRegion={{
          ...mapCenter,
          latitudeDelta: 0.014,
          longitudeDelta: 0.014,
        }}
        pitchEnabled={false}
        provider={mapProvider}
        rotateEnabled={false}
        scrollEnabled={false}
        showsBuildings={false}
        showsCompass={false}
        showsIndoors={false}
        showsMyLocationButton={false}
        showsPointsOfInterest={false}
        style={StyleSheet.absoluteFill}
        toolbarEnabled={false}
        zoomEnabled={false}
      >
        <Circle
          center={mapCenter}
          fillColor="rgba(58, 142, 214, 0.14)"
          radius={260}
          strokeColor="rgba(58, 142, 214, 0.08)"
          strokeWidth={1}
        />
        <Marker anchor={{ x: 0.5, y: 0.5 }} coordinate={mapCenter} tracksViewChanges={false} zIndex={2}>
          <View style={styles.currentLocationDot} />
        </Marker>
        {pins.map((pin) => (
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
      <View pointerEvents="none" style={styles.mapWash} />
      <View pointerEvents="none" style={styles.statusFade} />
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
  mapWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 253, 247, 0.16)',
    zIndex: 1,
  },
  statusFade: {
    backgroundColor: 'rgba(255, 253, 247, 0.56)',
    height: 132,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 2,
  },
  currentLocationDot: {
    backgroundColor: '#2C8CDD',
    borderColor: colors.surface,
    borderRadius: 11,
    borderWidth: 4,
    height: 22,
    shadowColor: '#2C8CDD',
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    width: 22,
  },
});