import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatDate, formatDateRange } from '@/lib/availability';
import { useAuth } from '@/lib/auth';
import {
  getConversationDetails,
  sendMessage,
  type ConversationDetails,
  type ConversationMessage,
} from '@/lib/messages';
import {
  requestStatusDescription,
  requestStatusLabel,
  updateListingRequestStatus,
  type ListingRequestStatus,
} from '@/lib/requests';

const BACKGROUND = '#FFFDF7';
const GREEN = '#55633F';
const GREEN_DARK = '#3F4E2F';
const TEXT = '#20251F';
const MUTED = '#77736B';
const BORDER = 'rgba(64, 80, 48, 0.13)';
const CARD = 'rgba(255, 253, 247, 0.94)';

export default function ConversationScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const params = useLocalSearchParams<{ id?: string }>();
  const conversationId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [conversation, setConversation] = useState<ConversationDetails | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [eventUpdating, setEventUpdating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadConversation = useCallback(async () => {
    if (!conversationId) {
      setFeedback('Keskustelun tunniste puuttuu.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const data = await getConversationDetails(conversationId);
      setConversation(data);
      setMessages(data.messages);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Keskustelun lataus ei onnistunut.');
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    void loadConversation();
  }, [loadConversation]);

  const handleSend = async () => {
    if (!conversationId || sending || draft.trim().length < 1) {
      return;
    }

    setSending(true);
    setFeedback(null);

    try {
      const message = await sendMessage(conversationId, draft);
      setMessages((currentMessages) => [...currentMessages, message]);
      setDraft('');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Viestin lähetys ei onnistunut.');
    } finally {
      setSending(false);
    }
  };

  const handleEventAction = async (status: ListingRequestStatus) => {
    if (!conversation?.requestId || eventUpdating) {
      return;
    }

    setEventUpdating(true);
    setFeedback(null);

    try {
      await updateListingRequestStatus(conversation.requestId, status);
      await loadConversation();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Tilan päivitys ei onnistunut.');
    } finally {
      setEventUpdating(false);
    }
  };

  const isOwner = conversation?.ownerId === session?.user.id;
  const isRequester = conversation?.requesterId === session?.user.id;
  const requestStatus = conversation?.requestStatus ?? null;
  const hasRequestDates = !!conversation?.requestStartDate && !!conversation?.requestEndDate;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityLabel="Takaisin"
            hitSlop={12}
            onPress={() => router.back()}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          >
            <Ionicons color={TEXT} name="chevron-back" size={27} />
          </Pressable>
          <View style={styles.headerTextWrap}>
            <Text allowFontScaling={false} numberOfLines={1} style={styles.pageTitle}>
              {conversation?.otherUserName ?? 'Keskustelu'}
            </Text>
            <Text allowFontScaling={false} numberOfLines={1} style={styles.headerSubtitle}>
              {conversation?.listingTitle ?? 'Ilmoitus'}
            </Text>
          </View>
          <Pressable accessibilityLabel="Päivitä" onPress={() => void loadConversation()} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <Ionicons color={GREEN_DARK} name="refresh-outline" size={22} />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={GREEN} size="small" />
            <Text allowFontScaling={false} style={styles.loadingText}>Ladataan keskustelua...</Text>
          </View>
        ) : (
          <>
            <ScrollView contentContainerStyle={styles.messageList} showsVerticalScrollIndicator={false}>
              {!!conversation && (
                <View style={styles.eventCard}>
                  <View style={styles.eventHeaderRow}>
                    <View style={styles.eventIconCircle}>
                      <Ionicons color="#FFFFFF" name="swap-horizontal-outline" size={19} />
                    </View>
                    <View style={styles.eventHeaderText}>
                      <Text allowFontScaling={false} style={styles.eventTitle}>Lainaustapahtuma</Text>
                      <Text allowFontScaling={false} style={styles.eventStatus}>{requestStatus ? requestStatusLabel(requestStatus) : 'Ei pyyntöä'}</Text>
                    </View>
                  </View>
                  <Text allowFontScaling={false} style={styles.eventDescription}>{requestStatusDescription(requestStatus)}</Text>

                  {hasRequestDates && (
                    <View style={styles.eventDateGrid}>
                      <View style={styles.eventDatePill}>
                        <Text allowFontScaling={false} style={styles.eventDateLabel}>Ajankohta</Text>
                        <Text allowFontScaling={false} style={styles.eventDateValue}>{formatDateRange(conversation.requestStartDate, conversation.requestEndDate)}</Text>
                      </View>
                      <View style={styles.eventDatePill}>
                        <Text allowFontScaling={false} style={styles.eventDateLabel}>Palautus</Text>
                        <Text allowFontScaling={false} style={styles.eventDateValue}>{formatDate(conversation.returnDueDate ?? conversation.requestEndDate)}</Text>
                      </View>
                    </View>
                  )}

                  {!!conversation.requestId && (
                    <View style={styles.eventActions}>
                      {eventUpdating ? (
                        <ActivityIndicator color={GREEN} size="small" />
                      ) : (
                        <>
                          {isOwner && requestStatus === 'pending' && (
                            <>
                              <EventButton label="Hyväksy" onPress={() => void handleEventAction('accepted')} primary />
                              <EventButton label="Hylkää" onPress={() => void handleEventAction('declined')} />
                            </>
                          )}
                          {isRequester && requestStatus === 'pending' && (
                            <EventButton label="Peru pyyntö" onPress={() => void handleEventAction('cancelled')} />
                          )}
                          {isOwner && requestStatus === 'accepted' && (
                            <EventButton label="Merkitse valmiiksi" onPress={() => void handleEventAction('completed')} primary />
                          )}
                          {conversation.listingId && (
                            <EventButton label="Avaa ilmoitus" onPress={() => router.push({ pathname: '/listings/[id]', params: { id: conversation.listingId } })} />
                          )}
                        </>
                      )}
                    </View>
                  )}
                </View>
              )}

              {messages.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Ionicons color={GREEN} name="chatbubble-outline" size={28} />
                  <Text allowFontScaling={false} style={styles.emptyTitle}>Ei viestejä vielä</Text>
                </View>
              ) : (
                messages.map((message) => {
                  const isMine = message.senderId === session?.user.id;

                  return (
                    <View key={message.id} style={[styles.bubbleRow, isMine && styles.myBubbleRow]}>
                      <View style={[styles.bubble, isMine ? styles.myBubble : styles.otherBubble]}>
                        <Text allowFontScaling={false} style={[styles.bubbleText, isMine && styles.myBubbleText]}>
                          {message.body}
                        </Text>
                        <Text allowFontScaling={false} style={[styles.bubbleTime, isMine && styles.myBubbleTime]}>
                          {formatTime(message.createdAt)}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}

              {!!feedback && (
                <View style={styles.feedbackCard}>
                  <Ionicons color={GREEN_DARK} name="information-circle-outline" size={20} />
                  <Text allowFontScaling={false} style={styles.feedbackText}>{feedback}</Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.composerWrap}>
              <TextInput
                editable={!sending}
                multiline
                onChangeText={setDraft}
                placeholder="Kirjoita viesti..."
                placeholderTextColor={MUTED}
                style={styles.composerInput}
                value={draft}
              />
              <Pressable
                disabled={sending || draft.trim().length < 1}
                onPress={handleSend}
                style={({ pressed }) => [styles.sendButton, (sending || draft.trim().length < 1) && styles.disabledButton, pressed && styles.pressed]}
              >
                {sending ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Ionicons color="#FFFFFF" name="send" size={19} />
                )}
              </Pressable>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function EventButton({ label, onPress, primary }: { label: string; onPress: () => void; primary?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.eventButton, primary && styles.eventButtonPrimary, pressed && styles.pressed]}>
      <Text allowFontScaling={false} style={[styles.eventButtonText, primary && styles.eventButtonPrimaryText]}>{label}</Text>
    </Pressable>
  );
}

function formatTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleTimeString('fi-FI', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: BACKGROUND,
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  topBar: {
    alignItems: 'center',
    borderBottomColor: 'rgba(64, 80, 48, 0.08)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 12,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 253, 247, 0.9)',
    borderColor: BORDER,
    borderRadius: 14,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  headerTextWrap: {
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  pageTitle: {
    color: TEXT,
    fontSize: 17,
    fontWeight: '900',
    maxWidth: '100%',
  },
  headerSubtitle: {
    color: MUTED,
    fontSize: 12.5,
    fontWeight: '700',
    marginTop: 2,
    maxWidth: '100%',
  },
  loadingWrap: {
    alignItems: 'center',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
  },
  loadingText: {
    color: MUTED,
    fontSize: 14,
    fontWeight: '600',
  },
  messageList: {
    flexGrow: 1,
    paddingBottom: 20,
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  eventCard: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    padding: 14,
  },
  eventHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  eventIconCircle: {
    alignItems: 'center',
    backgroundColor: GREEN,
    borderRadius: 999,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  eventHeaderText: {
    flex: 1,
  },
  eventTitle: {
    color: TEXT,
    fontSize: 15.5,
    fontWeight: '900',
  },
  eventStatus: {
    color: GREEN_DARK,
    fontSize: 12.8,
    fontWeight: '800',
    marginTop: 2,
  },
  eventDescription: {
    color: MUTED,
    fontSize: 13.2,
    fontWeight: '700',
    lineHeight: 19,
    marginTop: 10,
  },
  eventDateGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  eventDatePill: {
    backgroundColor: 'rgba(85, 99, 63, 0.08)',
    borderColor: 'rgba(85, 99, 63, 0.16)',
    borderRadius: 15,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  eventDateLabel: {
    color: MUTED,
    fontSize: 11.5,
    fontWeight: '800',
    marginBottom: 3,
  },
  eventDateValue: {
    color: GREEN_DARK,
    fontSize: 13,
    fontWeight: '900',
  },
  eventActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  eventButton: {
    borderColor: BORDER,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  eventButtonPrimary: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  eventButtonText: {
    color: GREEN_DARK,
    fontSize: 12.3,
    fontWeight: '900',
  },
  eventButtonPrimaryText: {
    color: '#FFFFFF',
  },
  bubbleRow: {
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  myBubbleRow: {
    alignItems: 'flex-end',
  },
  bubble: {
    borderRadius: 18,
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  myBubble: {
    backgroundColor: GREEN,
    borderBottomRightRadius: 6,
  },
  otherBubble: {
    backgroundColor: CARD,
    borderBottomLeftRadius: 6,
    borderColor: BORDER,
    borderWidth: 1,
  },
  bubbleText: {
    color: TEXT,
    fontSize: 14.5,
    fontWeight: '600',
    lineHeight: 20,
  },
  myBubbleText: {
    color: '#FFFFFF',
  },
  bubbleTime: {
    color: MUTED,
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: 5,
  },
  myBubbleTime: {
    color: 'rgba(255, 255, 255, 0.78)',
  },
  composerWrap: {
    alignItems: 'flex-end',
    backgroundColor: BACKGROUND,
    borderTopColor: 'rgba(64, 80, 48, 0.08)',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  composerInput: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: 18,
    borderWidth: 1,
    color: TEXT,
    flex: 1,
    fontSize: 14.5,
    fontWeight: '600',
    maxHeight: 112,
    minHeight: 46,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: GREEN,
    borderRadius: 16,
    height: 46,
    justifyContent: 'center',
    width: 50,
  },
  disabledButton: {
    opacity: 0.5,
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    padding: 24,
  },
  emptyTitle: {
    color: TEXT,
    fontSize: 15.5,
    fontWeight: '900',
  },
  feedbackCard: {
    alignItems: 'flex-start',
    backgroundColor: 'rgba(85, 99, 63, 0.08)',
    borderColor: 'rgba(85, 99, 63, 0.18)',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 9,
    marginTop: 12,
    padding: 13,
  },
  feedbackText: {
    color: GREEN_DARK,
    flex: 1,
    fontSize: 13.5,
    fontWeight: '700',
    lineHeight: 19,
  },
  pressed: {
    opacity: 0.78,
  },
});
