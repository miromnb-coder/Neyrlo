import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ItemCard } from '@/components/ItemCard';
import {
  createDateOptions,
  dateRangeContains,
  dateRangesOverlap,
  formatDateRange,
  getListingAvailability,
  getReservedDateRanges,
  type ListingAvailabilityRange,
  type ReservedDateRange,
} from '@/lib/availability';
import { useAuth } from '@/lib/auth';
import { isListingFavorite, toggleFavorite } from '@/lib/favorites';
import {
  getActiveListings,
  getListingForReview,
  listingToNearbyItem,
  listingTypeLabel,
  type ListingWithRelations,
} from '@/lib/listings';
import { createContactForListing } from '@/lib/messages';
import { blockUser, createReview, reportListing, type ReportReason } from '@/lib/safety';
import type { NearbyItem } from '@/types/item';

const BACKGROUND = '#FFFDF7';
const GREEN = '#55633F';
const GREEN_DARK = '#3F4E2F';
const TEXT = '#20251F';
const MUTED = '#77736B';
const BORDER = 'rgba(64, 80, 48, 0.13)';
const CARD = 'rgba(255, 253, 247, 0.94)';

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

const reportReasons: { label: string; value: ReportReason }[] = [
  { label: 'Roskaposti', value: 'spam' },
  { label: 'Huijaus', value: 'scam' },
  { label: 'Sopimaton sisältö', value: 'inappropriate' },
  { label: 'Turvaton ilmoitus', value: 'unsafe' },
  { label: 'Muu syy', value: 'other' },
];

export default function ListingDetailsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const params = useLocalSearchParams<{ id?: string }>();
  const listingId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [listing, setListing] = useState<ListingWithRelations | null>(null);
  const [similarItems, setSimilarItems] = useState<NearbyItem[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('Hei! Onko tämä vielä saatavilla?');
  const [reviewComment, setReviewComment] = useState('Kiitos sujuvasta lainaamisesta!');
  const [reviewRating, setReviewRating] = useState(5);
  const [isFavorite, setIsFavorite] = useState(false);
  const [sending, setSending] = useState(false);
  const [safetyLoading, setSafetyLoading] = useState(false);
  const [availabilityRanges, setAvailabilityRanges] = useState<ListingAvailabilityRange[]>([]);
  const [reservedRanges, setReservedRanges] = useState<ReservedDateRange[]>([]);
  const [selectedStartDate, setSelectedStartDate] = useState<string | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const isOwnListing = !!listing && listing.owner_id === session?.user.id;
  const categoryLabel = listing?.category_id ? categoryLabels[listing.category_id] ?? 'Muu' : 'Muu';
  const imageUrl = listing?.image_urls[selectedImageIndex] ?? listing?.image_urls[0];
  const dateOptions = useMemo(() => createDateOptions(21), []);
  const unavailableDateValues = useMemo(
    () =>
      new Set(
        dateOptions
          .filter((option) => {
            const isReserved = reservedRanges.some((range) => dateRangesOverlap(option.value, option.value, range.startDate, range.endDate));
            const isBlocked = availabilityRanges.some((range) => range.status === 'blocked' && dateRangesOverlap(option.value, option.value, range.startDate, range.endDate));
            const availableRanges = availabilityRanges.filter((range) => range.status === 'available');
            const isOutsideAvailableRanges =
              availableRanges.length > 0 && !availableRanges.some((range) => dateRangeContains(range.startDate, range.endDate, option.value, option.value));

            return isReserved || isBlocked || isOutsideAvailableRanges;
          })
          .map((option) => option.value),
      ),
    [availabilityRanges, dateOptions, reservedRanges],
  );
  const isSelectedRangeUnavailable = useMemo(() => {
    if (!selectedStartDate || !selectedEndDate) return false;

    const hasUnavailableDate = dateOptions.some(
      (option) => option.value >= selectedStartDate && option.value <= selectedEndDate && unavailableDateValues.has(option.value),
    );

    const hasReservedOverlap = reservedRanges.some((range) => dateRangesOverlap(selectedStartDate, selectedEndDate, range.startDate, range.endDate));
    const hasBlockedOverlap = availabilityRanges.some(
      (range) => range.status === 'blocked' && dateRangesOverlap(selectedStartDate, selectedEndDate, range.startDate, range.endDate),
    );
    const availableRanges = availabilityRanges.filter((range) => range.status === 'available');
    const isOutsideAvailableRanges =
      availableRanges.length > 0 && !availableRanges.some((range) => dateRangeContains(range.startDate, range.endDate, selectedStartDate, selectedEndDate));

    return hasUnavailableDate || hasReservedOverlap || hasBlockedOverlap || isOutsideAvailableRanges;
  }, [availabilityRanges, dateOptions, reservedRanges, selectedEndDate, selectedStartDate, unavailableDateValues]);
  const selectedRangeLabel = selectedStartDate && selectedEndDate ? formatDateRange(selectedStartDate, selectedEndDate) : 'Valitse aloitus- ja palautuspäivä';
  const contactButtonLabel = useMemo(() => {
    if (!listing) return 'Ota yhteyttä';

    switch (listing.listing_type) {
      case 'rent': return 'Kysy vuokrausta';
      case 'swap': return 'Ehdota vaihtoa';
      case 'free': return 'Kysy tavarasta';
      case 'borrow':
      default: return 'Pyydä lainaan';
    }
  }, [listing]);

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
      setSelectedImageIndex(0);
      setIsFavorite(await isListingFavorite(listingId));

      const [activeListings, availabilityData, reservedData] = await Promise.all([
        getActiveListings(30),
        getListingAvailability(listingId),
        getReservedDateRanges(listingId),
      ]);

      setAvailabilityRanges(availabilityData);
      setReservedRanges(reservedData);
      setSimilarItems(
        activeListings
          .filter((item) => item.id !== data.id && (!!data.category_id ? item.category_id === data.category_id : true))
          .slice(0, 4)
          .map(listingToNearbyItem),
      );
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Ilmoituksen lataus ei onnistunut.');
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    void loadListing();
  }, [loadListing]);

  const handleDateSelect = (dateValue: string) => {
    if (unavailableDateValues.has(dateValue)) {
      setFeedback('Tämä päivä ei ole saatavilla.');
      return;
    }

    setFeedback(null);

    if (!selectedStartDate || selectedEndDate) {
      setSelectedStartDate(dateValue);
      setSelectedEndDate(null);
      return;
    }

    if (dateValue < selectedStartDate) {
      setSelectedStartDate(dateValue);
      setSelectedEndDate(null);
      return;
    }

    setSelectedEndDate(dateValue);
  };

  const handleFavorite = async () => {
    if (!listing || safetyLoading) return;

    setSafetyLoading(true);
    setFeedback(null);

    try {
      const nextFavoriteState = await toggleFavorite(listing.id);
      setIsFavorite(nextFavoriteState);
      setFeedback(nextFavoriteState ? 'Ilmoitus lisätty suosikkeihin.' : 'Ilmoitus poistettu suosikeista.');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Suosikin päivitys ei onnistunut.');
    } finally {
      setSafetyLoading(false);
    }
  };

  const handleContact = async () => {
    if (!listing || sending || isOwnListing) return;

    if (!selectedStartDate || !selectedEndDate) {
      setFeedback('Valitse aloitus- ja palautuspäivä ennen pyynnön lähettämistä.');
      return;
    }

    if (isSelectedRangeUnavailable) {
      setFeedback('Valittu ajankohta ei ole saatavilla. Valitse toinen jakso.');
      return;
    }

    setSending(true);
    setFeedback(null);

    try {
      const conversationId = await createContactForListing({
        endDate: selectedEndDate,
        listingId: listing.id,
        message,
        startDate: selectedStartDate,
      });
      router.push({ pathname: '/messages/[id]', params: { id: conversationId } });
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Yhteydenotto ei onnistunut.');
    } finally {
      setSending(false);
    }
  };

  const submitReport = async (reason: ReportReason) => {
    if (!listing || safetyLoading) return;

    setSafetyLoading(true);
    setFeedback(null);

    try {
      await reportListing({
        details: `Raportoitu sovelluksesta: ${listing.title}`,
        listingId: listing.id,
        reason,
        reportedUserId: listing.owner_id,
      });
      setFeedback('Raportti lähetetty. Kiitos, että autat pitämään Neyrlon turvallisena.');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Raportointi ei onnistunut.');
    } finally {
      setSafetyLoading(false);
    }
  };

  const openReportMenu = () => {
    if (!listing) return;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          cancelButtonIndex: reportReasons.length,
          options: [...reportReasons.map((reason) => reason.label), 'Peruuta'],
          title: 'Raportoi ilmoitus',
        },
        (buttonIndex) => {
          const selectedReason = reportReasons[buttonIndex];
          if (selectedReason) void submitReport(selectedReason.value);
        },
      );
      return;
    }

    Alert.alert('Raportoi ilmoitus', 'Valitse syy raportille.', [
      ...reportReasons.map((reason) => ({ onPress: () => void submitReport(reason.value), text: reason.label })),
      { style: 'cancel' as const, text: 'Peruuta' },
    ]);
  };

  const handleBlockUser = () => {
    if (!listing) return;

    Alert.alert('Blokkaa käyttäjä?', 'Käyttäjä tallennetaan blokkilistallesi.', [
      { style: 'cancel', text: 'Peruuta' },
      {
        onPress: async () => {
          setSafetyLoading(true);
          setFeedback(null);
          try {
            await blockUser(listing.owner_id);
            setFeedback('Käyttäjä blokattu.');
          } catch (error) {
            setFeedback(error instanceof Error ? error.message : 'Blokkaus ei onnistunut.');
          } finally {
            setSafetyLoading(false);
          }
        },
        style: 'destructive',
        text: 'Blokkaa',
      },
    ]);
  };

  const handleReview = async () => {
    if (!listing || safetyLoading || isOwnListing) return;

    setSafetyLoading(true);
    setFeedback(null);

    try {
      await createReview({
        comment: reviewComment,
        listingId: listing.id,
        rating: reviewRating,
        revieweeId: listing.owner_id,
      });
      setFeedback('Arvio tallennettu.');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Arvion tallennus ei onnistunut.');
    } finally {
      setSafetyLoading(false);
    }
  };

  const openOwnerProfile = () => {
    if (!listing) return;
    router.push({ pathname: '/users/[id]', params: { id: listing.owner_id } });
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
        <View style={styles.topBar}>
          <Pressable accessibilityLabel="Takaisin" hitSlop={12} onPress={() => router.back()} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <Ionicons color={TEXT} name="chevron-back" size={27} />
          </Pressable>
          <Text allowFontScaling={false} style={styles.pageTitle}>Ilmoitus</Text>
          <Pressable accessibilityLabel="Suosikki" onPress={handleFavorite} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            {safetyLoading ? <ActivityIndicator color={GREEN_DARK} size="small" /> : <Ionicons color={GREEN_DARK} name={isFavorite ? 'heart' : 'heart-outline'} size={24} />}
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={GREEN} size="small" />
            <Text allowFontScaling={false} style={styles.loadingText}>Ladataan ilmoitusta...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.heroImage} /> : <View style={styles.emptyImage}><Ionicons color={GREEN_DARK} name="image-outline" size={42} /></View>}

            {!!listing && listing.image_urls.length > 1 && (
              <ScrollView contentContainerStyle={styles.thumbnailRow} horizontal showsHorizontalScrollIndicator={false}>
                {listing.image_urls.map((uri, index) => (
                  <Pressable key={`${uri}-${index}`} onPress={() => setSelectedImageIndex(index)} style={[styles.imageThumb, selectedImageIndex === index && styles.imageThumbActive]}>
                    <Image source={{ uri }} style={styles.imageThumbPhoto} />
                  </Pressable>
                ))}
              </ScrollView>
            )}

            {!!listing && (
              <>
                <View style={styles.titleCard}>
                  <View style={styles.badgeRow}>
                    <View style={styles.badge}><Text allowFontScaling={false} style={styles.badgeText}>{listingTypeLabel(listing.listing_type)}</Text></View>
                    <Text allowFontScaling={false} style={styles.categoryText}>{categoryLabel}</Text>
                  </View>
                  <Text allowFontScaling={false} style={styles.title}>{listing.title}</Text>
                  <Pressable onPress={openOwnerProfile} style={({ pressed }) => [styles.ownerRow, pressed && styles.pressed]}>
                    <Ionicons color={GREEN_DARK} name="person-circle-outline" size={22} />
                    <Text allowFontScaling={false} style={styles.ownerText}>{listing.owner_name}</Text>
                    <Text allowFontScaling={false} style={styles.star}>★</Text>
                    <Text allowFontScaling={false} style={styles.ownerText}>{listing.owner_rating.toFixed(1)}</Text>
                    <Ionicons color={MUTED} name="chevron-forward" size={16} />
                  </Pressable>
                </View>

                <View style={styles.infoRow}>
                  <InfoPill icon="location-outline" label={listing.location_label ?? 'Sijainti ei tiedossa'} />
                  <InfoPill icon="cash-outline" label={formatPrice(listing.price_amount)} />
                </View>

                <View style={styles.sectionCard}>
                  <Text allowFontScaling={false} style={styles.sectionTitle}>Kuvaus</Text>
                  <Text allowFontScaling={false} style={styles.description}>{listing.description || 'Ei kuvausta.'}</Text>
                </View>

                <View style={styles.sectionCard}>
                  <View style={styles.availabilityHeaderRow}>
                    <View>
                      <Text allowFontScaling={false} style={styles.sectionTitle}>Saatavuus</Text>
                      <Text allowFontScaling={false} style={styles.availabilitySubtitle}>{availabilityRanges.length > 0 ? 'Omistajan määrittämät saatavuusjaksot huomioidaan.' : 'Valitse sopiva jakso seuraavilta päiviltä.'}</Text>
                    </View>
                    <View style={styles.availabilityIcon}><Ionicons color={GREEN_DARK} name="calendar-outline" size={20} /></View>
                  </View>
                  {reservedRanges.length > 0 ? (
                    <Text allowFontScaling={false} style={styles.reservedText}>Varattu: {reservedRanges.slice(0, 2).map((range) => formatDateRange(range.startDate, range.endDate)).join(', ')}</Text>
                  ) : (
                    <Text allowFontScaling={false} style={styles.reservedText}>Ei vahvistettuja varauksia lähijaksolle.</Text>
                  )}
                </View>

                <View style={styles.safetyCard}>
                  <Ionicons color={GREEN_DARK} name="shield-checkmark-outline" size={22} />
                  <Text allowFontScaling={false} style={styles.safetyText}>Tarkka noutopaikka kannattaa sopia vasta viesteissä. Neyrlo näyttää sijainnin vain suurpiirteisesti.</Text>
                </View>

                {isOwnListing ? (
                  <View style={styles.feedbackCard}><Ionicons color={GREEN_DARK} name="information-circle-outline" size={20} /><Text allowFontScaling={false} style={styles.feedbackText}>Tämä on oma ilmoituksesi.</Text></View>
                ) : (
                  <>
                    <View style={styles.contactCard}>
                      <Text allowFontScaling={false} style={styles.sectionTitle}>Valitse ajankohta</Text>
                      <Text allowFontScaling={false} style={[styles.selectedRangeText, isSelectedRangeUnavailable && styles.unavailableRangeText]}>{selectedRangeLabel}</Text>
                      <ScrollView contentContainerStyle={styles.dateChipRow} horizontal showsHorizontalScrollIndicator={false}>
                        {dateOptions.map((option) => {
                          const isUnavailable = unavailableDateValues.has(option.value);
                          const isStart = option.value === selectedStartDate;
                          const isEnd = option.value === selectedEndDate;
                          const isInsideRange = !!selectedStartDate && !!selectedEndDate && option.value > selectedStartDate && option.value < selectedEndDate;

                          return (
                            <Pressable
                              disabled={isUnavailable}
                              key={option.value}
                              onPress={() => handleDateSelect(option.value)}
                              style={({ pressed }) => [
                                styles.dateChip,
                                (isStart || isEnd) && styles.dateChipSelected,
                                isInsideRange && styles.dateChipInsideRange,
                                isUnavailable && styles.dateChipUnavailable,
                                pressed && styles.pressed,
                              ]}
                            >
                              <Text allowFontScaling={false} style={[styles.dateChipWeekday, (isStart || isEnd) && styles.dateChipTextSelected, isUnavailable && styles.dateChipTextUnavailable]}>{option.weekday}</Text>
                              <Text allowFontScaling={false} style={[styles.dateChipLabel, (isStart || isEnd) && styles.dateChipTextSelected, isUnavailable && styles.dateChipTextUnavailable]}>{option.label}</Text>
                            </Pressable>
                          );
                        })}
                      </ScrollView>
                      {isSelectedRangeUnavailable && <Text allowFontScaling={false} style={styles.dateWarningText}>Valittu jakso osuu varattuun tai suljettuun päivään.</Text>}
                    </View>

                    <View style={styles.contactCard}>
                      <Text allowFontScaling={false} style={styles.sectionTitle}>Ota yhteyttä</Text>
                      <TextInput editable={!sending} multiline onChangeText={setMessage} placeholder="Kirjoita viesti omistajalle..." placeholderTextColor={MUTED} style={styles.messageInput} value={message} />
                      <Pressable disabled={sending || !selectedStartDate || !selectedEndDate || isSelectedRangeUnavailable} onPress={handleContact} style={({ pressed }) => [styles.primaryButton, (sending || !selectedStartDate || !selectedEndDate || isSelectedRangeUnavailable) && styles.disabledButton, pressed && styles.pressed]}>
                        {sending ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text allowFontScaling={false} style={styles.primaryButtonText}>{contactButtonLabel}</Text>}
                      </Pressable>
                    </View>

                    <View style={styles.contactCard}>
                      <Text allowFontScaling={false} style={styles.sectionTitle}>Arvioi käyttäjä</Text>
                      <View style={styles.ratingPicker}>
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <Pressable key={rating} onPress={() => setReviewRating(rating)}><Ionicons color="#E9B949" name={rating <= reviewRating ? 'star' : 'star-outline'} size={28} /></Pressable>
                        ))}
                      </View>
                      <TextInput multiline onChangeText={setReviewComment} placeholder="Kirjoita lyhyt arvio..." placeholderTextColor={MUTED} style={styles.messageInput} value={reviewComment} />
                      <Pressable disabled={safetyLoading} onPress={handleReview} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}><Text allowFontScaling={false} style={styles.secondaryButtonText}>Tallenna arvio</Text></Pressable>
                    </View>

                    <View style={styles.safetyActions}>
                      <Pressable onPress={openReportMenu} style={({ pressed }) => [styles.safetyAction, pressed && styles.pressed]}><Ionicons color={GREEN_DARK} name="flag-outline" size={20} /><Text allowFontScaling={false} style={styles.safetyActionText}>Raportoi</Text></Pressable>
                      <Pressable onPress={handleBlockUser} style={({ pressed }) => [styles.safetyAction, styles.dangerSafetyAction, pressed && styles.pressed]}><Ionicons color="#9F2E2E" name="ban-outline" size={20} /><Text allowFontScaling={false} style={styles.dangerSafetyText}>Blokkaa</Text></Pressable>
                    </View>
                  </>
                )}

                {similarItems.length > 0 && (
                  <View style={styles.similarSection}>
                    <Text allowFontScaling={false} style={styles.sectionTitle}>Samankaltaiset ilmoitukset</Text>
                    <View style={styles.similarList}>{similarItems.map((item) => <ItemCard item={item} key={item.id} onPress={() => router.push({ pathname: '/listings/[id]', params: { id: item.id } })} />)}</View>
                  </View>
                )}

                {!!feedback && <View style={styles.feedbackCard}><Ionicons color={GREEN_DARK} name="information-circle-outline" size={20} /><Text allowFontScaling={false} style={styles.feedbackText}>{feedback}</Text></View>}
              </>
            )}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function InfoPill({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return <View style={styles.infoPill}><Ionicons color={GREEN_DARK} name={icon} size={17} /><Text allowFontScaling={false} numberOfLines={1} style={styles.infoPillText}>{label}</Text></View>;
}

function formatPrice(price: number | null) {
  if (price === null || price === undefined) return 'Ei korvausta';
  return `${price.toFixed(2).replace('.', ',')} €`;
}

const serifFont = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

const styles = StyleSheet.create({
  screen: { backgroundColor: BACKGROUND, flex: 1 },
  keyboardView: { flex: 1 },
  topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 8 },
  iconButton: { alignItems: 'center', backgroundColor: 'rgba(255, 253, 247, 0.9)', borderColor: BORDER, borderRadius: 14, borderWidth: 1, height: 45, justifyContent: 'center', width: 45 },
  pageTitle: { color: TEXT, fontFamily: serifFont, fontSize: 28, fontWeight: Platform.OS === 'ios' ? '500' : '400' },
  loadingWrap: { alignItems: 'center', flex: 1, gap: 12, justifyContent: 'center' },
  loadingText: { color: MUTED, fontSize: 14, fontWeight: '600' },
  content: { paddingBottom: 30, paddingHorizontal: 24, paddingTop: 20 },
  heroImage: { backgroundColor: '#F8F2EA', borderRadius: 24, height: 270, width: '100%' },
  emptyImage: { alignItems: 'center', backgroundColor: '#F8F2EA', borderRadius: 24, height: 220, justifyContent: 'center' },
  thumbnailRow: { gap: 9, paddingTop: 10 },
  imageThumb: { borderColor: 'transparent', borderRadius: 13, borderWidth: 2, height: 62, overflow: 'hidden', width: 70 },
  imageThumbActive: { borderColor: GREEN },
  imageThumbPhoto: { height: '100%', width: '100%' },
  titleCard: { backgroundColor: CARD, borderColor: BORDER, borderRadius: 20, borderWidth: 1, marginTop: 16, padding: 18 },
  badgeRow: { alignItems: 'center', flexDirection: 'row', gap: 10, marginBottom: 10 },
  badge: { backgroundColor: GREEN, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  badgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  categoryText: { color: GREEN_DARK, fontSize: 12.5, fontWeight: '800' },
  title: { color: TEXT, fontSize: 28, fontWeight: '900', letterSpacing: -0.45 },
  ownerRow: { alignItems: 'center', flexDirection: 'row', gap: 5, marginTop: 10 },
  ownerText: { color: GREEN_DARK, fontSize: 14, fontWeight: '700' },
  star: { color: '#E9B949', fontSize: 14, fontWeight: '900' },
  infoRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  infoPill: { alignItems: 'center', backgroundColor: CARD, borderColor: BORDER, borderRadius: 999, borderWidth: 1, flex: 1, flexDirection: 'row', gap: 6, minHeight: 42, paddingHorizontal: 13 },
  infoPillText: { color: GREEN_DARK, flex: 1, fontSize: 12.8, fontWeight: '700' },
  sectionCard: { backgroundColor: CARD, borderColor: BORDER, borderRadius: 18, borderWidth: 1, marginTop: 12, padding: 18 },
  sectionTitle: { color: TEXT, fontSize: 16, fontWeight: '900', marginBottom: 8 },
  description: { color: MUTED, fontSize: 14.6, fontWeight: '600', lineHeight: 22 },
  availabilityHeaderRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  availabilityIcon: { alignItems: 'center', backgroundColor: 'rgba(85, 99, 63, 0.08)', borderRadius: 999, height: 38, justifyContent: 'center', width: 38 },
  availabilitySubtitle: { color: MUTED, fontSize: 13.2, fontWeight: '700', lineHeight: 18, marginTop: -2 },
  reservedText: { color: GREEN_DARK, fontSize: 13.2, fontWeight: '800', lineHeight: 19, marginTop: 10 },
  safetyCard: { alignItems: 'flex-start', backgroundColor: 'rgba(85, 99, 63, 0.08)', borderColor: 'rgba(85, 99, 63, 0.18)', borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 10, marginTop: 12, padding: 14 },
  safetyText: { color: GREEN_DARK, flex: 1, fontSize: 13.5, fontWeight: '700', lineHeight: 19 },
  contactCard: { backgroundColor: CARD, borderColor: BORDER, borderRadius: 18, borderWidth: 1, marginTop: 12, padding: 18 },
  selectedRangeText: { color: GREEN_DARK, fontSize: 14, fontWeight: '900', marginBottom: 12 },
  unavailableRangeText: { color: '#9F2E2E' },
  dateChipRow: { gap: 8, paddingRight: 4 },
  dateChip: { alignItems: 'center', backgroundColor: '#F8F3EA', borderColor: 'rgba(64, 80, 48, 0.12)', borderRadius: 16, borderWidth: 1, minHeight: 62, minWidth: 78, paddingHorizontal: 12, paddingVertical: 10 },
  dateChipSelected: { backgroundColor: GREEN, borderColor: GREEN },
  dateChipInsideRange: { backgroundColor: 'rgba(85, 99, 63, 0.11)', borderColor: 'rgba(85, 99, 63, 0.2)' },
  dateChipUnavailable: { opacity: 0.38 },
  dateChipWeekday: { color: MUTED, fontSize: 11.5, fontWeight: '800', textTransform: 'uppercase' },
  dateChipLabel: { color: TEXT, fontSize: 13, fontWeight: '900', marginTop: 4 },
  dateChipTextSelected: { color: '#FFFFFF' },
  dateChipTextUnavailable: { color: MUTED },
  dateWarningText: { color: '#9F2E2E', fontSize: 12.5, fontWeight: '800', lineHeight: 18, marginTop: 10 },
  messageInput: { backgroundColor: '#F8F3EA', borderColor: 'rgba(64, 80, 48, 0.1)', borderRadius: 14, borderWidth: 1, color: TEXT, fontSize: 14.5, fontWeight: '600', lineHeight: 20, minHeight: 88, padding: 13, textAlignVertical: 'top' },
  ratingPicker: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  primaryButton: { alignItems: 'center', backgroundColor: GREEN, borderRadius: 16, height: 56, justifyContent: 'center', marginTop: 14 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  secondaryButton: { alignItems: 'center', borderColor: GREEN_DARK, borderRadius: 16, borderWidth: 1, height: 50, justifyContent: 'center', marginTop: 12 },
  secondaryButtonText: { color: GREEN_DARK, fontSize: 15.5, fontWeight: '900' },
  safetyActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  safetyAction: { alignItems: 'center', backgroundColor: CARD, borderColor: BORDER, borderRadius: 16, borderWidth: 1, flex: 1, flexDirection: 'row', gap: 8, justifyContent: 'center', paddingVertical: 13 },
  safetyActionText: { color: GREEN_DARK, fontSize: 14, fontWeight: '900' },
  dangerSafetyAction: { borderColor: 'rgba(159, 46, 46, 0.25)' },
  dangerSafetyText: { color: '#9F2E2E', fontSize: 14, fontWeight: '900' },
  similarSection: { marginTop: 18 },
  similarList: { gap: 10 },
  disabledButton: { opacity: 0.7 },
  feedbackCard: { alignItems: 'flex-start', backgroundColor: 'rgba(85, 99, 63, 0.08)', borderColor: 'rgba(85, 99, 63, 0.18)', borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 9, marginTop: 14, padding: 13 },
  feedbackText: { color: GREEN_DARK, flex: 1, fontSize: 13.5, fontWeight: '700', lineHeight: 19 },
  pressed: { opacity: 0.78 },
});
