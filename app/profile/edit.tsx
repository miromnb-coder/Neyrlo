import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { pickProfileImage, uploadCurrentUserProfileImage } from '@/lib/profileImages';
import { getCurrentProfile, updateCurrentProfile, type ProfileRecord } from '@/lib/profile';

const BACKGROUND = '#FFFDF7';
const GREEN = '#55633F';
const GREEN_DARK = '#3F4E2F';
const TEXT = '#20251F';
const MUTED = '#77736B';
const BORDER = 'rgba(64, 80, 48, 0.13)';
const CARD = 'rgba(255, 253, 247, 0.94)';

export default function EditProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setFeedback(null);

    try {
      const data = await getCurrentProfile();
      setProfile(data);
      setDisplayName(data.display_name ?? '');
      setBio(data.bio ?? '');
      setCity(data.city ?? '');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Profiilin lataus ei onnistunut.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const saveProfile = async () => {
    if (saving) return;

    setSaving(true);
    setFeedback(null);

    try {
      const updated = await updateCurrentProfile({ bio, city, displayName });
      setProfile(updated);
      setFeedback('Profiili tallennettu.');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Profiilin tallennus ei onnistunut.');
    } finally {
      setSaving(false);
    }
  };

  const updateAvatar = async () => {
    if (uploadingImage) return;

    setUploadingImage(true);
    setFeedback(null);

    try {
      const selectedImage = await pickProfileImage();

      if (!selectedImage) return;

      const avatarUrl = await uploadCurrentUserProfileImage(selectedImage);
      setProfile((current) => current ? { ...current, avatar_url: avatarUrl } : current);
      setFeedback('Profiilikuva päivitetty.');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Profiilikuvan päivitys ei onnistunut.');
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
        <View style={styles.topBar}>
          <Pressable accessibilityLabel="Takaisin" onPress={() => router.back()} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <Ionicons color={TEXT} name="chevron-back" size={27} />
          </Pressable>
          <Text allowFontScaling={false} style={styles.pageTitle}>Muokkaa profiilia</Text>
          <Pressable accessibilityLabel="Päivitä" onPress={() => void loadProfile()} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <Ionicons color={GREEN_DARK} name="refresh-outline" size={22} />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={GREEN} size="small" />
            <Text allowFontScaling={false} style={styles.loadingText}>Ladataan profiilia...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.avatarCard}>
              <View style={styles.avatarCircle}>
                {profile?.avatar_url ? <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} /> : <Ionicons color={GREEN_DARK} name="person-outline" size={42} />}
              </View>
              <Pressable disabled={uploadingImage} onPress={updateAvatar} style={({ pressed }) => [styles.secondaryButton, uploadingImage && styles.disabledButton, pressed && styles.pressed]}>
                {uploadingImage ? <ActivityIndicator color={GREEN_DARK} size="small" /> : <Text allowFontScaling={false} style={styles.secondaryButtonText}>Vaihda profiilikuva</Text>}
              </Pressable>
            </View>

            <ProfileInput label="Nimi" onChangeText={setDisplayName} placeholder="Neyrlo-käyttäjä" value={displayName} />
            <ProfileInput label="Kaupunki / alue" onChangeText={setCity} placeholder="Esim. Helsinki, Kallio" value={city} />
            <ProfileInput label="Bio" multiline onChangeText={setBio} placeholder="Kerro lyhyesti itsestäsi ja miten lainaat tavaroita." value={bio} />

            {!!feedback && (
              <View style={styles.feedbackCard}>
                <Ionicons color={GREEN_DARK} name="information-circle-outline" size={20} />
                <Text allowFontScaling={false} style={styles.feedbackText}>{feedback}</Text>
              </View>
            )}

            <Pressable disabled={saving} onPress={saveProfile} style={({ pressed }) => [styles.primaryButton, saving && styles.disabledButton, pressed && styles.pressed]}>
              {saving ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text allowFontScaling={false} style={styles.primaryButtonText}>Tallenna profiili</Text>}
            </Pressable>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ProfileInput({ label, multiline, onChangeText, placeholder, value }: { label: string; multiline?: boolean; onChangeText: (value: string) => void; placeholder: string; value: string }) {
  return (
    <View style={[styles.inputCard, multiline && styles.multilineCard]}>
      <Text allowFontScaling={false} style={styles.inputLabel}>{label}</Text>
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

const styles = StyleSheet.create({
  screen: { backgroundColor: BACKGROUND, flex: 1 },
  keyboardView: { flex: 1 },
  topBar: { alignItems: 'center', flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 8 },
  iconButton: { alignItems: 'center', backgroundColor: CARD, borderColor: BORDER, borderRadius: 14, borderWidth: 1, height: 44, justifyContent: 'center', width: 44 },
  pageTitle: { color: TEXT, flex: 1, fontSize: 20, fontWeight: '900', textAlign: 'center' },
  loadingWrap: { alignItems: 'center', flex: 1, gap: 12, justifyContent: 'center' },
  loadingText: { color: MUTED, fontSize: 14, fontWeight: '700' },
  content: { gap: 12, paddingBottom: 30, paddingHorizontal: 22, paddingTop: 22 },
  avatarCard: { alignItems: 'center', backgroundColor: CARD, borderColor: BORDER, borderRadius: 22, borderWidth: 1, gap: 14, padding: 20 },
  avatarCircle: { alignItems: 'center', backgroundColor: '#F8F2EA', borderRadius: 999, height: 104, justifyContent: 'center', overflow: 'hidden', width: 104 },
  avatarImage: { height: '100%', width: '100%' },
  inputCard: { backgroundColor: CARD, borderColor: BORDER, borderRadius: 18, borderWidth: 1, minHeight: 74, paddingHorizontal: 16, paddingVertical: 13 },
  multilineCard: { minHeight: 132 },
  inputLabel: { color: TEXT, fontSize: 15.5, fontWeight: '900', marginBottom: 6 },
  input: { color: TEXT, fontSize: 15, fontWeight: '650', padding: 0 },
  multilineInput: { lineHeight: 21, minHeight: 72, textAlignVertical: 'top' },
  primaryButton: { alignItems: 'center', backgroundColor: GREEN, borderRadius: 17, height: 56, justifyContent: 'center', marginTop: 6 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16.5, fontWeight: '900' },
  secondaryButton: { alignItems: 'center', borderColor: GREEN_DARK, borderRadius: 999, borderWidth: 1, minHeight: 44, justifyContent: 'center', paddingHorizontal: 18 },
  secondaryButtonText: { color: GREEN_DARK, fontSize: 14, fontWeight: '900' },
  feedbackCard: { alignItems: 'flex-start', backgroundColor: 'rgba(85, 99, 63, 0.08)', borderColor: 'rgba(85, 99, 63, 0.18)', borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 9, padding: 13 },
  feedbackText: { color: GREEN_DARK, flex: 1, fontSize: 13.5, fontWeight: '700', lineHeight: 19 },
  disabledButton: { opacity: 0.6 },
  pressed: { opacity: 0.78 },
});
