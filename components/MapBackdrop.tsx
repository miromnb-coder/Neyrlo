import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { MapPin } from '@/components/MapPin';
import { NearbyMapCard } from '@/components/NearbyMapCard';
import { colors } from '@/constants/theme';

type Pin = {
  icon: keyof typeof Ionicons.glyphMap;
  left: `${number}%`;
  top: `${number}%`;
};

const pins: Pin[] = [
  { icon: 'construct-outline', left: '27%', top: '28%' },
  { icon: 'shirt-outline', left: '35%', top: '43%' },
  { icon: 'briefcase-outline', left: '61%', top: '57%' },
  { icon: 'leaf-outline', left: '82%', top: '42%' },
  { icon: 'ticket-outline', left: '22%', top: '57%' },
  { icon: 'restaurant-outline', left: '67%', top: '31%' },
];

export function MapBackdrop() {
  return (
    <View style={styles.map}>
      <View style={styles.statusFade} />
      <View style={[styles.park, styles.parkOne]} />
      <View style={[styles.park, styles.parkTwo]} />
      <View style={[styles.park, styles.parkThree]} />
      <View style={styles.river} />

      <View style={[styles.road, styles.roadOne]} />
      <View style={[styles.road, styles.roadTwo]} />
      <View style={[styles.road, styles.roadThree]} />
      <View style={[styles.road, styles.roadFour]} />
      <View style={[styles.street, styles.streetOne]} />
      <View style={[styles.street, styles.streetTwo]} />
      <View style={[styles.street, styles.streetThree]} />
      <View style={[styles.street, styles.streetFour]} />

      <View style={styles.currentLocation}>
        <View style={styles.currentLocationDot} />
      </View>

      {pins.map((pin) => (
        <MapPin icon={pin.icon} key={`${pin.icon}-${pin.left}-${pin.top}`} left={pin.left} top={pin.top} />
      ))}

      <NearbyMapCard />
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
  statusFade: {
    backgroundColor: 'rgba(255, 253, 247, 0.6)',
    height: 132,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 2,
  },
  park: {
    backgroundColor: 'rgba(220, 236, 220, 0.78)',
    position: 'absolute',
  },
  parkOne: {
    borderRadius: 140,
    height: 270,
    left: -68,
    top: 84,
    width: 300,
  },
  parkTwo: {
    borderRadius: 105,
    height: 205,
    right: -58,
    top: 204,
    width: 245,
  },
  parkThree: {
    borderRadius: 94,
    height: 188,
    left: 206,
    top: 392,
    width: 270,
  },
  river: {
    backgroundColor: 'rgba(201, 224, 235, 0.82)',
    height: 94,
    left: -126,
    position: 'absolute',
    top: 286,
    transform: [{ rotate: '-25deg' }],
    width: 720,
  },
  road: {
    backgroundColor: 'rgba(255, 253, 247, 0.84)',
    borderColor: 'rgba(229, 218, 206, 0.68)',
    borderWidth: 1,
    height: 28,
    left: -108,
    position: 'absolute',
    width: 640,
  },
  roadOne: {
    top: 150,
    transform: [{ rotate: '13deg' }],
  },
  roadTwo: {
    top: 210,
    transform: [{ rotate: '-9deg' }],
  },
  roadThree: {
    top: 474,
    transform: [{ rotate: '-11deg' }],
  },
  roadFour: {
    top: 532,
    transform: [{ rotate: '19deg' }],
  },
  street: {
    backgroundColor: 'rgba(255, 253, 247, 0.56)',
    height: 12,
    left: -96,
    position: 'absolute',
    width: 640,
  },
  streetOne: {
    top: 332,
    transform: [{ rotate: '28deg' }],
  },
  streetTwo: {
    top: 386,
    transform: [{ rotate: '-32deg' }],
  },
  streetThree: {
    top: 448,
    transform: [{ rotate: '8deg' }],
  },
  streetFour: {
    top: 596,
    transform: [{ rotate: '-24deg' }],
  },
  currentLocation: {
    alignItems: 'center',
    backgroundColor: 'rgba(58, 142, 214, 0.14)',
    borderRadius: 37,
    height: 74,
    justifyContent: 'center',
    left: '46%',
    position: 'absolute',
    top: '39%',
    width: 74,
    zIndex: 2,
  },
  currentLocationDot: {
    backgroundColor: '#2C8CDD',
    borderColor: colors.surface,
    borderRadius: 11,
    borderWidth: 4,
    height: 22,
    width: 22,
  },
});