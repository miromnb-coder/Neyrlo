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
            <Text style={[styles.chipText, active && styles.activeChipText]}>{filter}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  chip: {
    backgroundColor: 'rgba(255, 253, 247, 0.94)',
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    minWidth: 96,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    shadowColor: '#000',
    shadowOffset: { height: 5, width: 0 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
  },
  activeChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  activeChipText: {
    color: colors.surface,
  },
});
