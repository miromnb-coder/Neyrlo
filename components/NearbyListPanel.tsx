import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { ItemCard } from '@/components/ItemCard';
import { NearbyMapCard } from '@/components/NearbyMapCard';
import { colors } from '@/constants/theme';
import type { NearbyItem } from '@/types/item';

type NearbyListPanelProps = {
  items: NearbyItem[];
  loading?: boolean;
};

const DARK_OLIVE = '#41482C';
const SHEET_BACKGROUND = '#FFFDF7';

function SheetHandle() {
  return (
    <View style={styles.handleContainer}>
      <View style={styles.handleIndicator} />
    </View>
  );
}

export function NearbyListPanel({ items, loading = false }: NearbyListPanelProps) {
  const router = useRouter();
  const { height } = useWindowDimensions();
  const animatedIndex = useSharedValue(0);
  const snapPoints = useMemo(() => ['45%', '70%', '84%'], []);

  const cardTopAtMiddleSnap = height * 0.53 - 96;
  const distanceFromLowerToMiddleSnap = height * 0.17;
  const itemCountLabel = `${items.length} ${items.length === 1 ? 'tavara' : 'tavaraa'} 5 km säteellä`;

  const openListing = (item: NearbyItem) => {
    router.push({ pathname: '/listings/[id]', params: { id: item.id } });
  };

  const floatingCardStyle = useAnimatedStyle(() => ({
    opacity: interpolate(animatedIndex.value, [0.8, 1.12], [1, 0], Extrapolation.CLAMP),
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
          <View style={styles.headerRow}>
            <View style={styles.headerTextBlock}>
              <Text allowFontScaling={false} style={styles.title}>Lähellä sinua</Text>
              <Text allowFontScaling={false} style={styles.subtitle}>{itemCountLabel}</Text>
            </View>

            <Pressable style={({ pressed }) => [styles.mapButton, pressed && styles.pressed]}>
              <Text allowFontScaling={false} style={styles.mapButtonText}>Näytä kartalla</Text>
              <Ionicons color={DARK_OLIVE} name="map-outline" size={19} />
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.stateCard}>
              <Ionicons color={DARK_OLIVE} name="sync-outline" size={22} />
              <Text allowFontScaling={false} style={styles.stateText}>Ladataan julkaistuja ilmoituksia...</Text>
            </View>
          ) : items.length === 0 ? (
            <View style={styles.stateCard}>
              <Ionicons color={DARK_OLIVE} name="cube-outline" size={24} />
              <Text allowFontScaling={false} style={styles.stateTitle}>Ei tavaroita tällä alueella</Text>
              <Text allowFontScaling={false} style={styles.stateText}>Kokeile suurempaa etäisyyttä tai julkaise ensimmäinen ilmoitus.</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {items.map((item) => (
                <ItemCard item={item} key={item.id} onPress={openListing} variant="mapSheet" />
              ))}
            </View>
          )}
        </BottomSheetScrollView>
      </BottomSheet>
    </>
  );
}

const serifFont = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

const styles = StyleSheet.create({
  sheet: {
    shadowColor: '#1F261B',
    shadowOffset: { height: -8, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    zIndex: 20,
  },
  sheetBackground: {
    backgroundColor: SHEET_BACKGROUND,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
  },
  handleContainer: {
    alignItems: 'center',
    paddingBottom: 10,
    paddingTop: 12,
  },
  floatingCard: {
    position: 'absolute',
    right: 20,
    zIndex: 18,
  },
  handleIndicator: {
    backgroundColor: '#BDB4A9',
    borderRadius: 999,
    height: 5,
    width: 48,
  },
  content: {
    backgroundColor: SHEET_BACKGROUND,
    paddingBottom: 120,
    paddingHorizontal: 22,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
    paddingTop: 2,
  },
  headerTextBlock: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },
  title: {
    color: '#20251F',
    fontFamily: serifFont,
    fontSize: 30,
    fontWeight: Platform.OS === 'ios' ? '500' : '700',
    letterSpacing: -0.65,
    lineHeight: 36,
  },
  subtitle: {
    color: '#686D66',
    fontSize: 14.6,
    fontWeight: '650',
    lineHeight: 20,
    marginTop: 1,
  },
  mapButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 253, 247, 0.92)',
    borderColor: 'rgba(65, 72, 44, 0.13)',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  mapButtonText: {
    color: '#686D66',
    fontSize: 13.2,
    fontWeight: '750',
  },
  list: {
    gap: 11,
  },
  stateCard: {
    alignItems: 'center',
    backgroundColor: '#FFFDF8',
    borderColor: 'rgba(229, 218, 206, 0.85)',
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 28,
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
  pressed: {
    opacity: 0.78,
  },
});
