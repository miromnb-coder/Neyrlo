import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';

export default function ProfileScreen() {
  const router = useRouter();
  const { session, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignOut = async () => {
    setErrorMessage(null);
    setLoading(true);

    try {
      await signOut();
      router.replace('/auth');
    } catch {
      setErrorMessage('Uloskirjautuminen ei onnistunut. Yritä uudelleen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text allowFontScaling={false} style={styles.eyebrow}>Neyrlo</Text>
          <Text allowFontScaling={false} style={styles.title}>Profiili</Text>
          <Text allowFontScaling={false} style={styles.subtitle}>
            Hallitse tiliäsi, omia tavaroitasi ja turvallisuusasetuksia.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.avatarCircle}>
            <Ionicons color={colors.primary} name="person-outline" size={34} />
          </View>

          <View style={styles.accountInfo}>
            <Text allowFontScaling={false} style={styles.cardTitle}>Kirjautunut sisään</Text>
            <Text allowFontScaling={false} numberOfLines={1} style={styles.emailText}>
              {session?.user.email ?? 'Sähköpostitili'}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.settingRow}>
            <Ionicons color={colors.primaryDark} name="cube-outline" size={24} />
            <View style={styles.settingTextWrap}>
              <Text allowFontScaling={false} style={styles.settingTitle}>Omat tavarat</Text>
              <Text allowFontScaling={false} style={styles.settingDescription}>Lisätään seuraavassa vaiheessa.</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <Ionicons color={colors.primaryDark} name="shield-checkmark-outline" size={24} />
            <View style={styles.settingTextWrap}>
              <Text allowFontScaling={false} style={styles.settingTitle}>Turvallisuus</Text>
              <Text allowFontScaling={false} style={styles.settingDescription}>Arviot ja vahvistukset tulevat myöhemmin.</Text>
            </View>
          </View>
        </View>

        {!!errorMessage && <Text allowFontScaling={false} style={styles.errorText}>{errorMessage}</Text>}

        <Pressable
          disabled={loading}
          onPress={handleSignOut}
          style={({ pressed }) => [styles.signOutButton, loading && styles.disabledButton, pressed && styles.pressed]}
        >
          {loading ? (
            <ActivityIndicator color={colors.primaryDark} size="small" />
          ) : (
            <>
              <Ionicons color={colors.primaryDark} name="log-out-outline" size={22} />
              <Text allowFontScaling={false} style={styles.signOutText}>Kirjaudu ulos</Text>
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const serifFont = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    flex: 1,
    paddingBottom: 110,
    paddingHorizontal: spacing.xl,
    paddingTop: 40,
  },
  header: {
    marginBottom: spacing.xl,
  },
  eyebrow: {
    color: colors.primaryDark,
    fontFamily: serifFont,
    fontSize: 24,
    fontWeight: Platform.OS === 'ios' ? '500' : '400',
    letterSpacing: -0.4,
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.text,
    fontFamily: serifFont,
    fontSize: 40,
    fontWeight: Platform.OS === 'ios' ? '500' : '400',
    letterSpacing: -0.8,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 23,
    marginTop: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
  },
  avatarCircle: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radii.pill,
    height: 74,
    justifyContent: 'center',
    marginBottom: spacing.md,
    width: 74,
  },
  accountInfo: {
    gap: 5,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  emailText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
  settingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  settingTextWrap: {
    flex: 1,
  },
  settingTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  settingDescription: {
    color: colors.textMuted,
    fontSize: 13.5,
    fontWeight: '600',
    lineHeight: 19,
    marginTop: 2,
  },
  divider: {
    backgroundColor: colors.border,
    height: 1,
    marginVertical: spacing.lg,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  signOutButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.primaryDark,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    height: 58,
    justifyContent: 'center',
  },
  signOutText: {
    color: colors.primaryDark,
    fontSize: 17,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.65,
  },
  pressed: {
    opacity: 0.78,
  },
});
