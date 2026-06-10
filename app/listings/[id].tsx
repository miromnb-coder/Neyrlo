import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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

import { createContactForListing } from '@/lib/messages';
import {
  getListingForReview,
  listingTypeLabel,
  type ListingWithRelations,
} from '@/lib/listings';
import { useAuth } from '@/lib/auth';

const BACKGROUND = '#FFFDF7';
const GREEN = '#55633F';
const GREEN_DARK = '#3F4E2F';
const TEXT = '#20251F';
const MUTED = '#77736B';
const BORDER = 'rgba(64, 80, 48, 0.13)';
const CARD = 'rgba(255, 253, 247, 0.94)';

const categoryLabels: Record<string, string> = {
  electronics: 'Elektroniikka',
  events: 'Juhlat',
  home: 'Koti',
  kids: 'Lapset',
  outdoors: 'Ulkoilu',
  sports: 'Urheilu',
  tools: 'Työkalut',
  travel: 'Matkustus',
};

export default function ListingDetailsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const params = useLocalSearchParams<{ id?: string }>();
  const listingId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [listing, setListing] = useState<ListingWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('Hei! Onko tämä vielä saatavilla?');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const isOwnListing = !!listing && listing.owner_id === session?.user.id;
  const categoryLabel = listing?.category_id ? categoryLabels[listing.category_id] ?? 'Muu' : 'Muu';
  const imageUrl = listing?.image_urls[0];
  const contactButtonLabel = useMemo(() => {
    if (!listing) {
      return 'Ota yhteyttä';
    }

    switch (listing.listing_type) {
      case 'rent':
        return 'Kysy vuokrausta';
      case 'swap':
        return 'Ehdota vaihtoa';
      case 'free':
        return 'Kysy tavarasta';
      case 'borrow':
      default:
        return 'Pyydä lainaan';
    }
  }, [listing]);

  const loadListing = useCallback(async () => {
    if (!listingId) {
      setFeedback('Ilmoituksen tunniste puuttuu.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const data = await getListingForReview(listingId);
      setListing(data);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Ilmoituksen lataus ei onnistunut.');
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    void loadListing();
  }, [loadListing]);

  const handleContact = async () => {
    if (!listing || sending || isOwnListing) {
      return;
    }

    setSending(true);
    setFeedback(null);

    try {
      const conversationId = await createContactForListing({
        listingId: listing.id,
        message,
      });

      router.push({ pathname: '/messages/[id]', params: { id: conversationId } });
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Yhteydenotto ei onnistunut.');
    } finally {
      setSending(false);
    }
  };

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
          <Text allowFontScaling={false} style={styles.pageTitle}>Ilmoitus</Text>
          <Pressable accessibilityLabel="Suosikki" style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <Ionicons color={GREEN_DARK} name="heart-outline" size={24} />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={GREEN} size="small" />
            <Text allowFontScaling={false} style={styles.loadingText}>Ladataan ilmoitusta...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.heroImage} />
            ) : (
              <View style={styles.emptyImage}>
                <Ionicons color={GREEN_DARK} name="image-outline" size={42} />
              </View>
            )}

            {!!listing && (
              <>
                <View style={styles.titleCard}>
                  <View style={styles.badgeRow}>
                    <View style={styles.badge}>
                      <Text allowFontScaling={false} style={styles.badgeText}>{listingTypeLabel(listing.listing_type)}</Text>
                    </View>
                    <Text allowFontScaling={false} style={styles.categoryText}>{categoryLabel}</Text>
                  </View>
                  <Text allowFontScaling={false} style={styles.title}>{listing.title}</Text>
                  <View style={styles.ownerRow}>
                    <Ionicons color={GREEN_DARK} name="person-circle-outline" size={22} />
                    <Text allowFontScaling={false} style={styles.ownerText}>{listing.owner_name}</Text>
                    <Text allowFontScaling={false} style={styles.star}>★</Text>
                    <Text allowFontScaling={false} style={styles.ownerText}>{listing.owner_rating.toFixed(1)}</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <InfoPill icon="location-outline" label={listing.location_label ?? 'Sijainti ei tiedossa'} />
                  <InfoPill icon="cash-outline" label={formatPrice(listing.price_amount)} />
                </View>

                <View style={styles.sectionCard}>
                  <Text allowFontScaling={false} style={styles.sectionTitle}>Kuvaus</Text>
                  <Text allowFontScaling={false} style={styles.description}>{listing.description || 'Ei kuvausta.'}</Text>
                </View>

                <View style={styles.safetyCard}>
                  <Ionicons color={GREEN_DARK} name="shield-checkmark-outline" size={22} />
                  <Text allowFontScaling={false} style={styles.safetyText}>
                    Tarkka noutopaikka kannattaa sopia vasta viesteissä. Neyrlo näyttää sijainnin vain suurpiirteisesti.
                  </Text>
                </View>

                {isOwnListing ? (
                  <View style={styles.feedbackCard}>
                    <Ionicons color={GREEN_DARK} name="information-circle-outline" size={20} />
                    <Text allowFontScaling={false} style={styles.feedbackText}>Tämä on oma ilmoituksesi.</Text>
                  </View>
                ) : (
                  <View style={styles.contactCard}>
                    <Text allowFontScaling={false} style={styles.sectionTitle}>Ota yhteyttä</Text>
                    <TextInput
                      editable={!sending}
                      multiline
                      onChangeText={setMessage}
                      placeholder="Kirjoita viesti omistajalle..."
                      placeholderTextColor={MUTED}
                      style={styles.messageInput}
                      value={message}
                    />
                    {!!feedback && (
                      <Text allowFontScaling={false} style={styles.inlineError}>{feedback}</Text>
                    )}
                    <Pressable
                      disabled={sending}
                      onPress={handleContact}
                      style={({ pressed }) => [styles.primaryButton, sending && styles.disabledButton, pressed && styles.pressed]}
                    >
                      {sending ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text allowFontScaling={false} style={styles.primaryButtonText}>{contactButtonLabel}</Text>
                      )}
                    </Pressable>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function InfoPill({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.infoPill}>
      <Ionicons color={GREEN_DARK} name={icon} size={17} />
      <Text allowFontScaling={false} numberOfLines={1} style={styles.infoPillText}>{label}</Text>
    </View>
  );
}

function formatPrice(price: number | null) {
  if (price === null || price === undefined) {
    return 'Ei korvausta';
  }

  return `${price.toFixed(2).replace('.', ',')} €`;
}

const serifFont = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 253, 247, 0.9)',
    borderColor: BORDER,
    borderRadius: 14,
    borderWidth: 1,
    height: 45,
    justifyContent: 'center',
    width: 45,
  },
  pageTitle: {
    color: TEXT,
    fontFamily: serifFont,
    fontSize: 28,
    fontWeight: Platform.OS === 'ios' ? '500' : '400',
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
  content: {
    paddingBottom: 30,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  heroImage: {
    backgroundColor: '#F8F2EA',
    borderRadius: 24,
    height: 270,
    width: '100%',
  },
  emptyImage: {
    alignItems: 'center',
    backgroundColor: '#F8F2EA',
    borderRadius: 24,
    height: 220,
    justifyContent: 'center',
  },
  titleCard: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 16,
    padding: 18,
  },
  badgeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  badge: {
    backgroundColor: GREEN,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  categoryText: {
    color: GREEN_DARK,
    fontSize: 12.5,
    fontWeight: '800',
  },
  title: {
    color: TEXT,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.45,
  },
  ownerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    marginTop: 10,
  },
  ownerText: {
    color: GREEN_DARK,
    fontSize: 14,
    fontWeight: '700',
  },
  star: {
    color: '#E9B949',
    fontSize: 14,
    fontWeight: '900',
  },
  infoRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  infoPill: {
    alignItems: 'center',
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    minHeight: 42,
    paddingHorizontal: 13,
  },
  infoPillText: {
    color: GREEN_DARK,
    flex: 1,
    fontSize: 12.8,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 12,
    padding: 18,
  },
  sectionTitle: {
    color: TEXT,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 8,
  },
  description: {
    color: MUTED,
    fontSize: 14.6,
    fontWeight: '600',
    lineHeight: 22,
  },
  safetyCard: {
    alignItems: 'flex-start',
    backgroundColor: 'rgba(85, 99, 63, 0.08)',
    borderColor: 'rgba(85, 99, 63, 0.18)',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    padding: 14,
  },
  safetyText: {
    color: GREEN_DARK,
    flex: 1,
    fontSize: 13.5,
    fontWeight: '700',
    lineHeight: 19,
  },
  contactCard: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 12,
    padding: 18,
  },
  messageInput: {
    backgroundColor: '#F8F3EA',
    borderColor: 'rgba(64, 80, 48, 0.1)',
    borderRadius: 14,
    borderWidth: 1,
    color: TEXT,
    fontSize: 14.5,
    fontWeight: '600',
    lineHeight: 20,
    minHeight: 92,
    padding: 13,
    textAlignVertical: 'top',
  },
  inlineError: {
    color: GREEN_DARK,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 10,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: GREEN,
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    marginTop: 14,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.7,
  },
  feedbackCard: {
    alignItems: 'flex-start',
    backgroundColor: 'rgba(85, 99, 63, 0.08)',
    borderColor: 'rgba(85, 99, 63, 0.18)',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 9,
    marginTop: 14,
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
