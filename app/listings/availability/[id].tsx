import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  addDaysToISODate,
  addListingAvailabilityRange,
  createDateOptions,
  deleteListingAvailabilityRange,
  formatDateRange,
  getListingAvailability,
  getReservedDateRanges,
  getTodayISODate,
  type ListingAvailabilityRange,
  type ListingAvailabilityStatus,
  type ReservedDateRange,
} from '@/lib/availability';
import { getMyListingForEdit } from '@/lib/myListings';

const BACKGROUND = '#FFFDF7';
const GREEN = '#55633F';
const GREEN_DARK = '#3F4E2F';
const TEXT = '#20251F';
const MUTED = '#77736B';
const BORDER = 'rgba(64, 80, 48, 0.13)';
const CARD = 'rgba(255, 253, 247, 0.94)';

export default function ListingAvailabilityScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const listingId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [listingTitle, setListingTitle] = useState('Ilmoitus');
  const [ranges, setRanges] = useState<ListingAvailabilityRange[]>([]);
  const [reservedRanges, setReservedRanges] = useState<ReservedDateRange[]>([]);
  const [startDate, setStartDate] = useState(getTodayISODate());
  const [endDate, setEndDate] = useState(addDaysToISODate(getTodayISODate(), 3));
  const [status, setStatus] = useState<ListingAvailabilityStatus>('available');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const dateOptions = useMemo(() => createDateOptions(45), []);

  const loadData = useCallback(async () => {
    if (!listingId) {
      setFeedback('Ilmoituksen tunniste puuttuu.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const [listing, availabilityData, reservedData] = await Promise.all([
        getMyListingForEdit(listingId),
        getListingAvailability(listingId),
        getReservedDateRanges(listingId),
      ]);
      setListingTitle(listing.title);
      setRanges(availabilityData);
      setReservedRanges(reservedData);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Saatavuuden lataus ei onnistunut.');
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const selectDate = (value: string) => {
    setFeedback(null);

    if (value < startDate || endDate) {
      setStartDate(value);
      setEndDate('');
      return;
    }

    setEndDate(value);
  };

  const addRange = async () => {
    if (!listingId || saving) return;

    if (!startDate || !endDate) {
      setFeedback('Valitse jaksolle aloitus- ja lopetuspäivä.');
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const range = await addListingAvailabilityRange({
        endDate,
        listingId,
        startDate,
        status,
      });
      setRanges((current) => [...current, range].sort((a, b) => a.startDate.localeCompare(b.startDate)));
      setFeedback(status === 'available' ? 'Saatavuusjakso lisätty.' : 'Suljettu jakso lisätty.');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Jakson lisäys ei onnistunut.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (range: ListingAvailabilityRange) => {
    Alert.alert('Poista jakso?', formatDateRange(range.startDate, range.endDate), [
      { style: 'cancel', text: 'Peruuta' },
      {
        onPress: async () => {
          setFeedback(null);
          try {
            await deleteListingAvailabilityRange(range.id);
            setRanges((current) => current.filter((item) => item.id !== range.id));
            setFeedback('Jakso poistettu.');
          } catch (error) {
            setFeedback(error instanceof Error ? error.message : 'Jakson poisto ei onnistunut.');
          }
        },
        style: 'destructive',
        text: 'Poista',
      },
    ]);
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable accessibilityLabel="Takaisin" onPress={() => router.back()} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
          <Ionicons color={TEXT} name="chevron-back" size={27} />
        </Pressable>
        <View style={styles.headerText}>
          <Text allowFontScaling={false} style={styles.pageTitle}>Saatavuus</Text>
          <Text allowFontScaling={false} numberOfLines={1} style={styles.subtitle}>{listingTitle}</Text>
        </View>
        <Pressable accessibilityLabel="Päivitä" onPress={() => void loadData()} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
          <Ionicons color={GREEN_DARK} name="refresh-outline" size={22} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={GREEN} size="small" />
          <Text allowFontScaling={false} style={styles.loadingText}>Ladataan saatavuutta...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text allowFontScaling={false} style={styles.sectionTitle}>Lisää jakso</Text>
            <Text allowFontScaling={false} style={styles.helpText}>Valitse ensin aloituspäivä ja sitten lopetuspäivä. “Saatavilla” rajaa ajan, jolloin tavara on lainattavissa. “Suljettu” piilottaa yksittäiset poikkeukset.</Text>

            <View style={styles.segmentRow}>
              <Segment label="Saatavilla" selected={status === 'available'} onPress={() => setStatus('available')} />
              <Segment label="Suljettu" selected={status === 'blocked'} onPress={() => setStatus('blocked')} />
            </View>

            <Text allowFontScaling={false} style={styles.selectedRange}>{startDate && endDate ? formatDateRange(startDate, endDate) : 'Valitse lopetuspäivä'}</Text>

            <ScrollView contentContainerStyle={styles.dateRow} horizontal showsHorizontalScrollIndicator={false}>
              {dateOptions.map((option) => {
                const selected = option.value === startDate || option.value === endDate;
                const inside = !!startDate && !!endDate && option.value > startDate && option.value < endDate;

                return (
                  <Pressable key={option.value} onPress={() => selectDate(option.value)} style={({ pressed }) => [styles.dateChip, selected && styles.dateChipSelected, inside && styles.dateChipInside, pressed && styles.pressed]}>
                    <Text allowFontScaling={false} style={[styles.dateWeekday, selected && styles.dateTextSelected]}>{option.weekday}</Text>
                    <Text allowFontScaling={false} style={[styles.dateLabel, selected && styles.dateTextSelected]}>{option.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Pressable disabled={saving || !startDate || !endDate} onPress={addRange} style={({ pressed }) => [styles.primaryButton, (saving || !startDate || !endDate) && styles.disabledButton, pressed && styles.pressed]}>
              {saving ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text allowFontScaling={false} style={styles.primaryButtonText}>Lisää jakso</Text>}
            </Pressable>
          </View>

          <View style={styles.card}>
            <Text allowFontScaling={false} style={styles.sectionTitle}>Nykyiset jaksot</Text>
            {ranges.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons color={GREEN_DARK} name="calendar-outline" size={26} />
                <Text allowFontScaling={false} style={styles.emptyText}>Ei saatavuusjaksoja vielä. Ilman jaksoja tavara oletetaan vapaaksi, ellei sitä ole varattu.</Text>
              </View>
            ) : (
              <View style={styles.rangeList}>
                {ranges.map((range) => (
                  <View key={range.id} style={styles.rangeRow}>
                    <View style={[styles.rangeIcon, range.status === 'blocked' && styles.blockedIcon]}>
                      <Ionicons color={range.status === 'blocked' ? '#9F2E2E' : GREEN_DARK} name={range.status === 'blocked' ? 'close-circle-outline' : 'checkmark-circle-outline'} size={20} />
                    </View>
                    <View style={styles.rangeBody}>
                      <Text allowFontScaling={false} style={styles.rangeTitle}>{range.status === 'available' ? 'Saatavilla' : 'Suljettu'}</Text>
                      <Text allowFontScaling={false} style={styles.rangeDate}>{formatDateRange(range.startDate, range.endDate)}</Text>
                    </View>
                    <Pressable onPress={() => confirmDelete(range)} style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}>
                      <Ionicons color="#9F2E2E" name="trash-outline" size={18} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.card}>
            <Text allowFontScaling={false} style={styles.sectionTitle}>Vahvistetut varaukset</Text>
            {reservedRanges.length === 0 ? (
              <Text allowFontScaling={false} style={styles.helpText}>Ei vahvistettuja varauksia.</Text>
            ) : (
              <View style={styles.rangeList}>
                {reservedRanges.map((range) => (
                  <View key={range.id} style={styles.reservedRow}>
                    <Ionicons color={GREEN_DARK} name="bookmark-outline" size={18} />
                    <Text allowFontScaling={false} style={styles.rangeDate}>{formatDateRange(range.startDate, range.endDate)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

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

function Segment({ label, onPress, selected }: { label: string; onPress: () => void; selected: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.segment, selected && styles.segmentSelected, pressed && styles.pressed]}>
      <Text allowFontScaling={false} style={[styles.segmentText, selected && styles.segmentTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: BACKGROUND, flex: 1 },
  topBar: { alignItems: 'center', flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 8 },
  iconButton: { alignItems: 'center', backgroundColor: CARD, borderColor: BORDER, borderRadius: 14, borderWidth: 1, height: 44, justifyContent: 'center', width: 44 },
  headerText: { alignItems: 'center', flex: 1, minWidth: 0 },
  pageTitle: { color: TEXT, fontSize: 20, fontWeight: '900' },
  subtitle: { color: MUTED, fontSize: 12.5, fontWeight: '700', marginTop: 2, maxWidth: '100%' },
  loadingWrap: { alignItems: 'center', flex: 1, gap: 12, justifyContent: 'center' },
  loadingText: { color: MUTED, fontSize: 14, fontWeight: '700' },
  content: { gap: 14, paddingBottom: 30, paddingHorizontal: 22, paddingTop: 22 },
  card: { backgroundColor: CARD, borderColor: BORDER, borderRadius: 20, borderWidth: 1, padding: 16 },
  sectionTitle: { color: TEXT, fontSize: 17, fontWeight: '900', marginBottom: 8 },
  helpText: { color: MUTED, fontSize: 13.4, fontWeight: '650', lineHeight: 20 },
  segmentRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  segment: { alignItems: 'center', borderColor: BORDER, borderRadius: 999, borderWidth: 1, flex: 1, paddingVertical: 10 },
  segmentSelected: { backgroundColor: GREEN, borderColor: GREEN },
  segmentText: { color: GREEN_DARK, fontSize: 13.5, fontWeight: '900' },
  segmentTextSelected: { color: '#FFFFFF' },
  selectedRange: { color: GREEN_DARK, fontSize: 14, fontWeight: '900', marginTop: 14 },
  dateRow: { gap: 8, paddingTop: 12 },
  dateChip: { alignItems: 'center', backgroundColor: '#F8F3EA', borderColor: BORDER, borderRadius: 15, borderWidth: 1, minWidth: 76, paddingHorizontal: 12, paddingVertical: 10 },
  dateChipSelected: { backgroundColor: GREEN, borderColor: GREEN },
  dateChipInside: { backgroundColor: 'rgba(85, 99, 63, 0.1)' },
  dateWeekday: { color: MUTED, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  dateLabel: { color: TEXT, fontSize: 12.8, fontWeight: '900', marginTop: 4 },
  dateTextSelected: { color: '#FFFFFF' },
  primaryButton: { alignItems: 'center', backgroundColor: GREEN, borderRadius: 16, height: 54, justifyContent: 'center', marginTop: 16 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  disabledButton: { opacity: 0.58 },
  emptyState: { alignItems: 'center', gap: 8, paddingVertical: 14 },
  emptyText: { color: MUTED, fontSize: 13.2, fontWeight: '700', lineHeight: 19, textAlign: 'center' },
  rangeList: { gap: 9 },
  rangeRow: { alignItems: 'center', backgroundColor: '#F8F3EA', borderRadius: 15, flexDirection: 'row', gap: 10, padding: 12 },
  rangeIcon: { alignItems: 'center', backgroundColor: 'rgba(85, 99, 63, 0.11)', borderRadius: 999, height: 36, justifyContent: 'center', width: 36 },
  blockedIcon: { backgroundColor: 'rgba(159, 46, 46, 0.08)' },
  rangeBody: { flex: 1, minWidth: 0 },
  rangeTitle: { color: TEXT, fontSize: 14, fontWeight: '900' },
  rangeDate: { color: GREEN_DARK, fontSize: 13, fontWeight: '800', marginTop: 2 },
  deleteButton: { alignItems: 'center', borderColor: 'rgba(159, 46, 46, 0.24)', borderRadius: 12, borderWidth: 1, height: 36, justifyContent: 'center', width: 36 },
  reservedRow: { alignItems: 'center', flexDirection: 'row', gap: 8, paddingVertical: 5 },
  feedbackCard: { alignItems: 'flex-start', backgroundColor: 'rgba(85, 99, 63, 0.08)', borderColor: 'rgba(85, 99, 63, 0.18)', borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 9, padding: 13 },
  feedbackText: { color: GREEN_DARK, flex: 1, fontSize: 13.5, fontWeight: '700', lineHeight: 19 },
  pressed: { opacity: 0.78 },
});
