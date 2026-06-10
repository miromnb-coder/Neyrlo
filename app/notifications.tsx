import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getMyNotificationEvents,
  markAllNotificationEventsRead,
  markNotificationEventRead,
  type NotificationEvent,
} from '@/lib/notificationEvents';

const BACKGROUND = '#FFFDF7';
const GREEN = '#55633F';
const GREEN_DARK = '#3F4E2F';
const TEXT = '#20251F';
const MUTED = '#77736B';
const BORDER = 'rgba(64, 80, 48, 0.13)';
const CARD = 'rgba(255, 253, 247, 0.94)';

export default function NotificationsScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<NotificationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingRead, setMarkingRead] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setFeedback(null);

    try {
      setEvents(await getMyNotificationEvents(60));
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

  const unreadCount = useMemo(() => events.filter((event) => !event.readAt).length, [events]);
  const messageCount = useMemo(() => events.filter((event) => event.type === 'message').length, [events]);
  const requestCount = useMemo(() => events.filter((event) => event.type !== 'message').length, [events]);

  const markAllRead = async () => {
    if (markingRead) return;

    setMarkingRead(true);
    setFeedback(null);

    try {
      await markAllNotificationEventsRead();
      setEvents((current) => current.map((event) => ({ ...event, readAt: event.readAt ?? new Date().toISOString() })));
      setFeedback('Ilmoitukset merkitty luetuiksi.');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Lukukuittaus ei onnistunut.');
    } finally {
      setMarkingRead(false);
    }
  };

  const openEvent = async (event: NotificationEvent) => {
    if (!event.readAt) {
      void markNotificationEventRead(event.id);
      setEvents((current) => current.map((item) => (item.id === event.id ? { ...item, readAt: new Date().toISOString() } : item)));
    }

    const conversationId = typeof event.data.conversationId === 'string' ? event.data.conversationId : null;
    const listingId = typeof event.data.listingId === 'string' ? event.data.listingId : null;

    if (conversationId) {
      router.push({ pathname: '/messages/[id]', params: { id: conversationId } });
      return;
    }

    if (listingId) {
      router.push({ pathname: '/listings/[id]', params: { id: listingId } });
      return;
    }

    router.push('/(tabs)/messages');
  };

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
        ) : feedback && events.length === 0 ? (
          <View style={styles.stateCard}>
            <Ionicons color={GREEN} name="information-circle-outline" size={24} />
            <Text allowFontScaling={false} style={styles.stateText}>{feedback}</Text>
          </View>
        ) : (
          <>
            <View style={styles.summaryCard}>
              <NotificationStat icon="ellipse-outline" label="Uutta" value={unreadCount} />
              <NotificationStat icon="chatbubble-outline" label="Viestejä" value={messageCount} />
              <NotificationStat icon="swap-horizontal-outline" label="Pyyntöjä" value={requestCount} />
            </View>

            <View style={styles.sectionHeader}>
              <Text allowFontScaling={false} style={styles.sectionTitle}>Tapahtumat</Text>
              <Pressable disabled={markingRead || unreadCount === 0} onPress={markAllRead} style={({ pressed }) => [styles.readAllButton, (markingRead || unreadCount === 0) && styles.disabledButton, pressed && styles.pressed]}>
                <Text allowFontScaling={false} style={styles.readAllText}>Merkitse luetuksi</Text>
              </Pressable>
            </View>

            {events.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons color={GREEN_DARK} name="notifications-outline" size={30} />
                <Text allowFontScaling={false} style={styles.emptyTitle}>Ei ilmoituksia vielä</Text>
                <Text allowFontScaling={false} style={styles.stateText}>Uudet viestit, pyynnöt ja lainaustapahtuman päivitykset näkyvät täällä.</Text>
              </View>
            ) : (
              <View style={styles.listStack}>
                {events.map((event) => (
                  <Pressable key={event.id} onPress={() => void openEvent(event)} style={({ pressed }) => [styles.notificationCard, !event.readAt && styles.unreadCard, pressed && styles.pressed]}>
                    <View style={[styles.notificationIcon, event.readAt && styles.notificationIconSoft]}>
                      <Ionicons color={event.readAt ? GREEN_DARK : '#FFFFFF'} name={iconForEvent(event.type)} size={20} />
                    </View>
                    <View style={styles.notificationBody}>
                      <View style={styles.notificationTitleRow}>
                        <Text allowFontScaling={false} numberOfLines={1} style={styles.notificationTitle}>{event.title}</Text>
                        {!event.readAt && <View style={styles.unreadDot} />}
                      </View>
                      <Text allowFontScaling={false} numberOfLines={2} style={styles.notificationText}>{event.body}</Text>
                      <Text allowFontScaling={false} style={styles.notificationTime}>{formatDate(event.createdAt)}</Text>
                    </View>
                    <Ionicons color={MUTED} name="chevron-forward" size={18} />
                  </Pressable>
                ))}
              </View>
            )}

            {!!feedback && events.length > 0 && (
              <View style={styles.feedbackCard}>
                <Ionicons color={GREEN_DARK} name="information-circle-outline" size={20} />
                <Text allowFontScaling={false} style={styles.feedbackText}>{feedback}</Text>
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

function iconForEvent(type: NotificationEvent['type']): keyof typeof Ionicons.glyphMap {
  if (type === 'message') return 'chatbubble-outline';
  if (type === 'request') return 'mail-unread-outline';
  if (type === 'return_due' || type === 'return_reminder') return 'time-outline';
  if (type === 'returned' || type === 'request_completed') return 'checkmark-done-outline';
  return 'swap-horizontal-outline';
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('fi-FI', { day: 'numeric', month: 'numeric' }) + ' ' + date.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' });
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
  sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { color: TEXT, fontSize: 18, fontWeight: '900' },
  readAllButton: { borderColor: GREEN_DARK, borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7 },
  readAllText: { color: GREEN_DARK, fontSize: 12.5, fontWeight: '900' },
  listStack: { gap: 10, marginBottom: 20 },
  notificationCard: { alignItems: 'center', backgroundColor: CARD, borderColor: BORDER, borderRadius: 17, borderWidth: 1, flexDirection: 'row', gap: 12, padding: 13 },
  unreadCard: { borderColor: 'rgba(85, 99, 63, 0.32)' },
  notificationIcon: { alignItems: 'center', backgroundColor: GREEN, borderRadius: 999, height: 38, justifyContent: 'center', width: 38 },
  notificationIconSoft: { backgroundColor: 'rgba(85, 99, 63, 0.1)' },
  notificationBody: { flex: 1, minWidth: 0 },
  notificationTitleRow: { alignItems: 'center', flexDirection: 'row', gap: 7 },
  notificationTitle: { color: TEXT, flex: 1, fontSize: 14.5, fontWeight: '900' },
  notificationText: { color: MUTED, fontSize: 12.8, fontWeight: '700', lineHeight: 18, marginTop: 2 },
  notificationTime: { color: GREEN_DARK, fontSize: 11.5, fontWeight: '800', marginTop: 5 },
  unreadDot: { backgroundColor: GREEN, borderRadius: 999, height: 8, width: 8 },
  stateCard: { alignItems: 'center', backgroundColor: CARD, borderColor: BORDER, borderRadius: 20, borderWidth: 1, gap: 8, padding: 24 },
  emptyCard: { alignItems: 'center', backgroundColor: CARD, borderColor: BORDER, borderRadius: 20, borderWidth: 1, gap: 8, padding: 24 },
  emptyTitle: { color: TEXT, fontSize: 16, fontWeight: '900' },
  stateText: { color: MUTED, fontSize: 14, fontWeight: '700', lineHeight: 20, textAlign: 'center' },
  feedbackCard: { alignItems: 'flex-start', backgroundColor: 'rgba(85, 99, 63, 0.08)', borderColor: 'rgba(85, 99, 63, 0.18)', borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 9, padding: 13 },
  feedbackText: { color: GREEN_DARK, flex: 1, fontSize: 13.5, fontWeight: '700', lineHeight: 19 },
  disabledButton: { opacity: 0.45 },
  pressed: { opacity: 0.78 },
});
