import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { NearbyMapCard } from '@/components/NearbyMapCard';
import type { NearbyItem } from '@/types/item';

type NearbyListPanelProps = {
  items: NearbyItem[];
};

function SheetHandle() {
  return (
    <View style={styles.handleContainer}>
      <View style={styles.handleIndicator} />
    </View>
  );
}

export function NearbyListPanel({ items: _items }: NearbyListPanelProps) {
  const { height } = useWindowDimensions();
  const animatedIndex = useSharedValue(1);
  const snapPoints = useMemo(() => ['18%', '47%', '76%'], []);

  const cardTopAtMiddleSnap = height * 0.53 - 82;
  const distanceFromLowerToMiddleSnap = height * 0.29;

  const floatingCardStyle = useAnimatedStyle(() => ({
    opacity: interpolate(animatedIndex.value, [1.55, 1.95], [1, 0], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(
          animatedIndex.value,
          [0, 1, 2],
          [distanceFromLowerToMiddleSnap, 0, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  return (
    <>
      <Animated.View pointerEvents="none" style={[styles.floatingCard, { top: cardTopAtMiddleSnap }, floatingCardStyle]}>
        <NearbyMapCard />
      </Animated.View>

      <BottomSheet
        animatedIndex={animatedIndex}
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
    </>
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
  handleContainer: {
    alignItems: 'center',
    paddingBottom: 6,
    paddingTop: 9,
  },
  floatingCard: {
    position: 'absolute',
    right: 30,
    zIndex: 19,
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