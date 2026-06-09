import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '@/constants/theme';

export function SearchOverlay() {
  return (
    <View style={styles.searchCard}>
      <Ionicons color={colors.primary} name="search" size={20} />
      <Text style={styles.placeholder}>Hae tavaroita tai kategorioita</Text>
      <View style={styles.filterButton}>
        <Ionicons color={colors.primary} name="options-outline" size={20} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  searchCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 253, 247, 0.96)',
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    shadowColor: '#000',
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
  placeholder: {
    color: colors.textMuted,
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  filterButton: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radii.pill,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
});
