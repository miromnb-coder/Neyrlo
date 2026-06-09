import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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
        <Text style={styles.emoji}>{item.emoji}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text numberOfLines={1} style={styles.title}>
            {item.title}
          </Text>
          <Ionicons color={colors.primary} name="heart-outline" size={21} />
        </View>

        <Text style={styles.owner}>{item.ownerName} • ⭐ {item.rating.toFixed(1)}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons color={colors.textMuted} name="location-outline" size={15} />
            <Text style={styles.metaText}>{item.distanceKm.toFixed(1).replace('.', ',')} km</Text>
          </View>

          <View style={styles.metaItem}>
            <Ionicons color={colors.textMuted} name="calendar-outline" size={15} />
            <Text style={styles.metaText}>{item.availability}</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionColumn}>
        <View style={styles.actionButton}>
          <Text style={styles.actionText}>{item.priceLabel}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
  },
  cardPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  thumbnail: {
    alignItems: 'center',
    borderRadius: radii.md,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  emoji: {
    fontSize: 32,
  },
  content: {
    flex: 1,
    gap: spacing.xs,
    justifyContent: 'center',
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  owner: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metaItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
  },
  metaText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  actionColumn: {
    justifyContent: 'flex-end',
  },
  actionButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  actionText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '700',
  },
});
