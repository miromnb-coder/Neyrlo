import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import type { NearbyItem } from '@/types/item';

type NearbyListPanelProps = {
  items: NearbyItem[];
};

export function NearbyListPanel({ items: _items }: NearbyListPanelProps) {
  const snapPoints = useMemo(() => ['18%', '47%', '76%'], []);

  return (
    <BottomSheet
      backgroundStyle={styles.sheetBackground}
      enableDynamicSizing={false}
      enablePanDownToClose={false}
      handleIndicatorStyle={styles.handleIndicator}
      handleStyle={styles.handle}
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
  handle: {
    paddingBottom: 6,
    paddingTop: 9,
  },
  handleIndicator: {
    backgroundColor: '#CFC5BA',
    height: 4,
    width: 40,
  },
  emptyContent: {
    backgroundColor: '#FFFDF7',
    flex: 1,
  },
});