import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
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

import {
  activateMyListing,
  getMyListingForEdit,
  statusLabel,
  updateMyListingDetails,
  updateMyListingStatus,
} from '@/lib/myListings';
import {
  listingTypeLabel,
  parsePriceAmount,
  toListingType,
  type ListingStatus,
  type ListingWithRelations,
} from '@/lib/listings';

const BACKGROUND = '#FFFDF7';
const GREEN = '#55633F';
const GREEN_DARK = '#3F4E2F';
const TEXT = '#20251F';
const MUTED = '#77736B';
const BORDER = 'rgba(64, 80, 48, 0.13)';
const CARD = 'rgba(255, 253, 247, 0.94)';

type ListingIntent = 'Lainaa' | 'Vuokraa' | 'Vaihda' | 'Ilmainen';

type SelectedLocation = {
  label: string;
  latitude?: number;
  longitude?: number;
  source: 'current' | 'later';
};

const categories = [
  { id: 'tools', label: 'Työkalut' },
  { id: 'outdoors', label: 'Ulkoilu' },
  { id: 'travel', label: 'Matkustus' },
  { id: 'electronics', label: 'Elektroniikka' },
  { id: 'home', label: 'Koti' },
  { id: 'sports', label: 'Urheilu' },
  { id: 'kids', label: 'Lapset' },
  { id: 'events', label: 'Juhlat' },
  { id: 'other', label: 'Muu' },
];

const intentOptions: ListingIntent[] = ['Lainaa', 'Vuokraa', 'Vaihda', 'Ilmainen'];

export default function EditListingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const listingId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [listing, setListing] = useState<ListingWithRelations | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [intent, setIntent] = useState<ListingIntent>('Lainaa');
  const [categoryIndex, setCategoryIndex] = useState(-1);
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const selectedCategory = categoryIndex >= 0 ? categories[categoryIndex].label : 'Valitse kategoria';
  const selectedCategoryId = categoryIndex >= 0 ? categories[categoryIndex].id : null;
  const locationLabel = gettingLocation ? 'Haetaan sijaintia...' : selectedLocation?.label ?? 'Valitse sijainti';
  const imageUrl = listing?.image_urls[0];

  const loadListing = useCallback(async () => {
    if (!listingId) {
      setFeedback('Ilmoituksen tunniste puuttuu.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const data = await getMyListingForEdit(listingId);
      hydrateForm(data);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Ilmoituksen lataus ei onnistunut.');
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    void loadListing();
  }, [loadListing]);

  const hydrateForm = (data: ListingWithRelations) => {
    setListing(data);
    setTitle(data.title);
    setDescription(data.description ?? '');
    setPrice(data.price_amount === null || data.price_amount === undefined ? '' : String(data.price_amount).replace('.', ','));
    setIntent(labelFromType(data.listing_type));
    setCategoryIndex(categories.findIndex((category) => category.id === data.category_id));
    setSelectedLocation(
      data.location_label
        ? {
            label: data.location_label,
            latitude: data.location_lat ?? undefined,
            longitude: data.location_lng ?? undefined,
            source: data.location_lat && data.location_lng ? 'current' : 'later',
          }
        : null,
    );
  };

  const cycleCategory = () => {
    setFeedback(null);
    setCategoryIndex((current) => (current + 1) % categories.length);
  };

  const saveDetails = async () => {
    if (!listing || saving) {
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const updated = await updateMyListingDetails(listing.id, {
        categoryId: selectedCategoryId,
        description,
        listingType: toListingType(intent),
        location: selectedLocation,
        priceAmount: parsePriceAmount(price),
        title,
      });
      hydrateForm(updated);
      setFeedback('Ilmoituksen tiedot tallennettu.');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Tallennus ei onnistunut.');
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (nextStatus: ListingStatus | 'active') => {
    if (!listing || changingStatus) {
      return;
    }

    setChangingStatus(true);
    setFeedback(null);

    try {
      const updated = nextStatus === 'active'
        ? await activateMyListing(listing.id)
        : await updateMyListingStatus(listing.id, nextStatus);

      hydrateForm(updated);
      setFeedback(`Tila päivitetty: ${statusLabel(updated.status)}.`);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Tilan päivitys ei onnistunut.');
    } finally {
      setChangingStatus(false);
    }
  };

  const confirmDelete = () => {
    if (!listing) {
      return;
    }

    Alert.alert('Poista ilmoitus?', 'Ilmoitus piilotetaan sovelluksesta. Tätä toimintoa ei kannata käyttää, jos haluat vain keskeyttää ilmoituksen.', [
      { style: 'cancel', text: 'Peruuta' },
      { onPress: () => void changeStatus('deleted'), style: 'destructive', text: 'Poista' },
    ]);
  };

  const chooseLocationLater = () => {
    setSelectedLocation({ label: 'Valitaan myöhemmin', source: 'later' });
    setFeedback('Sijainti asetettu myöhemmin valittavaksi.');
  };

  const useCurrentLocation = async () => {
    setFeedback(null);
    setGettingLocation(true);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== 'granted') {
        setFeedback('Sijaintilupaa ei annettu.');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      let label = 'Nykyinen sijainti valittu';

      try {
        const places = await Location.reverseGeocodeAsync({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });
        label = formatLocationLabel(places[0]);
      } catch {
        label = 'Nykyinen sijainti valittu';
      }

      setSelectedLocation({
        label,
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        source: 'current',
      });
    } catch {
      setFeedback('Sijainnin haku ei onnistunut.');
    } finally {
      setGettingLocation(false);
    }
  };

  const openLocationMenu = () => {
    const message = 'Näytämme muille vain suurpiirteisen sijainnin.';

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          cancelButtonIndex: 2,
          message,
          options: ['Käytä nykyistä sijaintia', 'Valitse myöhemmin', 'Peruuta'],
          title: 'Valitse sijainti',
        },
        (buttonIndex) => {
          if (buttonIndex === 0) void useCurrentLocation();
          if (buttonIndex === 1) chooseLocationLater();
        },
      );
      return;
    }

    Alert.alert('Valitse sijainti', message, [
      { onPress: () => void useCurrentLocation(), text: 'Käytä nykyistä sijaintia' },
      { onPress: chooseLocationLater, text: 'Valitse myöhemmin' },
      { style: 'cancel', text: 'Peruuta' },
    ]);
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
        <View style={styles.topBar}>
          <Pressable accessibilityLabel="Takaisin" onPress={() => router.back()} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <Ionicons color={TEXT} name="chevron-back" size={27} />
          </Pressable>
          <Text allowFontScaling={false} style={styles.pageTitle}>Muokkaa</Text>
          <Pressable accessibilityLabel="Päivitä" onPress={() => void loadListing()} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <Ionicons color={GREEN_DARK} name="refresh-outline" size={22} />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={GREEN} size="small" />
            <Text allowFontScaling={false} style={styles.loadingText}>Ladataan ilmoitusta...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.summaryCard}>
              <View style={styles.thumbnailWrap}>
                {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.thumbnail} /> : <Ionicons color={GREEN_DARK} name="image-outline" size={28} />}
              </View>
              <View style={styles.summaryBody}>
                <Text allowFontScaling={false} numberOfLines={1} style={styles.summaryTitle}>{listing?.title ?? 'Ilmoitus'}</Text>
                <Text allowFontScaling={false} style={styles.summaryMeta}>{listing ? statusLabel(listing.status) : ''}</Text>
              </View>
              {listing?.status === 'active' && (
                <Pressable onPress={() => router.push({ pathname: '/listings/[id]', params: { id: listing.id } })}>
                  <Ionicons color={GREEN_DARK} name="open-outline" size={22} />
                </Pressable>
              )}
            </View>

            <View style={styles.formStack}>
              <FormInput label="Otsikko" onChangeText={setTitle} placeholder="Mitä jaat?" value={title} />
              <FormInput label="Kuvaus" multiline onChangeText={setDescription} placeholder="Kerro tavarasta..." value={description} />
              <FormAction label="Kategoria" onPress={cycleCategory} value={selectedCategory} />

              <View style={styles.card}>
                <Text allowFontScaling={false} style={styles.formLabel}>Jakotapa</Text>
                <View style={styles.intentRow}>
                  {intentOptions.map((option) => {
                    const selected = intent === option;
                    return (
                      <Pressable key={option} onPress={() => setIntent(option)} style={[styles.intentChip, selected && styles.intentChipActive]}>
                        <Text allowFontScaling={false} style={[styles.intentText, selected && styles.intentTextActive]}>{option}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <FormInput label="Hinta / korvaus" onChangeText={setPrice} placeholder="0,00 €" value={price} />
              <FormAction label="Sijainti" loading={gettingLocation} onPress={openLocationMenu} value={locationLabel} />
              {!!listing && <FormAction label="Kuvat" onPress={() => router.push({ pathname: '/listings/images/[id]', params: { id: listing.id } })} value="Poista, lisää ja järjestä kuvia" />}
              {!!listing && <FormAction label="Saatavuus" onPress={() => router.push({ pathname: '/listings/availability/[id]', params: { id: listing.id } })} value="Hallitse vapaita ja suljettuja päiviä" />}
            </View>

            {!!feedback && (
              <View style={styles.feedbackCard}>
                <Ionicons color={GREEN_DARK} name="information-circle-outline" size={20} />
                <Text allowFontScaling={false} style={styles.feedbackText}>{feedback}</Text>
              </View>
            )}

            <Pressable disabled={saving} onPress={saveDetails} style={({ pressed }) => [styles.primaryButton, saving && styles.disabledButton, pressed && styles.pressed]}>
              {saving ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text allowFontScaling={false} style={styles.primaryButtonText}>Tallenna muutokset</Text>}
            </Pressable>

            <View style={styles.statusSection}>
              <Text allowFontScaling={false} style={styles.sectionTitle}>Tilan hallinta</Text>
              <Text allowFontScaling={false} style={styles.sectionSubtitle}>Nykyinen tila: {listing ? statusLabel(listing.status) : ''}</Text>

              <View style={styles.statusGrid}>
                <StatusButton icon="play-outline" label="Aktivoi" onPress={() => void changeStatus('active')} />
                <StatusButton icon="pause-outline" label="Keskeytä" onPress={() => void changeStatus('paused')} />
                <StatusButton icon="bookmark-outline" label="Varattu" onPress={() => void changeStatus('reserved')} />
                <StatusButton icon="checkmark-done-outline" label="Valmis" onPress={() => void changeStatus('completed')} />
                <StatusButton icon="archive-outline" label="Arkistoi" onPress={() => void changeStatus('archived')} />
                <StatusButton danger icon="trash-outline" label="Poista" onPress={confirmDelete} />
              </View>

              {changingStatus && <ActivityIndicator color={GREEN} size="small" style={styles.statusLoader} />}
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FormInput({ label, multiline, onChangeText, placeholder, value }: { label: string; multiline?: boolean; onChangeText: (value: string) => void; placeholder: string; value: string }) {
  return (
    <View style={[styles.card, multiline && styles.multilineCard]}>
      <Text allowFontScaling={false} style={styles.formLabel}>{label}</Text>
      <TextInput
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={MUTED}
        style={[styles.input, multiline && styles.multilineInput]}
        value={value}
      />
    </View>
  );
}

function FormAction({ label, loading, onPress, value }: { label: string; loading?: boolean; onPress: () => void; value: string }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, styles.actionCard, pressed && styles.pressed]}>
      <View>
        <Text allowFontScaling={false} style={styles.formLabel}>{label}</Text>
        <Text allowFontScaling={false} numberOfLines={1} style={styles.actionValue}>{value}</Text>
      </View>
      {loading ? <ActivityIndicator color={GREEN_DARK} size="small" /> : <Ionicons color={GREEN_DARK} name="chevron-forward" size={22} />}
    </Pressable>
  );
}

function StatusButton({ danger, icon, label, onPress }: { danger?: boolean; icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.statusButton, danger && styles.dangerButton, pressed && styles.pressed]}>
      <Ionicons color={danger ? '#9F2E2E' : GREEN_DARK} name={icon} size={20} />
      <Text allowFontScaling={false} style={[styles.statusButtonText, danger && styles.dangerText]}>{label}</Text>
    </Pressable>
  );
}

function labelFromType(type: string): ListingIntent {
  switch (type) {
    case 'rent': return 'Vuokraa';
    case 'swap': return 'Vaihda';
    case 'free': return 'Ilmainen';
    case 'borrow':
    default: return 'Lainaa';
  }
}

function formatLocationLabel(place?: Location.LocationGeocodedAddress) {
  if (!place) return 'Nykyinen sijainti valittu';
  const area = place.district ?? place.subregion;
  const city = place.city ?? place.region;
  if (area && city && area !== city) return `${area}, ${city}`;
  return city ?? place.region ?? 'Nykyinen sijainti valittu';
}

const serifFont = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

const styles = StyleSheet.create({
  screen: { backgroundColor: BACKGROUND, flex: 1 },
  keyboardView: { flex: 1 },
  topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 8 },
  iconButton: { alignItems: 'center', backgroundColor: CARD, borderColor: BORDER, borderRadius: 14, borderWidth: 1, height: 45, justifyContent: 'center', width: 45 },
  pageTitle: { color: TEXT, fontFamily: serifFont, fontSize: 28, fontWeight: Platform.OS === 'ios' ? '500' : '400' },
  loadingWrap: { alignItems: 'center', flex: 1, gap: 12, justifyContent: 'center' },
  loadingText: { color: MUTED, fontSize: 14, fontWeight: '700' },
  content: { paddingBottom: 36, paddingHorizontal: 24, paddingTop: 22 },
  summaryCard: { alignItems: 'center', backgroundColor: CARD, borderColor: BORDER, borderRadius: 20, borderWidth: 1, flexDirection: 'row', gap: 12, marginBottom: 16, padding: 12 },
  thumbnailWrap: { alignItems: 'center', backgroundColor: '#F8F2EA', borderRadius: 14, height: 70, justifyContent: 'center', overflow: 'hidden', width: 78 },
  thumbnail: { height: '100%', resizeMode: 'cover', width: '100%' },
  summaryBody: { flex: 1, minWidth: 0 },
  summaryTitle: { color: TEXT, fontSize: 17, fontWeight: '900' },
  summaryMeta: { color: GREEN_DARK, fontSize: 13, fontWeight: '800', marginTop: 4 },
  formStack: { gap: 12 },
  card: { backgroundColor: CARD, borderColor: BORDER, borderRadius: 17, borderWidth: 1, minHeight: 72, paddingHorizontal: 16, paddingVertical: 12 },
  multilineCard: { minHeight: 108 },
  formLabel: { color: TEXT, fontSize: 15.5, fontWeight: '900', marginBottom: 5 },
  input: { color: TEXT, fontSize: 15, fontWeight: '600', padding: 0 },
  multilineInput: { lineHeight: 21, minHeight: 52, textAlignVertical: 'top' },
  actionCard: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  actionValue: { color: MUTED, fontSize: 14.5, fontWeight: '700' },
  intentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 3 },
  intentChip: { borderColor: 'rgba(85, 99, 63, 0.22)', borderRadius: 999, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 8 },
  intentChipActive: { backgroundColor: GREEN, borderColor: GREEN },
  intentText: { color: GREEN_DARK, fontSize: 13, fontWeight: '800' },
  intentTextActive: { color: '#FFFFFF' },
  feedbackCard: { alignItems: 'flex-start', backgroundColor: 'rgba(85, 99, 63, 0.08)', borderColor: 'rgba(85, 99, 63, 0.18)', borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 9, marginTop: 14, padding: 13 },
  feedbackText: { color: GREEN_DARK, flex: 1, fontSize: 13.5, fontWeight: '700', lineHeight: 19 },
  primaryButton: { alignItems: 'center', backgroundColor: GREEN, borderRadius: 17, height: 58, justifyContent: 'center', marginTop: 16 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  statusSection: { marginTop: 24 },
  sectionTitle: { color: TEXT, fontSize: 19, fontWeight: '900' },
  sectionSubtitle: { color: MUTED, fontSize: 13.5, fontWeight: '700', marginTop: 4 },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  statusButton: { alignItems: 'center', backgroundColor: CARD, borderColor: BORDER, borderRadius: 15, borderWidth: 1, flexDirection: 'row', gap: 6, minWidth: '47%', paddingHorizontal: 13, paddingVertical: 13 },
  statusButtonText: { color: GREEN_DARK, fontSize: 13.2, fontWeight: '900' },
  dangerButton: { borderColor: 'rgba(159, 46, 46, 0.25)' },
  dangerText: { color: '#9F2E2E' },
  statusLoader: { marginTop: 14 },
  disabledButton: { opacity: 0.65 },
  pressed: { opacity: 0.78 },
});
