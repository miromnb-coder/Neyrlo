import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ItemCard } from '@/components/ItemCard';
import { colors } from '@/constants/theme';
import { blockUser } from '@/lib/safety';
import {
  getPublicProfile,
  getPublicUserListings,
  getPublicUserReviews,
  type PublicProfile,
  type PublicReview,
} from '@/lib/publicProfiles';
import type { NearbyItem } from '@/types/item';

const BACKGROUND = '#FFFDF7';
const GREEN = '#55633F';
const GREEN_DARK = '#3F4E2F';
const TEXT = '#20251F';
const MUTED = '#77736B';
const BORDER = 'rgba(64, 80, 48, 0.13)';
const CARD = 'rgba(255, 253, 247, 0.94)';

export default function PublicUserProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const userId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [listings, setListings] = useState<NearbyItem[]>([]);
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!userId) {
      setFeedback('Käyttäjän tunniste puuttuu.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const [profileData, listingData, reviewData] = await Promise.all([
        getPublicProfile(userId),
        getPublicUserListings(userId),
        getPublicUserReviews(userId),
      ]);
      setProfile(profileData);
      setListings(listingData);
      setReviews(reviewData);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Profiilin lataus ei onnistunut.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleBlock = async () => {
    if (!userId) return;

    setFeedback(null);

    try {
      await blockUser(userId);
      setFeedback('Käyttäjä blokattu.');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Blokkaus ei onnistunut.');
    }
  };

  const openListing = (item: NearbyItem) => {
    router.push({ pathname: '/listings/[id]', params: { id: item.id } });
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
          <Ionicons color={TEXT} name="chevron-back" size={27} />
        </Pressable>
        <Text allowFontScaling={false} style={styles.pageTitle}>Profiili</Text>
        <Pressable onPress={handleBlock} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
          <Ionicons color="#9F2E2E" name="ban-outline" size={22} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={GREEN} size="small" />
          <Text allowFontScaling={false} style={styles.loadingText}>Ladataan profiilia...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {!!profile && (
            <View style={styles.profileCard}>
              <View style={styles.avatarCircle}>
                {profile.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                ) : (
                  <Ionicons color={GREEN} name="person-outline" size={34} />
                )}
              </View>
              <View style={styles.profileInfo}>
                <View style={styles.nameRow}>
                  <Text allowFontScaling={false} numberOfLines={1} style={styles.nameText}>{profile.display_name || 'Neyrlo-käyttäjä'}</Text>
                  {profile.is_verified && <Ionicons color={GREEN} name="checkmark-circle" size={18} />}
                </View>
                <Text allowFontScaling={false} style={styles.mutedText}>{profile.city || 'Paikallinen käyttäjä'}</Text>
                <View style={styles.ratingRow}>
                  <Text allowFontScaling={false} style={styles.star}>★</Text>
                  <Text allowFontScaling={false} style={styles.ratingText}>{Number(profile.rating_average ?? 0).toFixed(1)}</Text>
                  <Text allowFontScaling={false} style={styles.mutedText}>({profile.rating_count ?? 0} arviota)</Text>
                </View>
              </View>
            </View>
          )}

          {!!profile?.bio && (
            <View style={styles.sectionCard}>
              <Text allowFontScaling={false} style={styles.sectionTitle}>Tietoja käyttäjästä</Text>
              <Text allowFontScaling={false} style={styles.bodyText}>{profile.bio}</Text>
            </View>
          )}

          {!!feedback && (
            <View style={styles.feedbackCard}>
              <Ionicons color={GREEN_DARK} name="information-circle-outline" size={20} />
              <Text allowFontScaling={false} style={styles.feedbackText}>{feedback}</Text>
            </View>
          )}

          <Text allowFontScaling={false} style={styles.sectionHeading}>Käyttäjän ilmoitukset</Text>
          {listings.length === 0 ? (
            <View style={styles.stateCard}>
              <Text allowFontScaling={false} style={styles.mutedText}>Ei aktiivisia ilmoituksia.</Text>
            </View>
          ) : (
            <View style={styles.listStack}>
              {listings.map((item) => <ItemCard item={item} key={item.id} onPress={openListing} />)}
            </View>
          )}

          <Text allowFontScaling={false} style={styles.sectionHeading}>Arviot</Text>
          {reviews.length === 0 ? (
            <View style={styles.stateCard}>
              <Text allowFontScaling={false} style={styles.mutedText}>Ei arvioita vielä.</Text>
            </View>
          ) : (
            <View style={styles.listStack}>
              {reviews.map((review) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewTopRow}>
                    <Text allowFontScaling={false} style={styles.reviewName}>{review.reviewerName}</Text>
                    <Text allowFontScaling={false} style={styles.star}>{'★'.repeat(review.rating)}</Text>
                  </View>
                  {!!review.comment && <Text allowFontScaling={false} style={styles.bodyText}>{review.comment}</Text>}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: BACKGROUND, flex: 1 },
  topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 8 },
  iconButton: { alignItems: 'center', backgroundColor: CARD, borderColor: BORDER, borderRadius: 14, borderWidth: 1, height: 45, justifyContent: 'center', width: 45 },
  pageTitle: { color: TEXT, fontSize: 25, fontWeight: '900' },
  loadingWrap: { alignItems: 'center', flex: 1, gap: 12, justifyContent: 'center' },
  loadingText: { color: MUTED, fontSize: 14, fontWeight: '700' },
  content: { paddingBottom: 34, paddingHorizontal: 24, paddingTop: 22 },
  profileCard: { alignItems: 'center', backgroundColor: CARD, borderColor: BORDER, borderRadius: 22, borderWidth: 1, flexDirection: 'row', gap: 14, padding: 16 },
  avatarCircle: { alignItems: 'center', backgroundColor: '#F2EDE5', borderRadius: 999, height: 78, justifyContent: 'center', overflow: 'hidden', width: 78 },
  avatar: { height: '100%', width: '100%' },
  profileInfo: { flex: 1, minWidth: 0 },
  nameRow: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  nameText: { color: TEXT, flex: 1, fontSize: 21, fontWeight: '900' },
  mutedText: { color: MUTED, fontSize: 13.5, fontWeight: '700', lineHeight: 19 },
  ratingRow: { alignItems: 'center', flexDirection: 'row', gap: 4, marginTop: 5 },
  star: { color: '#E9B949', fontSize: 13.5, fontWeight: '900' },
  ratingText: { color: GREEN_DARK, fontSize: 13.5, fontWeight: '900' },
  sectionCard: { backgroundColor: CARD, borderColor: BORDER, borderRadius: 18, borderWidth: 1, marginTop: 14, padding: 16 },
  sectionTitle: { color: TEXT, fontSize: 16, fontWeight: '900', marginBottom: 8 },
  bodyText: { color: MUTED, fontSize: 14, fontWeight: '600', lineHeight: 21 },
  sectionHeading: { color: TEXT, fontSize: 18, fontWeight: '900', marginBottom: 10, marginTop: 22 },
  listStack: { gap: 10 },
  stateCard: { backgroundColor: CARD, borderColor: BORDER, borderRadius: 18, borderWidth: 1, padding: 16 },
  reviewCard: { backgroundColor: CARD, borderColor: BORDER, borderRadius: 16, borderWidth: 1, padding: 14 },
  reviewTopRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  reviewName: { color: TEXT, fontSize: 14, fontWeight: '900' },
  feedbackCard: { alignItems: 'flex-start', backgroundColor: 'rgba(85, 99, 63, 0.08)', borderColor: 'rgba(85, 99, 63, 0.18)', borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 9, marginTop: 14, padding: 13 },
  feedbackText: { color: GREEN_DARK, flex: 1, fontSize: 13.5, fontWeight: '700', lineHeight: 19 },
  pressed: { opacity: 0.78 },
});
