import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '@/constants/theme';

export function NearbyMapCard() {
  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Ionicons color={colors.primary} name="location" size={15} />
        <Text style={styles.title}>Lähellä sinua</Text>
      </View>
      <Text style={styles.text}>14 tavaraa</Text>
      <Text style={styles.text}>2 km säteellä</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 253, 247, 0.94)',
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    position: 'absolute',
    right: spacing.xl,
    top: 318,
    zIndex: 4,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  text: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
  },
});
