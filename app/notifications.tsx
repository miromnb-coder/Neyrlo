import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getConversations, type ConversationSummary } from '@/lib/messages';
import { getMyListingRequests, requestStatusLabel, type ListingRequestSummary } from '@/lib/requests';

const BACKGROUND = '#FFFDF7';
const GREEN = '#55633F';
const GREEN_DARK = '#3F4E2F';
const TEXT = '#20251F';
const MUTED = '#77736B';
const BORDER = 'rgba(64, 80, 48, 0.13)';
const CARD = 'rgba(255, 253, 247, 0.94)';

export default function NotificationsScreen() {
  const router = useRouter();
  const [requests, setRequests] = useState<ListingRequestSummary[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setFeedback(null);

    try {
      const [requestData, conversationData] = await Promise.all([getMyListingRequests(), getConversations()]);
      setRequests(requestData);
      setConversations(conversationData);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Ilmoitusten lataus ei onnistunut.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadNotifications();
    }, [loadNotifications]),
  );

  const recentConversations = useMemo(() => conversations.slice(0, 5), [conversations]);
  const pendingRequests = useMemo(() => requests.filter((request) => request.status === 'pending'), [requests]);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
          <Ionicons color={TEXT} name="chevron-back" size={27} />
        </Pressable>
        <Text allowFontScaling={false} style={styles.pageTitle}>Ilmoitukset</Text>
        <Pressable onPress={() => void loadNotifications()} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
          <Ionicons color={GREEN} name="refresh-outline" size={22} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color={GREEN} size="small" />
            <Text allowFontScaling={false} style={styles.stateText}>Ladataan ilmoituksia...</Text>
          </View>
        ) : feedback ? (
          <View style={styles.stateCard}>
            <Ionicons color={GREEN} name="information-circle-outline" size={24} />
            <Text allowFontScaling={false} style={styles.stateText}>{feedback}</Text>
          </View>
        ) : (
          <>
            <View style={styles.summaryCard}>
              <NotificationStat icon="hourglass-outline" label="Odottaa" value={pendingRequests.length} />
              <NotificationStat icon="chatbubble-outline" label="Keskustelua" value={conversations.length} />
              <NotificationStat icon="swap-horizontal-outline" label="Pyyntöä" value={requests.length} />
            </View>

            <Text allowFontScaling={false} style={styles.sectionTitle}>Tärkeät pyynnöt</Text>
            {pendingRequests.length === 0 ? (
              <View style={styles.miniStateCard}>
                <Text allowFontScaling={false} style={styles.stateText}>Ei uusia pyyntöjä.</Text>
              </View>
            ) : (
              <View style={styles.listStack}>
                {pendingRequests.map((request) => (
                  <Pressable key={request.id} onPress={() => router.push('/(tabs)/messages')} style={({ pressed }) => [styles.notificationCard, pressed && styles.pressed]}>
                    <View style={styles.notificationIcon}>
                      <Ionicons color="#FFFFFF" name="swap-horizontal-outline" size={20} />
                    </View>
                    <View style={styles.notificationBody}>
                      <Text allowFontScaling={false} numberOfLines={1} style={styles.notificationTitle}>{request.listingTitle}</Text>
                      <Text allowFontScaling={false} numberOfLines={2} style={styles.notificationText}>{request.otherUserName} • {requestStatusLabel(request.status)}</Text>
                    </View>
                    <Ionicons color={MUTED} name="chevron-forward" size={18} />
                  </Pressable>
                ))}
              </View>
            )}

            <Text allowFontScaling={false} style={styles.sectionTitle}>Viimeisimmät viestit</Text>
            {recentConversations.length === 0 ? (
              <View style={styles.miniStateCard}>
                <Text allowFontScaling={false} style={styles.stateText}>Ei viestejä vielä.</Text>
              </View>
            ) : (
              <View style={styles.listStack}>
                {recentConversations.map((conversation) => (
                  <Pressable key={conversation.id} onPress={() => router.push({ pathname: '/messages/[id]', params: { id: conversation.id } })} style={({ pressed }) => [styles.notificationCard, pressed && styles.pressed]}>
                    <View style={styles.notificationIconSoft}>
                      <Ionicons color={GREEN_DARK} name="chatbubble-outline" size={20} />
                    </View>
                    <View style={styles.notificationBody}>
                      <Text allowFontScaling={false} numberOfLines={1} style={styles.notificationTitle}>{conversation.listingTitle}</Text>
                      <Text allowFontScaling={false} numberOfLines={2} style={styles.notificationText}>{conversation.lastMessageBody}</Text>
                    </View>
                    <Ionicons color={MUTED} name="chevron-forward" size={18} />
                  </Pressable>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function NotificationStat({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: number }) {
  return (
    <View style={styles.statItem}>
      <Ionicons color={GREEN_DARK} name={icon} size={20} />
      <Text allowFontScaling={false} style={styles.statValue}>{value}</Text>
      <Text allowFontScaling={false} style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: BACKGROUND, flex: 1 },
  topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 8 },
  iconButton: { alignItems: 'center', backgroundColor: CARD, borderColor: BORDER, borderRadius: 14, borderWidth: 1, height: 45, justifyContent: 'center', width: 45 },
  pageTitle: { color: TEXT, fontSize: 25, fontWeight: '900' },
  content: { paddingBottom: 34, paddingHorizontal: 24, paddingTop: 22 },
  summaryCard: { backgroundColor: CARD, borderColor: BORDER, borderRadius: 20, borderWidth: 1, flexDirection: 'row', marginBottom: 22, padding: 15 },
  statItem: { alignItems: 'center', flex: 1, gap: 3 },
  statValue: { color: TEXT, fontSize: 19, fontWeight: '900' },
  statLabel: { color: MUTED, fontSize: 11.5, fontWeight: '800' },
  sectionTitle: { color: TEXT, fontSize: 18, fontWeight: '900', marginBottom: 10, marginTop: 2 },
  listStack: { gap: 10, marginBottom: 20 },
  notificationCard: { alignItems: 'center', backgroundColor: CARD, borderColor: BORDER, borderRadius: 17, borderWidth: 1, flexDirection: 'row', gap: 12, padding: 13 },
  notificationIcon: { alignItems: 'center', backgroundColor: GREEN, borderRadius: 999, height: 38, justifyContent: 'center', width: 38 },
  notificationIconSoft: { alignItems: 'center', backgroundColor: 'rgba(85, 99, 63, 0.1)', borderRadius: 999, height: 38, justifyContent: 'center', width: 38 },
  notificationBody: { flex: 1, minWidth: 0 },
  notificationTitle: { color: TEXT, fontSize: 14.5, fontWeight: '900' },
  notificationText: { color: MUTED, fontSize: 12.8, fontWeight: '700', lineHeight: 18, marginTop: 2 },
  stateCard: { alignItems: 'center', backgroundColor: CARD, borderColor: BORDER, borderRadius: 20, borderWidth: 1, gap: 8, padding: 24 },
  miniStateCard: { backgroundColor: CARD, borderColor: BORDER, borderRadius: 16, borderWidth: 1, marginBottom: 20, padding: 16 },
  stateText: { color: MUTED, fontSize: 14, fontWeight: '700', lineHeight: 20, textAlign: 'center' },
  pressed: { opacity: 0.78 },
});
