import { supabase } from '@/lib/supabase';

export type ListingAvailabilityStatus = 'available' | 'blocked';
export type ListingRequestDateRange = {
  startDate: string;
  endDate: string;
  returnDueDate: string;
};

export type ListingAvailabilityRange = {
  id: string;
  listingId: string;
  ownerId: string;
  startDate: string;
  endDate: string;
  status: ListingAvailabilityStatus;
  note: string | null;
  createdAt: string;
};

export type ReservedDateRange = {
  id: string;
  startDate: string;
  endDate: string;
  returnDueDate: string | null;
  status: string;
};

type AvailabilityRow = {
  id: string;
  listing_id: string;
  owner_id: string;
  start_date: string;
  end_date: string;
  status: ListingAvailabilityStatus;
  note: string | null;
  created_at: string;
};

type ReservedRequestRow = {
  id: string;
  request_start_date: string | null;
  request_end_date: string | null;
  return_due_date: string | null;
  status: string;
};

const RESERVED_REQUEST_STATUSES = ['accepted'] as const;

export async function getListingAvailability(listingId: string) {
  const { data, error } = await supabase
    .from('listing_availability')
    .select('id, listing_id, owner_id, start_date, end_date, status, note, created_at')
    .eq('listing_id', listingId)
    .order('start_date', { ascending: true });

  if (error) {
    throw toAppError(error, 'Saatavuuden lataus ei onnistunut.');
  }

  return (data ?? []).map(mapAvailabilityRange);
}

export async function getReservedDateRanges(listingId: string) {
  const { data, error } = await supabase
    .from('listing_requests')
    .select('id, request_start_date, request_end_date, return_due_date, status')
    .eq('listing_id', listingId)
    .in('status', [...RESERVED_REQUEST_STATUSES])
    .not('request_start_date', 'is', null)
    .not('request_end_date', 'is', null)
    .order('request_start_date', { ascending: true });

  if (error) {
    throw toAppError(error, 'Varausten lataus ei onnistunut.');
  }

  return (data ?? []).map((row) => mapReservedDateRange(row as ReservedRequestRow));
}

export async function isDateRangeAvailable(listingId: string, startDate: string, endDate: string) {
  const range = normalizeRequestDateRange(startDate, endDate);

  if (!range) {
    return true;
  }

  const [availabilityRanges, reservedRanges] = await Promise.all([
    getListingAvailability(listingId),
    getReservedDateRanges(listingId),
  ]);

  const hasBlockedOverlap = availabilityRanges.some(
    (availability) => availability.status === 'blocked' && dateRangesOverlap(range.startDate, range.endDate, availability.startDate, availability.endDate),
  );

  if (hasBlockedOverlap) {
    return false;
  }

  const availableRanges = availabilityRanges.filter((availability) => availability.status === 'available');

  if (availableRanges.length > 0) {
    const isInsideAvailableWindow = availableRanges.some((availability) =>
      dateRangeContains(availability.startDate, availability.endDate, range.startDate, range.endDate),
    );

    if (!isInsideAvailableWindow) {
      return false;
    }
  }

  return !reservedRanges.some((reservedRange) =>
    dateRangesOverlap(range.startDate, range.endDate, reservedRange.startDate, reservedRange.endDate),
  );
}

export function normalizeRequestDateRange(startDate?: string | null, endDate?: string | null): ListingRequestDateRange | null {
  const normalizedStartDate = startDate?.trim() || null;
  const normalizedEndDate = endDate?.trim() || null;

  if (!normalizedStartDate && !normalizedEndDate) {
    return null;
  }

  if (!normalizedStartDate || !normalizedEndDate) {
    throw new Error('Valitse sekä aloitus- että palautuspäivä.');
  }

  if (!isISODate(normalizedStartDate) || !isISODate(normalizedEndDate)) {
    throw new Error('Päivämäärä ei ole kelvollinen.');
  }

  if (normalizedStartDate > normalizedEndDate) {
    throw new Error('Palautuspäivän pitää olla aloituspäivän jälkeen.');
  }

  return {
    endDate: normalizedEndDate,
    returnDueDate: normalizedEndDate,
    startDate: normalizedStartDate,
  };
}

export function createDateOptions(dayCount = 21) {
  const today = new Date();

  return Array.from({ length: dayCount }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    const value = toISODate(date);

    return {
      day: date.toLocaleDateString('fi-FI', { day: 'numeric' }),
      label: index === 0 ? 'Tänään' : index === 1 ? 'Huomenna' : date.toLocaleDateString('fi-FI', { day: 'numeric', month: 'numeric' }),
      value,
      weekday: date.toLocaleDateString('fi-FI', { weekday: 'short' }).replace('.', ''),
    };
  });
}

export function formatDateRange(startDate?: string | null, endDate?: string | null) {
  if (!startDate || !endDate) {
    return 'Päiviä ei valittu';
  }

  if (startDate === endDate) {
    return formatDate(startDate);
  }

  return `${formatDate(startDate)}–${formatDate(endDate)}`;
}

export function formatDate(value?: string | null) {
  if (!value) {
    return '';
  }

  const [year, month, day] = value.split('-').map(Number);

  if (!year || !month || !day) {
    return value;
  }

  return new Date(year, month - 1, day).toLocaleDateString('fi-FI', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
}

export function dateRangesOverlap(startDate: string, endDate: string, comparedStartDate: string, comparedEndDate: string) {
  return startDate <= comparedEndDate && comparedStartDate <= endDate;
}

export function dateRangeContains(containerStartDate: string, containerEndDate: string, startDate: string, endDate: string) {
  return containerStartDate <= startDate && endDate <= containerEndDate;
}

function toISODate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function isISODate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function mapAvailabilityRange(row: AvailabilityRow): ListingAvailabilityRange {
  return {
    createdAt: row.created_at,
    endDate: row.end_date,
    id: row.id,
    listingId: row.listing_id,
    note: row.note,
    ownerId: row.owner_id,
    startDate: row.start_date,
    status: row.status,
  };
}

function mapReservedDateRange(row: ReservedRequestRow): ReservedDateRange {
  return {
    endDate: row.request_end_date ?? '',
    id: row.id,
    returnDueDate: row.return_due_date,
    startDate: row.request_start_date ?? '',
    status: row.status,
  };
}

function toAppError(error: unknown, fallbackMessage: string) {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === 'object' && error !== null) {
    const maybeError = error as { details?: string; hint?: string; message?: string };
    const messageParts = [maybeError.message, maybeError.details, maybeError.hint].filter(Boolean);

    if (messageParts.length > 0) {
      return new Error(messageParts.join(' '));
    }
  }

  return new Error(fallbackMessage);
}
