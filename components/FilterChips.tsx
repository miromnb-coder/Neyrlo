import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { colors, radii, spacing } from '@/constants/theme';
import { filters } from '@/data/nearbyItems';

type FilterChipsProps = {
  selected?: (typeof filters)[number];
  onSelect?: (filter: (typeof filters)[number]) => void;
};

export function FilterChips({ selected = 'Kaikki', onSelect }: FilterChipsProps) {
  return (
    <ScrollView
      contentContainerStyle={styles.row}
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {filters.map((filter) => {
        const active = filter === selected;

        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            key={filter}
            onPress={() => onSelect?.(filter)}
            style={[styles.chip, active && styles.activeChip]}
          >
            <Text allowFontScaling={false} style={[styles.chipText, active && styles.activeChipText]}>{filter}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  chip: {
    backgroundColor: 'rgba(255, 253, 247, 0.93)',
    borderColor: 'rgba(229, 218, 206, 0.86)',
    borderRadius: radii.pill,
    borderWidth: 1,
    minWidth: 82,
    paddingHorizontal: 14,
    paddingVertical: 9,
    shadowColor: '#000',
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 9,
  },
  activeChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: '#666C64',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  activeChipText: {
    color: colors.surface,
    fontWeight: '800',
  },
});