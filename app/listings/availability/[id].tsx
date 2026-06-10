import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  addListingAvailabilityRange,
  dateRangesOverlap,
  deleteListingAvailabilityRange,
  formatDate,
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
const DANGER = '#9F2E2E';

const weekdays = ['Ma', 'Ti', 'Ke', 'To', 'Pe', 'La', 'Su'];

export default function ListingAvailabilityScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const listingId = Array.isArray(params.id) ? params.id[0] : params.id;
  const today = getTodayISODate();
  const [listingTitle, setListingTitle] = useState('Ilmoitus');
  const [ranges, setRanges] = useState<ListingAvailabilityRange[]>([]);
  const [reservedRanges, setReservedRanges] = useState<ReservedDateRange[]>([]);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<ListingAvailabilityStatus>('available');
  const [visibleMonth, setVisibleMonth] = useState(() => monthStartFromISODate(today));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const calendarDays = useMemo(() => createMonthCalendarDays(visibleMonth), [visibleMonth]);
  const selectedRangeLabel = startDate && endDate ? formatDateRange(startDate, endDate) : startDate ? `${formatDate(startDate)} – valitse päättymispäivä` : 'Valitse aloituspäivä';

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
    if (value < today) {
      setFeedback('Et voi valita mennyttä päivää.');
      return;
    }

    setFeedback(null);

    if (!startDate || endDate) {
      setStartDate(value);
      setEndDate('');
      return;
    }

    if (value < startDate) {
      setEndDate(startDate);
      setStartDate(value);
      return;
    }

    setEndDate(value);
  };

  const addRange = async () => {
    if (!listingId || saving) return;

    if (!startDate || !endDate) {
      setFeedback('Valitse kalenterista sekä aloitus- että päättymispäivä.');
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
      setFeedback(status === 'available' ? 'Saatavilla-jakso lisätty.' : 'Suljettu jakso lisätty.');
      setStartDate(endDate);
      setEndDate('');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Saatavuusjakson lisäys ei onnistunut.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteRange = (range: ListingAvailabilityRange) => {
    Alert.alert('Poista jakso?', `${formatDateRange(range.startDate, range.endDate)} poistetaan saatavuudesta.`, [
      { style: 'cancel', text: 'Peruuta' },
      {
        onPress: async () => {
          setSaving(true);
          setFeedback(null);

          try {
            await deleteListingAvailabilityRange(range.id);
            setRanges((current) => current.filter((item) => item.id !== range.id));
            setFeedback('Saatavuusjakso poistettu.');
          } catch (error) {
            setFeedback(error instanceof Error ? error.message : 'Saatavuusjakson poisto ei onnistunut.');
          } finally {
            setSaving(false);
          }
        },
        style: 'destructive',
        text: 'Poista',
      },
    ]);
  };

  const moveMonth = (direction: -1 | 1) => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
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
          <View style={styles.calendarCard}>
            <View style={styles.calendarHeader}>
              <Pressable onPress={() => moveMonth(-1)} style={({ pressed }) => [styles.monthButton, pressed && styles.pressed]}>
                <Ionicons color={GREEN_DARK} name="chevron-back" size={20} />
              </Pressable>
              <Text allowFontScaling={false} style={styles.monthTitle}>{formatMonthTitle(visibleMonth)}</Text>
              <Pressable onPress={() => moveMonth(1)} style={({ pressed }) => [styles.monthButton, pressed && styles.pressed]}>
                <Ionicons color={GREEN_DARK} name="chevron-forward" size={20} />
              </Pressable>
            </View>

            <View style={styles.weekdayRow}>
              {weekdays.map((weekday) => (
                <Text allowFontScaling={false} key={weekday} style={styles.weekdayText}>{weekday}</Text>
              ))}
            </View>

            <View style={styles.monthGrid}>
              {calendarDays.map((day) => {
                const dayState = getDayState(day.value, ranges, reservedRanges);
                const inSelection = isInsideSelectedRange(day.value, startDate, endDate);
                const isSelectedEdge = day.value === startDate || day.value === endDate;
                const isPast = day.value < today;
                const isToday = day.value === today;

                return (
                  <Pressable
                    disabled={isPast}
                    key={day.key}
                    onPress={() => selectDate(day.value)}
                    style={({ pressed }) => [
                      styles.dayCell,
                      !day.inCurrentMonth && styles.dayCellOutside,
                      isPast && styles.dayCellPast,
                      dayState === 'available' && styles.dayCellAvailable,
                      dayState === 'blocked' && styles.dayCellBlocked,
                      dayState === 'reserved' && styles.dayCellReserved,
                      inSelection && styles.dayCellSelectedRange,
                      isSelectedEdge && styles.dayCellSelectedEdge,
                      isToday && styles.dayCellToday,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      allowFontScaling={false}
                      style={[
                        styles.dayNumber,
                        !day.inCurrentMonth && styles.dayNumberOutside,
                        isPast && styles.dayNumberPast,
                        isSelectedEdge && styles.dayNumberSelected,
                        dayState === 'blocked' && !isSelectedEdge && styles.dayNumberBlocked,
                        dayState === 'reserved' && !isSelectedEdge && styles.dayNumberReserved,
                      ]}
                    >
                      {day.dayNumber}
                    </Text>
                    {dayState !== 'none' && <View style={[styles.dayStatusDot, styles[`dayStatusDot_${dayState}`]]} />}
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.legendRow}>
              <LegendDot label="Saatavilla" tone="available" />
              <LegendDot label="Suljettu" tone="blocked" />
              <LegendDot label="Varattu" tone="reserved" />
            </View>
          </View>

          <View style={styles.selectionCard}>
            <Text allowFontScaling={false} style={styles.sectionTitle}>Valittu jakso</Text>
            <Text allowFontScaling={false} style={styles.selectionText}>{selectedRangeLabel}</Text>
            <View style={styles.segmentedControl}>
              <SegmentButton label="Saatavilla" selected={status === 'available'} onPress={() => setStatus('available')} />
              <SegmentButton label="Suljettu" selected={status === 'blocked'} onPress={() => setStatus('blocked')} />
            </View>
            <Pressable disabled={saving || !startDate || !endDate} onPress={addRange} style={({ pressed }) => [styles.primaryButton, (saving || !startDate || !endDate) && styles.disabledButton, pressed && styles.pressed]}>
              {saving ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text allowFontScaling={false} style={styles.primaryButtonText}>Lisää jakso</Text>}
            </Pressable>
          </View>

          {!!feedback && (
            <View style={styles.feedbackCard}>
              <Ionicons color={GREEN_DARK} name="information-circle-outline" size={20} />
              <Text allowFontScaling={false} style={styles.feedbackText}>{feedback}</Text>
            </View>
          )}

          <RangeSection emptyText="Ei saatavuusjaksoja vielä." onDelete={confirmDeleteRange} ranges={ranges} title="Omistajan saatavuusjaksot" />
          <ReservedSection ranges={reservedRanges} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function SegmentButton({ label, onPress, selected }: { label: string; onPress: () => void; selected: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.segmentButton, selected && styles.segmentButtonActive, pressed && styles.pressed]}>
      <Text allowFontScaling={false} style={[styles.segmentButtonText, selected && styles.segmentButtonTextActive]}>{label}</Text>
    </Pressable>
  );
}

function LegendDot({ label, tone }: { label: string; tone: 'available' | 'blocked' | 'reserved' }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, styles[`legendDot_${tone}`]]} />
      <Text allowFontScaling={false} style={styles.legendText}>{label}</Text>
    </View>
  );
}

function RangeSection({ emptyText, onDelete, ranges, title }: { emptyText: string; onDelete: (range: ListingAvailabilityRange) => void; ranges: ListingAvailabilityRange[]; title: string }) {
  return (
    <View style={styles.sectionCard}>
      <Text allowFontScaling={false} style={styles.sectionTitle}>{title}</Text>
      {ranges.length === 0 ? (
        <Text allowFontScaling={false} style={styles.emptyText}>{emptyText}</Text>
      ) : (
        <View style={styles.rangeList}>
          {ranges.map((range) => (
            <View key={range.id} style={styles.rangeRow}>
              <View style={styles.rangeBody}>
                <Text allowFontScaling={false} style={styles.rangeTitle}>{formatDateRange(range.startDate, range.endDate)}</Text>
                <Text allowFontScaling={false} style={[styles.rangeMeta, range.status === 'blocked' && styles.rangeMetaBlocked]}>{range.status === 'available' ? 'Saatavilla' : 'Suljettu'}</Text>
              </View>
              <Pressable onPress={() => onDelete(range)} style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}>
                <Ionicons color={DANGER} name="trash-outline" size={18} />
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function ReservedSection({ ranges }: { ranges: ReservedDateRange[] }) {
  return (
    <View style={styles.sectionCard}>
      <Text allowFontScaling={false} style={styles.sectionTitle}>Vahvistetut varaukset</Text>
      {ranges.length === 0 ? (
        <Text allowFontScaling={false} style={styles.emptyText}>Ei varauksia tällä hetkellä.</Text>
      ) : (
        <View style={styles.rangeList}>
          {ranges.map((range) => (
            <View key={range.id} style={styles.rangeRow}>
              <View style={styles.rangeBody}>
                <Text allowFontScaling={false} style={styles.rangeTitle}>{formatDateRange(range.startDate, range.endDate)}</Text>
                <Text allowFontScaling={false} style={styles.rangeMetaReserved}>Varattu · palautus {formatDate(range.returnDueDate ?? range.endDate)}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

type CalendarDay = {
  dayNumber: number;
  inCurrentMonth: boolean;
  key: string;
  value: string;
};

function createMonthCalendarDays(monthDate: Date): CalendarDay[] {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const firstWeekdayMondayBased = (firstDay.getDay() + 6) % 7;
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - firstWeekdayMondayBased);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    const value = toISODate(date);

    return {
      dayNumber: date.getDate(),
      inCurrentMonth: date.getMonth() === monthDate.getMonth(),
      key: value,
      value,
    };
  });
}

function getDayState(value: string, ranges: ListingAvailabilityRange[], reservedRanges: ReservedDateRange[]) {
  const reserved = reservedRanges.some((range) => dateRangesOverlap(value, value, range.startDate, range.endDate));
  if (reserved) return 'reserved' as const;

  const blocked = ranges.some((range) => range.status === 'blocked' && dateRangesOverlap(value, value, range.startDate, range.endDate));
  if (blocked) return 'blocked' as const;

  const available = ranges.some((range) => range.status === 'available' && dateRangesOverlap(value, value, range.startDate, range.endDate));
  if (available) return 'available' as const;

  return 'none' as const;
}

function isInsideSelectedRange(value: string, startDate: string, endDate: string) {
  if (!startDate || !endDate) return false;
  return startDate <= value && value <= endDate;
}

function monthStartFromISODate(value: string) {
  const [year, month] = value.split('-').map(Number);
  return new Date(year, month - 1, 1);
}

function formatMonthTitle(date: Date) {
  const label = date.toLocaleDateString('fi-FI', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function toISODate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
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
  content: { gap: 13, paddingBottom: 32, paddingHorizontal: 22, paddingTop: 22 },
  calendarCard: { backgroundColor: CARD, borderColor: BORDER, borderRadius: 24, borderWidth: 1, padding: 14 },
  calendarHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  monthButton: { alignItems: 'center', borderColor: BORDER, borderRadius: 12, borderWidth: 1, height: 38, justifyContent: 'center', width: 38 },
  monthTitle: { color: TEXT, fontSize: 17, fontWeight: '900' },
  weekdayRow: { flexDirection: 'row', marginBottom: 7 },
  weekdayText: { color: MUTED, flex: 1, fontSize: 11.5, fontWeight: '900', textAlign: 'center' },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { alignItems: 'center', borderColor: 'transparent', borderRadius: 14, borderWidth: 1, height: 45, justifyContent: 'center', marginBottom: 5, paddingTop: 4, width: `${100 / 7}%` },
  dayCellOutside: { opacity: 0.42 },
  dayCellPast: { opacity: 0.28 },
  dayCellToday: { borderColor: 'rgba(85, 99, 63, 0.35)' },
  dayCellAvailable: { backgroundColor: 'rgba(85, 99, 63, 0.08)' },
  dayCellBlocked: { backgroundColor: 'rgba(159, 46, 46, 0.08)' },
  dayCellReserved: { backgroundColor: 'rgba(166, 123, 54, 0.12)' },
  dayCellSelectedRange: { backgroundColor: 'rgba(85, 99, 63, 0.16)' },
  dayCellSelectedEdge: { backgroundColor: GREEN, borderColor: GREEN },
  dayNumber: { color: TEXT, fontSize: 14, fontWeight: '900' },
  dayNumberOutside: { color: MUTED },
  dayNumberPast: { color: MUTED },
  dayNumberSelected: { color: '#FFFFFF' },
  dayNumberBlocked: { color: DANGER },
  dayNumberReserved: { color: '#8B6429' },
  dayStatusDot: { borderRadius: 999, height: 4, marginTop: 3, width: 4 },
  dayStatusDot_available: { backgroundColor: GREEN },
  dayStatusDot_blocked: { backgroundColor: DANGER },
  dayStatusDot_reserved: { backgroundColor: '#A67B36' },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  legendItem: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  legendDot: { borderRadius: 999, height: 8, width: 8 },
  legendDot_available: { backgroundColor: GREEN },
  legendDot_blocked: { backgroundColor: DANGER },
  legendDot_reserved: { backgroundColor: '#A67B36' },
  legendText: { color: MUTED, fontSize: 11.5, fontWeight: '800' },
  selectionCard: { backgroundColor: CARD, borderColor: BORDER, borderRadius: 20, borderWidth: 1, gap: 12, padding: 16 },
  sectionCard: { backgroundColor: CARD, borderColor: BORDER, borderRadius: 20, borderWidth: 1, padding: 16 },
  sectionTitle: { color: TEXT, fontSize: 16.5, fontWeight: '900' },
  selectionText: { color: GREEN_DARK, fontSize: 14, fontWeight: '900', lineHeight: 20 },
  segmentedControl: { backgroundColor: 'rgba(85, 99, 63, 0.08)', borderRadius: 999, flexDirection: 'row', padding: 4 },
  segmentButton: { alignItems: 'center', borderRadius: 999, flex: 1, paddingVertical: 10 },
  segmentButtonActive: { backgroundColor: GREEN },
  segmentButtonText: { color: GREEN_DARK, fontSize: 13, fontWeight: '900' },
  segmentButtonTextActive: { color: '#FFFFFF' },
  primaryButton: { alignItems: 'center', backgroundColor: GREEN, borderRadius: 16, height: 52, justifyContent: 'center' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15.5, fontWeight: '900' },
  rangeList: { gap: 10, marginTop: 12 },
  rangeRow: { alignItems: 'center', borderColor: BORDER, borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 10, padding: 12 },
  rangeBody: { flex: 1, minWidth: 0 },
  rangeTitle: { color: TEXT, fontSize: 14.5, fontWeight: '900' },
  rangeMeta: { color: GREEN_DARK, fontSize: 12.3, fontWeight: '800', marginTop: 3 },
  rangeMetaBlocked: { color: DANGER },
  rangeMetaReserved: { color: '#8B6429', fontSize: 12.3, fontWeight: '800', marginTop: 3 },
  deleteButton: { alignItems: 'center', borderColor: 'rgba(159, 46, 46, 0.22)', borderRadius: 12, borderWidth: 1, height: 38, justifyContent: 'center', width: 38 },
  emptyText: { color: MUTED, fontSize: 13.5, fontWeight: '700', lineHeight: 19, marginTop: 8 },
  feedbackCard: { alignItems: 'flex-start', backgroundColor: 'rgba(85, 99, 63, 0.08)', borderColor: 'rgba(85, 99, 63, 0.18)', borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 9, padding: 13 },
  feedbackText: { color: GREEN_DARK, flex: 1, fontSize: 13.5, fontWeight: '700', lineHeight: 19 },
  disabledButton: { opacity: 0.52 },
  pressed: { opacity: 0.78 },
});
