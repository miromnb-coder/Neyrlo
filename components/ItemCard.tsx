import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '@/constants/theme';
import type { NearbyItem } from '@/types/item';

type ItemCardProps = {
  item: NearbyItem;
  onPress?: (item: NearbyItem) => void;
  variant?: 'default' | 'mapSheet';
};

const DARK_OLIVE = '#41482C';
const MUTED = '#686D66';

export function ItemCard({ item, onPress, variant = 'default' }: ItemCardProps) {
  const locationText = item.locationLabel ?? `${item.distanceKm.toFixed(1).replace('.', ',')} km`;
  const isMapSheet = variant === 'mapSheet';

  if (isMapSheet) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${item.title}, ${locationText}, ${item.priceLabel}`}
        onPress={() => onPress?.(item)}
        style={({ pressed }) => [styles.mapCard, pressed && styles.cardPressed]}
      >
        <View style={styles.mapThumbnailWrap}>
          <Image source={{ uri: item.imageUrl }} style={styles.image} />
        </View>

        <View style={styles.mapContent}>
          <Text allowFontScaling={false} numberOfLines={1} style={styles.mapTitle}>{item.title}</Text>
          <View style={styles.mapMetaRow}>
            <Ionicons color={MUTED} name="location-outline" size={15} />
            <Text allowFontScaling={false} numberOfLines={1} style={styles.mapMetaText}>
              {locationText}
            </Text>
          </View>
          <View style={styles.mapStatusChip}>
            <Text allowFontScaling={false} style={styles.mapStatusText}>{statusLabelForItem(item)}</Text>
          </View>
        </View>

        <View style={styles.mapRightColumn}>
          <View style={styles.avatarCircle}>
            <Text allowFontScaling={false} style={styles.avatarInitial}>{initialForName(item.ownerName)}</Text>
          </View>
          <Ionicons color={DARK_OLIVE} name="heart-outline" size={22} />
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${locationText}, ${item.availability}`}
      onPress={() => onPress?.(item)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={[styles.thumbnail, { backgroundColor: item.accentColor }]}> 
        <Image source={{ uri: item.imageUrl }} style={styles.image} />
      </View>

      <View style={styles.content}>
        <Text allowFontScaling={false} numberOfLines={1} style={styles.title}>
          {item.title}
        </Text>

        <Text allowFontScaling={false} numberOfLines={1} style={styles.owner}>
          {item.ownerName} • <Text style={styles.star}>★</Text> {item.rating.toFixed(1)}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons color={colors.textMuted} name="location-outline" size={11} />
            <Text allowFontScaling={false} numberOfLines={1} style={styles.metaText}>{locationText}</Text>
          </View>

          <View style={styles.metaItem}>
            <Ionicons color={colors.textMuted} name="calendar-outline" size={11} />
            <Text allowFontScaling={false} numberOfLines={1} style={styles.metaText}>
              {item.availability}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.rightColumn}>
        <Ionicons color={colors.primary} name="heart-outline" size={19} />
        <View style={styles.actionButton}>
          <Text allowFontScaling={false} style={styles.actionText}>{item.priceLabel}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function statusLabelForItem(item: NearbyItem) {
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

function initialForName(name: string) {
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed.charAt(0).toUpperCase() : 'N';
}

const styles = StyleSheet.create({
  mapCard: {
    alignItems: 'center',
    backgroundColor: '#FFFDF9',
    borderColor: 'rgba(65, 72, 44, 0.12)',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 13,
    minHeight: 114,
    padding: 9,
    shadowColor: '#1F261B',
    shadowOffset: { height: 5, width: 0 },
    shadowOpacity: 0.035,
    shadowRadius: 12,
  },
  mapThumbnailWrap: {
    backgroundColor: '#F4EDE5',
    borderRadius: 13,
    height: 94,
    overflow: 'hidden',
    width: 126,
  },
  mapContent: {
    flex: 1,
    minWidth: 0,
  },
  mapTitle: {
    color: '#20251F',
    fontSize: 17.2,
    fontWeight: '800',
    letterSpacing: -0.25,
    lineHeight: 22,
  },
  mapMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginTop: 7,
  },
  mapMetaText: {
    color: MUTED,
    flex: 1,
    fontSize: 13.5,
    fontWeight: '650',
  },
  mapStatusChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2E6',
    borderRadius: 9,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  mapStatusText: {
    color: DARK_OLIVE,
    fontSize: 12.2,
    fontWeight: '750',
  },
  mapRightColumn: {
    alignItems: 'center',
    alignSelf: 'stretch',
    justifyContent: 'space-between',
    paddingBottom: 8,
    paddingTop: 2,
    width: 46,
  },
  avatarCircle: {
    alignItems: 'center',
    backgroundColor: '#E9E0D3',
    borderColor: 'rgba(65, 72, 44, 0.10)',
    borderRadius: 999,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 38,
  },
  avatarInitial: {
    color: DARK_OLIVE,
    fontSize: 15,
    fontWeight: '900',
  },
  card: {
    alignItems: 'center',
    backgroundColor: '#FFFDF8',
    borderColor: 'rgba(232, 222, 211, 0.92)',
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 74,
    padding: 7,
    shadowColor: '#000',
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
  },
  cardPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  thumbnail: {
    alignItems: 'center',
    borderRadius: 10,
    height: 56,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 82,
  },
  image: {
    height: '100%',
    resizeMode: 'cover',
    width: '100%',
  },
  content: {
    flex: 1,
    gap: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: -0.1,
  },
  owner: {
    color: colors.primaryDark,
    fontSize: 11.3,
    fontWeight: '800',
  },
  star: {
    color: '#E9B949',
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 1,
  },
  metaItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
    maxWidth: 100,
  },
  metaText: {
    color: colors.textMuted,
    fontSize: 10.3,
    fontWeight: '600',
  },
  rightColumn: {
    alignItems: 'flex-end',
    alignSelf: 'stretch',
    justifyContent: 'space-between',
    width: 70,
  },
  actionButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    minWidth: 64,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5.5,
  },
  actionText: {
    color: colors.surface,
    fontSize: 11.3,
    fontWeight: '900',
    textAlign: 'center',
  },
});
