import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
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

import { colors, radii, spacing } from '@/constants/theme';

const ADD_GREEN = '#55633F';
const ADD_GREEN_DARK = '#405030';
const ADD_BACKGROUND = '#FFFDF7';
const CARD_BACKGROUND = 'rgba(255, 253, 247, 0.86)';
const SOFT_BACKGROUND = '#F8F3EA';
const BORDER = 'rgba(64, 80, 48, 0.16)';
const MUTED_TEXT = '#68706B';

type ListingIntent = 'Lainaa' | 'Vuokraa' | 'Vaihda' | 'Ilmainen';

type IntentOption = {
  icon: keyof typeof Ionicons.glyphMap;
  label: ListingIntent;
};

const intentOptions: IntentOption[] = [
  { icon: 'hand-left-outline', label: 'Lainaa' },
  { icon: 'calendar-outline', label: 'Vuokraa' },
  { icon: 'swap-horizontal-outline', label: 'Vaihda' },
  { icon: 'leaf-outline', label: 'Ilmainen' },
];

const categories = ['Työkalut', 'Ulkoilu', 'Matkustus', 'Elektroniikka', 'Koti'];
const locations = ['Nykyinen sijainti', 'Koti lähellä', 'Keskusta', 'Valitse myöhemmin'];
const availabilityOptions = ['Vapaa tänään', 'Vapaa huomenna', 'Viikonloppuna', 'Sovitaan erikseen'];

export default function AddItemScreen() {
  const [intent, setIntent] = useState<ListingIntent>('Lainaa');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryIndex, setCategoryIndex] = useState(-1);
  const [locationIndex, setLocationIndex] = useState(-1);
  const [availabilityIndex, setAvailabilityIndex] = useState(-1);
  const [imagePlaceholders, setImagePlaceholders] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const selectedCategory = categoryIndex >= 0 ? categories[categoryIndex] : 'Valitse kategoria';
  const selectedLocation = locationIndex >= 0 ? locations[locationIndex] : 'Valitse sijainti';
  const selectedAvailability = availabilityIndex >= 0 ? availabilityOptions[availabilityIndex] : 'Milloin tavara on saatavilla?';

  const completionText = useMemo(() => {
    const filled = [title.trim(), description.trim(), price.trim(), categoryIndex >= 0, locationIndex >= 0, availabilityIndex >= 0].filter(Boolean).length;
    return `${filled}/6 kohtaa täytetty`;
  }, [availabilityIndex, categoryIndex, description, locationIndex, price, title]);

  const cycleCategory = () => {
    setFeedback(null);
    setCategoryIndex((current) => (current + 1) % categories.length);
  };

  const cycleLocation = () => {
    setFeedback(null);
    setLocationIndex((current) => (current + 1) % locations.length);
  };

  const cycleAvailability = () => {
    setFeedback(null);
    setAvailabilityIndex((current) => (current + 1) % availabilityOptions.length);
  };

  const handleImagePlaceholderPress = () => {
    setFeedback('Kuvien lisääminen kytketään myöhemmin. Tämä on vielä käyttöliittymän testitila.');
    setImagePlaceholders((current) => Math.min(current + 1, 3));
  };

  const handlePublishPress = () => {
    setFeedback('Julkaisua ei ole vielä kytketty. Ilmoitusta ei tallennettu tai julkaistu.');
  };

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text allowFontScaling={false} style={styles.title}>Lisää</Text>
              <View style={styles.titleDot} />
            </View>
            <Text allowFontScaling={false} style={styles.subtitle}>Luo uusi ilmoitus helposti.</Text>
          </View>

          <View style={styles.intentRow}>
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
                    styles.intentCard,
                    selected && styles.intentCardActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons color={selected ? '#FFFFFF' : ADD_GREEN_DARK} name={option.icon} size={27} />
                  <Text allowFontScaling={false} style={[styles.intentLabel, selected && styles.intentLabelActive]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable onPress={handleImagePlaceholderPress} style={({ pressed }) => [styles.photoCard, pressed && styles.pressed]}>
            <Ionicons color={ADD_GREEN} name="camera-outline" size={45} />
            <Text allowFontScaling={false} style={styles.photoTitle}>Lisää kuvat</Text>
            <Text allowFontScaling={false} style={styles.photoSubtitle}>Napauta lisätäksesi kuvia myöhemmin.</Text>

            <View style={styles.thumbnailRow}>
              {[0, 1, 2].map((index) => (
                <View key={index} style={[styles.thumbnail, index < imagePlaceholders && styles.thumbnailActive]}>
                  <Ionicons
                    color={index < imagePlaceholders ? ADD_GREEN : '#8E8A82'}
                    name={index < imagePlaceholders ? 'checkmark-circle-outline' : 'image-outline'}
                    size={30}
                  />
                </View>
              ))}
            </View>
          </Pressable>

          <View style={styles.formStack}>
            <FormInputRow
              icon="pricetag-outline"
              label="Ilmoituksen nimi"
              onChangeText={(value) => {
                setFeedback(null);
                setTitle(value);
              }}
              placeholder="Esim. Akkuporakone"
              value={title}
            />

            <FormActionRow icon="grid-outline" label="Kategoria" onPress={cycleCategory} value={selectedCategory} />

            <FormInputRow
              icon="document-text-outline"
              label="Kuvaus"
              multiline
              onChangeText={(value) => {
                setFeedback(null);
                setDescription(value);
              }}
              placeholder="Kerro tarkemmin tavarasta"
              value={description}
            />

            <FormInputRow
              icon="cash-outline"
              keyboardType="default"
              label="Hinta / korvaus"
              onChangeText={(value) => {
                setFeedback(null);
                setPrice(value);
              }}
              placeholder={intent === 'Ilmainen' ? 'Ei korvausta' : 'Esim. 5 € / pv tai vaihto'}
              value={price}
            />

            <FormActionRow icon="location-outline" label="Sijainti" onPress={cycleLocation} rightIcon="locate-outline" value={selectedLocation} />

            <FormActionRow icon="calendar-clear-outline" label="Saatavuus" onPress={cycleAvailability} value={selectedAvailability} />
          </View>

          <View style={styles.tipCard}>
            <View style={styles.tipIconCircle}>
              <Ionicons color="#FFFFFF" name="bulb-outline" size={25} />
            </View>
            <Text allowFontScaling={false} style={styles.tipText}>
              <Text style={styles.tipStrong}>Vinkki:</Text> Lisää selkeät kuvat ja kuvaus, jotta naapurit löytävät tavaran helpommin.
            </Text>
          </View>

          {!!feedback && (
            <View style={styles.feedbackCard}>
              <Ionicons color={ADD_GREEN_DARK} name="information-circle-outline" size={21} />
              <Text allowFontScaling={false} style={styles.feedbackText}>{feedback}</Text>
            </View>
          )}

          <Text allowFontScaling={false} style={styles.completionText}>{completionText}</Text>

          <Pressable onPress={handlePublishPress} style={({ pressed }) => [styles.publishButton, pressed && styles.pressed]}>
            <Text allowFontScaling={false} style={styles.publishText}>Julkaise ilmoitus</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type FormInputRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  label: string;
  multiline?: boolean;
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
};

function FormInputRow({ icon, keyboardType = 'default', label, multiline, onChangeText, placeholder, value }: FormInputRowProps) {
  return (
    <View style={[styles.formRow, multiline && styles.formRowMultiline]}>
      <Ionicons color={ADD_GREEN_DARK} name={icon} size={25} />
      <View style={styles.formTextWrap}>
        <Text allowFontScaling={false} style={styles.formLabel}>{label}</Text>
        <TextInput
          keyboardType={keyboardType}
          multiline={multiline}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9A968E"
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
  onPress: () => void;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  value: string;
};

function FormActionRow({ icon, label, onPress, rightIcon = 'chevron-forward', value }: FormActionRowProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.formRow, pressed && styles.pressed]}>
      <Ionicons color={ADD_GREEN_DARK} name={icon} size={25} />
      <View style={styles.formTextWrap}>
        <Text allowFontScaling={false} style={styles.formLabel}>{label}</Text>
        <Text allowFontScaling={false} numberOfLines={1} style={styles.formValue}>{value}</Text>
      </View>
      <Ionicons color={ADD_GREEN_DARK} name={rightIcon} size={22} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: ADD_BACKGROUND,
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    paddingBottom: 120,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  header: {
    marginBottom: 24,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  title: {
    color: ADD_GREEN,
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1.3,
    lineHeight: 48,
  },
  titleDot: {
    backgroundColor: ADD_GREEN,
    borderColor: 'rgba(255, 253, 247, 0.8)',
    borderRadius: 999,
    borderWidth: 2,
    height: 12,
    marginTop: 8,
    width: 12,
  },
  subtitle: {
    color: '#667083',
    fontSize: 17,
    fontWeight: '500',
    lineHeight: 24,
    marginTop: 4,
  },
  intentRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 22,
  },
  intentCard: {
    alignItems: 'center',
    backgroundColor: CARD_BACKGROUND,
    borderColor: BORDER,
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    gap: 8,
    height: 96,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
  },
  intentCardActive: {
    backgroundColor: ADD_GREEN,
    borderColor: ADD_GREEN,
  },
  intentLabel: {
    color: '#151C18',
    fontSize: 14.8,
    fontWeight: '700',
  },
  intentLabelActive: {
    color: '#FFFFFF',
  },
  photoCard: {
    alignItems: 'center',
    backgroundColor: SOFT_BACKGROUND,
    borderColor: 'rgba(64, 80, 48, 0.32)',
    borderRadius: 22,
    borderStyle: 'dashed',
    borderWidth: 1.3,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 26,
    shadowColor: '#000',
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
  },
  photoTitle: {
    color: ADD_GREEN,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginTop: 6,
  },
  photoSubtitle: {
    color: MUTED_TEXT,
    fontSize: 14.5,
    fontWeight: '600',
    lineHeight: 21,
    marginTop: 4,
    textAlign: 'center',
  },
  thumbnailRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 18,
  },
  thumbnail: {
    alignItems: 'center',
    borderColor: 'rgba(105, 97, 87, 0.38)',
    borderRadius: 12,
    borderStyle: 'dashed',
    borderWidth: 1.2,
    height: 78,
    justifyContent: 'center',
    width: 78,
  },
  thumbnailActive: {
    backgroundColor: 'rgba(85, 99, 63, 0.08)',
    borderColor: ADD_GREEN,
  },
  formStack: {
    gap: 12,
  },
  formRow: {
    alignItems: 'center',
    backgroundColor: CARD_BACKGROUND,
    borderColor: BORDER,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 16,
    minHeight: 70,
    paddingHorizontal: 18,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.035,
    shadowRadius: 14,
  },
  formRowMultiline: {
    alignItems: 'flex-start',
    minHeight: 92,
    paddingTop: 16,
  },
  formTextWrap: {
    flex: 1,
  },
  formLabel: {
    color: '#202620',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.15,
  },
  formValue: {
    color: '#908D87',
    fontSize: 15.5,
    fontWeight: '600',
    marginTop: 3,
  },
  input: {
    color: '#262C27',
    fontSize: 15.5,
    fontWeight: '600',
    marginTop: 1,
    padding: 0,
  },
  multilineInput: {
    lineHeight: 21,
    minHeight: 38,
    paddingTop: 2,
    textAlignVertical: 'top',
  },
  tipCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(85, 99, 63, 0.08)',
    borderColor: 'rgba(85, 99, 63, 0.2)',
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    marginTop: 18,
    padding: spacing.lg,
  },
  tipIconCircle: {
    alignItems: 'center',
    backgroundColor: ADD_GREEN,
    borderRadius: 999,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  tipText: {
    color: ADD_GREEN_DARK,
    flex: 1,
    fontSize: 15.2,
    fontWeight: '500',
    lineHeight: 22,
  },
  tipStrong: {
    fontWeight: '800',
  },
  feedbackCard: {
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 253, 247, 0.9)',
    borderColor: 'rgba(85, 99, 63, 0.22)',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 9,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  feedbackText: {
    color: ADD_GREEN_DARK,
    flex: 1,
    fontSize: 13.5,
    fontWeight: '700',
    lineHeight: 19,
  },
  completionText: {
    color: MUTED_TEXT,
    fontSize: 13.2,
    fontWeight: '700',
    marginTop: 13,
    textAlign: 'center',
  },
  publishButton: {
    alignItems: 'center',
    backgroundColor: ADD_GREEN,
    borderRadius: 18,
    height: 62,
    justifyContent: 'center',
    marginTop: 14,
    shadowColor: '#000',
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
  publishText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  pressed: {
    opacity: 0.78,
  },
});
