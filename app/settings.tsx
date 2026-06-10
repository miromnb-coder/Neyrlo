import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { disableCurrentDevicePushNotifications, registerForPushNotifications } from '@/lib/pushNotifications';
import { getCurrentProfile, updateCurrentProfile, type ProfileRecord } from '@/lib/profile';

const BACKGROUND = '#FFFDF7';
const GREEN = '#55633F';
const GREEN_DARK = '#3F4E2F';
const TEXT = '#20251F';
const MUTED = '#77736B';
const BORDER = 'rgba(64, 80, 48, 0.13)';
const CARD = 'rgba(255, 253, 247, 0.94)';

export default function SettingsScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setFeedback(null);

    try {
      const data = await getCurrentProfile();
      setProfile(data);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Asetusten lataus ei onnistunut.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const updateSetting = async (key: 'notifyMessages' | 'notifyRequests' | 'notifyReturnReminders' | 'notifyStatusUpdates', value: boolean) => {
    if (saving || !profile) return;

    setSaving(true);
    setFeedback(null);

    try {
      const updated = await updateCurrentProfile({ [key]: value });
      setProfile(updated);
      setFeedback('Asetus tallennettu.');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Asetuksen tallennus ei onnistunut.');
    } finally {
      setSaving(false);
    }
  };

  const enablePush = async () => {
    if (pushLoading) return;

    setPushLoading(true);
    setFeedback(null);

    try {
      const result = await registerForPushNotifications();

      if (result.status === 'granted') {
        setFeedback('Push-ilmoitukset otettu käyttöön tällä laitteella.');
      } else if (result.status === 'unsupported') {
        setFeedback('Push-ilmoituksia ei tueta tässä ympäristössä. Testaa fyysisellä laitteella.');
      } else {
        setFeedback('Ilmoituslupaa ei annettu.');
      }
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Push-ilmoitusten käyttöönotto ei onnistunut.');
    } finally {
      setPushLoading(false);
    }
  };

  const disablePush = async () => {
    if (pushLoading) return;

    setPushLoading(true);
    setFeedback(null);

    try {
      await disableCurrentDevicePushNotifications();
      setFeedback('Push-ilmoitukset poistettu käytöstä.');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Push-ilmoitusten poisto ei onnistunut.');
    } finally {
      setPushLoading(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable accessibilityLabel="Takaisin" onPress={() => router.back()} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
          <Ionicons color={TEXT} name="chevron-back" size={27} />
        </Pressable>
        <Text allowFontScaling={false} style={styles.pageTitle}>Asetukset</Text>
        <Pressable accessibilityLabel="Päivitä" onPress={() => void loadSettings()} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
          <Ionicons color={GREEN_DARK} name="refresh-outline" size={22} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={GREEN} size="small" />
          <Text allowFontScaling={false} style={styles.loadingText}>Ladataan asetuksia...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text allowFontScaling={false} style={styles.sectionTitle}>Push-ilmoitukset</Text>
            <Text allowFontScaling={false} style={styles.helpText}>Ota puhelimen ilmoitukset käyttöön, jotta näet tärkeät viestit ja pyynnöt ajoissa.</Text>
            <View style={styles.buttonRow}>
              <Pressable disabled={pushLoading} onPress={enablePush} style={({ pressed }) => [styles.primaryButton, pushLoading && styles.disabledButton, pressed && styles.pressed]}>
                <Text allowFontScaling={false} style={styles.primaryButtonText}>Ota käyttöön</Text>
              </Pressable>
              <Pressable disabled={pushLoading} onPress={disablePush} style={({ pressed }) => [styles.secondaryButton, pushLoading && styles.disabledButton, pressed && styles.pressed]}>
                <Text allowFontScaling={false} style={styles.secondaryButtonText}>Pois päältä</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.card}>
            <Text allowFontScaling={false} style={styles.sectionTitle}>Ilmoitustyypit</Text>
            <SettingToggle label="Uudet viestit" onValueChange={(value) => void updateSetting('notifyMessages', value)} value={profile?.notify_messages ?? true} />
            <SettingToggle label="Uudet pyynnöt" onValueChange={(value) => void updateSetting('notifyRequests', value)} value={profile?.notify_requests ?? true} />
            <SettingToggle label="Pyyntöjen statukset" onValueChange={(value) => void updateSetting('notifyStatusUpdates', value)} value={profile?.notify_status_updates ?? true} />
            <SettingToggle label="Palautusmuistutukset" onValueChange={(value) => void updateSetting('notifyReturnReminders', value)} value={profile?.notify_return_reminders ?? true} />
          </View>

          <Pressable onPress={() => router.push('/settings/blocked-users')} style={({ pressed }) => [styles.navCard, pressed && styles.pressed]}>
            <Ionicons color={GREEN_DARK} name="people-outline" size={22} />
            <View style={styles.navBody}>
              <Text allowFontScaling={false} style={styles.navTitle}>Piilotetut käyttäjät</Text>
              <Text allowFontScaling={false} style={styles.navText}>Hallinnoi käyttäjiä, joita et halua nähdä sovelluksessa.</Text>
            </View>
            <Ionicons color={MUTED} name="chevron-forward" size={18} />
          </Pressable>

          {!!feedback && (
            <View style={styles.feedbackCard}>
              <Ionicons color={GREEN_DARK} name="information-circle-outline" size={20} />
              <Text allowFontScaling={false} style={styles.feedbackText}>{feedback}</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function SettingToggle({ label, onValueChange, value }: { label: string; onValueChange: (value: boolean) => void; value: boolean }) {
  return (
    <View style={styles.toggleRow}>
      <Text allowFontScaling={false} style={styles.toggleLabel}>{label}</Text>
      <Switch onValueChange={onValueChange} value={value} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: BACKGROUND, flex: 1 },
  topBar: { alignItems: 'center', flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 8 },
  iconButton: { alignItems: 'center', backgroundColor: CARD, borderColor: BORDER, borderRadius: 14, borderWidth: 1, height: 44, justifyContent: 'center', width: 44 },
  pageTitle: { color: TEXT, flex: 1, fontSize: 20, fontWeight: '900', textAlign: 'center' },
  loadingWrap: { alignItems: 'center', flex: 1, gap: 12, justifyContent: 'center' },
  loadingText: { color: MUTED, fontSize: 14, fontWeight: '700' },
  content: { gap: 13, paddingBottom: 30, paddingHorizontal: 22, paddingTop: 22 },
  card: { backgroundColor: CARD, borderColor: BORDER, borderRadius: 20, borderWidth: 1, padding: 16 },
  sectionTitle: { color: TEXT, fontSize: 17, fontWeight: '900', marginBottom: 8 },
  helpText: { color: MUTED, fontSize: 13.4, fontWeight: '650', lineHeight: 20 },
  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  primaryButton: { alignItems: 'center', backgroundColor: GREEN, borderRadius: 14, flex: 1, height: 48, justifyContent: 'center' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 14.5, fontWeight: '900' },
  secondaryButton: { alignItems: 'center', borderColor: GREEN_DARK, borderRadius: 14, borderWidth: 1, flex: 1, height: 48, justifyContent: 'center' },
  secondaryButtonText: { color: GREEN_DARK, fontSize: 14.5, fontWeight: '900' },
  toggleRow: { alignItems: 'center', borderTopColor: 'rgba(64, 80, 48, 0.08)', borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 54 },
  toggleLabel: { color: TEXT, fontSize: 14.5, fontWeight: '850' },
  navCard: { alignItems: 'center', backgroundColor: CARD, borderColor: BORDER, borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 12, padding: 14 },
  navBody: { flex: 1, minWidth: 0 },
  navTitle: { color: TEXT, fontSize: 15, fontWeight: '900' },
  navText: { color: MUTED, fontSize: 12.5, fontWeight: '700', lineHeight: 18, marginTop: 2 },
  feedbackCard: { alignItems: 'flex-start', backgroundColor: 'rgba(85, 99, 63, 0.08)', borderColor: 'rgba(85, 99, 63, 0.18)', borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 9, padding: 13 },
  feedbackText: { color: GREEN_DARK, flex: 1, fontSize: 13.5, fontWeight: '700', lineHeight: 19 },
  disabledButton: { opacity: 0.55 },
  pressed: { opacity: 0.78 },
});
