import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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
const GREEN = '#55633F';
const GREEN_DARK = '#3F4E2F';
const TEXT = '#20251F';
const MUTED = '#77736B';
const BORDER = 'rgba(64, 80, 48, 0.13)';
const CARD = 'rgba(255, 253, 247, 0.92)';

const categoryLabels: Record<string, string> = {
  electronics: 'Elektroniikka',
  events: 'Juhlat',
  home: 'Koti',
  kids: 'Lapset',
  outdoors: 'Ulkoilu',
  sports: 'Urheilu',
  tools: 'Työkalut',
  travel: 'Matkustus',
};

export default function ReviewListingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ listingId?: string }>();
  const listingId = Array.isArray(params.listingId) ? params.listingId[0] : params.listingId;
  const [listing, setListing] = useState<ListingWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const missingFields = useMemo(() => (listing ? getPublishMissingFields(listing) : []), [listing]);
  const canPublish = !!listing && missingFields.length === 0 && !publishing;

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

  const primaryImage = listing?.image_urls[0];
  const categoryLabel = listing?.category_id ? categoryLabels[listing.category_id] ?? 'Muu' : 'Ei valittu';
  const locationLabel = listing?.location_label ?? 'Ei valittu';

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel="Takaisin"
          hitSlop={12}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
        >
          <Ionicons color={TEXT} name="chevron-back" size={27} />
        </Pressable>
        <Text allowFontScaling={false} style={styles.pageTitle}>Tarkista ilmoitus</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={GREEN} size="small" />
          <Text allowFontScaling={false} style={styles.loadingText}>Ladataan luonnosta...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {primaryImage ? (
            <Image source={{ uri: primaryImage }} style={styles.heroImage} />
          ) : (
            <View style={styles.emptyImage}>
              <Ionicons color={GREEN_DARK} name="image-outline" size={42} />
              <Text allowFontScaling={false} style={styles.emptyImageText}>Ei kuvia vielä</Text>
            </View>
          )}

          {!!listing && (
            <>
              <View style={styles.titleCard}>
                <View style={styles.statusRow}>
                  <Text allowFontScaling={false} style={styles.statusText}>
                    {listing.status === 'active' ? 'Julkaistu' : 'Luonnos'}
                  </Text>
                  <Text allowFontScaling={false} style={styles.statusDot}>•</Text>
                  <Text allowFontScaling={false} style={styles.statusText}>{listingTypeLabel(listing.listing_type)}</Text>
                </View>
                <Text allowFontScaling={false} style={styles.listingTitle}>{listing.title}</Text>
                <Text allowFontScaling={false} style={styles.ownerText}>{listing.owner_name}</Text>
              </View>

              <View style={styles.infoGrid}>
                <InfoCard icon="grid-outline" label="Kategoria" value={categoryLabel} />
                <InfoCard icon="location-outline" label="Sijainti" value={locationLabel} />
                <InfoCard icon="cash-outline" label="Korvaus" value={formatPrice(listing.price_amount)} />
                <InfoCard icon="images-outline" label="Kuvat" value={`${listing.image_urls.length}/10`} />
              </View>

              <View style={styles.descriptionCard}>
                <Text allowFontScaling={false} style={styles.sectionTitle}>Kuvaus</Text>
                <Text allowFontScaling={false} style={styles.descriptionText}>
                  {listing.description || 'Kuvaus puuttuu.'}
                </Text>
              </View>

              {missingFields.length > 0 && (
                <View style={styles.warningCard}>
                  <Ionicons color={GREEN_DARK} name="alert-circle-outline" size={21} />
                  <Text allowFontScaling={false} style={styles.warningText}>
                    Täydennä ennen julkaisua: {missingFields.join(', ')}.
                  </Text>
                </View>
              )}

              {!!feedback && (
                <View style={styles.feedbackCard}>
                  <Ionicons color={GREEN_DARK} name="information-circle-outline" size={20} />
                  <Text allowFontScaling={false} style={styles.feedbackText}>{feedback}</Text>
                </View>
              )}

              {listing.status === 'active' ? (
                <Pressable onPress={() => router.replace('/(tabs)/browse')} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
                  <Text allowFontScaling={false} style={styles.primaryButtonText}>Katso selaa-näkymässä</Text>
                </Pressable>
              ) : (
                <Pressable
                  disabled={!canPublish}
                  onPress={handlePublish}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    !canPublish && styles.disabledButton,
                    pressed && styles.pressed,
                  ]}
                >
                  {publishing ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text allowFontScaling={false} style={styles.primaryButtonText}>Julkaise ilmoitus</Text>
                  )}
                </Pressable>
              )}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function InfoCard({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.infoCard}>
      <Ionicons color={GREEN_DARK} name={icon} size={22} />
      <Text allowFontScaling={false} style={styles.infoLabel}>{label}</Text>
      <Text allowFontScaling={false} numberOfLines={1} style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function formatPrice(price: number | null) {
  if (price === null || price === undefined) {
    return 'Ei korvausta';
  }

  return `${price.toFixed(2).replace('.', ',')} €`;
}

const serifFont = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

const styles = StyleSheet.create({
  screen: {
    backgroundColor: BACKGROUND,
    flex: 1,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 253, 247, 0.88)',
    borderColor: BORDER,
    borderRadius: 14,
    borderWidth: 1,
    height: 45,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.045,
    shadowRadius: 12,
    width: 45,
  },
  pageTitle: {
    color: TEXT,
    fontFamily: serifFont,
    fontSize: 28,
    fontWeight: Platform.OS === 'ios' ? '500' : '400',
    letterSpacing: -0.35,
  },
  headerSpacer: {
    width: 45,
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
    fontWeight: '600',
  },
  content: {
    paddingBottom: 30,
    paddingHorizontal: 24,
    paddingTop: 22,
  },
  heroImage: {
    backgroundColor: '#F8F2EA',
    borderRadius: 24,
    height: 236,
    width: '100%',
  },
  emptyImage: {
    alignItems: 'center',
    backgroundColor: '#F8F2EA',
    borderColor: 'rgba(85, 99, 63, 0.22)',
    borderRadius: 24,
    borderStyle: 'dashed',
    borderWidth: 1.2,
    height: 220,
    justifyContent: 'center',
  },
  emptyImageText: {
    color: GREEN_DARK,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 8,
  },
  titleCard: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 16,
    padding: 18,
  },
  statusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  statusText: {
    color: GREEN_DARK,
    fontSize: 12.5,
    fontWeight: '800',
  },
  statusDot: {
    color: GREEN_DARK,
    fontSize: 12,
    fontWeight: '900',
  },
  listingTitle: {
    color: TEXT,
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  ownerText: {
    color: MUTED,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 5,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  infoCard: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: 17,
    borderWidth: 1,
    flexGrow: 1,
    minHeight: 88,
    padding: 14,
    width: '47%',
  },
  infoLabel: {
    color: TEXT,
    fontSize: 13.5,
    fontWeight: '800',
    marginTop: 8,
  },
  infoValue: {
    color: MUTED,
    fontSize: 13.2,
    fontWeight: '600',
    marginTop: 3,
  },
  descriptionCard: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 12,
    padding: 18,
  },
  sectionTitle: {
    color: TEXT,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 8,
  },
  descriptionText: {
    color: MUTED,
    fontSize: 14.5,
    fontWeight: '600',
    lineHeight: 21,
  },
  warningCard: {
    alignItems: 'flex-start',
    backgroundColor: 'rgba(85, 99, 63, 0.08)',
    borderColor: 'rgba(85, 99, 63, 0.18)',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 9,
    marginTop: 14,
    padding: 13,
  },
  warningText: {
    color: GREEN_DARK,
    flex: 1,
    fontSize: 13.5,
    fontWeight: '700',
    lineHeight: 19,
  },
  feedbackCard: {
    alignItems: 'flex-start',
    backgroundColor: 'rgba(85, 99, 63, 0.08)',
    borderColor: 'rgba(85, 99, 63, 0.18)',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 9,
    marginTop: 14,
    padding: 13,
  },
  feedbackText: {
    color: GREEN_DARK,
    flex: 1,
    fontSize: 13.5,
    fontWeight: '700',
    lineHeight: 19,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: GREEN,
    borderRadius: 17,
    height: 60,
    justifyContent: 'center',
    marginTop: 18,
  },
  disabledButton: {
    opacity: 0.45,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.78,
  },
});
