import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
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

const ADD_GREEN = '#55633F';
const ADD_GREEN_DARK = '#3F4E2F';
const ADD_BACKGROUND = '#FFFDF7';
const CARD_BACKGROUND = 'rgba(255, 253, 247, 0.92)';
const FIELD_BORDER = 'rgba(64, 80, 48, 0.12)';
const DASHED_BORDER = 'rgba(85, 99, 63, 0.32)';
const MUTED_TEXT = '#8B8880';
const BODY_TEXT = '#20251F';

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

const intentOptions: IntentOption[] = [
  { icon: 'leaf-outline', label: 'Lainaa' },
  { icon: 'briefcase-outline', label: 'Vuokraa' },
  { icon: 'swap-horizontal-outline', label: 'Vaihda' },
  { icon: 'gift-outline', label: 'Ilmainen' },
];

const categories = ['Työkalut', 'Ulkoilu', 'Matkustus', 'Elektroniikka', 'Koti'];

export default function AddItemScreen() {
  const router = useRouter();
  const [intent, setIntent] = useState<ListingIntent>('Lainaa');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryIndex, setCategoryIndex] = useState(-1);
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const selectedCategory = categoryIndex >= 0 ? categories[categoryIndex] : 'Valitse kategoria';
  const locationLabel = isGettingLocation ? 'Haetaan sijaintia...' : selectedLocation?.label ?? 'Valitse sijainti';

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
    if (isGettingLocation) {
      return;
    }

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
          if (buttonIndex === 0) {
            void useCurrentLocation();
          }

          if (buttonIndex === 1) {
            chooseLocationLater();
          }
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

  const handleImagePress = () => {
    setFeedback('Kuvien lisääminen kytketään myöhemmin. Tämä on vielä käyttöliittymän testitila.');
  };

  const handleContinue = () => {
    setFeedback('Jatkamista ei ole vielä kytketty. Ilmoitusta ei tallennettu tai julkaistu.');
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityLabel="Sulje"
            hitSlop={12}
            onPress={() => router.replace('/(tabs)')}
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
          >
            <Ionicons color="#1D241D" name="close-outline" size={27} />
          </Pressable>

          <Text allowFontScaling={false} style={styles.pageTitle}>Luo ilmoitus</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable onPress={handleImagePress} style={({ pressed }) => [styles.photoCard, pressed && styles.pressed]}>
            <View style={styles.cameraCircle}>
              <Ionicons color="#FFFFFF" name="camera-outline" size={35} />
              <View style={styles.cameraPlusBadge}>
                <Ionicons color={ADD_GREEN} name="add" size={16} />
              </View>
            </View>

            <Text allowFontScaling={false} style={styles.photoTitle}>Lisää kuvia</Text>
            <Text allowFontScaling={false} style={styles.photoSubtitle}>Lisää jopa 10 kuvaa</Text>
            <View pointerEvents="none" style={styles.leafGhost}>
              <Ionicons color="rgba(85, 99, 63, 0.075)" name="leaf-outline" size={82} />
            </View>
          </Pressable>

          <View style={styles.formStack}>
            <FormInputRow
              icon="pricetag-outline"
              label="Otsikko"
              onChangeText={(value) => {
                setFeedback(null);
                setTitle(value);
              }}
              placeholder="Mitä jaat?"
              value={title}
            />

            <FormInputRow
              icon="document-text-outline"
              label="Kuvaus"
              multiline
              onChangeText={(value) => {
                setFeedback(null);
                setDescription(value);
              }}
              placeholder="Kerro tavarasta, kunnosta ja muista oleellisista tiedoista."
              value={description}
            />

            <FormActionRow icon="grid-outline" label="Kategoria" onPress={cycleCategory} value={selectedCategory} />

            <View style={styles.shareMethodCard}>
              <View style={styles.shareIconSlot}>
                <Ionicons color={ADD_GREEN_DARK} name="swap-horizontal-outline" size={24} />
              </View>
              <View style={styles.shareContent}>
                <Text allowFontScaling={false} style={styles.formLabel}>Jakotapa</Text>
                <View style={styles.intentChips}>
                  {intentOptions.map((option) => {
                    const selected = option.label === intent;

                    return (
                      <Pressable
                        key={option.label}
                        onPress={() => {
                          setFeedback(null);
                          setIntent(option.label);
                        }}
                        style={({ pressed }) => [
                          styles.intentChip,
                          selected && styles.intentChipActive,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Ionicons color={selected ? '#FFFFFF' : ADD_GREEN_DARK} name={option.icon} size={15} />
                        <Text allowFontScaling={false} style={[styles.intentChipText, selected && styles.intentChipTextActive]}>
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>

            <FormInputRow
              icon="pricetag-outline"
              label="Hinta / korvaus"
              onChangeText={(value) => {
                setFeedback(null);
                setPrice(value);
              }}
              optionalText="Valinnainen"
              placeholder="0,00 €"
              value={price}
            />

            <FormActionRow
              icon="location-outline"
              label="Sijainti"
              loading={isGettingLocation}
              onPress={openLocationMenu}
              value={locationLabel}
            />
          </View>

          {!!feedback && (
            <View style={styles.feedbackCard}>
              <Ionicons color={ADD_GREEN_DARK} name="information-circle-outline" size={19} />
              <Text allowFontScaling={false} style={styles.feedbackText}>{feedback}</Text>
            </View>
          )}

          <Pressable onPress={handleContinue} style={({ pressed }) => [styles.continueButton, pressed && styles.pressed]}>
            <Text allowFontScaling={false} style={styles.continueText}>Jatka</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function formatLocationLabel(place?: Location.LocationGeocodedAddress) {
  if (!place) {
    return 'Nykyinen sijainti valittu';
  }

  const area = place.district ?? place.subregion;
  const city = place.city ?? place.region;

  if (area && city && area !== city) {
    return `${area}, ${city}`;
  }

  return city ?? place.region ?? 'Nykyinen sijainti valittu';
}

type FormInputRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  multiline?: boolean;
  onChangeText: (value: string) => void;
  optionalText?: string;
  placeholder: string;
  value: string;
};

function FormInputRow({ icon, label, multiline, onChangeText, optionalText, placeholder, value }: FormInputRowProps) {
  return (
    <View style={[styles.formRow, multiline && styles.formRowMultiline]}>
      <Ionicons color={ADD_GREEN_DARK} name={icon} size={23} />
      <View style={styles.formTextWrap}>
        <View style={styles.labelRow}>
          <Text allowFontScaling={false} style={styles.formLabel}>{label}</Text>
          {!!optionalText && <Text allowFontScaling={false} style={styles.optionalText}>{optionalText}</Text>}
        </View>
        <TextInput
          multiline={multiline}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={MUTED_TEXT}
          style={[styles.input, multiline && styles.multilineInput]}
          value={value}
        />
      </View>
    </View>
  );
}

type FormActionRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  loading?: boolean;
  onPress: () => void;
  value: string;
};

function FormActionRow({ icon, label, loading, onPress, value }: FormActionRowProps) {
  return (
    <Pressable disabled={loading} onPress={onPress} style={({ pressed }) => [styles.formRow, pressed && styles.pressed]}>
      <Ionicons color={ADD_GREEN_DARK} name={icon} size={23} />
      <View style={styles.formTextWrap}>
        <Text allowFontScaling={false} style={styles.formLabel}>{label}</Text>
        <Text allowFontScaling={false} numberOfLines={1} style={styles.formValue}>{value}</Text>
      </View>
      {loading ? (
        <ActivityIndicator color={ADD_GREEN_DARK} size="small" />
      ) : (
        <Ionicons color={ADD_GREEN_DARK} name="chevron-forward" size={22} />
      )}
    </Pressable>
  );
}

const serifFont = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

const styles = StyleSheet.create({
  screen: {
    backgroundColor: ADD_BACKGROUND,
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 26,
    paddingTop: 8,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 253, 247, 0.88)',
    borderColor: FIELD_BORDER,
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
    color: '#182118',
    fontFamily: serifFont,
    fontSize: 30,
    fontWeight: Platform.OS === 'ios' ? '500' : '400',
    letterSpacing: -0.45,
    lineHeight: 38,
  },
  headerSpacer: {
    width: 45,
  },
  content: {
    paddingBottom: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  photoCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 253, 247, 0.58)',
    borderColor: DASHED_BORDER,
    borderRadius: 19,
    borderStyle: 'dashed',
    borderWidth: 1.25,
    height: 202,
    justifyContent: 'center',
    marginBottom: 22,
    overflow: 'hidden',
  },
  cameraCircle: {
    alignItems: 'center',
    backgroundColor: ADD_GREEN,
    borderRadius: 999,
    height: 78,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.075,
    shadowRadius: 15,
    width: 78,
  },
  cameraPlusBadge: {
    alignItems: 'center',
    backgroundColor: '#FFFDF7',
    borderRadius: 999,
    bottom: 17,
    height: 21,
    justifyContent: 'center',
    position: 'absolute',
    right: 15,
    width: 21,
  },
  photoTitle: {
    color: '#1F2A1D',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginTop: 16,
  },
  photoSubtitle: {
    color: MUTED_TEXT,
    fontSize: 15,
    fontWeight: '500',
    marginTop: 7,
  },
  leafGhost: {
    opacity: 0.9,
    position: 'absolute',
    right: 22,
    top: 102,
    transform: [{ rotate: '-28deg' }],
  },
  formStack: {
    gap: 13,
  },
  formRow: {
    alignItems: 'center',
    backgroundColor: CARD_BACKGROUND,
    borderColor: FIELD_BORDER,
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 15,
    minHeight: 70,
    paddingHorizontal: 18,
    paddingVertical: 11,
    shadowColor: '#000',
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
  },
  formRowMultiline: {
    alignItems: 'flex-start',
    minHeight: 84,
    paddingTop: 15,
  },
  formTextWrap: {
    flex: 1,
  },
  labelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  formLabel: {
    color: BODY_TEXT,
    fontSize: 16.4,
    fontWeight: '700',
    letterSpacing: -0.12,
    lineHeight: 21,
  },
  formValue: {
    color: MUTED_TEXT,
    fontSize: 14.8,
    fontWeight: '500',
    marginTop: 4,
  },
  optionalText: {
    color: MUTED_TEXT,
    fontSize: 13.3,
    fontWeight: '500',
  },
  input: {
    color: BODY_TEXT,
    fontSize: 14.8,
    fontWeight: '500',
    marginTop: 3,
    padding: 0,
  },
  multilineInput: {
    lineHeight: 20,
    minHeight: 38,
    paddingTop: 1,
    textAlignVertical: 'top',
  },
  shareMethodCard: {
    alignItems: 'center',
    backgroundColor: CARD_BACKGROUND,
    borderColor: FIELD_BORDER,
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    minHeight: 94,
    paddingHorizontal: 18,
    paddingVertical: 13,
    shadowColor: '#000',
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
  },
  shareIconSlot: {
    alignSelf: 'flex-start',
    paddingTop: 3,
  },
  shareContent: {
    flex: 1,
  },
  intentChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 9,
  },
  intentChip: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 253, 247, 0.84)',
    borderColor: 'rgba(85, 99, 63, 0.21)',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    minHeight: 34,
    paddingHorizontal: 10,
  },
  intentChipActive: {
    backgroundColor: ADD_GREEN,
    borderColor: ADD_GREEN,
    shadowColor: '#000',
    shadowOffset: { height: 5, width: 0 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
  },
  intentChipText: {
    color: ADD_GREEN_DARK,
    fontSize: 12.8,
    fontWeight: '600',
  },
  intentChipTextActive: {
    color: '#FFFFFF',
  },
  feedbackCard: {
    alignItems: 'flex-start',
    backgroundColor: 'rgba(85, 99, 63, 0.08)',
    borderColor: 'rgba(85, 99, 63, 0.18)',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  feedbackText: {
    color: ADD_GREEN_DARK,
    flex: 1,
    fontSize: 13.2,
    fontWeight: '700',
    lineHeight: 18,
  },
  continueButton: {
    alignItems: 'center',
    backgroundColor: ADD_GREEN,
    borderRadius: 17,
    height: 60,
    justifyContent: 'center',
    marginTop: 22,
    shadowColor: '#000',
    shadowOffset: { height: 9, width: 0 },
    shadowOpacity: 0.075,
    shadowRadius: 16,
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.15,
  },
  pressed: {
    opacity: 0.78,
  },
});
