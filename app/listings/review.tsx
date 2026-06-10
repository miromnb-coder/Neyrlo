import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getListingForReview,
  getPublishMissingFields,
  listingTypeLabel,
  publishListing,
  type ListingWithRelations,
} from '@/lib/listings';

const BACKGROUND = '#FFFDF7';
const DARK_OLIVE = '#41482C';
const DARK_OLIVE_DARK = '#30361F';
const TEXT = '#20251F';
const MUTED = '#686D66';
const BORDER = 'rgba(229, 218, 206, 0.82)';
const CARD = 'rgba(255, 253, 249, 0.96)';
const SOFT_GREEN = '#EEF2E6';
const SOFT_BEIGE = '#F4E8D7';

const categoryLabels: Record<string, string> = {
  electronics: 'Elektroniikka',
  events: 'Juhlat',
  home: 'Koti',
  kids: 'Lapset',
  outdoors: 'Retkeily ja ulkoilu',
  sports: 'Urheilu ja pyörät',
  tools: 'Työkalut ja remontti',
  travel: 'Matkustus',
};

export default function ReviewListingScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ listingId?: string }>();
  const listingId = Array.isArray(params.listingId) ? params.listingId[0] : params.listingId;
  const [listing, setListing] = useState<ListingWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const heroWidth = width - 48;
  const missingFields = useMemo(() => (listing ? getPublishMissingFields(listing) : []), [listing]);
  const canPublish = !!listing && missingFields.length === 0 && !publishing;
  const images = listing?.image_urls ?? [];
  const categoryLabel = listing?.category_id ? categoryLabels[listing.category_id] ?? 'Muu' : 'Ei valittu';
  const locationLabel = listing?.location_label ?? 'Ei valittu';
  const statusLabel = listing?.status === 'active' ? 'Julkaistu' : 'Luonnos';

  const loadListing = useCallback(async () => {
    if (!listingId) {
      setFeedback('Ilmoituksen tunniste puuttuu.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const data = await getListingForReview(listingId);
      setListing(data);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Ilmoituksen lataus ei onnistunut.');
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    void loadListing();
  }, [loadListing]);

  const handlePublish = async () => {
    if (!listing || !canPublish) {
      if (missingFields.length > 0) {
        setFeedback(`Täydennä ennen julkaisua: ${missingFields.join(', ')}.`);
      }
      return;
    }

    setPublishing(true);
    setFeedback(null);

    try {
      const publishedListing = await publishListing(listing.id);
      setListing(publishedListing);
      setFeedback('Ilmoitus julkaistu. Se näkyy nyt Selaa- ja Kartta-näkymissä.');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Julkaisu ei onnistunut.');
    } finally {
      setPublishing(false);
    }
  };

  const handleImageScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / heroWidth);
    setActiveImageIndex(nextIndex);
  };

  const openEdit = () => {
    if (!listing) return;
    router.push({ pathname: '/listings/edit/[id]', params: { id: listing.id } });
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Takaisin" hitSlop={12} onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Ionicons color={TEXT} name="arrow-back" size={22} />
        </Pressable>
        <Text allowFontScaling={false} style={styles.brand}>NEYRLO</Text>
        <Text allowFontScaling={false} numberOfLines={1} style={styles.pageTitle}>Tarkista ilmoitus</Text>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={DARK_OLIVE} size="small" />
          <Text allowFontScaling={false} style={styles.loadingText}>Ladataan luonnosta...</Text>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.heroWrap}>
              {images.length > 0 ? (
                <ScrollView
                  horizontal
                  onMomentumScrollEnd={handleImageScroll}
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  style={styles.heroScroller}
                >
                  {images.map((uri) => (
                    <Image key={uri} source={{ uri }} style={[styles.heroImage, { width: heroWidth }]} />
                  ))}
                </ScrollView>
              ) : (
                <View style={[styles.emptyImage, { width: heroWidth }]}> 
                  <Ionicons color={DARK_OLIVE} name="image-outline" size={40} />
                  <Text allowFontScaling={false} style={styles.emptyImageText}>Ei kuvia vielä</Text>
                </View>
              )}

              {images.length > 0 && (
                <View style={styles.imageCountBadge}>
                  <Text allowFontScaling={false} style={styles.imageCountText}>{activeImageIndex + 1}/{images.length}</Text>
                </View>
              )}
            </View>

            {images.length > 1 && (
              <View style={styles.dotsRow}>
                {images.map((uri, index) => (
                  <View key={`${uri}-${index}`} style={[styles.dot, index === activeImageIndex && styles.activeDot]} />
                ))}
              </View>
            )}

            {!!listing && (
              <View style={[styles.summaryCard, images.length <= 1 && styles.summaryCardWithoutDots]}>
                <View style={styles.pillRow}>
                  <View style={[styles.statusPill, statusLabel === 'Luonnos' && styles.draftPill]}>
                    <Text allowFontScaling={false} style={[styles.statusPillText, statusLabel === 'Luonnos' && styles.draftPillText]}>{statusLabel}</Text>
                  </View>
                  <View style={styles.typePill}>
                    <Text allowFontScaling={false} style={styles.typePillText}>{listingTypeLabel(listing.listing_type)}</Text>
                  </View>
                </View>

                <Text allowFontScaling={false} numberOfLines={2} style={styles.listingTitle}>{listing.title || 'Nimetön ilmoitus'}</Text>

                <View style={styles.ownerRow}>
                  <View style={styles.ownerAvatar}>
                    <Text allowFontScaling={false} style={styles.ownerInitial}>{initialForName(listing.owner_name)}</Text>
                  </View>
                  <Text allowFontScaling={false} numberOfLines={1} style={styles.ownerName}>{shortName(listing.owner_name)}</Text>
                </View>

                <View style={styles.infoGrid}>
                  <InfoCard icon="pricetag-outline" label="Kategoria" subLabel="" value={categoryLabel} />
                  <InfoCard icon="location-outline" label="Sijainti" subLabel="0,6 km päässä" value={locationLabel} />
                  <InfoCard icon="cash-outline" label="Korvaus" subLabel={priceSubLabel(listing.price_amount)} value={formatPrice(listing.price_amount, listing.listing_type)} />
                  <InfoCard icon="images-outline" label="Kuvat" subLabel="Lisättynä" value={`${images.length} ${images.length === 1 ? 'kuva' : 'kuvaa'}`} />
                </View>

                <View style={styles.descriptionCard}>
                  <Text allowFontScaling={false} style={styles.descriptionTitle}>Kuvaus</Text>
                  <Text allowFontScaling={false} style={styles.descriptionText}>{listing.description || 'Kuvaus puuttuu.'}</Text>
                </View>

                {missingFields.length > 0 && (
                  <View style={styles.warningCard}>
                    <Ionicons color={DARK_OLIVE} name="alert-circle-outline" size={20} />
                    <Text allowFontScaling={false} style={styles.warningText}>Täydennä ennen julkaisua: {missingFields.join(', ')}.</Text>
                  </View>
                )}

                {!!feedback && (
                  <View style={styles.feedbackCard}>
                    <Ionicons color={DARK_OLIVE} name="information-circle-outline" size={20} />
                    <Text allowFontScaling={false} style={styles.feedbackText}>{feedback}</Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {!!listing && (
            <View style={styles.actionBar}>
              <Pressable onPress={openEdit} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
                <Ionicons color={DARK_OLIVE} name="pencil-outline" size={21} />
                <Text allowFontScaling={false} style={styles.secondaryButtonText}>Muokkaa</Text>
              </Pressable>

              {listing.status === 'active' ? (
                <Pressable onPress={() => router.replace('/(tabs)/browse')} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
                  <Ionicons color="#FFFFFF" name="open-outline" size={21} />
                  <Text allowFontScaling={false} style={styles.primaryButtonText}>Avaa</Text>
                </Pressable>
              ) : (
                <Pressable disabled={!canPublish} onPress={handlePublish} style={({ pressed }) => [styles.primaryButton, !canPublish && styles.disabledButton, pressed && styles.pressed]}>
                  {publishing ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Ionicons color="#FFFFFF" name="share-outline" size={22} />
                      <Text allowFontScaling={false} style={styles.primaryButtonText}>Julkaise</Text>
                    </>
                  )}
                </Pressable>
              )}
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

function InfoCard({ icon, label, subLabel, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; subLabel?: string; value: string }) {
  return (
    <View style={styles.infoCard}>
      <View style={styles.infoIconCircle}>
        <Ionicons color={DARK_OLIVE} name={icon} size={21} />
      </View>
      <View style={styles.infoTextWrap}>
        <Text allowFontScaling={false} numberOfLines={1} style={styles.infoLabel}>{label}</Text>
        <Text allowFontScaling={false} numberOfLines={2} style={styles.infoValue}>{value}</Text>
        {!!subLabel && <Text allowFontScaling={false} numberOfLines={1} style={styles.infoSubValue}>{subLabel}</Text>}
      </View>
    </View>
  );
}

function formatPrice(price: number | null, type: ListingWithRelations['listing_type']) {
  if (price === null || price === undefined || price === 0) {
    return type === 'rent' ? 'Sopimuksen mukaan' : 'Ei korvausta';
  }

  if (type === 'rent') {
    return `Päiväkorvaus ${Math.round(price)} €`;
  }

  return `${price.toFixed(2).replace('.', ',')} €`;
}

function priceSubLabel(price: number | null) {
  return price === null || price === undefined || price === 0 ? 'Vapaa lainaus' : 'Tai sopimuksen mukaan';
}

function initialForName(name: string) {
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed.charAt(0).toUpperCase() : 'N';
}

function shortName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return name || 'Neyrlo-käyttäjä';
  return `${parts[0]} ${parts[1].charAt(0)}.`;
}

const serifFont = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

const styles = StyleSheet.create({
  screen: {
    backgroundColor: BACKGROUND,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    minHeight: 122,
    paddingHorizontal: 24,
    paddingTop: 6,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 253, 247, 0.95)',
    borderColor: BORDER,
    borderRadius: 999,
    borderWidth: 1,
    height: 50,
    justifyContent: 'center',
    left: 24,
    position: 'absolute',
    shadowColor: '#1F261B',
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 13,
    top: 39,
    width: 50,
    zIndex: 2,
  },
  brand: {
    color: DARK_OLIVE,
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 4.2,
    textAlign: 'center',
  },
  pageTitle: {
    color: TEXT,
    fontFamily: serifFont,
    fontSize: 27,
    fontWeight: Platform.OS === 'ios' ? '500' : '700',
    letterSpacing: -0.45,
    lineHeight: 33,
    marginTop: 31,
    maxWidth: '78%',
    textAlign: 'center',
  },
  loadingWrap: {
    alignItems: 'center',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
  },
  loadingText: {
    color: MUTED,
    fontSize: 14,
    fontWeight: '650',
  },
  content: {
    paddingBottom: 128,
    paddingHorizontal: 24,
  },
  heroWrap: {
    borderRadius: 23,
    height: 236,
    overflow: 'hidden',
    position: 'relative',
  },
  heroScroller: {
    borderRadius: 23,
  },
  heroImage: {
    backgroundColor: '#F4EDE5',
    borderRadius: 23,
    height: 236,
    resizeMode: 'cover',
  },
  emptyImage: {
    alignItems: 'center',
    backgroundColor: '#F4EDE5',
    borderColor: 'rgba(65, 72, 44, 0.18)',
    borderRadius: 23,
    borderStyle: 'dashed',
    borderWidth: 1.1,
    height: 236,
    justifyContent: 'center',
  },
  emptyImageText: {
    color: DARK_OLIVE,
    fontSize: 14.5,
    fontWeight: '750',
    marginTop: 8,
  },
  imageCountBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(32, 37, 31, 0.64)',
    borderRadius: 999,
    bottom: 18,
    height: 32,
    justifyContent: 'center',
    left: '50%',
    marginLeft: -29,
    position: 'absolute',
    width: 58,
  },
  imageCountText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '750',
  },
  dotsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 13,
    marginTop: 11,
  },
  dot: {
    backgroundColor: 'rgba(104, 109, 102, 0.20)',
    borderRadius: 999,
    height: 9,
    width: 9,
  },
  activeDot: {
    backgroundColor: DARK_OLIVE,
  },
  summaryCard: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: 23,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#1F261B',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
  },
  summaryCardWithoutDots: {
    marginTop: 10,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statusPill: {
    backgroundColor: SOFT_GREEN,
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  draftPill: {
    backgroundColor: SOFT_BEIGE,
  },
  statusPillText: {
    color: DARK_OLIVE,
    fontSize: 12.3,
    fontWeight: '750',
  },
  draftPillText: {
    color: '#7B5A2B',
  },
  typePill: {
    backgroundColor: SOFT_GREEN,
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  typePillText: {
    color: DARK_OLIVE,
    fontSize: 12.3,
    fontWeight: '750',
  },
  listingTitle: {
    color: TEXT,
    fontFamily: serifFont,
    fontSize: 29,
    fontWeight: Platform.OS === 'ios' ? '500' : '700',
    letterSpacing: -0.52,
    lineHeight: 35,
  },
  ownerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 11,
    marginTop: 15,
  },
  ownerAvatar: {
    alignItems: 'center',
    backgroundColor: '#E9E0D3',
    borderColor: 'rgba(65, 72, 44, 0.10)',
    borderRadius: 999,
    borderWidth: 1,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  ownerInitial: {
    color: DARK_OLIVE,
    fontSize: 17,
    fontWeight: '900',
  },
  ownerName: {
    color: TEXT,
    flex: 1,
    fontSize: 16,
    fontWeight: '650',
  },
  infoGrid: {
    columnGap: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 20,
    rowGap: 12,
  },
  infoCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 253, 247, 0.74)',
    borderColor: BORDER,
    borderRadius: 16,
    borderWidth: 1,
    flexBasis: '48%',
    flexDirection: 'row',
    gap: 10,
    minHeight: 100,
    padding: 13,
  },
  infoIconCircle: {
    alignItems: 'center',
    backgroundColor: SOFT_GREEN,
    borderRadius: 999,
    height: 45,
    justifyContent: 'center',
    width: 45,
  },
  infoTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  infoLabel: {
    color: MUTED,
    fontSize: 12.2,
    fontWeight: '650',
  },
  infoValue: {
    color: TEXT,
    fontSize: 14.1,
    fontWeight: '800',
    lineHeight: 18,
    marginTop: 2,
  },
  infoSubValue: {
    color: MUTED,
    fontSize: 11.6,
    fontWeight: '600',
    marginTop: 4,
  },
  descriptionCard: {
    backgroundColor: 'rgba(255, 253, 247, 0.74)',
    borderColor: BORDER,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 14,
    padding: 17,
  },
  descriptionTitle: {
    color: TEXT,
    fontSize: 15.5,
    fontWeight: '850',
    marginBottom: 9,
  },
  descriptionText: {
    color: '#3C4039',
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
  },
  warningCard: {
    alignItems: 'flex-start',
    backgroundColor: 'rgba(244, 232, 215, 0.72)',
    borderColor: 'rgba(123, 90, 43, 0.14)',
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 9,
    marginTop: 14,
    padding: 14,
  },
  warningText: {
    color: '#7B5A2B',
    flex: 1,
    fontSize: 13,
    fontWeight: '650',
    lineHeight: 19,
  },
  feedbackCard: {
    alignItems: 'flex-start',
    backgroundColor: 'rgba(238, 242, 230, 0.80)',
    borderColor: 'rgba(65, 72, 44, 0.13)',
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 9,
    marginTop: 14,
    padding: 14,
  },
  feedbackText: {
    color: DARK_OLIVE,
    flex: 1,
    fontSize: 13,
    fontWeight: '650',
    lineHeight: 19,
  },
  actionBar: {
    backgroundColor: 'rgba(255, 253, 247, 0.96)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    bottom: 0,
    flexDirection: 'row',
    gap: 12,
    left: 0,
    paddingBottom: Platform.OS === 'ios' ? 23 : 16,
    paddingHorizontal: 24,
    paddingTop: 18,
    position: 'absolute',
    right: 0,
    shadowColor: '#1F261B',
    shadowOffset: { height: -7, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 253, 247, 0.94)',
    borderColor: 'rgba(65, 72, 44, 0.28)',
    borderRadius: 15,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    height: 58,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: DARK_OLIVE,
    fontSize: 16.2,
    fontWeight: '800',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: DARK_OLIVE,
    borderRadius: 15,
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    height: 58,
    justifyContent: 'center',
    shadowColor: DARK_OLIVE_DARK,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16.2,
    fontWeight: '850',
  },
  disabledButton: {
    opacity: 0.68,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },
});
