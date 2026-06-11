import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/lib/auth';
import { getMyFavoriteListings } from '@/lib/favorites';
import { listingTypeLabel, type ListingStatus, type ListingWithRelations } from '@/lib/listings';
import { getMyListings, statusLabel } from '@/lib/myListings';
import { getMyNotificationEvents } from '@/lib/notificationEvents';
import { getCurrentProfile, type ProfileRecord } from '@/lib/profile';

type ListingFilter = 'active' | 'all' | 'archived' | 'draft';

const filters: { label: string; value: ListingFilter }[] = [
  { label: 'Kaikki', value: 'all' },
  { label: 'Luonnokset', value: 'draft' },
  { label: 'Julkaistut', value: 'active' },
  { label: 'Arkisto', value: 'archived' },
];

const BACKGROUND = '#FFFDF7';
const CARD = 'rgba(255, 253, 249, 0.98)';
const DARK_OLIVE = '#41482C';
const DARK_OLIVE_DARK = '#30361F';
const TEXT = '#20251F';
const MUTED = '#686D66';
const BORDER = 'rgba(229, 218, 206, 0.82)';
const SOFT_GREEN = '#EEF2E6';
const SOFT_BEIGE = '#F4E8D7';

export default function ProfileScreen() {
  const router = useRouter();
  const { session, signOut } = useAuth();
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [listings, setListings] = useState<ListingWithRelations[]>([]);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState<ListingFilter>('all');
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const [profileData, listingData, favoriteData, notificationData] = await Promise.all([
        getCurrentProfile(),
        getMyListings(),
        getMyFavoriteListings(),
        getMyNotificationEvents(40),
      ]);

      setProfile(profileData);
      setListings(listingData);
      setFavoriteCount(favoriteData.length);
      setUnreadNotifications(notificationData.filter((event) => !event.readAt).length);
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
    if (selectedFilter === 'all') return listings;
    if (selectedFilter === 'archived') return listings.filter((listing) => listing.status === 'archived' || listing.status === 'completed');
    return listings.filter((listing) => listing.status === selectedFilter);
  }, [listings, selectedFilter]);

  const counts = useMemo(
    () => ({
      favorites: favoriteCount,
      reviews: Number(profile?.rating_count ?? 0),
      total: listings.length,
    }),
    [favoriteCount, listings.length, profile?.rating_count],
  );

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

  const openSettings = () => {
    Alert.alert('Asetukset', 'Profiilin asetukset viimeistellään myöhemmin. Voit kirjautua ulos tästä.', [
      { style: 'cancel', text: 'Peruuta' },
      { onPress: () => void handleSignOut(), style: 'destructive', text: 'Kirjaudu ulos' },
    ]);
  };

  const openProfileEdit = () => {
    Alert.alert('Profiilin muokkaus', 'Profiilin muokkausnäkymä viimeistellään myöhemmin.');
  };

  const openListingEditor = (listingId: string) => {
    router.push({ pathname: '/listings/edit/[id]', params: { id: listingId } });
  };

  const displayName = profile?.display_name || session?.user.email?.split('@')[0] || 'Neyrlo-käyttäjä';
  const locationLabel = profile?.city ? `${profile.city}, Suomi` : 'Sijainti lisäämättä';
  const ratingAverage = Number(profile?.rating_average ?? 0);
  const ratingCount = Number(profile?.rating_count ?? 0);

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text allowFontScaling={false} style={styles.brand}>NEYRLO</Text>

        <Pressable onPress={openProfileEdit} style={({ pressed }) => [styles.profileCard, pressed && styles.pressed]}>
          <View pointerEvents="none" style={styles.profileDecorLarge} />
          <View pointerEvents="none" style={styles.profileDecorSmall} />

          <View style={styles.avatarWrap}>
            <View style={styles.avatarCircle}>
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
              ) : (
                <Text allowFontScaling={false} style={styles.avatarInitial}>{initialForName(displayName)}</Text>
              )}
            </View>
            <View style={styles.avatarEditButton}>
              <Ionicons color={DARK_OLIVE} name="pencil-outline" size={17} />
            </View>
          </View>

          <View style={styles.profileInfo}>
            <Text allowFontScaling={false} numberOfLines={1} ellipsizeMode="tail" style={styles.profileName}>{displayName}</Text>
            <View style={styles.profileMetaRow}>
              <Ionicons color={MUTED} name="location-outline" size={17} />
              <Text allowFontScaling={false} numberOfLines={1} ellipsizeMode="tail" style={styles.profileLocation}>{locationLabel}</Text>
            </View>
            <View style={styles.profileRatingRow}>
              <Ionicons color="#C89C3A" name="star" size={17} />
              <Text allowFontScaling={false} style={styles.profileRating}>{ratingAverage.toFixed(1).replace('.', ',')}</Text>
              <Text allowFontScaling={false} numberOfLines={1} style={styles.profileRatingMuted}>({ratingCount} arviota)</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <Ionicons color={DARK_OLIVE} name="shield-checkmark-outline" size={15} />
              <Text allowFontScaling={false} numberOfLines={1} style={styles.verifiedText}>{profile?.is_verified ? 'Vahvistettu käyttäjä' : 'Neyrlo-käyttäjä'}</Text>
            </View>
          </View>

          <Ionicons color={MUTED} name="chevron-forward" size={24} style={styles.profileChevron} />
        </Pressable>

        <View style={styles.statsCard}>
          <StatItem icon="reader-outline" label="Ilmoitusta" value={counts.total} />
          <View style={styles.statDivider} />
          <StatItem icon="heart-outline" label="Suosikkia" value={counts.favorites} />
          <View style={styles.statDivider} />
          <StatItem icon="star-outline" label="Arviota" value={counts.reviews} />
        </View>

        <View style={styles.quickCardsRow}>
          <QuickActionCard icon="heart-outline" label="Suosikit" onPress={() => router.push('/favorites')} subtitle="Tallennetut kohteet" />
          <QuickActionCard badge={unreadNotifications} icon="notifications-outline" label="Ilmoitukset" onPress={() => router.push('/notifications')} subtitle="Uudet viestit ja päivitykset" />
          <QuickActionCard icon="settings-outline" label="Asetukset" onPress={openSettings} subtitle="Tilin ja sovelluksen asetukset" />
        </View>

        <View style={styles.sectionHeader}>
          <Text allowFontScaling={false} style={styles.sectionTitle}>Omat ilmoitukset</Text>
          <Pressable onPress={() => router.push('/(tabs)/add')} style={({ pressed }) => [styles.createButton, pressed && styles.pressed]}>
            <Ionicons color={TEXT} name="add" size={17} />
            <Text allowFontScaling={false} style={styles.createButtonText}>Luo uusi ilmoitus</Text>
          </Pressable>
        </View>

        <View style={styles.filterRow}>
          {filters.map((filter) => {
            const selected = selectedFilter === filter.value;

            return (
              <Pressable
                key={filter.value}
                onPress={() => setSelectedFilter(filter.value)}
                style={({ pressed }) => [styles.filterChip, selected && styles.filterChipActive, pressed && styles.pressed]}
              >
                <Text allowFontScaling={false} numberOfLines={1} style={[styles.filterText, selected && styles.filterTextActive]}>{filter.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {loading ? (
          <StateCard icon="person-circle-outline" text="Ladataan profiilia..." />
        ) : errorMessage ? (
          <StateCard icon="alert-circle-outline" title="Lataus ei onnistunut" text={errorMessage} />
        ) : filteredListings.length === 0 ? (
          <View style={styles.stateCard}>
            <Ionicons color={DARK_OLIVE} name="cube-outline" size={26} />
            <Text allowFontScaling={false} style={styles.stateTitle}>Ei ilmoituksia tässä näkymässä</Text>
            <Text allowFontScaling={false} style={styles.stateText}>Luo uusi ilmoitus tai vaihda suodatinta.</Text>
            <Pressable onPress={() => router.push('/(tabs)/add')} style={({ pressed }) => [styles.emptyButton, pressed && styles.pressed]}>
              <Text allowFontScaling={false} style={styles.emptyButtonText}>Luo ensimmäinen ilmoitus</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.listingList}>
            {filteredListings.map((listing) => (
              <ProfileListingCard key={listing.id} listing={listing} onPress={() => openListingEditor(listing.id)} />
            ))}
          </View>
        )}

        <Pressable
          disabled={signingOut}
          onPress={handleSignOut}
          style={({ pressed }) => [styles.signOutButton, signingOut && styles.disabledButton, pressed && styles.pressed]}
        >
          {signingOut ? (
            <ActivityIndicator color={DARK_OLIVE} size="small" />
          ) : (
            <>
              <Ionicons color={DARK_OLIVE} name="log-out-outline" size={19} />
              <Text allowFontScaling={false} style={styles.signOutText}>Kirjaudu ulos</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatItem({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: number }) {
  return (
    <View style={styles.statItem}>
      <View style={styles.statIconCircle}>
        <Ionicons color={DARK_OLIVE} name={icon} size={22} />
      </View>
      <View style={styles.statTextBlock}>
        <Text allowFontScaling={false} style={styles.statValue}>{value}</Text>
        <Text allowFontScaling={false} numberOfLines={1} style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

function QuickActionCard({
  badge,
  icon,
  label,
  onPress,
  subtitle,
}: {
  badge?: number;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  subtitle: string;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.quickCard, pressed && styles.pressed]}>
      <View style={styles.quickIconCircle}>
        <Ionicons color={DARK_OLIVE} name={icon} size={25} />
        {!!badge && (
          <View style={styles.notificationBadge}>
            <Text allowFontScaling={false} style={styles.notificationBadgeText}>{badge > 9 ? '9+' : badge}</Text>
          </View>
        )}
      </View>
      <Text allowFontScaling={false} numberOfLines={1} style={styles.quickTitle}>{label}</Text>
      <Text allowFontScaling={false} numberOfLines={2} style={styles.quickSubtitle}>{subtitle}</Text>
      <Ionicons color={MUTED} name="chevron-forward" size={21} style={styles.quickChevron} />
    </Pressable>
  );
}

function ProfileListingCard({ listing, onPress }: { listing: ListingWithRelations; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.listingCard, pressed && styles.pressed]}>
      <View style={styles.thumbnailWrap}>
        {listing.image_urls[0] ? (
          <Image source={{ uri: listing.image_urls[0] }} style={styles.thumbnail} />
        ) : (
          <Ionicons color={DARK_OLIVE} name="image-outline" size={26} />
        )}
      </View>

      <View style={styles.listingBody}>
        <Text allowFontScaling={false} numberOfLines={1} ellipsizeMode="tail" style={styles.listingTitle}>{listing.title}</Text>
        <View style={styles.listingMetaRow}>
          <Ionicons color={MUTED} name="location-outline" size={14} />
          <Text allowFontScaling={false} numberOfLines={1} ellipsizeMode="tail" style={styles.listingMeta}>{listing.location_label ?? listingTypeLabel(listing.listing_type)}</Text>
        </View>
        <View style={[styles.statusBadge, statusBadgeStyle(listing.status)]}>
          <Text allowFontScaling={false} numberOfLines={1} style={[styles.statusBadgeText, statusBadgeTextStyle(listing.status)]}>{statusLabel(listing.status)}</Text>
        </View>
      </View>

      <View style={styles.listingActions}>
        <Ionicons color={MUTED} name="ellipsis-horizontal" size={22} />
        <View style={styles.listingActionBottom}>
          <Ionicons color={MUTED} name="eye-outline" size={16} />
          <Text allowFontScaling={false} style={styles.viewCountText}>—</Text>
          <Ionicons color={DARK_OLIVE} name="heart-outline" size={22} />
        </View>
      </View>
    </Pressable>
  );
}

function StateCard({ icon, text, title }: { icon: keyof typeof Ionicons.glyphMap; text: string; title?: string }) {
  return (
    <View style={styles.stateCard}>
      <Ionicons color={DARK_OLIVE} name={icon} size={25} />
      {title && <Text allowFontScaling={false} style={styles.stateTitle}>{title}</Text>}
      <Text allowFontScaling={false} style={styles.stateText}>{text}</Text>
    </View>
  );
}

function statusBadgeStyle(status: ListingStatus) {
  if (status === 'active') return styles.statusActive;
  if (status === 'draft') return styles.statusDraft;
  if (status === 'reserved') return styles.statusReserved;
  return styles.statusNeutral;
}

function statusBadgeTextStyle(status: ListingStatus) {
  return status === 'active' ? styles.statusActiveText : styles.statusNeutralText;
}

function initialForName(name: string) {
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed.charAt(0).toUpperCase() : 'N';
}

const serifFont = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

const styles = StyleSheet.create({
  screen: {
    backgroundColor: BACKGROUND,
    flex: 1,
  },
  content: {
    paddingBottom: 122,
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  brand: {
    color: MUTED,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 4,
    marginBottom: 28,
    textAlign: 'center',
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: 26,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 18,
    minHeight: 150,
    overflow: 'hidden',
    padding: 20,
    position: 'relative',
    shadowColor: DARK_OLIVE_DARK,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.07,
    shadowRadius: 18,
    elevation: 3,
  },
  profileDecorLarge: {
    backgroundColor: 'rgba(65, 72, 44, 0.06)',
    borderRadius: 999,
    bottom: -42,
    height: 118,
    position: 'absolute',
    right: -18,
    width: 164,
  },
  profileDecorSmall: {
    backgroundColor: 'rgba(244, 232, 215, 0.65)',
    borderRadius: 999,
    height: 80,
    position: 'absolute',
    right: 72,
    top: 38,
    width: 80,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarCircle: {
    alignItems: 'center',
    backgroundColor: '#E9E0D3',
    borderRadius: 52,
    height: 104,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 104,
  },
  avatarImage: {
    height: '100%',
    resizeMode: 'cover',
    width: '100%',
  },
  avatarInitial: {
    color: DARK_OLIVE,
    fontSize: 34,
    fontWeight: '900',
  },
  avatarEditButton: {
    alignItems: 'center',
    backgroundColor: BACKGROUND,
    borderColor: BORDER,
    borderRadius: 17,
    borderWidth: 1,
    bottom: 2,
    height: 34,
    justifyContent: 'center',
    position: 'absolute',
    right: -2,
    shadowColor: DARK_OLIVE_DARK,
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.09,
    shadowRadius: 8,
    width: 34,
    elevation: 2,
  },
  profileInfo: {
    flex: 1,
    minWidth: 0,
    paddingRight: 24,
  },
  profileName: {
    color: TEXT,
    fontFamily: serifFont,
    fontSize: 27,
    fontWeight: Platform.OS === 'ios' ? '500' : '700',
    letterSpacing: -0.48,
    lineHeight: 32,
  },
  profileMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
    marginTop: 8,
  },
  profileLocation: {
    color: MUTED,
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
  },
  profileRatingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  profileRating: {
    color: TEXT,
    fontSize: 13.5,
    fontWeight: '800',
  },
  profileRatingMuted: {
    color: MUTED,
    flexShrink: 1,
    fontSize: 13.5,
    fontWeight: '600',
  },
  verifiedBadge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: SOFT_GREEN,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
    maxWidth: '100%',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  verifiedText: {
    color: DARK_OLIVE,
    fontSize: 12,
    fontWeight: '700',
  },
  profileChevron: {
    position: 'absolute',
    right: 18,
    top: 24,
  },
  statsCard: {
    alignItems: 'center',
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    height: 82,
    marginTop: 18,
    paddingHorizontal: 18,
    shadowColor: DARK_OLIVE_DARK,
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.045,
    shadowRadius: 14,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  statIconCircle: {
    alignItems: 'center',
    backgroundColor: SOFT_GREEN,
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  statTextBlock: {
    minWidth: 0,
  },
  statValue: {
    color: TEXT,
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    color: MUTED,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  statDivider: {
    backgroundColor: BORDER,
    height: 42,
    width: 1,
  },
  quickCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  quickCard: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: 22,
    borderWidth: 1,
    flex: 1,
    height: 132,
    padding: 16,
    position: 'relative',
    shadowColor: DARK_OLIVE_DARK,
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.045,
    shadowRadius: 14,
    elevation: 2,
  },
  quickIconCircle: {
    alignItems: 'center',
    backgroundColor: SOFT_GREEN,
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  notificationBadge: {
    alignItems: 'center',
    backgroundColor: DARK_OLIVE,
    borderColor: CARD,
    borderRadius: 11,
    borderWidth: 1,
    height: 22,
    justifyContent: 'center',
    position: 'absolute',
    right: -7,
    top: -7,
    width: 22,
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '900',
  },
  quickTitle: {
    color: TEXT,
    fontFamily: serifFont,
    fontSize: 18,
    fontWeight: Platform.OS === 'ios' ? '500' : '700',
    letterSpacing: -0.2,
    marginTop: 14,
  },
  quickSubtitle: {
    color: MUTED,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    marginTop: 5,
    paddingRight: 18,
  },
  quickChevron: {
    bottom: 18,
    position: 'absolute',
    right: 14,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 26,
  },
  sectionTitle: {
    color: TEXT,
    fontFamily: serifFont,
    fontSize: 25,
    fontWeight: Platform.OS === 'ios' ? '500' : '700',
    letterSpacing: -0.4,
    lineHeight: 31,
  },
  createButton: {
    alignItems: 'center',
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 7,
    height: 38,
    paddingHorizontal: 14,
  },
  createButtonText: {
    color: TEXT,
    fontSize: 13,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  filterChip: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,253,249,0.9)',
    borderColor: BORDER,
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    height: 38,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  filterChipActive: {
    backgroundColor: DARK_OLIVE,
    borderColor: DARK_OLIVE,
  },
  filterText: {
    color: MUTED,
    fontSize: 12.4,
    fontWeight: '700',
  },
  filterTextActive: {
    color: BACKGROUND,
  },
  listingList: {
    gap: 12,
    marginTop: 14,
  },
  listingCard: {
    alignItems: 'center',
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    minHeight: 98,
    padding: 10,
    shadowColor: DARK_OLIVE_DARK,
    shadowOffset: { height: 5, width: 0 },
    shadowOpacity: 0.035,
    shadowRadius: 12,
    elevation: 1,
  },
  thumbnailWrap: {
    alignItems: 'center',
    backgroundColor: '#F4EDE5',
    borderRadius: 11,
    height: 76,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 118,
  },
  thumbnail: {
    height: '100%',
    resizeMode: 'cover',
    width: '100%',
  },
  listingBody: {
    flex: 1,
    minWidth: 0,
  },
  listingTitle: {
    color: TEXT,
    fontFamily: serifFont,
    fontSize: 17,
    fontWeight: Platform.OS === 'ios' ? '500' : '700',
    letterSpacing: -0.2,
    lineHeight: 21,
  },
  listingMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    marginTop: 6,
  },
  listingMeta: {
    color: MUTED,
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusActive: {
    backgroundColor: SOFT_GREEN,
  },
  statusDraft: {
    backgroundColor: SOFT_BEIGE,
  },
  statusReserved: {
    backgroundColor: 'rgba(220, 231, 240, 0.88)',
  },
  statusNeutral: {
    backgroundColor: 'rgba(119, 115, 107, 0.12)',
  },
  statusBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  statusActiveText: {
    color: DARK_OLIVE,
  },
  statusNeutralText: {
    color: MUTED,
  },
  listingActions: {
    alignItems: 'flex-end',
    alignSelf: 'stretch',
    justifyContent: 'space-between',
    paddingBottom: 4,
    paddingTop: 2,
  },
  listingActionBottom: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  viewCountText: {
    color: MUTED,
    fontSize: 12,
    fontWeight: '700',
  },
  stateCard: {
    alignItems: 'center',
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    marginTop: 14,
    padding: 24,
  },
  stateTitle: {
    color: TEXT,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  stateText: {
    color: MUTED,
    fontSize: 13.5,
    fontWeight: '600',
    lineHeight: 20,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: DARK_OLIVE,
    borderRadius: 999,
    marginTop: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  signOutButton: {
    alignItems: 'center',
    alignSelf: 'center',
    borderColor: 'rgba(65, 72, 44, 0.18)',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 7,
    height: 44,
    justifyContent: 'center',
    marginTop: 22,
    paddingHorizontal: 18,
  },
  signOutText: {
    color: DARK_OLIVE,
    fontSize: 13.5,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.65,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
});
