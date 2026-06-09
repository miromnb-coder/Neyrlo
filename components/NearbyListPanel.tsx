import { ScrollView, StyleSheet, View } from 'react-native';

import { BottomSheetHeader } from '@/components/BottomSheetHeader';
import { ItemCard } from '@/components/ItemCard';
import { colors } from '@/constants/theme';
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
    backgroundColor: '#FAF7F4',
    borderColor: '#E8DDD2',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    bottom: 0,
    left: 0,
    paddingHorizontal: 18,
    paddingTop: 10,
    position: 'absolute',
    right: 0,
    shadowColor: '#000',
    shadowOffset: { height: -8, width: 0 },
    shadowOpacity: 0.075,
    shadowRadius: 20,
    top: '51%',
    zIndex: 20,
  },
  list: {
    gap: 10,
    paddingBottom: 120,
  },
});
