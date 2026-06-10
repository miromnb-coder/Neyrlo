import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';
import { getConversations, type ConversationSummary } from '@/lib/messages';
import {
  getMyListingRequests,
  nextRequestActions,
  requestStatusLabel,
  updateListingRequestStatus,
  type ListingRequestStatus,
  type ListingRequestSummary,
} from '@/lib/requests';

const BACKGROUND = '#FFFDF7';
const GREEN = '#55633F';
const GREEN_DARK = '#3F4E2F';
const TEXT = '#20251F';
const MUTED = '#77736B';
const BORDER = 'rgba(64, 80, 48, 0.13)';
const CARD = 'rgba(255, 253, 247, 0.94)';

export default function MessagesScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [requests, setRequests] = useState<ListingRequestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const [conversationData, requestData] = await Promise.all([getConversations(), getMyListingRequests()]);
      setConversations(conversationData);
      setRequests(requestData);
    } catch (error) {
      setConversations([]);
      setRequests([]);
      setErrorMessage(error instanceof Error ? error.message : 'Viestien lataus ei onnistunut.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  const openConversation = (conversation: ConversationSummary) => {
    router.push({ pathname: '/messages/[id]', params: { id: conversation.id } });
  };

  const updateRequest = async (requestId: string, status: ListingRequestStatus) => {
    setUpdatingRequestId(requestId);
    setErrorMessage(null);

    try {
      await updateListingRequestStatus(requestId, status);
      await loadData();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Pyynnön päivitys ei onnistunut.');
    } finally {
      setUpdatingRequestId(null);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text allowFontScaling={false} style={styles.title}>Viestit</Text>
            <View style={styles.titleDot} />
          </View>
          <Text allowFontScaling={false} style={styles.subtitle}>Sovi noudosta, palautuksesta ja ehdoista turvallisesti.</Text>
        </View>

        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color={GREEN} size="small" />
            <Text allowFontScaling={false} style={styles.stateText}>Ladataan viestejä ja pyyntöjä...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.stateCard}>
            <Ionicons color={GREEN} name="alert-circle-outline" size={25} />
            <Text allowFontScaling={false} style={styles.stateTitle}>Lataus ei onnistunut</Text>
            <Text allowFontScaling={false} style={styles.stateText}>{errorMessage}</Text>
          </View>
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <Text allowFontScaling={false} style={styles.sectionTitle}>Pyynnöt</Text>
              {requests.filter((request) => request.status === 'pending').length > 0 && (
                <View style={styles.badgeDot}>
                  <Text allowFontScaling={false} style={styles.badgeDotText}>{requests.filter((request) => request.status === 'pending').length}</Text>
                </View>
              )}
            </View>

            {requests.length === 0 ? (
              <View style={styles.miniStateCard}>
                <Text allowFontScaling={false} style={styles.stateText}>Ei pyyntöjä vielä.</Text>
              </View>
            ) : (
              <View style={styles.requestList}>
                {requests.map((request) => {
                  const isUpdating = updatingRequestId === request.id;
                  const actions = nextRequestActions(request.status, request.role);

                  return (
                    <View key={request.id} style={styles.requestCard}>
                      <View style={styles.requestTopRow}>
                        <Text allowFontScaling={false} numberOfLines={1} style={styles.requestTitle}>{request.listingTitle}</Text>
                        <View style={styles.requestStatusBadge}>
                          <Text allowFontScaling={false} style={styles.requestStatusText}>{requestStatusLabel(request.status)}</Text>
                        </View>
                      </View>
                      <Text allowFontScaling={false} style={styles.otherUser}>{request.otherUserName}</Text>
                      <View style={styles.requestDateRow}>
                        <Ionicons color={GREEN_DARK} name="calendar-outline" size={15} />
                        <Text allowFontScaling={false} numberOfLines={1} style={styles.requestDateText}>{request.dateLabel}</Text>
                      </View>
                      {!!request.message && <Text allowFontScaling={false} numberOfLines={2} style={styles.lastMessage}>{request.message}</Text>}

                      {actions.length > 0 && (
                        <View style={styles.requestActions}>
                          {isUpdating ? (
                            <ActivityIndicator color={GREEN} size="small" />
                          ) : (
                            actions.map((action) => (
                              <RequestAction key={action} label={actionLabel(action)} onPress={() => void updateRequest(request.id, action)} primary={isPrimaryAction(action)} />
                            ))
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            <View style={styles.sectionHeader}>
              <Text allowFontScaling={false} style={styles.sectionTitle}>Keskustelut</Text>
            </View>

            {conversations.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons color="#FFFFFF" name="chatbubble-outline" size={28} />
                </View>
                <Text allowFontScaling={false} style={styles.stateTitle}>Ei viestejä vielä</Text>
                <Text allowFontScaling={false} style={styles.stateText}>
                  Kun otat yhteyttä ilmoitukseen tai joku kysyy sinun tavarastasi, keskustelu näkyy täällä.
                </Text>
              </View>
            ) : (
              <View style={styles.list}>
                {conversations.map((conversation) => (
                  <Pressable key={conversation.id} onPress={() => openConversation(conversation)} style={({ pressed }) => [styles.conversationCard, pressed && styles.pressed]}>
                    <View style={styles.thumbnailWrap}>
                      {conversation.listingImageUrl ? (
                        <Image source={{ uri: conversation.listingImageUrl }} style={styles.thumbnail} />
                      ) : (
                        <Ionicons color={GREEN_DARK} name="cube-outline" size={25} />
                      )}
                    </View>
                    <View style={styles.conversationBody}>
                      <View style={styles.conversationTopRow}>
                        <Text allowFontScaling={false} numberOfLines={1} style={styles.listingTitle}>{conversation.listingTitle}</Text>
                        <Text allowFontScaling={false} style={styles.dateText}>{formatDate(conversation.lastMessageAt)}</Text>
                      </View>
                      <Text allowFontScaling={false} numberOfLines={1} style={styles.otherUser}>{conversation.otherUserName}</Text>
                      <Text allowFontScaling={false} numberOfLines={2} style={styles.lastMessage}>{conversation.lastMessageBody}</Text>
                    </View>
                    <Ionicons color={colors.textMuted} name="chevron-forward" size={19} />
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

function RequestAction({ label, onPress, primary }: { label: string; onPress: () => void; primary?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.requestAction, primary && styles.requestActionPrimary, pressed && styles.pressed]}>
      <Text allowFontScaling={false} style={[styles.requestActionText, primary && styles.requestActionTextPrimary]}>{label}</Text>
    </Pressable>
  );
}

function actionLabel(status: ListingRequestStatus) {
  switch (status) {
    case 'accepted': return 'Hyväksy';
    case 'declined': return 'Hylkää';
    case 'cancelled': return 'Peru pyyntö';
    case 'pickup_scheduled': return 'Nouto sovittu';
    case 'picked_up': return 'Noudettu';
    case 'return_due': return 'Palautus tulossa';
    case 'returned': return 'Palautettu';
    case 'completed': return 'Valmis';
    case 'pending':
    default: return requestStatusLabel(status);
  }
}

function isPrimaryAction(status: ListingRequestStatus) {
  return status !== 'declined' && status !== 'cancelled';
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('fi-FI', { day: 'numeric', month: 'numeric' });
}

const styles = StyleSheet.create({
  screen: { backgroundColor: BACKGROUND, flex: 1 },
  content: { paddingBottom: 110, paddingHorizontal: 24, paddingTop: 24 },
  header: { marginBottom: 22 },
  titleRow: { alignItems: 'center', flexDirection: 'row', gap: 7 },
  title: { color: GREEN, fontSize: 34, fontWeight: '900', letterSpacing: -0.6 },
  titleDot: { backgroundColor: '#6C8A64', borderColor: 'rgba(255, 253, 247, 0.95)', borderRadius: 5, borderWidth: 1, height: 10, marginTop: 6, width: 10 },
  subtitle: { color: MUTED, fontSize: 14.5, fontWeight: '600', lineHeight: 21, marginTop: 4 },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'space-between', marginBottom: 10, marginTop: 8 },
  sectionTitle: { color: TEXT, fontSize: 18, fontWeight: '900' },
  badgeDot: { alignItems: 'center', backgroundColor: GREEN, borderRadius: 999, height: 24, justifyContent: 'center', minWidth: 24, paddingHorizontal: 7 },
  badgeDotText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  requestList: { gap: 10, marginBottom: 20 },
  requestCard: { backgroundColor: CARD, borderColor: BORDER, borderRadius: 18, borderWidth: 1, padding: 14 },
  requestTopRow: { alignItems: 'center', flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  requestTitle: { color: TEXT, flex: 1, fontSize: 15.5, fontWeight: '900' },
  requestStatusBadge: { backgroundColor: 'rgba(85, 99, 63, 0.1)', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  requestStatusText: { color: GREEN_DARK, fontSize: 11.5, fontWeight: '900' },
  requestDateRow: { alignItems: 'center', flexDirection: 'row', gap: 6, marginTop: 7 },
  requestDateText: { color: GREEN_DARK, flex: 1, fontSize: 12.5, fontWeight: '900' },
  requestActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  requestAction: { borderColor: BORDER, borderRadius: 999, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 8 },
  requestActionPrimary: { backgroundColor: GREEN, borderColor: GREEN },
  requestActionText: { color: GREEN_DARK, fontSize: 12.5, fontWeight: '900' },
  requestActionTextPrimary: { color: '#FFFFFF' },
  miniStateCard: { backgroundColor: CARD, borderColor: BORDER, borderRadius: 16, borderWidth: 1, marginBottom: 18, padding: 16 },
  list: { gap: 12 },
  conversationCard: { alignItems: 'center', backgroundColor: CARD, borderColor: BORDER, borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 12, minHeight: 92, padding: 12, shadowColor: '#000', shadowOffset: { height: 6, width: 0 }, shadowOpacity: 0.025, shadowRadius: 12 },
  thumbnailWrap: { alignItems: 'center', backgroundColor: '#F8F2EA', borderRadius: 14, height: 66, justifyContent: 'center', overflow: 'hidden', width: 74 },
  thumbnail: { height: '100%', resizeMode: 'cover', width: '100%' },
  conversationBody: { flex: 1, minWidth: 0 },
  conversationTopRow: { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  listingTitle: { color: TEXT, flex: 1, fontSize: 15.5, fontWeight: '900', letterSpacing: -0.15 },
  dateText: { color: MUTED, fontSize: 11.5, fontWeight: '700' },
  otherUser: { color: GREEN_DARK, fontSize: 12.6, fontWeight: '800', marginTop: 2 },
  lastMessage: { color: MUTED, fontSize: 12.8, fontWeight: '600', lineHeight: 18, marginTop: 4 },
  stateCard: { alignItems: 'center', backgroundColor: CARD, borderColor: BORDER, borderRadius: 18, borderWidth: 1, gap: 8, padding: 24 },
  emptyCard: { alignItems: 'center', backgroundColor: CARD, borderColor: BORDER, borderRadius: 22, borderWidth: 1, gap: 9, paddingHorizontal: 24, paddingVertical: 32 },
  emptyIconCircle: { alignItems: 'center', backgroundColor: GREEN, borderRadius: 999, height: 58, justifyContent: 'center', marginBottom: 2, width: 58 },
  stateTitle: { color: TEXT, fontSize: 16, fontWeight: '900', textAlign: 'center' },
  stateText: { color: MUTED, fontSize: 13.5, fontWeight: '600', lineHeight: 20, textAlign: 'center' },
  pressed: { opacity: 0.78 },
});
