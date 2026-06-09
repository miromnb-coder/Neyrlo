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
  { icon: 'construct-outline', left: '24%', top: '26%' },
  { icon: 'shirt-outline', left: '33%', top: '43%' },
  { icon: 'briefcase-outline', left: '61%', top: '58%' },
  { icon: 'leaf-outline', left: '81%', top: '42%' },
  { icon: 'ticket-outline', left: '22%', top: '58%' },
  { icon: 'restaurant-outline', left: '66%', top: '31%' },
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
    backgroundColor: 'rgba(255, 253, 247, 0.68)',
    height: 118,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 2,
  },
  park: {
    backgroundColor: colors.mapGreen,
    position: 'absolute',
  },
  parkOne: {
    borderRadius: 130,
    height: 250,
    left: -55,
    top: 92,
    width: 280,
  },
  parkTwo: {
    borderRadius: 95,
    height: 190,
    right: -46,
    top: 215,
    width: 230,
  },
  parkThree: {
    borderRadius: 90,
    height: 180,
    left: 205,
    top: 405,
    width: 260,
  },
  river: {
    backgroundColor: colors.mapBlue,
    height: 104,
    left: -120,
    position: 'absolute',
    top: 285,
    transform: [{ rotate: '-25deg' }],
    width: 720,
  },
  road: {
    backgroundColor: 'rgba(255, 253, 247, 0.88)',
    borderColor: 'rgba(229, 218, 206, 0.8)',
    borderWidth: 1,
    height: 34,
    left: -100,
    position: 'absolute',
    width: 620,
  },
  roadOne: {
    top: 152,
    transform: [{ rotate: '13deg' }],
  },
  roadTwo: {
    top: 214,
    transform: [{ rotate: '-9deg' }],
  },
  roadThree: {
    top: 480,
    transform: [{ rotate: '-11deg' }],
  },
  roadFour: {
    top: 540,
    transform: [{ rotate: '19deg' }],
  },
  street: {
    backgroundColor: 'rgba(255, 253, 247, 0.72)',
    height: 16,
    left: -90,
    position: 'absolute',
    width: 620,
  },
  streetOne: {
    top: 340,
    transform: [{ rotate: '28deg' }],
  },
  streetTwo: {
    top: 392,
    transform: [{ rotate: '-32deg' }],
  },
  streetThree: {
    top: 455,
    transform: [{ rotate: '8deg' }],
  },
  streetFour: {
    top: 602,
    transform: [{ rotate: '-24deg' }],
  },
  currentLocation: {
    alignItems: 'center',
    backgroundColor: 'rgba(58, 142, 214, 0.17)',
    borderRadius: 40,
    height: 80,
    justifyContent: 'center',
    left: '46%',
    position: 'absolute',
    top: '39%',
    width: 80,
    zIndex: 2,
  },
  currentLocationDot: {
    backgroundColor: '#2C8CDD',
    borderColor: colors.surface,
    borderRadius: 12,
    borderWidth: 4,
    height: 24,
    width: 24,
  },
});
