import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getBlockedUsers, unblockUser, type BlockedUserSummary } from '@/lib/safety';

const BACKGROUND = '#FFFDF7';
const GREEN = '#55633F';
const GREEN_DARK = '#3F4E2F';
const TEXT = '#20251F';
const MUTED = '#77736B';
const BORDER = 'rgba(64, 80, 48, 0.13)';
const CARD = 'rgba(255, 253, 247, 0.94)';

export default function BlockedUsersScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<BlockedUserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setFeedback(null);

    try {
      setUsers(await getBlockedUsers());
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Käyttäjälistan lataus ei onnistunut.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const removeUser = async (user: BlockedUserSummary) => {
    if (updatingId) return;

    setUpdatingId(user.blockedUserId);
    setFeedback(null);

    try {
      await unblockUser(user.blockedUserId);
      setUsers((current) => current.filter((item) => item.blockedUserId !== user.blockedUserId));
      setFeedback('Käyttäjä palautettu näkyviin.');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Muutoksen tallennus ei onnistunut.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable accessibilityLabel="Takaisin" onPress={() => router.back()} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
          <Ionicons color={TEXT} name="chevron-back" size={27} />
        </Pressable>
        <Text allowFontScaling={false} style={styles.pageTitle}>Piilotetut käyttäjät</Text>
        <Pressable accessibilityLabel="Päivitä" onPress={() => void loadUsers()} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
          <Ionicons color={GREEN_DARK} name="refresh-outline" size={22} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={GREEN} size="small" />
          <Text allowFontScaling={false} style={styles.loadingText}>Ladataan listaa...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {users.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons color={GREEN_DARK} name="people-outline" size={28} />
              <Text allowFontScaling={false} style={styles.emptyTitle}>Ei piilotettuja käyttäjiä</Text>
              <Text allowFontScaling={false} style={styles.emptyText}>Kun piilotat käyttäjän julkisesta profiilista tai ilmoituksesta, hän näkyy täällä.</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {users.map((user) => {
                const updating = updatingId === user.blockedUserId;

                return (
                  <View key={user.id} style={styles.userCard}>
                    <View style={styles.avatarCircle}>
                      {user.avatarUrl ? <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} /> : <Ionicons color={GREEN_DARK} name="person-outline" size={24} />}
                    </View>
                    <View style={styles.userBody}>
                      <Text allowFontScaling={false} numberOfLines={1} style={styles.userName}>{user.displayName}</Text>
                      <Text allowFontScaling={false} numberOfLines={1} style={styles.userMeta}>{user.city ?? 'Neyrlo-käyttäjä'}</Text>
                    </View>
                    <Pressable disabled={updating} onPress={() => void removeUser(user)} style={({ pressed }) => [styles.restoreButton, updating && styles.disabledButton, pressed && styles.pressed]}>
                      {updating ? <ActivityIndicator color={GREEN_DARK} size="small" /> : <Text allowFontScaling={false} style={styles.restoreButtonText}>Palauta</Text>}
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}

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

const styles = StyleSheet.create({
  screen: { backgroundColor: BACKGROUND, flex: 1 },
  topBar: { alignItems: 'center', flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 8 },
  iconButton: { alignItems: 'center', backgroundColor: CARD, borderColor: BORDER, borderRadius: 14, borderWidth: 1, height: 44, justifyContent: 'center', width: 44 },
  pageTitle: { color: TEXT, flex: 1, fontSize: 20, fontWeight: '900', textAlign: 'center' },
  loadingWrap: { alignItems: 'center', flex: 1, gap: 12, justifyContent: 'center' },
  loadingText: { color: MUTED, fontSize: 14, fontWeight: '700' },
  content: { gap: 12, paddingBottom: 30, paddingHorizontal: 22, paddingTop: 22 },
  emptyCard: { alignItems: 'center', backgroundColor: CARD, borderColor: BORDER, borderRadius: 20, borderWidth: 1, gap: 8, padding: 24 },
  emptyTitle: { color: TEXT, fontSize: 16, fontWeight: '900' },
  emptyText: { color: MUTED, fontSize: 13.2, fontWeight: '700', lineHeight: 19, textAlign: 'center' },
  list: { gap: 10 },
  userCard: { alignItems: 'center', backgroundColor: CARD, borderColor: BORDER, borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 12, padding: 12 },
  avatarCircle: { alignItems: 'center', backgroundColor: '#F8F2EA', borderRadius: 999, height: 48, justifyContent: 'center', overflow: 'hidden', width: 48 },
  avatarImage: { height: '100%', width: '100%' },
  userBody: { flex: 1, minWidth: 0 },
  userName: { color: TEXT, fontSize: 15, fontWeight: '900' },
  userMeta: { color: MUTED, fontSize: 12.6, fontWeight: '700', marginTop: 2 },
  restoreButton: { alignItems: 'center', borderColor: GREEN_DARK, borderRadius: 999, borderWidth: 1, minHeight: 38, justifyContent: 'center', paddingHorizontal: 13 },
  restoreButtonText: { color: GREEN_DARK, fontSize: 12.5, fontWeight: '900' },
  feedbackCard: { alignItems: 'flex-start', backgroundColor: 'rgba(85, 99, 63, 0.08)', borderColor: 'rgba(85, 99, 63, 0.18)', borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 9, padding: 13 },
  feedbackText: { color: GREEN_DARK, flex: 1, fontSize: 13.5, fontWeight: '700', lineHeight: 19 },
  disabledButton: { opacity: 0.55 },
  pressed: { opacity: 0.78 },
});
