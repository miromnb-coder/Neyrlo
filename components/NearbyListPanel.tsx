import { ScrollView, StyleSheet, View } from 'react-native';

import { BottomSheetHeader } from '@/components/BottomSheetHeader';
import { ItemCard } from '@/components/ItemCard';
import { colors, spacing } from '@/constants/theme';
import type { NearbyItem } from '@/types/item';

type NearbyListPanelProps = {
  items: NearbyItem[];
};

export function NearbyListPanel({ items }: NearbyListPanelProps) {
  return (
    <View style={styles.sheet}>
      <BottomSheetHeader />
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {items.map((item) => (
          <ItemCard item={item} key={item.id} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    bottom: 0,
    left: 0,
    paddingHorizontal: 18,
    paddingTop: 10,
    position: 'absolute',
    right: 0,
    shadowColor: '#000',
    shadowOffset: { height: -10, width: 0 },
    shadowOpacity: 0.09,
    shadowRadius: 22,
    top: '48%',
    zIndex: 20,
  },
  list: {
    gap: 10,
    paddingBottom: 120,
  },
});
