import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import * as Location from 'expo-location';

import { FilterChips } from '@/components/FilterChips';
import { MapBackdrop } from '@/components/MapBackdrop';
import { NearbyListPanel } from '@/components/NearbyListPanel';
import { SearchOverlay } from '@/components/SearchOverlay';
import { colors, spacing } from '@/constants/theme';
import { filters } from '@/data/nearbyItems';
import { addDistancesToItems, type Coordinates } from '@/lib/distance';
import { getActiveListings, listingToNearbyItem } from '@/lib/listings';
import type { NearbyItem } from '@/types/item';

export default function MapScreen() {
  const [selectedFilter, setSelectedFilter] = useState<(typeof filters)[number]>('Kaikki');
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<NearbyItem[]>([]);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(true);

  const loadListings = useCallback(async () => {
    setLoading(true);

    try {
      const listings = await getActiveListings(80);
      let currentLocation: Coordinates | null = null;
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status === 'granted') {
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        currentLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        setUserLocation(currentLocation);
      }

      setItems(addDistancesToItems(listings.map(listingToNearbyItem), currentLocation));
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
    const modeByFilter = {
      Lainaa: 'borrow',
      Vuokraa: 'rent',
      Vaihda: 'swap',
      Ilmainen: 'free',
    } as const;
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return items.filter((item) => {
      const matchesFilter = selectedFilter === 'Kaikki' || item.mode === modeByFilter[selectedFilter as keyof typeof modeByFilter];
      const matchesSearch =
        normalizedSearch.length === 0 ||
        item.title.toLowerCase().includes(normalizedSearch) ||
        item.ownerName.toLowerCase().includes(normalizedSearch) ||
        item.locationLabel?.toLowerCase().includes(normalizedSearch);
      return matchesFilter && matchesSearch;
    });
  }, [items, searchQuery, selectedFilter]);

  return (
    <View style={styles.screen}>
      <MapBackdrop items={visibleItems} userLocation={userLocation} />

      <View style={styles.searchWrapper}>
        <SearchOverlay onChangeText={setSearchQuery} value={searchQuery} />
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
