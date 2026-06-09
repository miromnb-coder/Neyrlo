import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '@/constants/theme';

export function SearchOverlay() {
  return (
    <View style={styles.searchCard}>
      <Ionicons color={colors.primaryDark} name="search" size={23} />
      <Text allowFontScaling={false} numberOfLines={1} style={styles.placeholder}>
        Hae tavaroita tai kategorioita
      </Text>
      <View style={styles.divider} />
      <View style={styles.filterButton}>
        <Ionicons color={colors.primaryDark} name="options-outline" size={21} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  searchCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 253, 247, 0.95)',
    borderColor: 'rgba(229, 218, 206, 0.82)',
    borderRadius: 28,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 56,
    paddingLeft: 17,
    paddingRight: 6,
    shadowColor: '#000',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.052,
    shadowRadius: 16,
  },
  placeholder: {
    color: '#646A63',
    flex: 1,
    fontSize: 15.5,
    fontWeight: '600',
  },
  divider: {
    backgroundColor: 'rgba(111, 117, 109, 0.16)',
    height: 30,
    width: 1,
  },
  filterButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(221, 237, 225, 0.78)',
    borderRadius: radii.pill,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
});