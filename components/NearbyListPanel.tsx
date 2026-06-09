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
    backgroundColor: 'rgba(255, 253, 247, 0.98)',
    borderColor: 'rgba(232, 221, 210, 0.9)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    bottom: 0,
    left: 0,
    paddingHorizontal: 13,
    paddingTop: 8,
    position: 'absolute',
    right: 0,
    shadowColor: '#000',
    shadowOffset: { height: -7, width: 0 },
    shadowOpacity: 0.055,
    shadowRadius: 18,
    top: '53%',
    zIndex: 20,
  },
  list: {
    gap: 7,
    paddingBottom: 116,
  },
});