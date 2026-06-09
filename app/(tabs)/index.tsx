import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { FilterChips } from '@/components/FilterChips';
import { MapBackdrop } from '@/components/MapBackdrop';
import { NearbyListPanel } from '@/components/NearbyListPanel';
import { SearchOverlay } from '@/components/SearchOverlay';
import { colors, spacing } from '@/constants/theme';
import { filters, nearbyItems } from '@/data/nearbyItems';

export default function MapScreen() {
  const [selectedFilter, setSelectedFilter] = useState<(typeof filters)[number]>('Kaikki');

  const visibleItems = useMemo(() => {
    if (selectedFilter === 'Kaikki') {
      return nearbyItems;
    }

    const modeByFilter = {
      Lainaa: 'borrow',
      Vuokraa: 'rent',
      Vaihda: 'swap',
      Ilmainen: 'free',
    } as const;

    return nearbyItems.filter((item) => item.mode === modeByFilter[selectedFilter as keyof typeof modeByFilter]);
  }, [selectedFilter]);

  return (
    <View style={styles.screen}>
      <MapBackdrop />

      <View style={styles.searchWrapper}>
        <SearchOverlay />
      </View>

      <View style={styles.filterWrapper}>
        <FilterChips selected={selectedFilter} onSelect={setSelectedFilter} />
      </View>

      <NearbyListPanel items={visibleItems} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  searchWrapper: {
    left: spacing.lg,
    position: 'absolute',
    right: spacing.lg,
    top: 58,
    zIndex: 30,
  },
  filterWrapper: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 132,
    zIndex: 29,
  },
});