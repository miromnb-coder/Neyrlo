import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { FilterChips } from '@/components/FilterChips';
import { SearchOverlay } from '@/components/SearchOverlay';
import { colors, radii } from '@/constants/theme';
import { filters } from '@/data/nearbyItems';
import { addDistancesToItems, type Coordinates } from '@/lib/distance';
import { getFavoriteListingIds, toggleFavorite } from '@/lib/favorites';
import { getActiveListings, listingToNearbyItem } from '@/lib/listings';
import type { NearbyItem } from '@/types/item';

const categoryImageBaseUrl = 'https://raw.githubusercontent.com/miromnb-coder/Neyrlo/main/assets/images/categories';

const categories = [
  { id: 'tools', title: 'Työkalut', imageUrl: `${categoryImageBaseUrl}/category-tools.PNG` },
  { id: 'outdoors', title: 'Ulkoilu', imageUrl: `${categoryImageBaseUrl}/category-outdoor.PNG` },
  { id: 'travel', title: 'Matkustus', imageUrl: `${categoryImageBaseUrl}/category-travel.PNG` },
];

const horizontalPadding = 24;
const productGap = 10;
const categoryGap = 14;
const radiusOptions = [2, 5, 10, 25];

export default function BrowseScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [selectedFilter, setSelectedFilter] = useState<(typeof filters)[number]>('Kaikki');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedRadiusKm, setSelectedRadiusKm] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<NearbyItem[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const categoryCardWidth = (width - horizontalPadding * 2 - categoryGap * 2) / 3;
  const productCardWidth = (width - horizontalPadding * 2 - productGap) / 2;

  const openListing = (item: NearbyItem) => {
    router.push({ pathname: '/listings/[id]', params: { id: item.id } });
  };

  const loadListings = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const [listings, favorites] = await Promise.all([getActiveListings(100), getFavoriteListingIds()]);
      setFavoriteIds(favorites);

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
    } catch (error) {
      setItems([]);
      setErrorMessage(error instanceof Error ? error.message : 'Julkaistujen ilmoitusten lataus ei onnistunut.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadListings();
    }, [loadListings]),
  );

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
      const matchesCategory = !selectedCategory || item.categoryId === selectedCategory;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        item.title.toLowerCase().includes(normalizedSearch) ||
        item.ownerName.toLowerCase().includes(normalizedSearch) ||
        item.locationLabel?.toLowerCase().includes(normalizedSearch) ||
        item.priceLabel.toLowerCase().includes(normalizedSearch);
      const matchesRadius = !userLocation || !item.latitude || !item.longitude || item.distanceKm <= selectedRadiusKm;

      return matchesFilter && matchesCategory && matchesSearch && matchesRadius;
    });
  }, [items, searchQuery, selectedCategory, selectedFilter, selectedRadiusKm, userLocation]);

  const handleToggleFavorite = async (itemId: string) => {
    try {
      const isFavorite = await toggleFavorite(itemId);
      setFavoriteIds((current) => {
        const next = new Set(current);
        if (isFavorite) {
          next.add(itemId);
        } else {
          next.delete(itemId);
        }
        return next;
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Suosikin päivitys ei onnistunut.');
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.searchWrapper}>
          <SearchOverlay onChangeText={setSearchQuery} value={searchQuery} />
        </View>

        <View style={styles.filterWrapper}>
          <FilterChips selected={selectedFilter} onSelect={setSelectedFilter} />
        </View>

        <View style={styles.radiusRow}>
          {radiusOptions.map((radius) => {
            const selected = selectedRadiusKm === radius;
            return (
              <Pressable
                key={radius}
                onPress={() => setSelectedRadiusKm(radius)}
                style={({ pressed }) => [styles.radiusChip, selected && styles.radiusChipActive, pressed && styles.cardPressed]}
              >
                <Text allowFontScaling={false} style={[styles.radiusText, selected && styles.radiusTextActive]}>{radius} km</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text allowFontScaling={false} style={styles.title}>Selaa</Text>
            <View style={styles.titleDot} />
          </View>
          <Text allowFontScaling={false} style={styles.subtitle}>Löydä julkaistuja tavaroita läheltäsi.</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text allowFontScaling={false} style={styles.sectionTitle}>Kategoriat</Text>
          <Pressable onPress={() => setSelectedCategory(null)} style={styles.showAllButton}>
            <Text allowFontScaling={false} style={styles.showAllText}>Näytä kaikki</Text>
            <Ionicons color={colors.primaryDark} name="chevron-forward" size={17} />
          </Pressable>
        </View>

        <View style={styles.categoryRow}>
          {categories.map((category) => {
            const selected = selectedCategory === category.id;

            return (
              <Pressable
                key={category.id}
                onPress={() => setSelectedCategory((current) => (current === category.id ? null : category.id))}
                style={[styles.categoryCard, { width: categoryCardWidth }, selected && styles.selectedCategoryCard]}
              >
                <Image source={{ uri: category.imageUrl }} style={styles.categoryImage} />
                <Text allowFontScaling={false} style={styles.categoryTitle}>{category.title}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.sectionHeader}>
          <Text allowFontScaling={false} style={styles.sectionTitle}>Julkaistut ilmoitukset</Text>
          <Pressable onPress={() => void loadListings()} style={styles.showAllButton}>
            <Text allowFontScaling={false} style={styles.showAllText}>Päivitä</Text>
            <Ionicons color={colors.primaryDark} name="refresh-outline" size={15} />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text allowFontScaling={false} style={styles.stateText}>Ladataan julkaistuja ilmoituksia...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.stateCard}>
            <Ionicons color={colors.primary} name="alert-circle-outline" size={24} />
            <Text allowFontScaling={false} style={styles.stateTitle}>Lataus ei onnistunut</Text>
            <Text allowFontScaling={false} style={styles.stateText}>{errorMessage}</Text>
          </View>
        ) : visibleItems.length === 0 ? (
          <View style={styles.stateCard}>
            <Ionicons color={colors.primary} name="cube-outline" size={24} />
            <Text allowFontScaling={false} style={styles.stateTitle}>Ei tuloksia</Text>
            <Text allowFontScaling={false} style={styles.stateText}>Kokeile toista hakusanaa, isompaa etäisyyttä tai eri suodatinta.</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {visibleItems.map((item) => {
              const isFavorite = favoriteIds.has(item.id);
              const distanceText = item.latitude && item.longitude ? `${item.distanceKm.toFixed(1).replace('.', ',')} km` : item.locationLabel ?? 'Lähellä';

              return (
                <Pressable
                  key={item.id}
                  onPress={() => openListing(item)}
                  style={({ pressed }) => [styles.productCard, { width: productCardWidth }, pressed && styles.cardPressed]}
                >
                  <View style={styles.productImageWrap}>
                    <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
                    <Pressable onPress={() => void handleToggleFavorite(item.id)} style={styles.heartButton}>
                      <Ionicons color={isFavorite ? colors.primary : '#59625E'} name={isFavorite ? 'heart' : 'heart-outline'} size={21} />
                    </Pressable>
                  </View>

                  <View style={styles.productBody}>
                    <Text allowFontScaling={false} numberOfLines={1} style={styles.productTitle}>{item.title}</Text>
                    <View style={styles.ownerRow}>
                      <Text allowFontScaling={false} numberOfLines={1} style={styles.ownerText}>{item.ownerName}</Text>
                      <Text allowFontScaling={false} style={styles.ownerText}>•</Text>
                      <Text allowFontScaling={false} style={styles.star}>★</Text>
                      <Text allowFontScaling={false} style={styles.ownerText}>{item.rating.toFixed(1)}</Text>
                    </View>

                    <View style={styles.productFooter}>
                      <View style={styles.distanceRow}>
                        <Ionicons color={colors.textMuted} name="location-outline" size={12} />
                        <Text allowFontScaling={false} style={styles.distanceText}>{distanceText}</Text>
                      </View>
                      <View style={styles.actionButton}>
                        <Text allowFontScaling={false} style={styles.actionText}>{item.priceLabel}</Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#FFFDF7', flex: 1 },
  content: { paddingBottom: 112, paddingTop: 72 },
  searchWrapper: { marginHorizontal: horizontalPadding },
  filterWrapper: { marginTop: 12 },
  radiusRow: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: horizontalPadding,
    marginTop: 10,
  },
  radiusChip: {
    backgroundColor: '#FFFDF8',
    borderColor: 'rgba(85, 99, 63, 0.18)',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  radiusChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  radiusText: { color: colors.primaryDark, fontSize: 12.2, fontWeight: '800' },
  radiusTextActive: { color: colors.surface },
  header: { marginHorizontal: horizontalPadding, marginTop: 22 },
  titleRow: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  title: { color: colors.primary, fontSize: 24, fontWeight: '800', letterSpacing: -0.32 },
  titleDot: { backgroundColor: '#6C8A64', borderColor: 'rgba(255, 253, 247, 0.95)', borderRadius: 4, borderWidth: 1, height: 8, marginTop: 4, width: 8 },
  subtitle: { color: '#5D6770', fontSize: 13.3, fontWeight: '500', marginTop: 3 },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: horizontalPadding, marginTop: 24 },
  sectionTitle: { color: colors.text, fontSize: 17.2, fontWeight: '800', letterSpacing: -0.22 },
  showAllButton: { alignItems: 'center', flexDirection: 'row', gap: 1 },
  showAllText: { color: colors.primaryDark, fontSize: 12.4, fontWeight: '600' },
  categoryRow: { flexDirection: 'row', gap: categoryGap, marginHorizontal: horizontalPadding, marginTop: 12 },
  categoryCard: { alignItems: 'center', backgroundColor: '#FFFDF8', borderColor: 'rgba(229, 218, 206, 0.9)', borderRadius: 15, borderWidth: 1, height: 126, justifyContent: 'flex-end', overflow: 'hidden', paddingBottom: 13, position: 'relative', shadowColor: '#000', shadowOffset: { height: 3, width: 0 }, shadowOpacity: 0.02, shadowRadius: 7 },
  selectedCategoryCard: { borderColor: '#5C7F53' },
  categoryImage: { bottom: -1, left: -1, position: 'absolute', right: -1, top: -1, resizeMode: 'cover' },
  categoryTitle: { color: colors.text, fontSize: 14.2, fontWeight: '800', letterSpacing: -0.1, zIndex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginHorizontal: horizontalPadding, marginTop: 13, rowGap: 10 },
  productCard: { backgroundColor: '#FFFDF8', borderColor: 'rgba(229, 218, 206, 0.78)', borderRadius: 13, borderWidth: 1, overflow: 'hidden', shadowColor: '#000', shadowOffset: { height: 3, width: 0 }, shadowOpacity: 0.02, shadowRadius: 7 },
  cardPressed: { opacity: 0.84 },
  productImageWrap: { backgroundColor: '#F8F2EA', height: 96, position: 'relative' },
  productImage: { height: '100%', resizeMode: 'cover', width: '100%' },
  heartButton: { alignItems: 'center', backgroundColor: 'rgba(255, 253, 247, 0.86)', borderRadius: 999, height: 32, justifyContent: 'center', position: 'absolute', right: 8, top: 8, width: 32 },
  productBody: { paddingBottom: 8, paddingHorizontal: 9, paddingTop: 7 },
  productTitle: { color: colors.text, fontSize: 12.4, fontWeight: '800', letterSpacing: -0.06 },
  ownerRow: { alignItems: 'center', flexDirection: 'row', gap: 3, marginTop: 2 },
  ownerText: { color: colors.primaryDark, fontSize: 10.5, fontWeight: '600' },
  star: { color: '#E9B949', fontSize: 11.2, fontWeight: '800' },
  productFooter: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  distanceRow: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 2, minWidth: 0 },
  distanceText: { color: colors.textMuted, flex: 1, fontSize: 10.3, fontWeight: '600' },
  actionButton: { backgroundColor: colors.primary, borderRadius: radii.pill, minWidth: 60, paddingHorizontal: 9, paddingVertical: 5 },
  actionText: { color: colors.surface, fontSize: 10.5, fontWeight: '800', textAlign: 'center' },
  stateCard: { alignItems: 'center', backgroundColor: '#FFFDF8', borderColor: 'rgba(229, 218, 206, 0.85)', borderRadius: 18, borderWidth: 1, gap: 7, marginHorizontal: horizontalPadding, marginTop: 13, paddingHorizontal: 18, paddingVertical: 26 },
  stateTitle: { color: colors.text, fontSize: 15.8, fontWeight: '900', textAlign: 'center' },
  stateText: { color: colors.textMuted, fontSize: 13.5, fontWeight: '600', lineHeight: 19, textAlign: 'center' },
});
