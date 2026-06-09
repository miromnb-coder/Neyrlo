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
    paddingBottom: 12,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: '#D0C6BA',
    borderRadius: radii.pill,
    height: 5,
    marginBottom: 14,
    width: 44,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  title: {
    color: colors.primary,
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: -0.25,
  },
  liveDot: {
    backgroundColor: colors.primary,
    borderRadius: 5,
    height: 10,
    marginTop: 3,
    width: 10,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginTop: 4,
  },
});
