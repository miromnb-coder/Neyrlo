import { StyleSheet, Text, View } from 'react-native';

import { colors, radii } from '@/constants/theme';

export function BottomSheetHeader() {
  return (
    <View style={styles.container}>
      <View style={styles.handle} />
      <View style={styles.titleRow}>
        <Text allowFontScaling={false} style={styles.title}>Lähellä sinua</Text>
        <View style={styles.liveDot} />
      </View>
      <Text allowFontScaling={false} numberOfLines={1} style={styles.subtitle}>
        Lainaa, vuokraa, vaihda tai anna. Kaikki läheltä.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 9,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: '#CEC4B8',
    borderRadius: radii.pill,
    height: 4,
    marginBottom: 12,
    width: 40,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  title: {
    color: colors.primary,
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  liveDot: {
    backgroundColor: colors.primary,
    borderRadius: 4,
    height: 8,
    marginTop: 2,
    opacity: 0.9,
    width: 8,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    marginTop: 3,
  },
});