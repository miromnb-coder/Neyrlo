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
      <Text style={styles.subtitle}>Lainaa, vuokraa, vaihda tai anna. Kaikki läheltä.</Text>
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
    height: 6,
    marginBottom: spacing.xl,
    width: 46,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  title: {
    color: colors.primary,
    fontSize: 29,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  liveDot: {
    backgroundColor: colors.primary,
    borderRadius: 7,
    height: 14,
    marginTop: 4,
    width: 14,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 24,
    marginTop: spacing.sm,
  },
});
