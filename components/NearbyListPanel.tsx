import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { ItemCard } from '@/components/ItemCard';
import { NearbyMapCard } from '@/components/NearbyMapCard';
import { colors } from '@/constants/theme';
import type { NearbyItem } from '@/types/item';

type NearbyListPanelProps = {
  items: NearbyItem[];
  loading?: boolean;
};

function SheetHandle() {
  return (
    <View style={styles.handleContainer}>
      <View style={styles.handleIndicator} />
    </View>
  );
}

export function NearbyListPanel({ items, loading = false }: NearbyListPanelProps) {
  const { height } = useWindowDimensions();
  const animatedIndex = useSharedValue(0);
  const snapPoints = useMemo(() => ['30%', '47%', '76%'], []);

  const cardTopAtMiddleSnap = height * 0.53 - 96;
  const distanceFromLowerToMiddleSnap = height * 0.17;

  const floatingCardStyle = useAnimatedStyle(() => ({
    opacity: interpolate(animatedIndex.value, [1.12, 1.32], [1, 0], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(
          animatedIndex.value,
          [0, 1, 1.32],
          [distanceFromLowerToMiddleSnap, 0, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  return (
    <>
      <Animated.View pointerEvents="none" style={[styles.floatingCard, { top: cardTopAtMiddleSnap }, floatingCardStyle]}>
        <NearbyMapCard count={items.length} radiusLabel="julkaistua ilmoitusta" />
      </Animated.View>

      <BottomSheet
        animatedIndex={animatedIndex}
        backgroundStyle={styles.sheetBackground}
        enableDynamicSizing={false}
        enablePanDownToClose={false}
        handleComponent={SheetHandle}
        index={0}
        overDragResistanceFactor={3}
        snapPoints={snapPoints}
        style={styles.sheet}
      >
        <BottomSheetScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text allowFontScaling={false} style={styles.title}>Lähellä sinua</Text>
              <View style={styles.titleDot} />
            </View>
            <Text allowFontScaling={false} style={styles.subtitle}>
              Lainaa, vuokraa, vaihda tai anna. Kaikki läheltä.
            </Text>
          </View>

          {loading ? (
            <View style={styles.stateCard}>
              <Ionicons color={colors.primary} name="sync-outline" size={22} />
              <Text allowFontScaling={false} style={styles.stateText}>Ladataan julkaistuja ilmoituksia...</Text>
            </View>
          ) : items.length === 0 ? (
            <View style={styles.stateCard}>
              <Ionicons color={colors.primary} name="cube-outline" size={24} />
              <Text allowFontScaling={false} style={styles.stateTitle}>Ei julkaistuja ilmoituksia vielä</Text>
              <Text allowFontScaling={false} style={styles.stateText}>Julkaise ensimmäinen ilmoitus Lisää-sivulta.</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {items.map((item) => (
                <ItemCard item={item} key={item.id} />
              ))}
            </View>
          )}
        </BottomSheetScrollView>
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
    right: 20,
    zIndex: 18,
  },
  handleIndicator: {
    backgroundColor: '#CFC5BA',
    borderRadius: 2,
    height: 4,
    width: 40,
  },
  content: {
    backgroundColor: '#FFFDF7',
    paddingBottom: 118,
    paddingHorizontal: 16,
  },
  header: {
    marginBottom: 16,
    marginTop: 4,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  title: {
    color: colors.primary,
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: -0.35,
  },
  titleDot: {
    backgroundColor: '#6C8A64',
    borderColor: 'rgba(255, 253, 247, 0.95)',
    borderRadius: 5,
    borderWidth: 1,
    height: 10,
    marginTop: 5,
    width: 10,
  },
  subtitle: {
    color: '#5D6770',
    fontSize: 13.8,
    fontWeight: '600',
    lineHeight: 20,
    marginTop: 5,
  },
  list: {
    gap: 10,
  },
  stateCard: {
    alignItems: 'center',
    backgroundColor: '#FFFDF8',
    borderColor: 'rgba(229, 218, 206, 0.85)',
    borderRadius: 18,
    borderWidth: 1,
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 22,
  },
  stateTitle: {
    color: colors.text,
    fontSize: 15.5,
    fontWeight: '900',
    textAlign: 'center',
  },
  stateText: {
    color: colors.textMuted,
    fontSize: 13.5,
    fontWeight: '600',
    lineHeight: 19,
    textAlign: 'center',
  },
});
