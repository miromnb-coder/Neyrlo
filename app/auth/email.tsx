import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';

const BRAND_GREEN = '#304327';
const CTA_GREEN = '#314423';
const TEXT_MUTED = '#606767';
const PLACEHOLDER = '#8C9190';
const FIELD_BORDER = '#405936';
const BACKGROUND = '#FFFDF7';

type AuthMode = 'signIn' | 'signUp';

export default function EmailAuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('signUp');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const isSignUp = mode === 'signUp';

  const title = isSignUp ? 'Luo tili sähköpostilla' : 'Kirjaudu sähköpostilla';
  const subtitle = isSignUp
    ? 'Luo Neyrlo-tili ja aloita lainaaminen läheltä.'
    : 'Tervetuloa takaisin Neyrloon.';
  const buttonLabel = isSignUp ? 'Luo tili' : 'Kirjaudu';

  const resetFeedback = () => {
    setErrorMessage(null);
    setInfoMessage(null);
  };

  const handleSubmit = async () => {
    resetFeedback();

    const trimmedEmail = email.trim().toLowerCase();

    if (!isSupabaseConfigured) {
      setErrorMessage('Supabase-ympäristömuuttujat puuttuvat. Tarkista .env-tiedosto ja käynnistä Expo uudelleen.');
      return;
    }

    if (!trimmedEmail || !password) {
      setErrorMessage('Lisää sähköposti ja salasana.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Salasanan pitää olla vähintään 6 merkkiä.');
      return;
    }

    if (isSignUp && !acceptedTerms) {
      setErrorMessage('Hyväksy käyttöehdot ja tietosuojakäytäntö ennen tilin luomista.');
      return;
    }

    setLoading(true);

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
      });

      setLoading(false);

      if (error) {
        setErrorMessage(formatAuthError(error.message));
        return;
      }

      if (!data.session) {
        setInfoMessage('Tili luotiin. Tarkista sähköpostisi ja vahvista tili, jos Supabase pyytää vahvistusta.');
        return;
      }

      router.replace('/(tabs)');
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMessage(formatAuthError(error.message));
      return;
    }

    router.replace('/(tabs)');
  };

  const handleResetPassword = async () => {
    resetFeedback();

    const trimmedEmail = email.trim().toLowerCase();

    if (!isSupabaseConfigured) {
      setErrorMessage('Supabase-ympäristömuuttujat puuttuvat. Tarkista .env-tiedosto ja käynnistä Expo uudelleen.');
      return;
    }

    if (!trimmedEmail) {
      setErrorMessage('Lisää ensin sähköpostiosoite.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail);

    setLoading(false);

    if (error) {
      setErrorMessage(formatAuthError(error.message));
      return;
    }

    setInfoMessage('Lähetimme salasanan palautuslinkin sähköpostiisi.');
  };

  const toggleMode = () => {
    resetFeedback();
    setMode((currentMode) => (currentMode === 'signUp' ? 'signIn' : 'signUp'));
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        bounces={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable hitSlop={14} onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Ionicons color="#38403E" name="arrow-back-outline" size={31} />
        </Pressable>

        <Text allowFontScaling={false} style={styles.smallLogo}>Neyrlo</Text>

        <View style={styles.header}>
          <Text allowFontScaling={false} style={styles.title}>{title}</Text>
          <Text allowFontScaling={false} style={styles.subtitle}>{subtitle}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputBox}>
            <Ionicons color="#424946" name="mail-outline" size={26} />
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              keyboardType="email-address"
              onChangeText={(value) => {
                resetFeedback();
                setEmail(value);
              }}
              placeholder="Sähköposti"
              placeholderTextColor={PLACEHOLDER}
              style={styles.input}
              textContentType="emailAddress"
              value={email}
            />
          </View>

          <View style={styles.inputBox}>
            <Ionicons color="#424946" name="lock-closed-outline" size={26} />
            <TextInput
              autoCapitalize="none"
              editable={!loading}
              onChangeText={(value) => {
                resetFeedback();
                setPassword(value);
              }}
              placeholder="Salasana"
              placeholderTextColor={PLACEHOLDER}
              secureTextEntry={!showPassword}
              style={styles.input}
              textContentType={isSignUp ? 'newPassword' : 'password'}
              value={password}
            />
            <Pressable disabled={loading} hitSlop={12} onPress={() => setShowPassword((current) => !current)}>
              <Ionicons color="#424946" name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={28} />
            </Pressable>
          </View>

          {!isSignUp && (
            <Pressable disabled={loading} onPress={handleResetPassword} style={({ pressed }) => pressed && styles.pressed}>
              <Text allowFontScaling={false} style={styles.forgotText}>Unohditko salasanan?</Text>
            </Pressable>
          )}

          {isSignUp && (
            <Pressable
              disabled={loading}
              onPress={() => {
                resetFeedback();
                setAcceptedTerms((current) => !current);
              }}
              style={({ pressed }) => [styles.termsRow, pressed && styles.pressed]}
            >
              <View style={[styles.checkbox, acceptedTerms && styles.checkboxActive]}>
                {acceptedTerms && <Ionicons color="#FFFFFF" name="checkmark" size={20} />}
              </View>
              <Text allowFontScaling={false} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78} style={styles.termsText}>
                Hyväksyn <Text style={styles.termsLink}>käyttöehdot</Text> ja <Text style={styles.termsLink}>tietosuojakäytännön</Text>
              </Text>
            </Pressable>
          )}

          {!!errorMessage && (
            <View style={styles.messageBox}>
              <Ionicons color="#9E3838" name="alert-circle-outline" size={20} />
              <Text allowFontScaling={false} style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {!!infoMessage && (
            <View style={styles.messageBox}>
              <Ionicons color={BRAND_GREEN} name="checkmark-circle-outline" size={20} />
              <Text allowFontScaling={false} style={styles.infoText}>{infoMessage}</Text>
            </View>
          )}

          <Pressable
            disabled={loading}
            onPress={handleSubmit}
            style={({ pressed }) => [styles.continueButton, loading && styles.disabledButton, pressed && styles.pressed]}
          >
            {loading ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text allowFontScaling={false} style={styles.continueText}>{buttonLabel}</Text>}
          </Pressable>

          <View style={styles.bottomRow}>
            <Text allowFontScaling={false} style={styles.bottomText}>{isSignUp ? 'Onko sinulla jo tili?' : 'Eikö sinulla ole tiliä?'}</Text>
            <Pressable disabled={loading} onPress={toggleMode} style={({ pressed }) => pressed && styles.pressed}>
              <Text allowFontScaling={false} style={styles.bottomLink}>{isSignUp ? 'Kirjaudu' : 'Luo tili'}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatAuthError(message: string) {
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes('invalid login credentials')) {
    return 'Sähköposti tai salasana on väärin.';
  }

  if (normalizedMessage.includes('email not confirmed')) {
    return 'Sähköpostia ei ole vielä vahvistettu. Tarkista sähköpostisi.';
  }

  if (normalizedMessage.includes('already registered') || normalizedMessage.includes('already exists')) {
    return 'Tällä sähköpostilla on jo tili. Kokeile kirjautumista.';
  }

  return message;
}

const serifFont = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

const styles = StyleSheet.create({
  screen: {
    backgroundColor: BACKGROUND,
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingBottom: 54,
    paddingHorizontal: 36,
  },
  backButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    left: 27,
    position: 'absolute',
    top: 70,
    width: 44,
    zIndex: 5,
  },
  smallLogo: {
    alignSelf: 'center',
    color: BRAND_GREEN,
    fontFamily: serifFont,
    fontSize: 34,
    fontWeight: Platform.OS === 'ios' ? '500' : '400',
    letterSpacing: -0.7,
    marginTop: 102,
  },
  header: {
    alignItems: 'center',
    marginTop: 64,
  },
  title: {
    color: BRAND_GREEN,
    fontFamily: serifFont,
    fontSize: 37,
    fontWeight: Platform.OS === 'ios' ? '500' : '400',
    letterSpacing: -0.7,
    lineHeight: 45,
    textAlign: 'center',
    width: '100%',
  },
  subtitle: {
    color: TEXT_MUTED,
    fontSize: 16.4,
    fontWeight: '500',
    letterSpacing: -0.1,
    lineHeight: 23,
    marginTop: 20,
    textAlign: 'center',
  },
  form: {
    marginTop: 38,
  },
  inputBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 253, 247, 0.72)',
    borderColor: FIELD_BORDER,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 19,
    height: 66,
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  input: {
    color: '#222A27',
    flex: 1,
    fontSize: 21,
    fontWeight: '500',
    padding: 0,
  },
  forgotText: {
    color: '#26302C',
    fontSize: 14.3,
    fontWeight: '500',
    marginLeft: 18,
    marginTop: -8,
  },
  termsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 15,
    marginTop: 30,
    paddingHorizontal: 20,
  },
  checkbox: {
    alignItems: 'center',
    borderColor: FIELD_BORDER,
    borderRadius: 6,
    borderWidth: 1.5,
    height: 29,
    justifyContent: 'center',
    width: 29,
  },
  checkboxActive: {
    backgroundColor: FIELD_BORDER,
  },
  termsText: {
    color: '#4E5552',
    flex: 1,
    fontSize: 14.4,
    fontWeight: '500',
    lineHeight: 21,
  },
  termsLink: {
    color: BRAND_GREEN,
    fontWeight: '600',
  },
  messageBox: {
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 253, 247, 0.8)',
    borderColor: 'rgba(64, 89, 54, 0.22)',
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  errorText: {
    color: '#9E3838',
    flex: 1,
    fontSize: 14.2,
    fontWeight: '600',
    lineHeight: 20,
  },
  infoText: {
    color: BRAND_GREEN,
    flex: 1,
    fontSize: 14.2,
    fontWeight: '600',
    lineHeight: 20,
  },
  continueButton: {
    alignItems: 'center',
    backgroundColor: CTA_GREEN,
    borderRadius: 13,
    height: 61,
    justifyContent: 'center',
    marginTop: 32,
    shadowColor: '#000',
    shadowOffset: { height: 7, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
  },
  disabledButton: {
    opacity: 0.72,
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: 21.5,
    fontWeight: '500',
    letterSpacing: -0.15,
  },
  bottomRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 24,
  },
  bottomText: {
    color: TEXT_MUTED,
    fontSize: 15.4,
    fontWeight: '500',
  },
  bottomLink: {
    color: BRAND_GREEN,
    fontSize: 15.4,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.78,
  },
});
