import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { colors, radii } from '@/constants/theme';
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
    gap: 11,
    paddingHorizontal: 18,
  },
  chip: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 253, 247, 0.93)',
    borderColor: 'rgba(229, 218, 206, 0.78)',
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    minWidth: 86,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { height: 5, width: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 9,
  },
  activeChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: '#5F665F',
    fontSize: 14.5,
    fontWeight: '600',
    letterSpacing: -0.08,
    textAlign: 'center',
  },
  activeChipText: {
    color: colors.surface,
    fontWeight: '700',
  },
});