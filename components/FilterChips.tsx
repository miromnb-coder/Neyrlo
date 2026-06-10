import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { filters } from '@/data/nearbyItems';

const DARK_OLIVE = '#41482C';
const INACTIVE_TEXT = '#676B65';
const CHIP_BACKGROUND = 'rgba(255, 253, 247, 0.94)';

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
        const isAll = filter === 'Kaikki';
        const isSustainable = filter === 'Kestävä';

        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            key={filter}
            onPress={() => onSelect?.(filter)}
            style={({ pressed }) => [styles.chip, active && styles.activeChip, pressed && styles.pressed]}
          >
            <View style={styles.chipContent}>
              {isAll && <Ionicons color={active ? '#FFFFFF' : DARK_OLIVE} name="options-outline" size={14} />}
              {isSustainable && <Ionicons color={active ? '#FFFFFF' : DARK_OLIVE} name="leaf-outline" size={14} />}
              <Text allowFontScaling={false} style={[styles.chipText, active && styles.activeChipText]}>{filter}</Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const shadow = {
  shadowColor: '#1F261B',
  shadowOffset: { height: 4, width: 0 },
  shadowOpacity: 0.04,
  shadowRadius: 9,
};

const styles = StyleSheet.create({
  row: {
    gap: 9,
    paddingHorizontal: 30,
  },
  chip: {
    ...shadow,
    alignItems: 'center',
    backgroundColor: CHIP_BACKGROUND,
    borderColor: 'rgba(229, 218, 206, 0.76)',
    borderRadius: 999,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    minWidth: 70,
    paddingHorizontal: 14,
  },
  activeChip: {
    backgroundColor: DARK_OLIVE,
    borderColor: DARK_OLIVE,
  },
  chipContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  chipText: {
    color: INACTIVE_TEXT,
    fontSize: 12.4,
    fontWeight: '650',
    letterSpacing: -0.04,
    textAlign: 'center',
  },
  activeChipText: {
    color: '#FFFFFF',
    fontWeight: '750',
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
});
