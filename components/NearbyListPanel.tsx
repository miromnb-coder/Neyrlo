import { ScrollView, StyleSheet, View } from 'react-native';

import { BottomSheetHeader } from '@/components/BottomSheetHeader';
import { ItemCard } from '@/components/ItemCard';
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
    backgroundColor: '#FFFDF7',
    borderColor: '#E8DDD2',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    bottom: 0,
    left: 0,
    paddingHorizontal: 14,
    paddingTop: 8,
    position: 'absolute',
    right: 0,
    shadowColor: '#000',
    shadowOffset: { height: -7, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    top: '54%',
    zIndex: 20,
  },
  list: {
    gap: 8,
    paddingBottom: 118,
  },
});