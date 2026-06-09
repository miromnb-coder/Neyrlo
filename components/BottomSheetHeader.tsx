import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '@/constants/theme';

export function BottomSheetHeader() {
  return (
    <View style={styles.container}>
      <View style={styles.handle} />
      <View style={styles.titleRow}>
        <Text style={styles.title}>Lähellä sinua</Text>
        <View style={styles.liveDot} />
      </View>
      <Text numberOfLines={1} style={styles.subtitle}>
        Lainaa, vuokraa, vaihda tai anna. Kaikki läheltä.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.md,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: '#D1C6B9',
    borderRadius: radii.pill,
    height: 5,
    marginBottom: spacing.md,
    width: 44,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  title: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.3,
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
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 3,
  },
});
