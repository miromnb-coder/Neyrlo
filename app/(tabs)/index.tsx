import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { FilterChips } from '@/components/FilterChips';
import { ItemCard } from '@/components/ItemCard';
import { MapBackdrop } from '@/components/MapBackdrop';
import { SearchOverlay } from '@/components/SearchOverlay';
import { colors, radii, spacing } from '@/constants/theme';
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

      <View style={styles.topOverlay}>
        <SearchOverlay />
        <FilterChips selected={selectedFilter} onSelect={setSelectedFilter} />
      </View>

      <View style={styles.bottomSheet}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Lähellä sinua</Text>
              <View style={styles.liveDot} />
            </View>
            <Text style={styles.subtitle}>Lainaa, vuokraa, vaihda tai anna. Kaikki läheltä.</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {visibleItems.map((item) => (
            <ItemCard item={item} key={item.id} />
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  topOverlay: {
    gap: spacing.md,
    left: spacing.lg,
    paddingTop: 60,
    position: 'absolute',
    right: spacing.lg,
    top: 0,
    zIndex: 10,
  },
  bottomSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    bottom: 0,
    height: '55%',
    left: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    position: 'absolute',
    right: 0,
    shadowColor: '#000',
    shadowOffset: { height: -10, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 22,
    zIndex: 11,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: '#D4CABE',
    borderRadius: radii.pill,
    height: 5,
    marginBottom: spacing.md,
    width: 42,
  },
  header: {
    marginBottom: spacing.md,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  title: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '800',
  },
  liveDot: {
    backgroundColor: colors.primary,
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  list: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
});
