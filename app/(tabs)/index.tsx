import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { FilterChips } from '@/components/FilterChips';
import { MapBackdrop } from '@/components/MapBackdrop';
import { NearbyListPanel } from '@/components/NearbyListPanel';
import { SearchOverlay } from '@/components/SearchOverlay';
import { colors, spacing } from '@/constants/theme';
import { filters } from '@/data/nearbyItems';
import { getActiveListings, listingToNearbyItem } from '@/lib/listings';
import type { NearbyItem } from '@/types/item';

export default function MapScreen() {
  const [selectedFilter, setSelectedFilter] = useState<(typeof filters)[number]>('Kaikki');
  const [items, setItems] = useState<NearbyItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadListings = useCallback(async () => {
    setLoading(true);

    try {
      const listings = await getActiveListings(50);
      setItems(listings.map(listingToNearbyItem));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadListings();
  }, [loadListings]);

  const visibleItems = useMemo(() => {
    if (selectedFilter === 'Kaikki') {
      return items;
    }

    const modeByFilter = {
      Lainaa: 'borrow',
      Vuokraa: 'rent',
      Vaihda: 'swap',
      Ilmainen: 'free',
    } as const;

    return items.filter((item) => item.mode === modeByFilter[selectedFilter as keyof typeof modeByFilter]);
  }, [items, selectedFilter]);

  return (
    <View style={styles.screen}>
      <MapBackdrop items={visibleItems} />

      <View style={styles.searchWrapper}>
        <SearchOverlay />
      </View>

      <View style={styles.filterWrapper}>
        <FilterChips selected={selectedFilter} onSelect={setSelectedFilter} />
      </View>

      <NearbyListPanel items={visibleItems} loading={loading} />
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
    top: 56,
    zIndex: 30,
  },
  filterWrapper: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 120,
    zIndex: 29,
  },
});
