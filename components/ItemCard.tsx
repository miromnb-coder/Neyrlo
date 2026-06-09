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
        <Text allowFontScaling={false} numberOfLines={1} style={styles.title}>
          {item.title}
        </Text>

        <Text allowFontScaling={false} numberOfLines={1} style={styles.owner}>
          {item.ownerName} • <Text style={styles.star}>★</Text> {item.rating.toFixed(1)}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons color={colors.textMuted} name="location-outline" size={11} />
            <Text allowFontScaling={false} style={styles.metaText}>{item.distanceKm.toFixed(1).replace('.', ',')} km</Text>
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

const styles = StyleSheet.create({
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