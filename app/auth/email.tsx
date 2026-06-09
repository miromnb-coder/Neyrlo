import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const BRAND_GREEN = '#304327';
const CTA_GREEN = '#314423';
const TEXT_MUTED = '#606767';
const PLACEHOLDER = '#8C9190';
const FIELD_BORDER = '#405936';
const BACKGROUND = '#FFFDF7';

export default function EmailAuthScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        bounces={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable hitSlop={14} onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Ionicons color="#38403E" name="arrow-back-outline" size={32} />
        </Pressable>

        <Text allowFontScaling={false} style={styles.smallLogo}>Neyrlo</Text>

        <View style={styles.header}>
          <Text allowFontScaling={false} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82} style={styles.title}>
            Jatka sähköpostilla
          </Text>
          <Text allowFontScaling={false} style={styles.subtitle}>Kirjaudu sisään tai luo tili sähköpostilla.</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputBox}>
            <Ionicons color="#424946" name="mail-outline" size={29} />
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="Sähköposti"
              placeholderTextColor={PLACEHOLDER}
              style={styles.input}
            />
          </View>

          <View style={styles.inputBox}>
            <Ionicons color="#424946" name="lock-closed-outline" size={29} />
            <TextInput
              placeholder="Salasana"
              placeholderTextColor={PLACEHOLDER}
              secureTextEntry
              style={styles.input}
            />
            <Ionicons color="#424946" name="eye-outline" size={30} />
          </View>

          <Pressable style={({ pressed }) => pressed && styles.pressed}>
            <Text allowFontScaling={false} style={styles.forgotText}>Unohditko salasanan?</Text>
          </Pressable>

          <Pressable style={({ pressed }) => [styles.termsRow, pressed && styles.pressed]}>
            <View style={styles.checkbox} />
            <Text allowFontScaling={false} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.86} style={styles.termsText}>
              Hyväksyn <Text style={styles.termsLink}>käyttöehdot</Text> ja <Text style={styles.termsLink}>tietosuojakäytännön</Text>
            </Text>
          </Pressable>

          <Pressable style={({ pressed }) => [styles.continueButton, pressed && styles.pressed]}>
            <Text allowFontScaling={false} style={styles.continueText}>Jatka</Text>
          </Pressable>

          <View style={styles.bottomRow}>
            <Text allowFontScaling={false} style={styles.bottomText}>Onko sinulla jo tili?</Text>
            <Pressable style={({ pressed }) => pressed && styles.pressed}>
              <Text allowFontScaling={false} style={styles.bottomLink}>Kirjaudu</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const serifFont = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

const styles = StyleSheet.create({
  screen: {
    backgroundColor: BACKGROUND,
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingBottom: 46,
    paddingHorizontal: 36,
  },
  backButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    left: 27,
    position: 'absolute',
    top: 77,
    width: 44,
    zIndex: 5,
  },
  smallLogo: {
    alignSelf: 'center',
    color: BRAND_GREEN,
    fontFamily: serifFont,
    fontSize: 35,
    fontWeight: Platform.OS === 'ios' ? '500' : '400',
    letterSpacing: -0.7,
    marginTop: 123,
  },
  header: {
    alignItems: 'center',
    marginTop: 142,
  },
  title: {
    color: BRAND_GREEN,
    fontFamily: serifFont,
    fontSize: 46,
    fontWeight: Platform.OS === 'ios' ? '500' : '400',
    letterSpacing: -1.1,
    lineHeight: 56,
    textAlign: 'center',
    width: '100%',
  },
  subtitle: {
    color: TEXT_MUTED,
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: -0.15,
    lineHeight: 25,
    marginTop: 31,
    textAlign: 'center',
  },
  form: {
    marginTop: 57,
  },
  inputBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 253, 247, 0.72)',
    borderColor: FIELD_BORDER,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 21,
    height: 76,
    marginBottom: 34,
    paddingHorizontal: 25,
  },
  input: {
    color: '#222A27',
    flex: 1,
    fontSize: 24,
    fontWeight: '500',
    padding: 0,
  },
  forgotText: {
    color: '#26302C',
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 19,
    marginTop: -18,
  },
  termsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 19,
    marginTop: 55,
    paddingHorizontal: 21,
  },
  checkbox: {
    borderColor: FIELD_BORDER,
    borderRadius: 6,
    borderWidth: 1.5,
    height: 32,
    width: 32,
  },
  termsText: {
    color: '#4E5552',
    flex: 1,
    fontSize: 16.5,
    fontWeight: '500',
    lineHeight: 24,
  },
  termsLink: {
    color: BRAND_GREEN,
    fontWeight: '600',
  },
  continueButton: {
    alignItems: 'center',
    backgroundColor: CTA_GREEN,
    borderRadius: 13,
    height: 68,
    justifyContent: 'center',
    marginTop: 49,
    shadowColor: '#000',
    shadowOffset: { height: 7, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '500',
    letterSpacing: -0.15,
  },
  bottomRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 38,
  },
  bottomText: {
    color: TEXT_MUTED,
    fontSize: 16.2,
    fontWeight: '500',
  },
  bottomLink: {
    color: BRAND_GREEN,
    fontSize: 16.2,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.78,
  },
});
