import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '@/constants/theme';

type Pin = {
  icon: keyof typeof Ionicons.glyphMap;
  left: `${number}%`;
  top: `${number}%`;
};

const pins: Pin[] = [
  { icon: 'construct-outline', left: '22%', top: '24%' },
  { icon: 'shirt-outline', left: '18%', top: '52%' },
  { icon: 'briefcase-outline', left: '48%', top: '66%' },
  { icon: 'leaf-outline', left: '72%', top: '34%' },
  { icon: 'radio-outline', left: '78%', top: '58%' },
];

export function MapBackdrop() {
  return (
    <View style={styles.map}>
      <View style={styles.statusFade} />
      <View style={[styles.park, styles.parkOne]} />
      <View style={[styles.park, styles.parkTwo]} />
      <View style={styles.river} />
      <View style={[styles.road, styles.roadOne]} />
      <View style={[styles.road, styles.roadTwo]} />
      <View style={[styles.road, styles.roadThree]} />

      <View style={styles.currentLocation}>
        <View style={styles.currentLocationDot} />
      </View>

      {pins.map((pin) => (
        <View key={`${pin.icon}-${pin.left}-${pin.top}`} style={[styles.pin, { left: pin.left, top: pin.top }]}>
          <Ionicons color={colors.surface} name={pin.icon} size={18} />
        </View>
      ))}

      <View style={styles.nearbyCard}>
        <View style={styles.nearbyTitleRow}>
          <Ionicons color={colors.primary} name="location" size={14} />
          <Text style={styles.nearbyTitle}>Lähellä sinua</Text>
        </View>
        <Text style={styles.nearbyText}>14 tavaraa</Text>
        <Text style={styles.nearbyText}>2 km säteellä</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    backgroundColor: '#EAF0E7',
    height: '100%',
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  statusFade: {
    backgroundColor: 'rgba(255, 253, 247, 0.82)',
    height: 122,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 2,
  },
  park: {
    backgroundColor: colors.mapGreen,
    borderRadius: 80,
    position: 'absolute',
  },
  parkOne: {
    height: 180,
    left: -42,
    top: 120,
    width: 220,
  },
  parkTwo: {
    height: 170,
    right: -48,
    top: 260,
    width: 220,
  },
  river: {
    backgroundColor: colors.mapBlue,
    height: 88,
    left: -50,
    position: 'absolute',
    top: 235,
    transform: [{ rotate: '-24deg' }],
    width: 520,
  },
  road: {
    backgroundColor: 'rgba(255, 253, 247, 0.9)',
    borderColor: '#D7D8CE',
    borderWidth: 1,
    height: 32,
    left: -60,
    position: 'absolute',
    width: 520,
  },
  roadOne: {
    top: 142,
    transform: [{ rotate: '13deg' }],
  },
  roadTwo: {
    top: 390,
    transform: [{ rotate: '-10deg' }],
  },
  roadThree: {
    top: 508,
    transform: [{ rotate: '24deg' }],
  },
  currentLocation: {
    alignItems: 'center',
    backgroundColor: 'rgba(69, 151, 219, 0.18)',
    borderRadius: 34,
    height: 68,
    justifyContent: 'center',
    left: '47%',
    position: 'absolute',
    top: '42%',
    width: 68,
  },
  currentLocationDot: {
    backgroundColor: '#2786D6',
    borderColor: colors.surface,
    borderRadius: 8,
    borderWidth: 3,
    height: 16,
    width: 16,
  },
  pin: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderColor: colors.surface,
    borderRadius: radii.pill,
    borderWidth: 3,
    height: 40,
    justifyContent: 'center',
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    width: 40,
    zIndex: 3,
  },
  nearbyCard: {
    backgroundColor: 'rgba(255, 253, 247, 0.94)',
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
    position: 'absolute',
    right: spacing.lg,
    top: 252,
    zIndex: 4,
  },
  nearbyTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  nearbyTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  nearbyText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
});
