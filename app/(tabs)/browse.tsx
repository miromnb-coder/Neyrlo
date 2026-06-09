import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { FilterChips } from '@/components/FilterChips';
import { SearchOverlay } from '@/components/SearchOverlay';
import { colors, radii } from '@/constants/theme';
import { filters, nearbyItems } from '@/data/nearbyItems';

const categories = [
  {
    id: 'tools',
    title: 'Työkalut',
    imageUrl: nearbyItems[0].imageUrl,
  },
  {
    id: 'outdoor',
    title: 'Ulkoilu',
    imageUrl: 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=360&h=280&fit=crop&auto=format',
  },
  {
    id: 'travel',
    title: 'Matkustus',
    imageUrl: nearbyItems[2].imageUrl,
  },
];

const browseItems = [
  {
    id: 'speaker-1',
    title: 'Bluetooth-kaiutin',
    ownerName: 'Jari',
    rating: 4.8,
    distanceKm: 0.6,
    priceLabel: 'Vaihda',
    imageUrl: nearbyItems[3].imageUrl,
  },
  {
    id: 'camera-1',
    title: 'Canon EOS 250D',
    ownerName: 'Emilia',
    rating: 4.9,
    distanceKm: 0.8,
    priceLabel: 'Vuokraa',
    imageUrl: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=420&h=320&fit=crop&auto=format',
  },
  {
    id: 'controller-1',
    title: 'Peliohjain (PS5)',
    ownerName: 'Tomi',
    rating: 4.7,
    distanceKm: 0.4,
    priceLabel: 'Lainaa',
    imageUrl: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=420&h=320&fit=crop&auto=format',
  },
  {
    id: 'bike-1',
    title: 'Polkupyörä',
    ownerName: 'Heidi',
    rating: 4.8,
    distanceKm: 1.1,
    priceLabel: 'Vuokraa',
    imageUrl: 'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?w=420&h=320&fit=crop&auto=format',
  },
  {
    id: 'projector-1',
    title: 'Projektori',
    ownerName: 'Ville',
    rating: 4.6,
    distanceKm: 0.9,
    priceLabel: 'Vuokraa',
    imageUrl: 'https://images.unsplash.com/photo-1626379953822-baec19c3accd?w=420&h=320&fit=crop&auto=format',
  },
  {
    id: 'sup-1',
    title: 'SUP-lauta',
    ownerName: 'Riku',
    rating: 4.9,
    distanceKm: 1.2,
    priceLabel: 'Vuokraa',
    imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=420&h=320&fit=crop&auto=format',
  },
];

const horizontalPadding = 24;
const productGap = 10;
const categoryGap = 14;

export default function BrowseScreen() {
  const { width } = useWindowDimensions();
  const [selectedFilter, setSelectedFilter] = useState<(typeof filters)[number]>('Kaikki');
  const [selectedCategory, setSelectedCategory] = useState(categories[0].id);

  const categoryCardWidth = (width - horizontalPadding * 2 - categoryGap * 2) / 3;
  const productCardWidth = (width - horizontalPadding * 2 - productGap) / 2;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.searchWrapper}>
          <SearchOverlay />
        </View>

        <View style={styles.filterWrapper}>
          <FilterChips selected={selectedFilter} onSelect={setSelectedFilter} />
        </View>

        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text allowFontScaling={false} style={styles.title}>Selaa</Text>
            <View style={styles.titleDot} />
          </View>
          <Text allowFontScaling={false} style={styles.subtitle}>Löydä tavaroita läheltäsi.</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text allowFontScaling={false} style={styles.sectionTitle}>Kategoriat</Text>
          <Pressable style={styles.showAllButton}>
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
                onPress={() => setSelectedCategory(category.id)}
                style={[styles.categoryCard, { width: categoryCardWidth }, selected && styles.selectedCategoryCard]}
              >
                <Image source={{ uri: category.imageUrl }} style={styles.categoryImage} />
                <Text allowFontScaling={false} style={styles.categoryTitle}>{category.title}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.sectionHeader}>
          <Text allowFontScaling={false} style={styles.sectionTitle}>Lähellä sinua</Text>
          <Pressable style={styles.showAllButton}>
            <Text allowFontScaling={false} style={styles.showAllText}>Näytä kaikki</Text>
            <Ionicons color={colors.primaryDark} name="chevron-forward" size={17} />
          </Pressable>
        </View>

        <View style={styles.grid}>
          {browseItems.map((item) => (
            <Pressable key={item.id} style={({ pressed }) => [styles.productCard, { width: productCardWidth }, pressed && styles.cardPressed]}>
              <View style={styles.productImageWrap}>
                <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
                <Ionicons color="#59625E" name="heart-outline" size={21} style={styles.heartIcon} />
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
                    <Text allowFontScaling={false} style={styles.distanceText}>{item.distanceKm.toFixed(1).replace('.', ',')} km</Text>
                  </View>
                  <View style={styles.actionButton}>
                    <Text allowFontScaling={false} style={styles.actionText}>{item.priceLabel}</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#FFFDF7',
    flex: 1,
  },
  content: {
    paddingBottom: 112,
    paddingTop: 72,
  },
  searchWrapper: {
    marginHorizontal: horizontalPadding,
  },
  filterWrapper: {
    marginTop: 12,
  },
  header: {
    marginHorizontal: horizontalPadding,
    marginTop: 22,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  title: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.32,
  },
  titleDot: {
    backgroundColor: '#6C8A64',
    borderColor: 'rgba(255, 253, 247, 0.95)',
    borderRadius: 4,
    borderWidth: 1,
    height: 8,
    marginTop: 4,
    width: 8,
  },
  subtitle: {
    color: '#5D6770',
    fontSize: 13.3,
    fontWeight: '500',
    marginTop: 3,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: horizontalPadding,
    marginTop: 24,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17.2,
    fontWeight: '800',
    letterSpacing: -0.22,
  },
  showAllButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 1,
  },
  showAllText: {
    color: colors.primaryDark,
    fontSize: 12.4,
    fontWeight: '600',
  },
  categoryRow: {
    flexDirection: 'row',
    gap: categoryGap,
    marginHorizontal: horizontalPadding,
    marginTop: 12,
  },
  categoryCard: {
    alignItems: 'center',
    backgroundColor: '#FFFDF8',
    borderColor: 'rgba(229, 218, 206, 0.9)',
    borderRadius: 15,
    borderWidth: 1,
    height: 126,
    justifyContent: 'space-between',
    paddingBottom: 14,
    paddingHorizontal: 7,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { height: 3, width: 0 },
    shadowOpacity: 0.02,
    shadowRadius: 7,
  },
  selectedCategoryCard: {
    borderColor: '#5C7F53',
  },
  categoryImage: {
    height: 72,
    resizeMode: 'contain',
    width: '100%',
  },
  categoryTitle: {
    color: colors.text,
    fontSize: 14.2,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: horizontalPadding,
    marginTop: 13,
    rowGap: 10,
  },
  productCard: {
    backgroundColor: '#FFFDF8',
    borderColor: 'rgba(229, 218, 206, 0.78)',
    borderRadius: 13,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { height: 3, width: 0 },
    shadowOpacity: 0.02,
    shadowRadius: 7,
  },
  cardPressed: {
    opacity: 0.84,
  },
  productImageWrap: {
    backgroundColor: '#F8F2EA',
    height: 96,
    position: 'relative',
  },
  productImage: {
    height: '100%',
    resizeMode: 'cover',
    width: '100%',
  },
  heartIcon: {
    position: 'absolute',
    right: 9,
    top: 8,
  },
  productBody: {
    paddingBottom: 8,
    paddingHorizontal: 9,
    paddingTop: 7,
  },
  productTitle: {
    color: colors.text,
    fontSize: 12.4,
    fontWeight: '800',
    letterSpacing: -0.06,
  },
  ownerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
    marginTop: 2,
  },
  ownerText: {
    color: colors.primaryDark,
    fontSize: 10.5,
    fontWeight: '600',
  },
  star: {
    color: '#E9B949',
    fontSize: 11.2,
    fontWeight: '800',
  },
  productFooter: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  distanceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 1,
  },
  distanceText: {
    color: colors.textMuted,
    fontSize: 10.8,
    fontWeight: '600',
  },
  actionButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    minWidth: 61,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  actionText: {
    color: colors.surface,
    fontSize: 10.9,
    fontWeight: '700',
    textAlign: 'center',
  },
});
