import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { NearbyMapCard } from '@/components/NearbyMapCard';
import type { NearbyItem } from '@/types/item';

type NearbyListPanelProps = {
  items: NearbyItem[];
};

function SheetHandle() {
  return (
    <View style={styles.handleContainer}>
      <View style={styles.floatingCard}>
        <NearbyMapCard />
      </View>
      <View style={styles.handleIndicator} />
    </View>
  );
}

export function NearbyListPanel({ items: _items }: NearbyListPanelProps) {
  const snapPoints = useMemo(() => ['18%', '47%', '76%'], []);

  return (
    <BottomSheet
      backgroundStyle={styles.sheetBackground}
      enableDynamicSizing={false}
      enablePanDownToClose={false}
      handleComponent={SheetHandle}
      index={1}
      overDragResistanceFactor={3}
      snapPoints={snapPoints}
      style={styles.sheet}
    >
      <BottomSheetView style={styles.emptyContent} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheet: {
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: { height: -7, width: 0 },
    shadowOpacity: 0.055,
    shadowRadius: 18,
    zIndex: 20,
  },
  sheetBackground: {
    backgroundColor: '#FFFDF7',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  handleContainer: {
    alignItems: 'center',
    paddingBottom: 6,
    paddingTop: 9,
  },
  floatingCard: {
    position: 'absolute',
    right: 30,
    top: -112,
  },
  handleIndicator: {
    backgroundColor: '#CFC5BA',
    borderRadius: 2,
    height: 4,
    width: 40,
  },
  emptyContent: {
    backgroundColor: '#FFFDF7',
    flex: 1,
  },
});