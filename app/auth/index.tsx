import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const BRAND_GREEN = '#304327';
const PRIMARY_GREEN = '#1E7A56';
const TEXT_MUTED = '#626A69';
const FIELD_BORDER = '#405936';
const BACKGROUND = '#FFFDF7';

export default function AuthLandingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.brandArea}>
          <Text allowFontScaling={false} style={styles.logo}>Neyrlo</Text>
          <Text allowFontScaling={false} style={styles.slogan}>Lainaa. Vuokraa. Vaihda läheltä.</Text>
        </View>

        <View style={styles.actions}>
          <Pressable style={({ pressed }) => [styles.appleButton, pressed && styles.pressed]}>
            <Ionicons color="#FFFFFF" name="logo-apple" size={31} />
            <Text allowFontScaling={false} style={styles.appleText}>Jatka Apple-tilillä</Text>
          </Pressable>

          <Pressable style={({ pressed }) => [styles.googleButton, pressed && styles.pressed]}>
            <Ionicons color="#4285F4" name="logo-google" size={29} />
            <Text allowFontScaling={false} style={styles.googleText}>Jatka Google-tilillä</Text>
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text allowFontScaling={false} style={styles.dividerText}>tai</Text>
            <View style={styles.divider} />
          </View>

          <Pressable
            onPress={() => router.push('/auth/email')}
            style={({ pressed }) => [styles.emailButton, pressed && styles.pressed]}
          >
            <Text allowFontScaling={false} style={styles.emailText}>Jatka sähköpostilla</Text>
          </Pressable>
        </View>

        <Text allowFontScaling={false} style={styles.legalText}>
          Jatkamalla hyväksyt <Text style={styles.legalLink}>käyttöehdot</Text> ja{' '}
          <Text style={styles.legalLink}>tietosuojakäytännön</Text>.
        </Text>
      </View>
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
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 38,
  },
  brandArea: {
    alignItems: 'center',
    marginTop: 300,
  },
  logo: {
    color: BRAND_GREEN,
    fontFamily: serifFont,
    fontSize: 78,
    fontWeight: Platform.OS === 'ios' ? '500' : '400',
    letterSpacing: -2.4,
    lineHeight: 88,
  },
  slogan: {
    color: TEXT_MUTED,
    fontSize: 24,
    fontWeight: '500',
    letterSpacing: -0.3,
    marginTop: 13,
    textAlign: 'center',
  },
  actions: {
    marginTop: 80,
    width: '100%',
  },
  appleButton: {
    alignItems: 'center',
    backgroundColor: '#0D0E0E',
    borderRadius: 15,
    flexDirection: 'row',
    gap: 19,
    height: 72,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.09,
    shadowRadius: 14,
  },
  appleText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.25,
  },
  googleButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 253, 247, 0.72)',
    borderColor: FIELD_BORDER,
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 20,
    height: 72,
    justifyContent: 'center',
    marginTop: 28,
  },
  googleText: {
    color: BRAND_GREEN,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.25,
  },
  dividerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 25,
    marginHorizontal: 32,
    marginTop: 42,
  },
  divider: {
    backgroundColor: 'rgba(99, 99, 91, 0.22)',
    flex: 1,
    height: 1,
  },
  dividerText: {
    color: TEXT_MUTED,
    fontSize: 21,
    fontWeight: '600',
  },
  emailButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 253, 247, 0.72)',
    borderColor: FIELD_BORDER,
    borderRadius: 15,
    borderWidth: 1,
    height: 74,
    justifyContent: 'center',
    marginTop: 40,
  },
  emailText: {
    color: BRAND_GREEN,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  legalText: {
    bottom: 44,
    color: '#7E8584',
    fontSize: 14.5,
    fontWeight: '500',
    left: 36,
    lineHeight: 21,
    position: 'absolute',
    right: 36,
    textAlign: 'center',
  },
  legalLink: {
    color: BRAND_GREEN,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.82,
  },
});
