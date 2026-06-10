import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  createDateOptions,
  dateRangeContains,
  dateRangesOverlap,
  getListingAvailability,
  getReservedDateRanges,
  type ListingAvailabilityRange,
  type ReservedDateRange,
} from '@/lib/availability';
import { useAuth } from '@/lib/auth';
import { calculateDistanceKm, addDistancesToItems, type Coordinates } from '@/lib/distance';
import { isListingFavorite, toggleFavorite } from '@/lib/favorites';
import {
  getActiveListings,
  getListingForReview,
  listingToNearbyItem,
  type ListingWithRelations,
} from '@/lib/listings';
import { createContactForListing } from '@/lib/messages';
import { blockUser, reportListing, type ReportReason } from '@/lib/safety';
import type { NearbyItem } from '@/types/item';

const BACKGROUND = '#FFFDF7';
const CARD = 'rgba(255, 253, 249, 0.98)';
const DARK_OLIVE = '#41482C';
const DARK_OLIVE_DARK = '#30361F';
const TEXT = '#20251F';
const MUTED = '#686D66';
const BORDER = 'rgba(229, 218, 206, 0.82)';
const SOFT_GREEN = '#EEF2E6';
const HERO_HEIGHT = 390;

const reportReasons: { label: string; value: ReportReason }[] = [
  { label: 'Roskaposti', value: 'spam' },
  { label: 'Huijaus', value: 'scam' },
  { label: 'Sopimaton sisältö', value: 'inappropriate' },
  { label: 'Turvaton ilmoitus', value: 'unsafe' },
  { label: 'Muu syy', value: 'other' },
];

export default function ListingDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [distanceLabel, setDistanceLabel] = useState<string | null>(null);

  const isOwnListing = !!listing && listing.owner_id === session?.user.id;
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
      const grantedLocation = await getGrantedUserCoordinates();
      setListing(data);
      setUserLocation(grantedLocation);
      setSelectedImageIndex(0);
      setIsFavorite(await isListingFavorite(listingId));

      if (grantedLocation && data.location_lat !== null && data.location_lng !== null) {
        const distanceKm = calculateDistanceKm(grantedLocation, {
          latitude: data.location_lat,
          longitude: data.location_lng,
        });
        setDistanceLabel(formatDistance(distanceKm));
      } else {
        setDistanceLabel(null);
      }

      const [activeListings, availabilityData, reservedData] = await Promise.all([
        getActiveListings(30),
        getListingAvailability(listingId),
        getReservedDateRanges(listingId),
      ]);

      const nearbyItems = activeListings
        .filter((item) => item.id !== data.id && (!!data.category_id ? item.category_id === data.category_id : true))
        .slice(0, 8)
        .map(listingToNearbyItem);

      setAvailabilityRanges(availabilityData);
      setReservedRanges(reservedData);
      setSimilarItems(addDistancesToItems(nearbyItems, grantedLocation));
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

  const showAllSimilar = () => {
    router.push('/browse');
  };

  if (loading) {
    return (
      <View style={styles.screen}>
        <StatusBar style="dark" />
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={DARK_OLIVE} size="small" />
          <Text allowFontScaling={false} style={styles.loadingText}>Ladataan ilmoitusta...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
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
              <View style={styles.emptyImageIcon}>
                <Ionicons color={DARK_OLIVE} name="image-outline" size={34} />
              </View>
              <Text allowFontScaling={false} style={styles.emptyImageText}>Kuva tulossa</Text>
            </View>
          )}

          <View pointerEvents="none" style={styles.heroTopShade} />
          <View pointerEvents="none" style={styles.heroBottomShade} />

          <Pressable
            accessibilityLabel="Takaisin"
            hitSlop={12}
            onPress={() => router.back()}
            style={({ pressed }) => [styles.heroIconButton, styles.backButton, { top: insets.top + 18 }, pressed && styles.pressed]}
          >
            <Ionicons color={TEXT} name="chevron-back" size={28} />
          </Pressable>

          <Pressable
            accessibilityLabel="Suosikki"
            hitSlop={12}
            onPress={handleFavorite}
            style={({ pressed }) => [styles.heroIconButton, styles.favoriteButton, { top: insets.top + 18 }, pressed && styles.pressed]}
          >
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
                <Text allowFontScaling={false} numberOfLines={2} ellipsizeMode="tail" style={styles.title}>{listing.title}</Text>
                <View style={styles.metaRow}>
                  {distanceLabel ? (
                    <>
                      <MetaItem icon="location-outline" text={distanceLabel} />
                      <Text allowFontScaling={false} style={styles.metaDot}>·</Text>
                      <Text allowFontScaling={false} numberOfLines={1} ellipsizeMode="tail" style={styles.metaLocationText}>{listing.location_label ?? 'Sijainti ei tiedossa'}</Text>
                    </>
                  ) : (
                    <MetaItem icon="location-outline" text={listing.location_label ?? 'Sijainti ei tiedossa'} />
                  )}
                  <MetaItem icon="shield-checkmark-outline" text="Luotettu jäsen" />
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
                <Text allowFontScaling={false} numberOfLines={1} ellipsizeMode="tail" style={styles.ownerName}>{shortName(listing.owner_name)}</Text>
                <Text allowFontScaling={false} numberOfLines={1} ellipsizeMode="tail" style={styles.ownerLocation}>{listing.location_label ?? 'Neyrlo-käyttäjä'}</Text>
                <Text allowFontScaling={false} numberOfLines={1} style={styles.ownerResponse}>Vastaa yleensä 1 h sisällä</Text>
              </View>
              <View style={styles.ownerSideBlock}>
                <View style={styles.trustBadge}>
                  <Ionicons color={DARK_OLIVE} name="shield-checkmark-outline" size={13} />
                  <Text allowFontScaling={false} numberOfLines={1} style={styles.trustBadgeText}>Luotettu jäsen</Text>
                </View>
                {listing.owner_rating > 0 && (
                  <View style={styles.ratingRow}>
                    <Ionicons color="#C89C3A" name="star" size={12} />
                    <Text allowFontScaling={false} style={styles.ratingText}>{listing.owner_rating.toFixed(1).replace('.', ',')}</Text>
                  </View>
                )}
              </View>
              <Ionicons color={MUTED} name="chevron-forward" size={19} />
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
                  <Pressable onPress={showAllSimilar} style={({ pressed }) => [styles.showAllButton, pressed && styles.pressed]}>
                    <Text allowFontScaling={false} style={styles.showAllText}>Näytä kaikki</Text>
                    <Ionicons color={DARK_OLIVE} name="chevron-forward" size={17} />
                  </Pressable>
                </View>
                <ScrollView contentContainerStyle={styles.similarRow} horizontal showsHorizontalScrollIndicator={false}>
                  {similarItems.map((item) => (
                    <SimilarCard item={item} key={item.id} onPress={() => router.push({ pathname: '/listings/[id]', params: { id: item.id } })} showDistance={!!userLocation} />
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

function MetaItem({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.metaItem}>
      <Ionicons color={MUTED} name={icon} size={15} />
      <Text allowFontScaling={false} numberOfLines={1} ellipsizeMode="tail" style={styles.metaText}>{text}</Text>
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
            <Pressable disabled={isUnavailable} key={option.value} onPress={() => onDatePress(option.value)} style={({ pressed }) => [styles.dayColumn, pressed && styles.dayPressed]}>
              <Text allowFontScaling={false} numberOfLines={1} style={styles.weekdayText}>{option.weekday.toUpperCase()}</Text>
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
        <Text allowFontScaling={false} numberOfLines={1} ellipsizeMode="tail" style={styles.panelFooterText}>Katso kaikki saatavuudet</Text>
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
      <Text allowFontScaling={false} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72} style={styles.priceValue}>{formatPrice(listing.price_amount, listing.listing_type)}</Text>
      <View style={styles.priceFooterRow}>
        <Text allowFontScaling={false} numberOfLines={1} ellipsizeMode="tail" style={styles.priceHint}>Tai tee oma ehdotus</Text>
        <Ionicons color={MUTED} name="chevron-forward" size={16} />
      </View>
    </View>
  );
}

function DescriptionCard({ description }: { description: string | null }) {
  return (
    <View style={[styles.infoPanel, styles.descriptionPanel]}>
      <Text allowFontScaling={false} style={styles.panelTitle}>Kuvaus</Text>
      <Text allowFontScaling={false} numberOfLines={5} ellipsizeMode="tail" style={styles.descriptionText}>{description || 'Ei kuvausta.'}</Text>
      <View style={styles.includedPill}>
        <Ionicons color={DARK_OLIVE} name="checkmark-circle" size={16} />
        <Text allowFontScaling={false} numberOfLines={1} ellipsizeMode="tail" style={styles.includedPillText}>Mukana: sovitaan</Text>
      </View>
    </View>
  );
}

function SafetyCard({ onBlock, onReport }: { onBlock: () => void; onReport: () => void }) {
  return (
    <View style={[styles.infoPanel, styles.safetyPanel]}>
      <Text allowFontScaling={false} style={styles.panelTitle}>Turvallista yhdessä</Text>
      <SafetyRow icon="checkmark-circle-outline" text="Tavarat tarkistetaan" />
      <SafetyRow icon="people-outline" text="Ystävällinen yhteisö" />
      <SafetyRow icon="shield-checkmark-outline" text="Vakuutettu käyttö" />
      <View style={styles.safetyMoreRow}>
        <Text allowFontScaling={false} numberOfLines={2} ellipsizeMode="tail" style={styles.safetyMoreText}>Lue lisää turvallisuudesta</Text>
        <Ionicons color={MUTED} name="chevron-forward" size={15} />
      </View>
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
      <Text allowFontScaling={false} numberOfLines={1} ellipsizeMode="tail" style={styles.safetyRowText}>{text}</Text>
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
          <Text allowFontScaling={false} numberOfLines={1} ellipsizeMode="tail" style={styles.requestTitle}>Pyydä varausta {ownerRequestName(listing.owner_name)}</Text>
          <Text allowFontScaling={false} numberOfLines={2} style={styles.requestSubtitle}>Valitse ajankohta ja lähetä pyyntö. Saat vastauksen pian.</Text>
        </View>
        <View style={styles.responsePill}>
          <Ionicons color={DARK_OLIVE} name="time-outline" size={15} />
          <Text allowFontScaling={false} numberOfLines={1} style={styles.responsePillText}>Vastaus yleensä 1 h sisällä</Text>
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
            {loading ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text allowFontScaling={false} numberOfLines={1} style={styles.requestButtonText}>{title}</Text>}
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
        <Text allowFontScaling={false} numberOfLines={1} ellipsizeMode="tail" style={styles.dateFieldText}>{value ? formatShortDate(value) : 'Valitse'}</Text>
        <Ionicons color={MUTED} name="chevron-down" size={16} />
      </Pressable>
    </View>
  );
}

function SimilarCard({ item, onPress, showDistance }: { item: NearbyItem; onPress: () => void; showDistance: boolean }) {
  const hasCoordinates = item.latitude !== undefined && item.longitude !== undefined;
  const meta = showDistance && hasCoordinates ? `${formatDistance(item.distanceKm)} · ${item.locationLabel ?? 'Lähellä'}` : item.locationLabel ?? 'Lähellä';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.similarCard, pressed && styles.pressed]}>
      <View style={styles.similarImageWrap}>
        <Image source={{ uri: item.imageUrl }} style={styles.similarImage} />
        <View style={styles.similarHeart}>
          <Ionicons color={DARK_OLIVE} name="heart-outline" size={18} />
        </View>
      </View>
      <View style={styles.similarBody}>
        <Text allowFontScaling={false} numberOfLines={2} ellipsizeMode="tail" style={styles.similarCardTitle}>{item.title}</Text>
        <Text allowFontScaling={false} numberOfLines={1} ellipsizeMode="tail" style={styles.similarMeta}>{meta}</Text>
      </View>
    </Pressable>
  );
}

async function getGrantedUserCoordinates(): Promise<Coordinates | null> {
  try {
    const permission = await Location.getForegroundPermissionsAsync();

    if (permission.status !== 'granted') {
      return null;
    }

    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  } catch {
    return null;
  }
}

function formatDistance(distanceKm: number) {
  if (!Number.isFinite(distanceKm)) return '';

  if (distanceKm < 1) {
    return `${Math.max(0.1, distanceKm).toFixed(1).replace('.', ',')} km`;
  }

  if (distanceKm < 10) {
    return `${distanceKm.toFixed(1).replace('.', ',')} km`;
  }

  return `${Math.round(distanceKm)} km`;
}

function formatPrice(price: number | null, type?: ListingWithRelations['listing_type']) {
  if (type === 'free') return 'Ilmainen';
  if (type === 'swap') return 'Vaihto';

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

function ownerRequestName(name: string) {
  const first = name.trim().split(/\s+/).filter(Boolean)[0] || 'omistaja';
  if (first.toLowerCase() === 'omistaja') return 'omistajalta';
  return `${first}lta`;
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
    fontWeight: '600',
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
    backgroundColor: '#E9E0D3',
    height: HERO_HEIGHT,
    justifyContent: 'center',
  },
  emptyImageIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,253,247,0.55)',
    borderColor: 'rgba(65,72,44,0.10)',
    borderRadius: 999,
    borderWidth: 1,
    height: 76,
    justifyContent: 'center',
    width: 76,
  },
  emptyImageText: {
    color: MUTED,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 12,
  },
  heroTopShade: {
    backgroundColor: 'rgba(0,0,0,0.18)',
    height: 150,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  heroBottomShade: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    bottom: 0,
    height: 118,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  heroIconButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 253, 247, 0.94)',
    borderColor: 'rgba(255,255,255,0.58)',
    borderRadius: 999,
    borderWidth: 1,
    elevation: 4,
    height: 56,
    justifyContent: 'center',
    position: 'absolute',
    shadowColor: DARK_OLIVE_DARK,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.13,
    shadowRadius: 16,
    width: 56,
  },
  backButton: {
    left: 32,
  },
  favoriteButton: {
    right: 32,
  },
  imageCountBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 253, 247, 0.86)',
    borderRadius: 999,
    bottom: 28,
    height: 34,
    justifyContent: 'center',
    left: '50%',
    marginLeft: -32,
    position: 'absolute',
    width: 64,
  },
  imageCountText: {
    color: TEXT,
    fontSize: 14,
    fontWeight: '700',
  },
  sheet: {
    backgroundColor: BACKGROUND,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
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
    fontSize: 27,
    fontWeight: Platform.OS === 'ios' ? '500' : '700',
    letterSpacing: -0.58,
    lineHeight: 33,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 9,
  },
  metaItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    maxWidth: 180,
  },
  metaText: {
    color: MUTED,
    fontSize: 12.8,
    fontWeight: '600',
  },
  metaLocationText: {
    color: MUTED,
    flexShrink: 1,
    fontSize: 12.8,
    fontWeight: '600',
    maxWidth: 170,
  },
  metaDot: {
    color: MUTED,
    fontSize: 13,
    fontWeight: '800',
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
    fontSize: 13,
    fontWeight: '700',
  },
  ownerCard: {
    alignItems: 'center',
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: 18,
    borderWidth: 1,
    elevation: 2,
    flexDirection: 'row',
    gap: 11,
    marginTop: 18,
    minHeight: 92,
    paddingHorizontal: 14,
    paddingVertical: 13,
    shadowColor: DARK_OLIVE_DARK,
    shadowOffset: { height: 5, width: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 13,
  },
  ownerAvatar: {
    alignItems: 'center',
    backgroundColor: '#E9E0D3',
    borderColor: 'rgba(65, 72, 44, 0.10)',
    borderRadius: 999,
    borderWidth: 1,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  ownerInitial: {
    color: DARK_OLIVE,
    fontSize: 20,
    fontWeight: '800',
  },
  ownerTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  ownerName: {
    color: TEXT,
    fontSize: 16.2,
    fontWeight: '800',
  },
  ownerLocation: {
    color: MUTED,
    fontSize: 12.7,
    fontWeight: '600',
    marginTop: 3,
  },
  ownerResponse: {
    color: MUTED,
    fontSize: 12.2,
    fontWeight: '600',
    marginTop: 4,
  },
  ownerSideBlock: {
    alignItems: 'flex-end',
    gap: 6,
    maxWidth: 114,
  },
  trustBadge: {
    alignItems: 'center',
    backgroundColor: SOFT_GREEN,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  trustBadgeText: {
    color: DARK_OLIVE,
    fontSize: 10.2,
    fontWeight: '700',
  },
  ratingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
    paddingRight: 4,
  },
  ratingText: {
    color: MUTED,
    fontSize: 11.5,
    fontWeight: '700',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  infoPanel: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: 18,
    borderWidth: 1,
    elevation: 1,
    flex: 1,
    padding: 16,
    shadowColor: DARK_OLIVE_DARK,
    shadowOffset: { height: 5, width: 0 },
    shadowOpacity: 0.035,
    shadowRadius: 12,
  },
  availabilityPanel: {
    flex: 1.22,
    minHeight: 166,
  },
  pricePanel: {
    flex: 0.95,
    minHeight: 166,
  },
  panelHeaderRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  panelTitle: {
    color: TEXT,
    fontFamily: serifFont,
    fontSize: 16.3,
    fontWeight: Platform.OS === 'ios' ? '500' : '700',
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  roundIcon: {
    alignItems: 'center',
    backgroundColor: SOFT_GREEN,
    borderRadius: 999,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: -2,
    marginTop: 13,
  },
  dayColumn: {
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  dayPressed: {
    opacity: 0.75,
  },
  weekdayText: {
    color: TEXT,
    fontSize: 8.5,
    fontWeight: '700',
    marginBottom: 7,
  },
  dayCircle: {
    alignItems: 'center',
    borderRadius: 999,
    height: 25,
    justifyContent: 'center',
    width: 25,
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
    fontSize: 12.4,
    fontWeight: '600',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
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
    fontSize: 11.4,
    fontWeight: '700',
  },
  priceValue: {
    color: TEXT,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.36,
    lineHeight: 34,
    marginTop: 24,
  },
  priceHint: {
    color: MUTED,
    flex: 1,
    fontSize: 11.4,
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
    fontSize: 13,
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
    gap: 5,
    marginTop: 'auto',
    maxWidth: '100%',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  includedPillText: {
    color: DARK_OLIVE,
    fontSize: 11.2,
    fontWeight: '700',
    maxWidth: 125,
  },
  safetyRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 11,
  },
  safetyRowText: {
    color: MUTED,
    flex: 1,
    fontSize: 11.6,
    fontWeight: '600',
  },
  safetyMoreRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginTop: 12,
  },
  safetyMoreText: {
    color: MUTED,
    flex: 1,
    fontSize: 11.6,
    fontWeight: '600',
    lineHeight: 15,
  },
  safetyLinksRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
    marginTop: 'auto',
    paddingTop: 8,
  },
  safetyLinkText: {
    color: DARK_OLIVE,
    fontSize: 11.5,
    fontWeight: '800',
  },
  safetyLink: {
    paddingVertical: 2,
  },
  safetySeparator: {
    color: MUTED,
    fontSize: 12,
    fontWeight: '800',
  },
  requestCard: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: 18,
    borderWidth: 1,
    elevation: 2,
    marginTop: 18,
    padding: 18,
    shadowColor: DARK_OLIVE_DARK,
    shadowOffset: { height: 5, width: 0 },
    shadowOpacity: 0.04,
    shadowRadius: 13,
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
    maxWidth: 172,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  responsePillText: {
    color: DARK_OLIVE,
    fontSize: 10.5,
    fontWeight: '700',
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
    minWidth: 0,
  },
  dateArrow: {
    marginBottom: 16,
  },
  dateFieldBlock: {
    flex: 1,
    gap: 6,
    minWidth: 0,
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
    fontSize: 11.5,
    fontWeight: '700',
  },
  requestButtonBlock: {
    alignItems: 'center',
    width: 136,
  },
  requestButton: {
    alignItems: 'center',
    backgroundColor: DARK_OLIVE,
    borderRadius: 999,
    elevation: 2,
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 12,
    shadowColor: DARK_OLIVE_DARK,
    shadowOffset: { height: 5, width: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    width: '100%',
  },
  requestButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
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
    fontWeight: '600',
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
    fontWeight: '600',
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
    fontSize: 20,
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
    fontWeight: '700',
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
    minHeight: 68,
    padding: 10,
  },
  similarCardTitle: {
    color: TEXT,
    fontSize: 12.7,
    fontWeight: '800',
    lineHeight: 16,
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
