import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SearchOverlay } from '@/components/SearchOverlay';
import { colors } from '@/constants/theme';
import { addDistancesToItems, type Coordinates } from '@/lib/distance';
import { getFavoriteListingIds, toggleFavorite } from '@/lib/favorites';
import { getActiveListings, listingToNearbyItem } from '@/lib/listings';
import type { ExchangeMode, NearbyItem } from '@/types/item';

const DARK_OLIVE = '#41482C';
const TEXT = '#20251F';
const MUTED = '#686D66';
const BACKGROUND = '#FFFDF7';
const CARD = '#FFFDF9';
const BORDER = 'rgba(229, 218, 206, 0.82)';
const categoryImageBaseUrl = 'https://raw.githubusercontent.com/miromnb-coder/Neyrlo/main/assets/images/categories';

const horizontalPadding = 24;
const browseFilters = ['Kaikki', 'Laina', 'Vuokra', 'Vaihda', 'Jaa', 'Sijainti'] as const;
type BrowseFilter = (typeof browseFilters)[number];

const categories: {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  imageUrl: string;
  title: string;
}[] = [
  { id: 'tools', icon: 'construct-outline', imageUrl: `${categoryImageBaseUrl}/category-tools.PNG`, title: 'Työkalut' },
  { id: 'outdoors', icon: 'bonfire-outline', imageUrl: `${categoryImageBaseUrl}/category-outdoor.PNG`, title: 'Retkeily' },
  { id: 'home', icon: 'briefcase-outline', imageUrl: `${categoryImageBaseUrl}/category-home.PNG`, title: 'Keittiö' },
  { id: 'sports', icon: 'bicycle-outline', imageUrl: `${categoryImageBaseUrl}/category-sports.PNG`, title: 'Pyörät' },
  { id: 'electronics', icon: 'camera-outline', imageUrl: `${categoryImageBaseUrl}/category-electronics.PNG`, title: 'Koti & kuva' },
];

export default function BrowseScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [selectedFilter, setSelectedFilter] = useState<BrowseFilter>('Kaikki');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<NearbyItem[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const productCardWidth = Math.min(165, Math.max(142, (width - horizontalPadding * 2 - 26) / 2.35));
  const categoryCardWidth = 130;

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
    const modeByFilter: Partial<Record<BrowseFilter, ExchangeMode>> = {
      Jaa: 'free',
      Laina: 'borrow',
      Vaihda: 'swap',
      Vuokra: 'rent',
    };
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return items.filter((item) => {
      const wantedMode = modeByFilter[selectedFilter];
      const matchesFilter = !wantedMode || item.mode === wantedMode;
      const matchesCategory = !selectedCategory || item.categoryId === selectedCategory;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        item.title.toLowerCase().includes(normalizedSearch) ||
        item.ownerName.toLowerCase().includes(normalizedSearch) ||
        item.locationLabel?.toLowerCase().includes(normalizedSearch) ||
        item.priceLabel.toLowerCase().includes(normalizedSearch);

      return matchesFilter && matchesCategory && matchesSearch;
    });
  }, [items, searchQuery, selectedCategory, selectedFilter]);

  const nearbyNowItems = useMemo(
    () => [...visibleItems].sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 10),
    [visibleItems],
  );

  const popularItems = useMemo(
    () => [...visibleItems].sort((a, b) => b.rating - a.rating || a.distanceKm - b.distanceKm).slice(0, 10),
    [visibleItems],
  );

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

  const openListing = (item: NearbyItem) => {
    router.push({ pathname: '/listings/[id]', params: { id: item.id } });
  };

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text allowFontScaling={false} style={styles.brand}>NEYRLO</Text>

        <View style={styles.hero}>
          <Text allowFontScaling={false} style={styles.title}>Selaa</Text>
          <Text allowFontScaling={false} style={styles.subtitle}>Lainaa läheltä. Elä enemmän.</Text>
        </View>

        <View style={styles.searchWrapper}>
          <SearchOverlay onChangeText={setSearchQuery} placeholder="Etsi tavaroita tai ihmisiä" value={searchQuery} />
        </View>

        <ScrollView contentContainerStyle={styles.filterRow} horizontal showsHorizontalScrollIndicator={false}>
          {browseFilters.map((filter) => (
            <BrowseFilterChip key={filter} label={filter} selected={selectedFilter === filter} onPress={() => setSelectedFilter(filter)} />
          ))}
        </ScrollView>

        <ScrollView contentContainerStyle={styles.categoryRow} horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((category) => (
            <Pressable
              key={category.id}
              onPress={() => setSelectedCategory((current) => (current === category.id ? null : category.id))}
              style={({ pressed }) => [
                styles.categoryCard,
                { width: categoryCardWidth },
                selectedCategory === category.id && styles.categoryCardActive,
                pressed && styles.pressed,
              ]}
            >
              <Image source={{ uri: category.imageUrl }} style={styles.categoryImage} />
              <View style={styles.categoryIconCircle}>
                <Ionicons color="#FFFFFF" name={category.icon} size={19} />
              </View>
              <Text allowFontScaling={false} numberOfLines={1} style={styles.categoryTitle}>{category.title}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <SectionHeader detail="5 km säteellä" icon="navigate" title="Lähellä juuri nyt" />
        <ContentSection
          emptyText="Ei tavaroita tällä alueella juuri nyt."
          errorMessage={errorMessage}
          favoriteIds={favoriteIds}
          items={nearbyNowItems}
          loading={loading}
          onOpen={openListing}
          onToggleFavorite={handleToggleFavorite}
          productCardWidth={productCardWidth}
        />

        <SectionHeader title="Suositut lainattavat" />
        <ContentSection
          emptyText="Suosittuja tavaroita ei löytynyt vielä."
          errorMessage={null}
          favoriteIds={favoriteIds}
          items={popularItems}
          loading={loading}
          onOpen={openListing}
          onToggleFavorite={handleToggleFavorite}
          productCardWidth={productCardWidth}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function BrowseFilterChip({ label, onPress, selected }: { label: BrowseFilter; onPress: () => void; selected: boolean }) {
  const iconName = label === 'Sijainti' ? 'location-outline' : label === 'Kaikki' ? 'options-outline' : null;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.filterChip, selected && styles.filterChipActive, pressed && styles.pressed]}>
      <View style={styles.filterChipInner}>
        {iconName && <Ionicons color={selected ? '#FFFFFF' : DARK_OLIVE} name={iconName} size={15} />}
        <Text allowFontScaling={false} style={[styles.filterChipText, selected && styles.filterChipTextActive]}>{label}</Text>
      </View>
    </Pressable>
  );
}

function SectionHeader({ detail, icon, title }: { detail?: string; icon?: keyof typeof Ionicons.glyphMap; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        <Text allowFontScaling={false} style={styles.sectionTitle}>{title}</Text>
        {!!detail && (
          <View style={styles.sectionDetailRow}>
            {icon && <Ionicons color={MUTED} name={icon} size={13} />}
            <Text allowFontScaling={false} style={styles.sectionDetail}>{detail}</Text>
          </View>
        )}
      </View>

      <Pressable style={({ pressed }) => [styles.showAllButton, pressed && styles.pressed]}>
        <Text allowFontScaling={false} style={styles.showAllText}>Näytä kaikki</Text>
        <Ionicons color={DARK_OLIVE} name="chevron-forward" size={18} />
      </Pressable>
    </View>
  );
}

function ContentSection({
  emptyText,
  errorMessage,
  favoriteIds,
  items,
  loading,
  onOpen,
  onToggleFavorite,
  productCardWidth,
}: {
  emptyText: string;
  errorMessage: string | null;
  favoriteIds: Set<string>;
  items: NearbyItem[];
  loading: boolean;
  onOpen: (item: NearbyItem) => void;
  onToggleFavorite: (itemId: string) => Promise<void>;
  productCardWidth: number;
}) {
  if (loading) {
    return (
      <View style={styles.stateCard}>
        <ActivityIndicator color={DARK_OLIVE} size="small" />
        <Text allowFontScaling={false} style={styles.stateText}>Ladataan tavaroita...</Text>
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View style={styles.stateCard}>
        <Ionicons color={DARK_OLIVE} name="alert-circle-outline" size={23} />
        <Text allowFontScaling={false} style={styles.stateTitle}>Lataus ei onnistunut</Text>
        <Text allowFontScaling={false} style={styles.stateText}>{errorMessage}</Text>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.stateCard}>
        <Ionicons color={DARK_OLIVE} name="cube-outline" size={23} />
        <Text allowFontScaling={false} style={styles.stateText}>{emptyText}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.productRow} horizontal showsHorizontalScrollIndicator={false}>
      {items.map((item) => (
        <BrowseProductCard
          favorite={favoriteIds.has(item.id)}
          item={item}
          key={item.id}
          onOpen={onOpen}
          onToggleFavorite={onToggleFavorite}
          width={productCardWidth}
        />
      ))}
    </ScrollView>
  );
}

function BrowseProductCard({
  favorite,
  item,
  onOpen,
  onToggleFavorite,
  width,
}: {
  favorite: boolean;
  item: NearbyItem;
  onOpen: (item: NearbyItem) => void;
  onToggleFavorite: (itemId: string) => Promise<void>;
  width: number;
}) {
  const distanceText = item.latitude && item.longitude ? `${item.distanceKm.toFixed(1).replace('.', ',')} km` : item.locationLabel ?? 'Lähellä';
  const locationText = item.locationLabel ? item.locationLabel.split(',')[0] : 'Lähellä';

  return (
    <Pressable onPress={() => onOpen(item)} style={({ pressed }) => [styles.productCard, { width }, pressed && styles.pressed]}>
      <View style={styles.productImageWrap}>
        <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
        <Pressable onPress={() => void onToggleFavorite(item.id)} style={({ pressed }) => [styles.favoriteButton, pressed && styles.pressed]}>
          <Ionicons color={favorite ? DARK_OLIVE : '#4F554C'} name={favorite ? 'heart' : 'heart-outline'} size={20} />
        </Pressable>
      </View>

      <View style={styles.productBody}>
        <Text allowFontScaling={false} numberOfLines={2} style={styles.productTitle}>{item.title}</Text>
        <View style={styles.locationRow}>
          <Ionicons color={MUTED} name="location-outline" size={12} />
          <Text allowFontScaling={false} numberOfLines={1} style={styles.locationText}>{distanceText} · {locationText}</Text>
        </View>
        <View style={styles.productFooter}>
          <View style={[styles.statusPill, item.mode === 'rent' && styles.statusPillRent]}>
            <Text allowFontScaling={false} style={[styles.statusPillText, item.mode === 'rent' && styles.statusPillTextRent]}>{statusLabel(item)}</Text>
          </View>
          <Text allowFontScaling={false} style={styles.priceText}>{priceText(item)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function statusLabel(item: NearbyItem) {
  switch (item.mode) {
    case 'rent':
      return 'Vuokrattavissa';
    case 'swap':
      return 'Vaihdettavissa';
    case 'free':
      return 'Annetaan';
    case 'borrow':
    default:
      return 'Lainattavissa';
  }
}

function priceText(item: NearbyItem) {
  switch (item.mode) {
    case 'rent':
      return '12 € / päivä';
    case 'swap':
      return 'Vaihto';
    case 'free':
      return '0 €';
    case 'borrow':
    default:
      return '0 € / laina';
  }
}

const serifFont = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

const styles = StyleSheet.create({
  screen: {
    backgroundColor: BACKGROUND,
    flex: 1,
  },
  content: {
    paddingBottom: 122,
    paddingTop: 8,
  },
  brand: {
    color: DARK_OLIVE,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 4,
    marginBottom: 26,
    textAlign: 'center',
  },
  hero: {
    marginHorizontal: horizontalPadding,
  },
  title: {
    color: TEXT,
    fontFamily: serifFont,
    fontSize: 40,
    fontWeight: Platform.OS === 'ios' ? '500' : '700',
    letterSpacing: -1,
    lineHeight: 46,
  },
  subtitle: {
    color: MUTED,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 6,
  },
  searchWrapper: {
    marginHorizontal: horizontalPadding,
    marginTop: 26,
  },
  filterRow: {
    gap: 10,
    paddingHorizontal: horizontalPadding,
    paddingTop: 18,
  },
  filterChip: {
    backgroundColor: 'rgba(255, 253, 247, 0.94)',
    borderColor: BORDER,
    borderRadius: 999,
    borderWidth: 1,
    minWidth: 74,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#1F261B',
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.035,
    shadowRadius: 9,
  },
  filterChipActive: {
    backgroundColor: DARK_OLIVE,
    borderColor: DARK_OLIVE,
  },
  filterChipInner: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
  },
  filterChipText: {
    color: MUTED,
    fontSize: 13.2,
    fontWeight: '650',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '750',
  },
  categoryRow: {
    gap: 14,
    paddingHorizontal: horizontalPadding,
    paddingTop: 24,
  },
  categoryCard: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: 15,
    borderWidth: 1,
    height: 132,
    overflow: 'hidden',
    shadowColor: '#1F261B',
    shadowOffset: { height: 5, width: 0 },
    shadowOpacity: 0.04,
    shadowRadius: 11,
  },
  categoryCardActive: {
    borderColor: 'rgba(65, 72, 44, 0.34)',
  },
  categoryImage: {
    height: 95,
    resizeMode: 'cover',
    width: '100%',
  },
  categoryIconCircle: {
    alignItems: 'center',
    backgroundColor: DARK_OLIVE,
    borderColor: 'rgba(255, 253, 247, 0.92)',
    borderRadius: 999,
    borderWidth: 1,
    bottom: 34,
    height: 42,
    justifyContent: 'center',
    left: 12,
    position: 'absolute',
    width: 42,
  },
  categoryTitle: {
    color: MUTED,
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingTop: 9,
    textAlign: 'center',
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: horizontalPadding,
    marginTop: 34,
  },
  sectionTitleRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    flex: 1,
    gap: 8,
    minWidth: 0,
  },
  sectionTitle: {
    color: TEXT,
    fontFamily: serifFont,
    fontSize: 26,
    fontWeight: Platform.OS === 'ios' ? '500' : '700',
    letterSpacing: -0.55,
  },
  sectionDetailRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
  },
  sectionDetail: {
    color: MUTED,
    fontSize: 12.6,
    fontWeight: '650',
  },
  showAllButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
    paddingLeft: 12,
  },
  showAllText: {
    color: DARK_OLIVE,
    fontSize: 13.2,
    fontWeight: '700',
  },
  productRow: {
    gap: 12,
    paddingHorizontal: horizontalPadding,
    paddingTop: 16,
  },
  productCard: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: 15,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#1F261B',
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.04,
    shadowRadius: 13,
  },
  productImageWrap: {
    backgroundColor: '#F4EDE5',
    height: 132,
    overflow: 'hidden',
  },
  productImage: {
    height: '100%',
    resizeMode: 'cover',
    width: '100%',
  },
  favoriteButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 253, 247, 0.94)',
    borderRadius: 999,
    height: 34,
    justifyContent: 'center',
    position: 'absolute',
    right: 8,
    top: 8,
    width: 34,
  },
  productBody: {
    gap: 7,
    padding: 12,
  },
  productTitle: {
    color: TEXT,
    fontFamily: serifFont,
    fontSize: 16.2,
    fontWeight: Platform.OS === 'ios' ? '500' : '700',
    letterSpacing: -0.25,
    lineHeight: 20,
    minHeight: 40,
  },
  locationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  locationText: {
    color: MUTED,
    flex: 1,
    fontSize: 11.8,
    fontWeight: '600',
  },
  productFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
    marginTop: 2,
  },
  statusPill: {
    backgroundColor: '#EEF2E6',
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  statusPillRent: {
    backgroundColor: '#F4E8D7',
  },
  statusPillText: {
    color: DARK_OLIVE,
    fontSize: 10.6,
    fontWeight: '700',
  },
  statusPillTextRent: {
    color: '#7B5A2B',
  },
  priceText: {
    color: TEXT,
    fontSize: 12.6,
    fontWeight: '800',
  },
  stateCard: {
    alignItems: 'center',
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    marginHorizontal: horizontalPadding,
    marginTop: 16,
    padding: 24,
  },
  stateTitle: {
    color: TEXT,
    fontSize: 15,
    fontWeight: '850',
    textAlign: 'center',
  },
  stateText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },
});
