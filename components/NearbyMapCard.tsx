import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '@/constants/theme';

export function NearbyMapCard() {
  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Ionicons color={colors.primary} name="location" size={13} />
        <Text allowFontScaling={false} style={styles.title}>Lähellä sinua</Text>
      </View>
      <Text allowFontScaling={false} style={styles.text}>14 tavaraa</Text>
      <Text allowFontScaling={false} style={styles.text}>2 km säteellä</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 253, 247, 0.94)',
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    position: 'absolute',
    right: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    top: 310,
    zIndex: 4,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: 3,
  },
  title: {
    color: colors.text,
    fontSize: 13.5,
    fontWeight: '900',
  },
  text: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
});