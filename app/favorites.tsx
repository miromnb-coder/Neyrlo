import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ItemCard } from '@/components/ItemCard';
import { getMyFavoriteListings } from '@/lib/favorites';
import type { NearbyItem } from '@/types/item';

const BACKGROUND = '#FFFDF7';
const GREEN = '#55633F';
const TEXT = '#20251F';
const MUTED = '#77736B';
const BORDER = 'rgba(64, 80, 48, 0.13)';
const CARD = 'rgba(255, 253, 247, 0.94)';

export default function FavoritesScreen() {
  const router = useRouter();
  const [items, setItems] = useState<NearbyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadFavorites = useCallback(async () => {
    setLoading(true);
    setFeedback(null);

    try {
      setItems(await getMyFavoriteListings());
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Suosikkien lataus ei onnistunut.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadFavorites();
    }, [loadFavorites]),
  );

  const openListing = (item: NearbyItem) => {
    router.push({ pathname: '/listings/[id]', params: { id: item.id } });
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
          <Ionicons color={TEXT} name="chevron-back" size={27} />
        </Pressable>
        <Text allowFontScaling={false} style={styles.pageTitle}>Suosikit</Text>
        <Pressable onPress={() => void loadFavorites()} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
          <Ionicons color={GREEN} name="refresh-outline" size={22} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color={GREEN} size="small" />
            <Text allowFontScaling={false} style={styles.stateText}>Ladataan suosikkeja...</Text>
          </View>
        ) : feedback ? (
          <View style={styles.stateCard}>
            <Ionicons color={GREEN} name="information-circle-outline" size={23} />
            <Text allowFontScaling={false} style={styles.stateText}>{feedback}</Text>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.stateCard}>
            <Ionicons color={GREEN} name="heart-outline" size={30} />
            <Text allowFontScaling={false} style={styles.stateTitle}>Ei suosikkeja vielä</Text>
            <Text allowFontScaling={false} style={styles.stateText}>Tallenna kiinnostavia ilmoituksia sydänpainikkeesta.</Text>
          </View>
        ) : (
          <View style={styles.listStack}>
            {items.map((item) => <ItemCard item={item} key={item.id} onPress={openListing} />)}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: BACKGROUND, flex: 1 },
  topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 8 },
  iconButton: { alignItems: 'center', backgroundColor: CARD, borderColor: BORDER, borderRadius: 14, borderWidth: 1, height: 45, justifyContent: 'center', width: 45 },
  pageTitle: { color: TEXT, fontSize: 25, fontWeight: '900' },
  content: { paddingBottom: 34, paddingHorizontal: 24, paddingTop: 22 },
  listStack: { gap: 10 },
  stateCard: { alignItems: 'center', backgroundColor: CARD, borderColor: BORDER, borderRadius: 20, borderWidth: 1, gap: 8, padding: 24 },
  stateTitle: { color: TEXT, fontSize: 17, fontWeight: '900' },
  stateText: { color: MUTED, fontSize: 14, fontWeight: '700', lineHeight: 20, textAlign: 'center' },
  pressed: { opacity: 0.78 },
});
