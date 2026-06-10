import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
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

const ADD_GREEN = '#55633F';
const ADD_GREEN_DARK = '#3F4E2F';
const ADD_BACKGROUND = '#FFFDF7';
const CARD_BACKGROUND = 'rgba(255, 253, 247, 0.9)';
const FIELD_BORDER = 'rgba(64, 80, 48, 0.13)';
const DASHED_BORDER = 'rgba(85, 99, 63, 0.34)';
const MUTED_TEXT = '#8B8880';
const BODY_TEXT = '#1F241F';

type ListingIntent = 'Lainaa' | 'Vuokraa' | 'Vaihda' | 'Ilmainen';

type IntentOption = {
  icon: keyof typeof Ionicons.glyphMap;
  label: ListingIntent;
};

const intentOptions: IntentOption[] = [
  { icon: 'leaf-outline', label: 'Lainaa' },
  { icon: 'briefcase-outline', label: 'Vuokraa' },
  { icon: 'swap-horizontal-outline', label: 'Vaihda' },
  { icon: 'gift-outline', label: 'Ilmainen' },
];

const categories = ['Työkalut', 'Ulkoilu', 'Matkustus', 'Elektroniikka', 'Koti'];
const locations = ['Nykyinen sijainti', 'Koti lähellä', 'Keskusta', 'Valitse myöhemmin'];

export default function AddItemScreen() {
  const router = useRouter();
  const [intent, setIntent] = useState<ListingIntent>('Lainaa');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryIndex, setCategoryIndex] = useState(-1);
  const [locationIndex, setLocationIndex] = useState(-1);
  const [feedback, setFeedback] = useState<string | null>(null);

  const selectedCategory = categoryIndex >= 0 ? categories[categoryIndex] : 'Valitse kategoria';
  const selectedLocation = locationIndex >= 0 ? locations[locationIndex] : 'Valitse sijainti';

  const cycleCategory = () => {
    setFeedback(null);
    setCategoryIndex((current) => (current + 1) % categories.length);
  };

  const cycleLocation = () => {
    setFeedback(null);
    setLocationIndex((current) => (current + 1) % locations.length);
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
            <Ionicons color="#1D241D" name="close-outline" size={34} />
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
              <Ionicons color="#FFFFFF" name="camera-outline" size={43} />
              <View style={styles.cameraPlusBadge}>
                <Ionicons color={ADD_GREEN} name="add" size={19} />
              </View>
            </View>

            <Text allowFontScaling={false} style={styles.photoTitle}>Lisää kuvia</Text>
            <Text allowFontScaling={false} style={styles.photoSubtitle}>Lisää jopa 10 kuvaa</Text>
            <View pointerEvents="none" style={styles.leafGhost}>
              <Ionicons color="rgba(85, 99, 63, 0.09)" name="leaf-outline" size={98} />
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
                <Ionicons color={ADD_GREEN_DARK} name="swap-horizontal-outline" size={28} />
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
                        <Ionicons color={selected ? '#FFFFFF' : ADD_GREEN_DARK} name={option.icon} size={18} />
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
              placeholder={intent === 'Ilmainen' ? '0,00 €' : '0,00 €'}
              value={price}
            />

            <FormActionRow icon="location-outline" label="Sijainti" onPress={cycleLocation} value={selectedLocation} />
          </View>

          {!!feedback && (
            <View style={styles.feedbackCard}>
              <Ionicons color={ADD_GREEN_DARK} name="information-circle-outline" size={20} />
              <Text allowFontScaling={false} style={styles.feedbackText}>{feedback}</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable onPress={handleContinue} style={({ pressed }) => [styles.continueButton, pressed && styles.pressed]}>
            <Text allowFontScaling={false} style={styles.continueText}>Jatka</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
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
      <Ionicons color={ADD_GREEN_DARK} name={icon} size={27} />
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
  onPress: () => void;
  value: string;
};

function FormActionRow({ icon, label, onPress, value }: FormActionRowProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.formRow, pressed && styles.pressed]}>
      <Ionicons color={ADD_GREEN_DARK} name={icon} size={27} />
      <View style={styles.formTextWrap}>
        <Text allowFontScaling={false} style={styles.formLabel}>{label}</Text>
        <Text allowFontScaling={false} numberOfLines={1} style={styles.formValue}>{value}</Text>
      </View>
      <Ionicons color={ADD_GREEN_DARK} name="chevron-forward" size={25} />
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
    paddingTop: 10,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 253, 247, 0.9)',
    borderColor: FIELD_BORDER,
    borderRadius: 16,
    borderWidth: 1,
    height: 53,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    width: 53,
  },
  pageTitle: {
    color: '#182118',
    fontFamily: serifFont,
    fontSize: 34,
    fontWeight: Platform.OS === 'ios' ? '500' : '400',
    letterSpacing: -0.55,
    lineHeight: 42,
  },
  headerSpacer: {
    width: 53,
  },
  content: {
    paddingBottom: 132,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  photoCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 253, 247, 0.58)',
    borderColor: DASHED_BORDER,
    borderRadius: 20,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    height: 234,
    justifyContent: 'center',
    marginBottom: 28,
    overflow: 'hidden',
  },
  cameraCircle: {
    alignItems: 'center',
    backgroundColor: ADD_GREEN,
    borderRadius: 999,
    height: 92,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.09,
    shadowRadius: 18,
    width: 92,
  },
  cameraPlusBadge: {
    alignItems: 'center',
    backgroundColor: '#FFFDF7',
    borderRadius: 999,
    bottom: 20,
    height: 24,
    justifyContent: 'center',
    position: 'absolute',
    right: 18,
    width: 24,
  },
  photoTitle: {
    color: '#1F2A1D',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginTop: 20,
  },
  photoSubtitle: {
    color: MUTED_TEXT,
    fontSize: 17,
    fontWeight: '600',
    marginTop: 10,
  },
  leafGhost: {
    opacity: 0.9,
    position: 'absolute',
    right: 18,
    top: 110,
    transform: [{ rotate: '-28deg' }],
  },
  formStack: {
    gap: 16,
  },
  formRow: {
    alignItems: 'center',
    backgroundColor: CARD_BACKGROUND,
    borderColor: FIELD_BORDER,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 18,
    minHeight: 84,
    paddingHorizontal: 21,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { height: 7, width: 0 },
    shadowOpacity: 0.025,
    shadowRadius: 12,
  },
  formRowMultiline: {
    alignItems: 'flex-start',
    minHeight: 106,
    paddingTop: 18,
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
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.2,
    lineHeight: 24,
  },
  formValue: {
    color: MUTED_TEXT,
    fontSize: 17,
    fontWeight: '600',
    marginTop: 7,
  },
  optionalText: {
    color: MUTED_TEXT,
    fontSize: 15,
    fontWeight: '600',
  },
  input: {
    color: BODY_TEXT,
    fontSize: 17,
    fontWeight: '600',
    marginTop: 5,
    padding: 0,
  },
  multilineInput: {
    lineHeight: 23,
    minHeight: 48,
    paddingTop: 2,
    textAlignVertical: 'top',
  },
  shareMethodCard: {
    alignItems: 'center',
    backgroundColor: CARD_BACKGROUND,
    borderColor: FIELD_BORDER,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 18,
    minHeight: 108,
    paddingHorizontal: 21,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { height: 7, width: 0 },
    shadowOpacity: 0.025,
    shadowRadius: 12,
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
    gap: 10,
    marginTop: 11,
  },
  intentChip: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 253, 247, 0.82)',
    borderColor: 'rgba(85, 99, 63, 0.22)',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 7,
    minHeight: 40,
    paddingHorizontal: 15,
  },
  intentChipActive: {
    backgroundColor: ADD_GREEN,
    borderColor: ADD_GREEN,
    shadowColor: '#000',
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  intentChipText: {
    color: ADD_GREEN_DARK,
    fontSize: 15.2,
    fontWeight: '700',
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
    gap: 9,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  feedbackText: {
    color: ADD_GREEN_DARK,
    flex: 1,
    fontSize: 13.7,
    fontWeight: '700',
    lineHeight: 19,
  },
  footer: {
    backgroundColor: ADD_BACKGROUND,
    borderTopColor: 'rgba(64, 80, 48, 0.06)',
    borderTopWidth: 1,
    bottom: 0,
    left: 0,
    paddingBottom: Platform.OS === 'ios' ? 14 : 18,
    paddingHorizontal: 24,
    paddingTop: 14,
    position: 'absolute',
    right: 0,
  },
  continueButton: {
    alignItems: 'center',
    backgroundColor: ADD_GREEN,
    borderRadius: 18,
    height: 66,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  pressed: {
    opacity: 0.78,
  },
});
