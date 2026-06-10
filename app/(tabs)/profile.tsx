import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { getMyListings, statusLabel } from '@/lib/myListings';
import { getCurrentProfile, type ProfileRecord } from '@/lib/profile';
import { listingTypeLabel, type ListingStatus, type ListingWithRelations } from '@/lib/listings';

type ListingFilter = 'all' | ListingStatus;

const filters: { label: string; value: ListingFilter }[] = [
  { label: 'Kaikki', value: 'all' },
  { label: 'Luonnokset', value: 'draft' },
  { label: 'Julkaistut', value: 'active' },
  { label: 'Keskeytetyt', value: 'paused' },
  { label: 'Arkisto', value: 'archived' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { session, signOut } = useAuth();
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [listings, setListings] = useState<ListingWithRelations[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<ListingFilter>('all');
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const [profileData, listingData] = await Promise.all([getCurrentProfile(), getMyListings()]);
      setProfile(profileData);
      setListings(listingData);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Profiilin lataus ei onnistunut.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile]),
  );

  const filteredListings = useMemo(() => {
    if (selectedFilter === 'all') {
      return listings;
    }

    return listings.filter((listing) => listing.status === selectedFilter);
  }, [listings, selectedFilter]);

  const counts = useMemo(() => ({
    active: listings.filter((listing) => listing.status === 'active').length,
    draft: listings.filter((listing) => listing.status === 'draft').length,
    total: listings.length,
  }), [listings]);

  const handleSignOut = async () => {
    setErrorMessage(null);
    setSigningOut(true);

    try {
      await signOut();
      router.replace('/auth');
    } catch {
      setErrorMessage('Uloskirjautuminen ei onnistunut. Yritä uudelleen.');
    } finally {
      setSigningOut(false);
    }
  };

  const openListingEditor = (listingId: string) => {
    router.push({ pathname: '/listings/edit/[id]', params: { id: listingId } });
  };

  const displayName = profile?.display_name || session?.user.email?.split('@')[0] || 'Neyrlo-käyttäjä';

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text allowFontScaling={false} style={styles.eyebrow}>Neyrlo</Text>
          <Text allowFontScaling={false} style={styles.title}>Profiili</Text>
          <Text allowFontScaling={false} style={styles.subtitle}>Hallinnoi profiilia, ilmoituksia ja niiden tilaa.</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
            ) : (
              <Ionicons color={colors.primary} name="person-outline" size={34} />
            )}
          </View>

          <View style={styles.accountInfo}>
            <Text allowFontScaling={false} style={styles.cardTitle}>{displayName}</Text>
            <Text allowFontScaling={false} numberOfLines={1} style={styles.emailText}>{session?.user.email ?? 'Sähköpostitili'}</Text>
            <View style={styles.ratingRow}>
              <Text allowFontScaling={false} style={styles.star}>★</Text>
              <Text allowFontScaling={false} style={styles.ratingText}>{Number(profile?.rating_average ?? 0).toFixed(1)}</Text>
              <Text allowFontScaling={false} style={styles.ratingMuted}>({profile?.rating_count ?? 0} arviota)</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatCard label="Ilmoitusta" value={counts.total} />
          <StatCard label="Julkaistu" value={counts.active} />
          <StatCard label="Luonnosta" value={counts.draft} />
        </View>

        <View style={styles.sectionHeader}>
          <Text allowFontScaling={false} style={styles.sectionTitle}>Omat ilmoitukset</Text>
          <Pressable onPress={() => router.push('/(tabs)/add')} style={styles.addButtonSmall}>
            <Ionicons color="#FFFFFF" name="add" size={17} />
            <Text allowFontScaling={false} style={styles.addButtonSmallText}>Lisää</Text>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
          {filters.map((filter) => {
            const selected = selectedFilter === filter.value;

            return (
              <Pressable
                key={filter.value}
                onPress={() => setSelectedFilter(filter.value)}
                style={({ pressed }) => [styles.filterChip, selected && styles.filterChipActive, pressed && styles.pressed]}
              >
                <Text allowFontScaling={false} style={[styles.filterText, selected && styles.filterTextActive]}>{filter.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text allowFontScaling={false} style={styles.stateText}>Ladataan profiilia...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.stateCard}>
            <Ionicons color={colors.primary} name="alert-circle-outline" size={24} />
            <Text allowFontScaling={false} style={styles.stateTitle}>Lataus ei onnistunut</Text>
            <Text allowFontScaling={false} style={styles.stateText}>{errorMessage}</Text>
          </View>
        ) : filteredListings.length === 0 ? (
          <View style={styles.stateCard}>
            <Ionicons color={colors.primary} name="cube-outline" size={25} />
            <Text allowFontScaling={false} style={styles.stateTitle}>Ei ilmoituksia tässä näkymässä</Text>
            <Text allowFontScaling={false} style={styles.stateText}>Luo uusi ilmoitus tai vaihda suodatinta.</Text>
          </View>
        ) : (
          <View style={styles.listingList}>
            {filteredListings.map((listing) => (
              <Pressable
                key={listing.id}
                onPress={() => openListingEditor(listing.id)}
                style={({ pressed }) => [styles.listingCard, pressed && styles.pressed]}
              >
                <View style={styles.thumbnailWrap}>
                  {listing.image_urls[0] ? (
                    <Image source={{ uri: listing.image_urls[0] }} style={styles.thumbnail} />
                  ) : (
                    <Ionicons color={colors.primaryDark} name="image-outline" size={26} />
                  )}
                </View>

                <View style={styles.listingBody}>
                  <View style={styles.listingTopRow}>
                    <Text allowFontScaling={false} numberOfLines={1} style={styles.listingTitle}>{listing.title}</Text>
                    <View style={[styles.statusBadge, statusBadgeStyle(listing.status)]}>
                      <Text allowFontScaling={false} style={[styles.statusBadgeText, statusBadgeTextStyle(listing.status)]}>
                        {statusLabel(listing.status)}
                      </Text>
                    </View>
                  </View>
                  <Text allowFontScaling={false} numberOfLines={1} style={styles.listingMeta}>
                    {listingTypeLabel(listing.listing_type)} • {listing.location_label ?? 'Ei sijaintia'}
                  </Text>
                  <Text allowFontScaling={false} style={styles.listingEditText}>Muokkaa ja hallitse tilaa</Text>
                </View>

                <Ionicons color={colors.textMuted} name="chevron-forward" size={20} />
              </Pressable>
            ))}
          </View>
        )}

        <Pressable
          disabled={signingOut}
          onPress={handleSignOut}
          style={({ pressed }) => [styles.signOutButton, signingOut && styles.disabledButton, pressed && styles.pressed]}
        >
          {signingOut ? (
            <ActivityIndicator color={colors.primaryDark} size="small" />
          ) : (
            <>
              <Ionicons color={colors.primaryDark} name="log-out-outline" size={22} />
              <Text allowFontScaling={false} style={styles.signOutText}>Kirjaudu ulos</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statCard}>
      <Text allowFontScaling={false} style={styles.statValue}>{value}</Text>
      <Text allowFontScaling={false} style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function statusBadgeStyle(status: ListingStatus) {
  if (status === 'active') {
    return styles.statusActive;
  }

  if (status === 'draft') {
    return styles.statusDraft;
  }

  return styles.statusNeutral;
}

function statusBadgeTextStyle(status: ListingStatus) {
  return status === 'active' ? styles.statusActiveText : styles.statusNeutralText;
}

const serifFont = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  content: { paddingBottom: 112, paddingHorizontal: spacing.xl, paddingTop: 34 },
  header: { marginBottom: spacing.xl },
  eyebrow: {
    color: colors.primaryDark,
    fontFamily: serifFont,
    fontSize: 24,
    fontWeight: Platform.OS === 'ios' ? '500' : '400',
    letterSpacing: -0.4,
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.text,
    fontFamily: serifFont,
    fontSize: 40,
    fontWeight: Platform.OS === 'ios' ? '500' : '400',
    letterSpacing: -0.8,
  },
  subtitle: { color: colors.textMuted, fontSize: 16, fontWeight: '600', lineHeight: 23, marginTop: spacing.sm },
  profileCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
  },
  avatarCircle: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radii.pill,
    height: 74,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 74,
  },
  avatarImage: { height: '100%', width: '100%' },
  accountInfo: { flex: 1, gap: 4, minWidth: 0 },
  cardTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
  emailText: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  ratingRow: { alignItems: 'center', flexDirection: 'row', gap: 4, marginTop: 3 },
  star: { color: '#E9B949', fontSize: 13, fontWeight: '900' },
  ratingText: { color: colors.primaryDark, fontSize: 13, fontWeight: '800' },
  ratingMuted: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: spacing.lg },
  statCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 14,
  },
  statValue: { color: colors.primary, fontSize: 22, fontWeight: '900' },
  statLabel: { color: colors.textMuted, fontSize: 11.8, fontWeight: '700', marginTop: 2 },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '900', letterSpacing: -0.25 },
  addButtonSmall: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addButtonSmallText: { color: colors.surface, fontSize: 12.5, fontWeight: '900' },
  filterScroll: { marginHorizontal: -spacing.xl, marginBottom: 14 },
  filterContent: { gap: 8, paddingHorizontal: spacing.xl },
  filterChip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.primaryDark, fontSize: 12.5, fontWeight: '800' },
  filterTextActive: { color: colors.surface },
  listingList: { gap: 10 },
  listingCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 10,
  },
  thumbnailWrap: {
    alignItems: 'center',
    backgroundColor: '#F8F2EA',
    borderRadius: 14,
    height: 66,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 74,
  },
  thumbnail: { height: '100%', resizeMode: 'cover', width: '100%' },
  listingBody: { flex: 1, minWidth: 0 },
  listingTopRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  listingTitle: { color: colors.text, flex: 1, fontSize: 15, fontWeight: '900' },
  statusBadge: { borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 4 },
  statusActive: { backgroundColor: colors.primary },
  statusDraft: { backgroundColor: 'rgba(85, 99, 63, 0.1)' },
  statusNeutral: { backgroundColor: 'rgba(119, 115, 107, 0.12)' },
  statusBadgeText: { fontSize: 10.5, fontWeight: '900' },
  statusActiveText: { color: colors.surface },
  statusNeutralText: { color: colors.primaryDark },
  listingMeta: { color: colors.textMuted, fontSize: 12.2, fontWeight: '700', marginTop: 3 },
  listingEditText: { color: colors.primaryDark, fontSize: 12, fontWeight: '800', marginTop: 4 },
  stateCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: 8,
    padding: spacing.xl,
  },
  stateTitle: { color: colors.text, fontSize: 16, fontWeight: '900', textAlign: 'center' },
  stateText: { color: colors.textMuted, fontSize: 13.5, fontWeight: '600', lineHeight: 20, textAlign: 'center' },
  signOutButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.primaryDark,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    height: 58,
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  signOutText: { color: colors.primaryDark, fontSize: 17, fontWeight: '800' },
  disabledButton: { opacity: 0.65 },
  pressed: { opacity: 0.78 },
});
