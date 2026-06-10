import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useState } from 'react';
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

import { useAuth } from '@/lib/auth';
import {
  createDraftListing,
  parsePriceAmount,
  toListingType,
  updateDraftListing,
} from '@/lib/listings';
import {
  getListingImagePublicUrl,
  pickListingImages,
  uploadListingImages,
  type ListingImageRecord,
  type SelectedListingImage,
} from '@/lib/listingImages';

const DARK_OLIVE = '#41482C';
const DARK_OLIVE_DARK = '#30361F';
const BACKGROUND = '#FFFDF7';
const CARD = '#FFFDF9';
const BORDER = 'rgba(229, 218, 206, 0.82)';
const MUTED = '#686D66';
const TEXT = '#20251F';
const PLACEHOLDER = '#9A948B';
const FIELD_BACKGROUND = 'rgba(255, 253, 247, 0.86)';
const DASHED_BORDER = 'rgba(65, 72, 44, 0.23)';

const steps = [
  { label: 'Kuvat ja\nperustiedot', value: 1 },
  { label: 'Kuvaus', value: 2 },
  { label: 'Tiedot', value: 3 },
  { label: 'Saatavuus', value: 4 },
  { label: 'Lisätiedot', value: 5 },
  { label: 'Esikatselu', value: 6 },
];

type ListingIntent = 'Lainaa' | 'Vuokraa' | 'Vaihda' | 'Ilmainen';

type IntentOption = {
  icon: keyof typeof Ionicons.glyphMap;
  label: ListingIntent;
};

type SelectedLocation = {
  label: string;
  latitude?: number;
  longitude?: number;
  source: 'current' | 'later';
};

type CategoryOption = {
  id: string;
  label: string;
};

const intentOptions: IntentOption[] = [
  { icon: 'repeat-outline', label: 'Lainaa' },
  { icon: 'calendar-outline', label: 'Vuokraa' },
  { icon: 'swap-horizontal-outline', label: 'Vaihda' },
  { icon: 'gift-outline', label: 'Ilmainen' },
];

const categories: CategoryOption[] = [
  { id: 'tools', label: 'Työkalut' },
  { id: 'outdoors', label: 'Retkeily' },
  { id: 'travel', label: 'Matkustus' },
  { id: 'electronics', label: 'Elektroniikka' },
  { id: 'home', label: 'Koti' },
  { id: 'sports', label: 'Pyörät' },
];

export default function AddItemScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [intent, setIntent] = useState<ListingIntent>('Lainaa');
  const [title, setTitle] = useState('');
  const [description] = useState('');
  const [price, setPrice] = useState('');
  const [categoryIndex, setCategoryIndex] = useState(-1);
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [selectedImages, setSelectedImages] = useState<SelectedListingImage[]>([]);
  const [uploadedImages, setUploadedImages] = useState<ListingImageRecord[]>([]);
  const [draftListingId, setDraftListingId] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isPickingImages, setIsPickingImages] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const selectedCategory = categoryIndex >= 0 ? categories[categoryIndex].label : 'Valitse kategoria';
  const selectedCategoryId = categoryIndex >= 0 ? categories[categoryIndex].id : null;
  const locationLabel = isGettingLocation ? 'Haetaan sijaintia...' : selectedLocation?.label ?? 'Nykyinen sijainti';
  const imageCount = selectedImages.length + uploadedImages.length;
  const previewUris = [
    ...uploadedImages.map((image) => getListingImagePublicUrl(image.storage_path)),
    ...selectedImages.map((image) => image.uri),
  ];
  const mainImageUri = previewUris[0];
  const sideImageUris = previewUris.slice(1, 5);

  const cycleCategory = () => {
    setFeedback(null);
    setCategoryIndex((current) => (current + 1) % categories.length);
  };

  const chooseLocationLater = () => {
    setSelectedLocation({ label: 'Valitaan myöhemmin', source: 'later' });
    setFeedback('Sijainnin voi lisätä myöhemmin ennen ilmoituksen julkaisua.');
  };

  const useCurrentLocation = async () => {
    setFeedback(null);
    setIsGettingLocation(true);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== 'granted') {
        setFeedback('Sijaintilupaa ei annettu. Voit valita sijainnin myöhemmin.');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

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
      setFeedback('Sijainti valittu. Neyrlo näyttää muille vain suurpiirteisen sijainnin.');
    } catch {
      setFeedback('Sijainnin hakeminen ei onnistunut. Yritä uudelleen tai valitse sijainti myöhemmin.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const openLocationMenu = () => {
    if (isGettingLocation || isSaving) return;

    const message = 'Näytämme muille vain suurpiirteisen sijainnin. Tarkka noutopaikka sovitaan myöhemmin viesteissä.';

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

  const handleImagePress = async () => {
    if (isPickingImages || isSaving) return;

    setFeedback(null);
    setIsPickingImages(true);

    try {
      const images = await pickListingImages(imageCount);

      if (images.length === 0) return;

      setSelectedImages((currentImages) => [...currentImages, ...images].slice(0, 10));
      setFeedback(`${images.length} kuva${images.length === 1 ? '' : 'a'} valittu. Kuvat tallennetaan luonnokseen, kun painat Jatka.`);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Kuvien valinta ei onnistunut.');
    } finally {
      setIsPickingImages(false);
    }
  };

  const handleContinue = async () => {
    if (isSaving) return;

    setFeedback(null);
    setIsSaving(true);

    try {
      const savedListing = draftListingId
        ? await updateDraftListing(draftListingId, {
            categoryId: selectedCategoryId,
            description,
            listingType: toListingType(intent),
            location: selectedLocation?.source === 'current' ? selectedLocation : null,
            priceAmount: parsePriceAmount(price),
            title,
          })
        : await createDraftListing({
            categoryId: selectedCategoryId,
            description,
            listingType: toListingType(intent),
            location: selectedLocation?.source === 'current' ? selectedLocation : null,
            priceAmount: parsePriceAmount(price),
            title,
          });

      setDraftListingId(savedListing.id);

      if (selectedImages.length > 0) {
        if (!session?.user.id) {
          throw new Error('Kirjaudu sisään ennen kuvien lataamista.');
        }

        const uploaded = await uploadListingImages({
          images: selectedImages,
          listingId: savedListing.id,
          startSortOrder: uploadedImages.length,
          userId: session.user.id,
        });

        setUploadedImages((currentImages) => [...currentImages, ...uploaded]);
        setSelectedImages([]);
      }

      router.push({ pathname: '/listings/review', params: { listingId: savedListing.id } });
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Luonnoksen tallennus ei onnistunut.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.headerArea}>
            <Pressable accessibilityLabel="Sulje" hitSlop={12} onPress={() => router.replace('/(tabs)')} style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
              <Ionicons color={TEXT} name="close-outline" size={29} />
            </Pressable>
            <Text allowFontScaling={false} style={styles.brand}>NEYRLO</Text>
            <Text allowFontScaling={false} style={styles.pageTitle}>Luo ilmoitus</Text>
          </View>

          <StepProgress />

          <View style={styles.sectionIntro}>
            <Text allowFontScaling={false} style={styles.sectionTitle}>Kuvat</Text>
            <Text allowFontScaling={false} style={styles.sectionSubtitle}>Lisää kuvia, jotka kuvaavat tuotettasi parhaiten.</Text>
          </View>

          <View style={styles.photoGrid}>
            <Pressable onPress={handleImagePress} style={({ pressed }) => [styles.mainPhotoSlot, pressed && styles.pressed]}>
              {mainImageUri ? <Image source={{ uri: mainImageUri }} style={styles.slotImage} /> : <MainPhotoPlaceholder loading={isPickingImages} />}
            </Pressable>

            <View style={styles.sidePhotoGrid}>
              {Array.from({ length: 4 }).map((_, index) => (
                <Pressable key={index} onPress={handleImagePress} style={({ pressed }) => [styles.sidePhotoSlot, pressed && styles.pressed]}>
                  {sideImageUris[index] ? (
                    <Image source={{ uri: sideImageUris[index] }} style={styles.slotImage} />
                  ) : (
                    <View style={styles.sidePlaceholder}>
                      <Ionicons color="rgba(65,72,44,0.18)" name={sidePlaceholderIcon(index)} size={36} />
                    </View>
                  )}
                  <View style={styles.photoAddBadge}>
                    <Ionicons color={DARK_OLIVE} name="add" size={18} />
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.formBlock}>
            <Text allowFontScaling={false} style={styles.fieldLabel}>Otsikko</Text>
            <View style={styles.titleField}>
              <TextInput
                allowFontScaling={false}
                editable={!isSaving}
                maxLength={80}
                onChangeText={(value) => {
                  setFeedback(null);
                  setTitle(value);
                }}
                placeholder="Mitä tarjoat?"
                placeholderTextColor={PLACEHOLDER}
                style={styles.titleInput}
                value={title}
              />
              <Text allowFontScaling={false} style={styles.counterText}>{title.length}/80</Text>
            </View>

            <Text allowFontScaling={false} style={styles.fieldLabel}>Kategoria</Text>
            <Pressable disabled={isSaving} onPress={cycleCategory} style={({ pressed }) => [styles.actionField, pressed && styles.pressed]}>
              <View style={styles.actionFieldLeft}>
                <Ionicons color={MUTED} name="grid-outline" size={22} />
                <Text allowFontScaling={false} numberOfLines={1} style={styles.actionFieldText}>{selectedCategory}</Text>
              </View>
              <Ionicons color={TEXT} name="chevron-forward" size={21} />
            </Pressable>

            <View style={styles.labelWithInfoRow}>
              <Text allowFontScaling={false} style={styles.fieldLabelNoMargin}>Jakamistapa</Text>
              <Ionicons color={MUTED} name="information-circle-outline" size={17} />
            </View>
            <View style={styles.intentRow}>
              {intentOptions.map((option) => {
                const selected = option.label === intent;

                return (
                  <Pressable
                    disabled={isSaving}
                    key={option.label}
                    onPress={() => {
                      setFeedback(null);
                      setIntent(option.label);
                    }}
                    style={({ pressed }) => [styles.intentChip, selected && styles.intentChipActive, pressed && styles.pressed]}
                  >
                    <Ionicons color={selected ? '#FFFFFF' : MUTED} name={option.icon} size={16} />
                    <Text allowFontScaling={false} style={[styles.intentChipText, selected && styles.intentChipTextActive]}>{option.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.twoColumnRow}>
              <View style={styles.halfFieldBlock}>
                <View style={styles.labelWithInfoRow}>
                  <Text allowFontScaling={false} style={styles.fieldLabelNoMargin}>Korvaus</Text>
                  <Ionicons color={MUTED} name="information-circle-outline" size={17} />
                </View>
                <View style={styles.compensationField}>
                  <Text allowFontScaling={false} style={styles.euroText}>€</Text>
                  <TextInput
                    allowFontScaling={false}
                    editable={!isSaving}
                    keyboardType="decimal-pad"
                    onChangeText={(value) => {
                      setFeedback(null);
                      setPrice(value);
                    }}
                    placeholder="Esim. 10"
                    placeholderTextColor={PLACEHOLDER}
                    style={styles.compensationInput}
                    value={price}
                  />
                  <Text allowFontScaling={false} style={styles.perDayText}>/ päivä</Text>
                  <Ionicons color={MUTED} name="chevron-down" size={15} />
                </View>
              </View>

              <View style={styles.halfFieldBlock}>
                <Text allowFontScaling={false} style={styles.fieldLabelNoMargin}>Sijainti</Text>
                <Pressable disabled={isSaving || isGettingLocation} onPress={openLocationMenu} style={({ pressed }) => [styles.locationField, pressed && styles.pressed]}>
                  <Ionicons color={MUTED} name="location-outline" size={20} />
                  <Text allowFontScaling={false} numberOfLines={1} style={styles.locationText}>{locationLabel}</Text>
                  {isGettingLocation ? <ActivityIndicator color={DARK_OLIVE} size="small" /> : <Ionicons color={DARK_OLIVE} name="locate-outline" size={20} />}
                </Pressable>
              </View>
            </View>
          </View>

          {!!feedback && (
            <View style={styles.feedbackCard}>
              <Ionicons color={DARK_OLIVE} name="information-circle-outline" size={18} />
              <Text allowFontScaling={false} style={styles.feedbackText}>{feedback}</Text>
            </View>
          )}

          <Pressable disabled={isSaving} onPress={handleContinue} style={({ pressed }) => [styles.continueButton, isSaving && styles.disabledButton, pressed && styles.pressed]}>
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text allowFontScaling={false} style={styles.continueText}>Jatka</Text>
                <Ionicons color="#FFFFFF" name="arrow-forward" size={23} />
              </>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MainPhotoPlaceholder({ loading }: { loading: boolean }) {
  return (
    <View style={styles.mainPlaceholder}>
      {loading ? <ActivityIndicator color={DARK_OLIVE} size="small" /> : <Ionicons color={DARK_OLIVE} name="images-outline" size={38} />}
      <Text allowFontScaling={false} style={styles.mainPhotoTitle}>Lisää pääkuva</Text>
      <Text allowFontScaling={false} style={styles.mainPhotoSubtitle}>Suositus 4:3 tai 1:1</Text>
    </View>
  );
}

function StepProgress() {
  return (
    <View style={styles.stepArea}>
      <View style={styles.stepLine} />
      {steps.map((step, index) => {
        const active = index === 0;

        return (
          <View key={step.value} style={styles.stepItem}>
            <View style={[styles.stepCircle, active && styles.stepCircleActive]}>
              <Text allowFontScaling={false} style={[styles.stepNumber, active && styles.stepNumberActive]}>{step.value}</Text>
            </View>
            <Text allowFontScaling={false} style={[styles.stepLabel, active && styles.stepLabelActive]}>{step.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

function sidePlaceholderIcon(index: number): keyof typeof Ionicons.glyphMap {
  switch (index) {
    case 0:
      return 'leaf-outline';
    case 1:
      return 'chair-outline';
    case 2:
      return 'bicycle-outline';
    case 3:
      return 'triangle-outline';
    default:
      return 'image-outline';
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
  screen: {
    backgroundColor: BACKGROUND,
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    paddingBottom: 124,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  headerArea: {
    alignItems: 'center',
    minHeight: 124,
    paddingTop: 2,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 253, 247, 0.94)',
    borderColor: BORDER,
    borderRadius: 999,
    borderWidth: 1,
    height: 56,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    shadowColor: '#1F261B',
    shadowOffset: { height: 7, width: 0 },
    shadowOpacity: 0.055,
    shadowRadius: 14,
    top: 42,
    width: 56,
  },
  brand: {
    color: DARK_OLIVE,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 4,
    textAlign: 'center',
  },
  pageTitle: {
    color: TEXT,
    fontFamily: serifFont,
    fontSize: 34,
    fontWeight: Platform.OS === 'ios' ? '500' : '700',
    letterSpacing: -0.75,
    lineHeight: 40,
    marginTop: 36,
  },
  stepArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 34,
    marginTop: 2,
    position: 'relative',
  },
  stepLine: {
    backgroundColor: 'rgba(104, 109, 102, 0.22)',
    height: 1,
    left: 46,
    position: 'absolute',
    right: 46,
    top: 22,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    alignItems: 'center',
    backgroundColor: BACKGROUND,
    borderColor: 'rgba(104, 109, 102, 0.25)',
    borderRadius: 999,
    borderWidth: 1,
    height: 45,
    justifyContent: 'center',
    width: 45,
  },
  stepCircleActive: {
    backgroundColor: DARK_OLIVE,
    borderColor: DARK_OLIVE,
  },
  stepNumber: {
    color: MUTED,
    fontSize: 13.5,
    fontWeight: '700',
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepLabel: {
    color: MUTED,
    fontSize: 11.3,
    fontWeight: '600',
    lineHeight: 15,
    marginTop: 8,
    minHeight: 32,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: TEXT,
    fontWeight: '700',
  },
  sectionIntro: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: TEXT,
    fontFamily: serifFont,
    fontSize: 23,
    fontWeight: Platform.OS === 'ios' ? '500' : '700',
    letterSpacing: -0.35,
    lineHeight: 28,
  },
  sectionSubtitle: {
    color: MUTED,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginTop: 3,
  },
  photoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 30,
  },
  mainPhotoSlot: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 253, 247, 0.64)',
    borderColor: DASHED_BORDER,
    borderRadius: 18,
    borderStyle: 'dashed',
    borderWidth: 1.2,
    flex: 1.55,
    height: 178,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  mainPlaceholder: {
    alignItems: 'center',
    gap: 5,
  },
  mainPhotoTitle: {
    color: TEXT,
    fontFamily: serifFont,
    fontSize: 18,
    fontWeight: Platform.OS === 'ios' ? '500' : '700',
    letterSpacing: -0.2,
    marginTop: 12,
  },
  mainPhotoSubtitle: {
    color: MUTED,
    fontSize: 12.6,
    fontWeight: '600',
  },
  sidePhotoGrid: {
    flex: 1.32,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  sidePhotoSlot: {
    backgroundColor: '#F4EDE5',
    borderColor: BORDER,
    borderRadius: 14,
    borderWidth: 1,
    height: 84.5,
    overflow: 'hidden',
    width: '47%',
  },
  sidePlaceholder: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  slotImage: {
    height: '100%',
    resizeMode: 'cover',
    width: '100%',
  },
  photoAddBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 253, 247, 0.96)',
    borderRadius: 999,
    bottom: 8,
    height: 31,
    justifyContent: 'center',
    position: 'absolute',
    right: 8,
    shadowColor: '#1F261B',
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    width: 31,
  },
  formBlock: {
    gap: 11,
  },
  fieldLabel: {
    color: TEXT,
    fontFamily: serifFont,
    fontSize: 20,
    fontWeight: Platform.OS === 'ios' ? '500' : '700',
    letterSpacing: -0.25,
    marginTop: 2,
  },
  fieldLabelNoMargin: {
    color: TEXT,
    fontFamily: serifFont,
    fontSize: 20,
    fontWeight: Platform.OS === 'ios' ? '500' : '700',
    letterSpacing: -0.25,
  },
  titleField: {
    alignItems: 'center',
    backgroundColor: FIELD_BACKGROUND,
    borderColor: BORDER,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    height: 56,
    paddingLeft: 17,
    paddingRight: 14,
  },
  titleInput: {
    color: TEXT,
    flex: 1,
    fontSize: 15.5,
    fontWeight: '600',
    padding: 0,
  },
  counterText: {
    color: MUTED,
    fontSize: 12.5,
    fontWeight: '600',
  },
  actionField: {
    alignItems: 'center',
    backgroundColor: FIELD_BACKGROUND,
    borderColor: BORDER,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    height: 56,
    justifyContent: 'space-between',
    paddingHorizontal: 17,
  },
  actionFieldLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    gap: 13,
    minWidth: 0,
  },
  actionFieldText: {
    color: MUTED,
    flex: 1,
    fontSize: 15.2,
    fontWeight: '600',
  },
  labelWithInfoRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  intentRow: {
    flexDirection: 'row',
    gap: 9,
  },
  intentChip: {
    alignItems: 'center',
    backgroundColor: FIELD_BACKGROUND,
    borderColor: BORDER,
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 7,
    height: 48,
    justifyContent: 'center',
  },
  intentChipActive: {
    backgroundColor: DARK_OLIVE,
    borderColor: DARK_OLIVE,
  },
  intentChipText: {
    color: MUTED,
    fontSize: 13.3,
    fontWeight: '700',
  },
  intentChipTextActive: {
    color: '#FFFFFF',
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  halfFieldBlock: {
    flex: 1,
    gap: 9,
  },
  compensationField: {
    alignItems: 'center',
    backgroundColor: FIELD_BACKGROUND,
    borderColor: BORDER,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    height: 56,
    paddingHorizontal: 14,
  },
  euroText: {
    color: MUTED,
    fontSize: 16,
    fontWeight: '700',
    marginRight: 10,
  },
  compensationInput: {
    color: TEXT,
    flex: 1,
    fontSize: 14.5,
    fontWeight: '600',
    padding: 0,
  },
  perDayText: {
    color: TEXT,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
    marginRight: 4,
  },
  locationField: {
    alignItems: 'center',
    backgroundColor: FIELD_BACKGROUND,
    borderColor: BORDER,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 9,
    height: 56,
    paddingHorizontal: 14,
  },
  locationText: {
    color: MUTED,
    flex: 1,
    fontSize: 13.8,
    fontWeight: '650',
  },
  feedbackCard: {
    alignItems: 'flex-start',
    backgroundColor: 'rgba(238, 242, 230, 0.82)',
    borderColor: 'rgba(65, 72, 44, 0.13)',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    padding: 13,
  },
  feedbackText: {
    color: DARK_OLIVE,
    flex: 1,
    fontSize: 12.8,
    fontWeight: '650',
    lineHeight: 18,
  },
  continueButton: {
    alignItems: 'center',
    backgroundColor: DARK_OLIVE,
    borderRadius: 18,
    flexDirection: 'row',
    gap: 12,
    height: 62,
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: DARK_OLIVE_DARK,
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '850',
    letterSpacing: -0.12,
  },
  disabledButton: {
    opacity: 0.58,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },
});
