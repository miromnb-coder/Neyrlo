import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '@/constants/theme';

export function SearchOverlay() {
  return (
    <View style={styles.searchCard}>
      <Ionicons color={colors.primary} name="search" size={26} />
      <Text numberOfLines={1} style={styles.placeholder}>
        Hae tavaroita tai kategorioita
      </Text>
      <View style={styles.filterButton}>
        <Ionicons color={colors.primary} name="options-outline" size={23} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  searchCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 253, 247, 0.97)',
    borderColor: colors.border,
    borderRadius: 38,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 64,
    paddingLeft: spacing.xl,
    paddingRight: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.07,
    shadowRadius: 18,
  },
  placeholder: {
    color: colors.textMuted,
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
  },
  filterButton: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radii.pill,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
});
