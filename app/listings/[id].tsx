import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
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
  categoryIcon,
  getActiveListings,
  getListingForReview,
  listingToNearbyItem,
  listingTypeLabel,
  type ListingWithRelations,
} from '@/lib/listings';
import { createContactForListing } from '@/lib/messages';
import { blockUser, reportListing, type ReportReason } from '@/lib/safety';
import type { NearbyItem } from '@/types/item';

const BACKGROUND = '#FFFDF7';
const DARK_OLIVE = '#41482C';
const DARK_OLIVE_DARK = '#30361F';
const TEXT = '#20251F';
const MUTED = '#686D66';
const BORDER = 'rgba(229, 218, 206, 0.82)';
const CARD = 'rgba(255, 253, 249, 0.97)';
const SOFT_GREEN = '#EEF2E6';
const SOFT_BEIGE = '#F4E8D7';
const HERO_HEIGHT = 378;

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

const reportReasons: { label: string; value: ReportReason }[] = [
  { label: 'Roskaposti', value: 'spam' },
  { label: 'Huijaus', value: 'scam' },
  { label: 'Sopimaton sisältö', value: 'inappropriate' },
  { label: 'Turvaton ilmoitus', value: 'unsafe' },
  { label: 'Muu syy', value: 'other' },
];

export default function ListingDetailsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { session } = useAuth();
  const params = useLocalSearchParams<{ id?: string }>();
  const listingId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [listing, setListing] = useState<ListingWithRelations | null>(null);
  const [similarItems, setSimilarItems] = useState<NearbyItem[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message] = useState('Hei! Haluaisin pyytää varausta tälle tavaralle.');
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
  const dateOptions = useMemo(() => createDateOptions(21), []);
  const images = listing?.image_urls ?? [];
  const heroWidth = width;

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

  const contactButtonLabel = useMemo(() => {
    if (!listing) return 'Lähetä pyyntö';

    switch (listing.listing_type) {
      case 'rent':
        return 'Pyydä vuokrausta';
      case 'swap':
        return 'Ehdota vaihtoa';
      case 'free':
        return 'Kysy tavarasta';
      case 'borrow':
      default:
        return 'Lähetä pyyntö';
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
          .slice(0, 8)
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

  useEffect(() => {
    if (loading || selectedStartDate || selectedEndDate) return;

    const availableDates = dateOptions.filter((option) => !unavailableDateValues.has(option.value));

    if (availableDates.length > 0) {
      setSelectedStartDate(availableDates[0].value);
      setSelectedEndDate(availableDates[Math.min(2, availableDates.length - 1)].value);
    }
  }, [dateOptions, loading, selectedEndDate, selectedStartDate, unavailableDateValues]);

  const handleImageScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / heroWidth);
    setSelectedImageIndex(nextIndex);
  };

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

  const openDateMenu = (target: 'end' | 'start') => {
    const availableOptions = dateOptions.filter((option) => !unavailableDateValues.has(option.value));
    const labels = availableOptions.map((option) => formatLongDate(option.value));

    const selectDate = (dateValue: string) => {
      if (target === 'start') {
        setSelectedStartDate(dateValue);
        if (selectedEndDate && dateValue > selectedEndDate) setSelectedEndDate(null);
        setFeedback(null);
        return;
      }

      if (!selectedStartDate) {
        setSelectedStartDate(dateValue);
        setFeedback('Valitse vielä päättymispäivä.');
        return;
      }

      if (dateValue < selectedStartDate) {
        setFeedback('Päättymispäivän pitää olla aloituspäivän jälkeen.');
        return;
      }

      setSelectedEndDate(dateValue);
      setFeedback(null);
    };

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          cancelButtonIndex: labels.length,
          options: [...labels, 'Peruuta'],
          title: target === 'start' ? 'Valitse aloituspäivä' : 'Valitse palautuspäivä',
        },
        (buttonIndex) => {
          const selectedOption = availableOptions[buttonIndex];
          if (selectedOption) selectDate(selectedOption.value);
        },
      );
      return;
    }

    Alert.alert(target === 'start' ? 'Valitse aloituspäivä' : 'Valitse palautuspäivä', '', [
      ...availableOptions.slice(0, 8).map((option) => ({ onPress: () => selectDate(option.value), text: formatLongDate(option.value) })),
      { style: 'cancel' as const, text: 'Peruuta' },
    ]);
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

  const openOwnerProfile = () => {
    if (!listing) return;
    router.push({ pathname: '/users/[id]', params: { id: listing.owner_id } });
  };

  if (loading) {
    return (
      <View style={styles.screen}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={DARK_OLIVE} size="small" />
          <Text allowFontScaling={false} style={styles.loadingText}>Ladataan ilmoitusta...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          {images.length > 0 ? (
            <ScrollView horizontal onMomentumScrollEnd={handleImageScroll} pagingEnabled showsHorizontalScrollIndicator={false}>
              {images.map((uri) => (
                <Image key={uri} source={{ uri }} style={[styles.heroImage, { width: heroWidth }]} />
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.emptyImage, { width: heroWidth }]}> 
              <Ionicons color={DARK_OLIVE} name="image-outline" size={44} />
            </View>
          )}

          <View style={styles.heroShade} />

          <Pressable accessibilityLabel="Takaisin" hitSlop={12} onPress={() => router.back()} style={({ pressed }) => [styles.heroIconButton, styles.backButton, pressed && styles.pressed]}>
            <Ionicons color={TEXT} name="chevron-back" size={28} />
          </Pressable>

          <Pressable accessibilityLabel="Suosikki" onPress={handleFavorite} style={({ pressed }) => [styles.heroIconButton, styles.favoriteButton, pressed && styles.pressed]}>
            {safetyLoading ? <ActivityIndicator color={DARK_OLIVE} size="small" /> : <Ionicons color={DARK_OLIVE} name={isFavorite ? 'heart' : 'heart-outline'} size={25} />}
          </Pressable>

          {images.length > 0 && (
            <View style={styles.imageCountBadge}>
              <Text allowFontScaling={false} style={styles.imageCountText}>{selectedImageIndex + 1} / {images.length}</Text>
            </View>
          )}
        </View>

        {!!listing ? (
          <View style={styles.sheet}>
            <View style={styles.titleRow}>
              <View style={styles.titleBlock}>
                <Text allowFontScaling={false} numberOfLines={2} style={styles.title}>{listing.title}</Text>
                <View style={styles.metaRow}>
                  <Ionicons color={MUTED} name="location-outline" size={15} />
                  <Text allowFontScaling={false} style={styles.metaText}>0,6 km</Text>
                  <Text allowFontScaling={false} style={styles.metaDot}>·</Text>
                  <Text allowFontScaling={false} numberOfLines={1} style={styles.metaText}>{listing.location_label ?? 'Sijainti ei tiedossa'}</Text>
                  <Ionicons color={MUTED} name="shield-checkmark-outline" size={15} style={styles.trustIcon} />
                  <Text allowFontScaling={false} style={styles.metaText}>Luotettu jäsen</Text>
                </View>
              </View>
              <View style={styles.pickupPill}>
                <Ionicons color={DARK_OLIVE} name="car-outline" size={17} />
                <Text allowFontScaling={false} style={styles.pickupText}>Nouto</Text>
              </View>
            </View>

            <Pressable onPress={openOwnerProfile} style={({ pressed }) => [styles.ownerCard, pressed && styles.pressed]}>
              <View style={styles.ownerAvatar}>
                <Text allowFontScaling={false} style={styles.ownerInitial}>{initialForName(listing.owner_name)}</Text>
              </View>
              <View style={styles.ownerTextBlock}>
                <Text allowFontScaling={false} numberOfLines={1} style={styles.ownerName}>{shortName(listing.owner_name)}</Text>
                <Text allowFontScaling={false} numberOfLines={1} style={styles.ownerLocation}>{listing.location_label ?? 'Neyrlo-käyttäjä'}</Text>
                <Text allowFontScaling={false} style={styles.ownerResponse}>Vastaa yleensä 1 h sisällä</Text>
              </View>
              <View style={styles.trustBadge}>
                <Ionicons color={DARK_OLIVE} name="shield-checkmark-outline" size={14} />
                <Text allowFontScaling={false} style={styles.trustBadgeText}>Luotettu jäsen</Text>
              </View>
              <Ionicons color={MUTED} name="chevron-forward" size={20} />
            </Pressable>

            <View style={styles.gridRow}>
              <AvailabilityPreview
                dateOptions={dateOptions.slice(0, 7)}
                onDatePress={handleDateSelect}
                selectedEndDate={selectedEndDate}
                selectedStartDate={selectedStartDate}
                unavailableDateValues={unavailableDateValues}
                onOpenAll={() => openDateMenu('start')}
              />
              <PriceCard listing={listing} />
            </View>

            <View style={styles.gridRow}>
              <DescriptionCard description={listing.description} />
              <SafetyCard onBlock={handleBlockUser} onReport={openReportMenu} />
            </View>

            {isOwnListing ? (
              <View style={styles.feedbackCard}>
                <Ionicons color={DARK_OLIVE} name="information-circle-outline" size={20} />
                <Text allowFontScaling={false} style={styles.feedbackText}>Tämä on oma ilmoituksesi.</Text>
              </View>
            ) : (
              <RequestCard
                disabled={sending || !selectedStartDate || !selectedEndDate || isSelectedRangeUnavailable}
                endDate={selectedEndDate}
                listing={listing}
                loading={sending}
                onChangeEnd={() => openDateMenu('end')}
                onChangeStart={() => openDateMenu('start')}
                onSubmit={handleContact}
                startDate={selectedStartDate}
                title={contactButtonLabel}
              />
            )}

            {isSelectedRangeUnavailable && (
              <View style={styles.feedbackCard}>
                <Ionicons color={DARK_OLIVE} name="alert-circle-outline" size={20} />
                <Text allowFontScaling={false} style={styles.feedbackText}>Valittu jakso osuu varattuun tai suljettuun päivään.</Text>
              </View>
            )}

            {!!feedback && (
              <View style={styles.feedbackCard}>
                <Ionicons color={DARK_OLIVE} name="information-circle-outline" size={20} />
                <Text allowFontScaling={false} style={styles.feedbackText}>{feedback}</Text>
              </View>
            )}

            {similarItems.length > 0 && (
              <View style={styles.similarSection}>
                <View style={styles.similarHeader}>
                  <Text allowFontScaling={false} style={styles.similarTitle}>Samankaltaiset tavarat</Text>
                  <Pressable style={({ pressed }) => [styles.showAllButton, pressed && styles.pressed]}>
                    <Text allowFontScaling={false} style={styles.showAllText}>Näytä kaikki</Text>
                    <Ionicons color={DARK_OLIVE} name="chevron-forward" size={17} />
                  </Pressable>
                </View>
                <ScrollView contentContainerStyle={styles.similarRow} horizontal showsHorizontalScrollIndicator={false}>
                  {similarItems.map((item) => (
                    <SimilarCard item={item} key={item.id} onPress={() => router.push({ pathname: '/listings/[id]', params: { id: item.id } })} />
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.errorCard}>
            <Ionicons color={DARK_OLIVE} name="alert-circle-outline" size={24} />
            <Text allowFontScaling={false} style={styles.feedbackText}>{feedback ?? 'Ilmoitusta ei löytynyt.'}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function AvailabilityPreview({
  dateOptions,
  onDatePress,
  onOpenAll,
  selectedEndDate,
  selectedStartDate,
  unavailableDateValues,
}: {
  dateOptions: ReturnType<typeof createDateOptions>;
  onDatePress: (dateValue: string) => void;
  onOpenAll: () => void;
  selectedEndDate: string | null;
  selectedStartDate: string | null;
  unavailableDateValues: Set<string>;
}) {
  return (
    <View style={[styles.infoPanel, styles.availabilityPanel]}>
      <Text allowFontScaling={false} style={styles.panelTitle}>Saatavuus</Text>
      <View style={styles.weekRow}>
        {dateOptions.map((option) => {
          const isUnavailable = unavailableDateValues.has(option.value);
          const isSelected = option.value === selectedStartDate || option.value === selectedEndDate;
          const isInside = !!selectedStartDate && !!selectedEndDate && option.value > selectedStartDate && option.value < selectedEndDate;

          return (
            <Pressable disabled={isUnavailable} key={option.value} onPress={() => onDatePress(option.value)} style={styles.dayColumn}>
              <Text allowFontScaling={false} style={styles.weekdayText}>{option.weekday.toUpperCase()}</Text>
              <View style={[styles.dayCircle, isSelected && styles.dayCircleSelected, isInside && styles.dayCircleInside, isUnavailable && styles.dayCircleUnavailable]}>
                <Text allowFontScaling={false} style={[styles.dayText, isSelected && styles.dayTextSelected, isUnavailable && styles.dayTextUnavailable]}>{option.day}</Text>
              </View>
              <View style={[styles.dayDot, isSelected && styles.dayDotSelected, isUnavailable && styles.dayDotUnavailable]} />
            </Pressable>
          );
        })}
      </View>
      <Pressable onPress={onOpenAll} style={({ pressed }) => [styles.panelFooterButton, pressed && styles.pressed]}>
        <Ionicons color={MUTED} name="calendar-outline" size={16} />
        <Text allowFontScaling={false} style={styles.panelFooterText}>Katso kaikki saatavuudet</Text>
        <Ionicons color={MUTED} name="chevron-forward" size={16} />
      </Pressable>
    </View>
  );
}

function PriceCard({ listing }: { listing: ListingWithRelations }) {
  return (
    <View style={[styles.infoPanel, styles.pricePanel]}>
      <View style={styles.panelHeaderRow}>
        <Text allowFontScaling={false} style={styles.panelTitle}>Korvaus</Text>
        <View style={styles.roundIcon}>
          <Ionicons color={DARK_OLIVE} name="pricetag-outline" size={22} />
        </View>
      </View>
      <Text allowFontScaling={false} style={styles.priceValue}>{formatPrice(listing.price_amount, listing.listing_type)}</Text>
      <View style={styles.priceFooterRow}>
        <Text allowFontScaling={false} style={styles.priceHint}>Tai tee oma ehdotus</Text>
        <Ionicons color={MUTED} name="chevron-forward" size={16} />
      </View>
    </View>
  );
}

function DescriptionCard({ description }: { description: string | null }) {
  return (
    <View style={[styles.infoPanel, styles.descriptionPanel]}>
      <Text allowFontScaling={false} style={styles.panelTitle}>Kuvaus</Text>
      <Text allowFontScaling={false} numberOfLines={5} style={styles.descriptionText}>{description || 'Ei kuvausta.'}</Text>
      <View style={styles.includedPill}>
        <Ionicons color="#FFFFFF" name="checkmark-circle" size={17} />
        <Text allowFontScaling={false} style={styles.includedPillText}>Mukana: sovitaan viesteissä</Text>
      </View>
    </View>
  );
}

function SafetyCard({ onBlock, onReport }: { onBlock: () => void; onReport: () => void }) {
  return (
    <View style={[styles.infoPanel, styles.safetyPanel]}>
      <Text allowFontScaling={false} style={styles.panelTitle}>Turvallista yhdessä</Text>
      <SafetyRow icon="checkmark-circle-outline" text="Tavarat tarkastetaan" />
      <SafetyRow icon="people-outline" text="Ystävällinen yhteisö" />
      <SafetyRow icon="shield-checkmark-outline" text="Vakuutettu käyttö" />
      <View style={styles.safetyLinksRow}>
        <Pressable onPress={onReport} style={({ pressed }) => [styles.safetyLink, pressed && styles.pressed]}>
          <Text allowFontScaling={false} style={styles.safetyLinkText}>Raportoi</Text>
        </Pressable>
        <Text allowFontScaling={false} style={styles.safetySeparator}>·</Text>
        <Pressable onPress={onBlock} style={({ pressed }) => [styles.safetyLink, pressed && styles.pressed]}>
          <Text allowFontScaling={false} style={styles.safetyLinkText}>Blokkaa</Text>
        </Pressable>
      </View>
    </View>
  );
}

function SafetyRow({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.safetyRow}>
      <Ionicons color={DARK_OLIVE} name={icon} size={15} />
      <Text allowFontScaling={false} style={styles.safetyRowText}>{text}</Text>
    </View>
  );
}

function RequestCard({
  disabled,
  endDate,
  listing,
  loading,
  onChangeEnd,
  onChangeStart,
  onSubmit,
  startDate,
  title,
}: {
  disabled: boolean;
  endDate: string | null;
  listing: ListingWithRelations;
  loading: boolean;
  onChangeEnd: () => void;
  onChangeStart: () => void;
  onSubmit: () => void;
  startDate: string | null;
  title: string;
}) {
  return (
    <View style={styles.requestCard}>
      <View style={styles.requestHeaderRow}>
        <View style={styles.requestTitleBlock}>
          <Text allowFontScaling={false} style={styles.requestTitle}>Pyydä varausta {firstName(listing.owner_name)}lta</Text>
          <Text allowFontScaling={false} style={styles.requestSubtitle}>Valitse ajankohta ja lähetä pyyntö. Saat vastauksen pian.</Text>
        </View>
        <View style={styles.responsePill}>
          <Ionicons color={DARK_OLIVE} name="time-outline" size={15} />
          <Text allowFontScaling={false} style={styles.responsePillText}>Vastaus yleensä 1 h sisällä</Text>
        </View>
      </View>

      <View style={styles.requestBodyRow}>
        <View style={styles.dateFieldsRow}>
          <DateField label="Alkaa" value={startDate} onPress={onChangeStart} />
          <Ionicons color={MUTED} name="arrow-forward" size={23} style={styles.dateArrow} />
          <DateField label="Päättyy" value={endDate} onPress={onChangeEnd} />
        </View>

        <View style={styles.requestButtonBlock}>
          <Pressable disabled={disabled} onPress={onSubmit} style={({ pressed }) => [styles.requestButton, disabled && styles.disabledButton, pressed && styles.pressed]}>
            {loading ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text allowFontScaling={false} style={styles.requestButtonText}>{title}</Text>}
          </Pressable>
          <View style={styles.noChargeRow}>
            <Ionicons color={MUTED} name="lock-closed-outline" size={12} />
            <Text allowFontScaling={false} style={styles.noChargeText}>Ei vielä veloitusta</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function DateField({ label, onPress, value }: { label: string; onPress: () => void; value: string | null }) {
  return (
    <View style={styles.dateFieldBlock}>
      <Text allowFontScaling={false} style={styles.dateFieldLabel}>{label}</Text>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.dateField, pressed && styles.pressed]}>
        <Ionicons color={MUTED} name="calendar-outline" size={18} />
        <Text allowFontScaling={false} numberOfLines={1} style={styles.dateFieldText}>{value ? formatShortDate(value) : 'Valitse'}</Text>
        <Ionicons color={MUTED} name="chevron-down" size={16} />
      </Pressable>
    </View>
  );
}

function SimilarCard({ item, onPress }: { item: NearbyItem; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.similarCard, pressed && styles.pressed]}>
      <View style={styles.similarImageWrap}>
        <Image source={{ uri: item.imageUrl }} style={styles.similarImage} />
        <View style={styles.similarHeart}>
          <Ionicons color={DARK_OLIVE} name="heart-outline" size={18} />
        </View>
      </View>
      <View style={styles.similarBody}>
        <Text allowFontScaling={false} numberOfLines={1} style={styles.similarCardTitle}>{item.title}</Text>
        <Text allowFontScaling={false} numberOfLines={1} style={styles.similarMeta}>{item.distanceKm.toFixed(1).replace('.', ',')} km · {item.locationLabel ?? 'Lähellä'}</Text>
      </View>
    </Pressable>
  );
}

function formatPrice(price: number | null, type?: ListingWithRelations['listing_type']) {
  if (price === null || price === undefined || price === 0) {
    if (type === 'rent') return 'Sopimuksen mukaan';
    return '0 € / laina';
  }

  const rounded = Number.isInteger(price) ? String(price) : price.toFixed(2).replace('.', ',');

  if (type === 'rent') return `${rounded} € / pv`;
  return `${rounded} €`;
}

function formatShortDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return value;
  const date = new Date(year, month - 1, day);
  const weekday = date.toLocaleDateString('fi-FI', { weekday: 'short' }).replace('.', '');
  return `${capitalize(weekday)} ${day}.${month}.${year}`;
}

function formatLongDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString('fi-FI', { day: 'numeric', month: 'long', weekday: 'long', year: 'numeric' });
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

function firstName(name: string) {
  return name.trim().split(/\s+/).filter(Boolean)[0] || 'omistaja';
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const serifFont = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

const styles = StyleSheet.create({
  screen: {
    backgroundColor: BACKGROUND,
    flex: 1,
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
    paddingBottom: 38,
  },
  heroSection: {
    backgroundColor: '#E9E0D3',
    height: HERO_HEIGHT,
    overflow: 'hidden',
    position: 'relative',
  },
  heroImage: {
    height: HERO_HEIGHT,
    resizeMode: 'cover',
  },
  emptyImage: {
    alignItems: 'center',
    backgroundColor: '#F4EDE5',
    height: HERO_HEIGHT,
    justifyContent: 'center',
  },
  heroShade: {
    backgroundColor: 'rgba(0,0,0,0.10)',
    height: 132,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  heroIconButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 253, 247, 0.94)',
    borderRadius: 999,
    height: 56,
    justifyContent: 'center',
    position: 'absolute',
    shadowColor: '#1F261B',
    shadowOffset: { height: 7, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    top: 54,
    width: 56,
  },
  backButton: {
    left: 34,
  },
  favoriteButton: {
    right: 34,
  },
  imageCountBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 253, 247, 0.82)',
    borderRadius: 999,
    bottom: 26,
    height: 34,
    justifyContent: 'center',
    left: '50%',
    marginLeft: -32,
    position: 'absolute',
    width: 64,
  },
  imageCountText: {
    color: TEXT,
    fontSize: 14.5,
    fontWeight: '750',
  },
  sheet: {
    backgroundColor: BACKGROUND,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -24,
    paddingBottom: 34,
    paddingHorizontal: 22,
    paddingTop: 24,
  },
  titleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: TEXT,
    fontFamily: serifFont,
    fontSize: 28,
    fontWeight: Platform.OS === 'ios' ? '500' : '700',
    letterSpacing: -0.55,
    lineHeight: 34,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 9,
  },
  metaText: {
    color: MUTED,
    fontSize: 13.2,
    fontWeight: '650',
  },
  metaDot: {
    color: MUTED,
    fontSize: 13,
    fontWeight: '850',
  },
  trustIcon: {
    marginLeft: 6,
  },
  pickupPill: {
    alignItems: 'center',
    backgroundColor: SOFT_GREEN,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  pickupText: {
    color: DARK_OLIVE,
    fontSize: 13.2,
    fontWeight: '750',
  },
  ownerCard: {
    alignItems: 'center',
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    padding: 14,
    shadowColor: '#1F261B',
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.035,
    shadowRadius: 10,
  },
  ownerAvatar: {
    alignItems: 'center',
    backgroundColor: '#E9E0D3',
    borderColor: 'rgba(65, 72, 44, 0.10)',
    borderRadius: 999,
    borderWidth: 1,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  ownerInitial: {
    color: DARK_OLIVE,
    fontSize: 20,
    fontWeight: '900',
  },
  ownerTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  ownerName: {
    color: TEXT,
    fontSize: 16.6,
    fontWeight: '800',
  },
  ownerLocation: {
    color: MUTED,
    fontSize: 13.2,
    fontWeight: '600',
    marginTop: 3,
  },
  ownerResponse: {
    color: MUTED,
    fontSize: 12.5,
    fontWeight: '600',
    marginTop: 4,
  },
  trustBadge: {
    alignItems: 'center',
    backgroundColor: SOFT_GREEN,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  trustBadgeText: {
    color: DARK_OLIVE,
    fontSize: 10.8,
    fontWeight: '750',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  infoPanel: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: 17,
    borderWidth: 1,
    flex: 1,
    padding: 16,
    shadowColor: '#1F261B',
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.025,
    shadowRadius: 10,
  },
  availabilityPanel: {
    minHeight: 178,
  },
  pricePanel: {
    minHeight: 178,
  },
  panelHeaderRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  panelTitle: {
    color: TEXT,
    fontFamily: serifFont,
    fontSize: 16.5,
    fontWeight: Platform.OS === 'ios' ? '500' : '700',
    letterSpacing: -0.2,
    lineHeight: 21,
  },
  roundIcon: {
    alignItems: 'center',
    backgroundColor: SOFT_GREEN,
    borderRadius: 999,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  dayColumn: {
    alignItems: 'center',
    width: 25,
  },
  weekdayText: {
    color: TEXT,
    fontSize: 9.5,
    fontWeight: '750',
    marginBottom: 7,
  },
  dayCircle: {
    alignItems: 'center',
    borderRadius: 999,
    height: 27,
    justifyContent: 'center',
    width: 27,
  },
  dayCircleSelected: {
    backgroundColor: DARK_OLIVE,
  },
  dayCircleInside: {
    backgroundColor: SOFT_GREEN,
  },
  dayCircleUnavailable: {
    opacity: 0.34,
  },
  dayText: {
    color: TEXT,
    fontSize: 13.2,
    fontWeight: '650',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '850',
  },
  dayTextUnavailable: {
    color: MUTED,
  },
  dayDot: {
    backgroundColor: DARK_OLIVE,
    borderRadius: 999,
    height: 4,
    marginTop: 8,
    opacity: 0.55,
    width: 4,
  },
  dayDotSelected: {
    opacity: 1,
  },
  dayDotUnavailable: {
    backgroundColor: 'transparent',
  },
  panelFooterButton: {
    alignItems: 'center',
    borderTopColor: 'rgba(229, 218, 206, 0.70)',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 7,
    marginTop: 14,
    paddingTop: 12,
  },
  panelFooterText: {
    color: MUTED,
    flex: 1,
    fontSize: 12.3,
    fontWeight: '700',
  },
  priceValue: {
    color: TEXT,
    fontSize: 27,
    fontWeight: '900',
    letterSpacing: -0.35,
    marginTop: 22,
  },
  priceHint: {
    color: MUTED,
    flex: 1,
    fontSize: 12.3,
    fontWeight: '700',
  },
  priceFooterRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginTop: 'auto',
    paddingTop: 12,
  },
  descriptionPanel: {
    minHeight: 172,
  },
  safetyPanel: {
    minHeight: 172,
  },
  descriptionText: {
    color: '#3C4039',
    fontSize: 13.2,
    fontWeight: '500',
    lineHeight: 19,
    marginTop: 11,
  },
  includedPill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: SOFT_GREEN,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 6,
    marginTop: 'auto',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  includedPillText: {
    color: DARK_OLIVE,
    fontSize: 11.5,
    fontWeight: '750',
  },
  safetyRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  safetyRowText: {
    color: MUTED,
    flex: 1,
    fontSize: 12.2,
    fontWeight: '650',
  },
  safetyLinksRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
    marginTop: 'auto',
    paddingTop: 12,
  },
  safetyLinkText: {
    color: DARK_OLIVE,
    fontSize: 12,
    fontWeight: '800',
  },
  safetyLink: {
    paddingVertical: 2,
  },
  safetySeparator: {
    color: MUTED,
    fontSize: 12,
    fontWeight: '900',
  },
  requestCard: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: 17,
    borderWidth: 1,
    marginTop: 18,
    padding: 18,
    shadowColor: '#1F261B',
    shadowOffset: { height: 5, width: 0 },
    shadowOpacity: 0.035,
    shadowRadius: 12,
  },
  requestHeaderRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  requestTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  requestTitle: {
    color: TEXT,
    fontFamily: serifFont,
    fontSize: 20,
    fontWeight: Platform.OS === 'ios' ? '500' : '700',
    letterSpacing: -0.32,
    lineHeight: 25,
  },
  requestSubtitle: {
    color: MUTED,
    fontSize: 12.7,
    fontWeight: '600',
    lineHeight: 18,
    marginTop: 4,
  },
  responsePill: {
    alignItems: 'center',
    backgroundColor: SOFT_GREEN,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  responsePillText: {
    color: DARK_OLIVE,
    fontSize: 10.5,
    fontWeight: '750',
  },
  requestBodyRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 14,
    marginTop: 18,
  },
  dateFieldsRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    flex: 1,
    gap: 8,
  },
  dateArrow: {
    marginBottom: 16,
  },
  dateFieldBlock: {
    flex: 1,
    gap: 6,
  },
  dateFieldLabel: {
    color: MUTED,
    fontSize: 11.5,
    fontWeight: '700',
  },
  dateField: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 253, 247, 0.88)',
    borderColor: BORDER,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 7,
    height: 44,
    paddingHorizontal: 11,
  },
  dateFieldText: {
    color: TEXT,
    flex: 1,
    fontSize: 11.7,
    fontWeight: '700',
  },
  requestButtonBlock: {
    alignItems: 'center',
    width: 134,
  },
  requestButton: {
    alignItems: 'center',
    backgroundColor: DARK_OLIVE,
    borderRadius: 999,
    height: 48,
    justifyContent: 'center',
    width: '100%',
  },
  requestButtonText: {
    color: '#FFFFFF',
    fontSize: 13.2,
    fontWeight: '850',
  },
  disabledButton: {
    opacity: 0.5,
  },
  noChargeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginTop: 7,
  },
  noChargeText: {
    color: MUTED,
    fontSize: 10.8,
    fontWeight: '650',
  },
  feedbackCard: {
    alignItems: 'flex-start',
    backgroundColor: 'rgba(238, 242, 230, 0.82)',
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
  errorCard: {
    alignItems: 'center',
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    margin: 24,
    padding: 20,
  },
  similarSection: {
    marginTop: 24,
  },
  similarHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  similarTitle: {
    color: TEXT,
    fontFamily: serifFont,
    fontSize: 19.5,
    fontWeight: Platform.OS === 'ios' ? '500' : '700',
    letterSpacing: -0.25,
  },
  showAllButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  showAllText: {
    color: DARK_OLIVE,
    fontSize: 12.5,
    fontWeight: '750',
  },
  similarRow: {
    gap: 12,
    paddingRight: 22,
  },
  similarCard: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    width: 150,
  },
  similarImageWrap: {
    backgroundColor: '#F4EDE5',
    height: 104,
    position: 'relative',
  },
  similarImage: {
    height: '100%',
    resizeMode: 'cover',
    width: '100%',
  },
  similarHeart: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,253,247,0.92)',
    borderRadius: 999,
    height: 30,
    justifyContent: 'center',
    position: 'absolute',
    right: 8,
    top: 8,
    width: 30,
  },
  similarBody: {
    gap: 4,
    padding: 10,
  },
  similarCardTitle: {
    color: TEXT,
    fontSize: 12.7,
    fontWeight: '800',
  },
  similarMeta: {
    color: MUTED,
    fontSize: 11.5,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
});
