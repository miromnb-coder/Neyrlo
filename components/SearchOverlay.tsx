import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '@/constants/theme';

export function SearchOverlay() {
  return (
    <View style={styles.searchCard}>
      <Ionicons color={colors.primary} name="search" size={24} />
      <Text allowFontScaling={false} numberOfLines={1} style={styles.placeholder}>
        Hae tavaroita tai kategorioita
      </Text>
      <View style={styles.divider} />
      <View style={styles.filterButton}>
        <Ionicons color={colors.primary} name="options-outline" size={22} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  searchCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 253, 247, 0.96)',
    borderColor: colors.border,
    borderRadius: 30,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 58,
    paddingLeft: 18,
    paddingRight: 7,
    shadowColor: '#000',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 15,
  },
  placeholder: {
    color: colors.textMuted,
    flex: 1,
    fontSize: 15.5,
    fontWeight: '600',
  },
  divider: {
    backgroundColor: 'rgba(111, 117, 109, 0.18)',
    height: 30,
    width: 1,
  },
  filterButton: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radii.pill,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
});