import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '@/constants/theme';
import { filters } from '@/data/nearbyItems';

type FilterChipsProps = {
  selected?: (typeof filters)[number];
  onSelect?: (filter: (typeof filters)[number]) => void;
};

export function FilterChips({ selected = 'Kaikki', onSelect }: FilterChipsProps) {
  return (
    <View style={styles.row}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: 'rgba(255, 253, 247, 0.92)',
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  activeChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  activeChipText: {
    color: colors.surface,
  },
});
