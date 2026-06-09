import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '@/constants/theme';
import type { NearbyItem } from '@/types/item';

type ItemCardProps = {
  item: NearbyItem;
  onPress?: (item: NearbyItem) => void;
};

export function ItemCard({ item, onPress }: ItemCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${item.distanceKm.toFixed(1)} kilometriä, ${item.availability}`}
      onPress={() => onPress?.(item)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={[styles.thumbnail, { backgroundColor: item.accentColor }]}>
        <Image source={{ uri: item.imageUrl }} style={styles.image} />
      </View>

      <View style={styles.content}>
        <Text numberOfLines={1} style={styles.title}>
          {item.title}
        </Text>

        <Text numberOfLines={1} style={styles.owner}>
          {item.ownerName} • <Text style={styles.star}>★</Text> {item.rating.toFixed(1)}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons color={colors.textMuted} name="location-outline" size={14} />
            <Text style={styles.metaText}>{item.distanceKm.toFixed(1).replace('.', ',')} km</Text>
          </View>

          <View style={styles.metaItem}>
            <Ionicons color={colors.textMuted} name="calendar-outline" size={14} />
            <Text numberOfLines={1} style={styles.metaText}>
              {item.availability}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.rightColumn}>
        <Ionicons color={colors.primary} name="heart-outline" size={22} />
        <View style={styles.actionButton}>
          <Text style={styles.actionText}>{item.priceLabel}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 92,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { height: 7, width: 0 },
    shadowOpacity: 0.055,
    shadowRadius: 12,
  },
  cardPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  thumbnail: {
    alignItems: 'center',
    borderRadius: 12,
    height: 70,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 96,
  },
  image: {
    height: '100%',
    resizeMode: 'cover',
    width: '100%',
  },
  content: {
    flex: 1,
    gap: 3,
    justifyContent: 'center',
    minWidth: 0,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.15,
  },
  owner: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '800',
  },
  star: {
    color: '#E9B949',
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  metaItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
    maxWidth: 112,
  },
  metaText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  rightColumn: {
    alignItems: 'flex-end',
    alignSelf: 'stretch',
    justifyContent: 'space-between',
    width: 92,
  },
  actionButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    minWidth: 78,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
  },
  actionText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
  },
});
