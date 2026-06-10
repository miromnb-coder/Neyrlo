import { formatDateRange, isDateRangeAvailable } from '@/lib/availability';
import { supabase } from '@/lib/supabase';

export type ListingRequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'completed';

export type ListingRequestSummary = {
  id: string;
  listingId: string;
  listingTitle: string;
  message: string | null;
  otherUserName: string;
  role: 'owner' | 'requester';
  status: ListingRequestStatus;
  requestStartDate: string | null;
  requestEndDate: string | null;
  returnDueDate: string | null;
  dateLabel: string;
  createdAt: string;
};

type RequestRow = {
  id: string;
  listing_id: string;
  requester_id: string;
  owner_id: string;
  status: ListingRequestStatus;
  message: string | null;
  request_start_date: string | null;
  request_end_date: string | null;
  return_due_date: string | null;
  created_at: string;
  listings?: { title?: string | null } | null;
  owner?: { display_name?: string | null } | null;
  requester?: { display_name?: string | null } | null;
};

const requestSelect = `
  id,
  listing_id,
  requester_id,
  owner_id,
  status,
  message,
  request_start_date,
  request_end_date,
  return_due_date,
  created_at,
  listings(title),
  owner:profiles!listing_requests_owner_id_fkey(display_name),
  requester:profiles!listing_requests_requester_id_fkey(display_name)
`;

export async function getMyListingRequests() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw toAppError(userError, 'Kirjautuneen käyttäjän tarkistus ei onnistunut.');
  }

  if (!user) {
    throw new Error('Kirjaudu sisään nähdäksesi pyynnöt.');
  }

  const { data, error } = await supabase
    .from('listing_requests')
    .select(requestSelect)
    .or(`owner_id.eq.${user.id},requester_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) {
    throw toAppError(error, 'Pyyntöjen lataus ei onnistunut.');
  }

  return (data ?? []).map((row) => mapRequest(row as RequestRow, user.id));
}

export async function updateListingRequestStatus(requestId: string, status: ListingRequestStatus) {
  if (status === 'accepted') {
    await ensureRequestCanBeAccepted(requestId);
  }

  const { data: request, error: requestError } = await supabase
    .from('listing_requests')
    .update({ status })
    .eq('id', requestId)
    .select(requestSelect)
    .single();

  if (requestError) {
    throw toAppError(requestError, 'Pyynnön tilan päivitys ei onnistunut.');
  }

  if (status === 'accepted') {
    const { error: listingError } = await supabase
      .from('listings')
      .update({ status: 'reserved' })
      .eq('id', request.listing_id);

    if (listingError) {
      throw toAppError(listingError, 'Ilmoituksen varausmerkintä ei onnistunut.');
    }
  }

  if (status === 'completed') {
    const { error: listingError } = await supabase
      .from('listings')
      .update({ status: 'completed' })
      .eq('id', request.listing_id);

    if (listingError) {
      throw toAppError(listingError, 'Ilmoituksen valmiiksi merkintä ei onnistunut.');
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return mapRequest(request as RequestRow, user?.id ?? request.owner_id);
}

export function requestStatusLabel(status: ListingRequestStatus) {
  switch (status) {
    case 'accepted':
      return 'Hyväksytty';
    case 'declined':
      return 'Hylätty';
    case 'cancelled':
      return 'Peruttu';
    case 'completed':
      return 'Valmis';
    case 'pending':
    default:
      return 'Odottaa';
  }
}

export function requestStatusDescription(status: ListingRequestStatus | null) {
  switch (status) {
    case 'pending':
      return 'Pyyntö odottaa omistajan vastausta.';
    case 'accepted':
      return 'Pyyntö hyväksytty. Sopikaa nouto ja palautus viesteissä.';
    case 'declined':
      return 'Pyyntö hylättiin.';
    case 'cancelled':
      return 'Pyyntö peruttiin.';
    case 'completed':
      return 'Tapahtuma on merkitty valmiiksi. Nyt voitte jättää arvion.';
    default:
      return 'Lainaustapahtumaa ei ole vielä aloitettu.';
  }
}

async function ensureRequestCanBeAccepted(requestId: string) {
  const { data: request, error } = await supabase
    .from('listing_requests')
    .select('id, listing_id, request_start_date, request_end_date')
    .eq('id', requestId)
    .single();

  if (error) {
    throw toAppError(error, 'Pyynnön tarkistus ei onnistunut.');
  }

  if (!request.request_start_date || !request.request_end_date) {
    return;
  }

  const available = await isDateRangeAvailable(request.listing_id, request.request_start_date, request.request_end_date);

  if (!available) {
    throw new Error('Tätä pyyntöä ei voi hyväksyä, koska valittu ajankohta ei ole enää vapaa.');
  }
}

function mapRequest(row: RequestRow, currentUserId: string): ListingRequestSummary {
  const role = row.owner_id === currentUserId ? 'owner' : 'requester';
  const otherUserName = role === 'owner' ? row.requester?.display_name : row.owner?.display_name;

  return {
    createdAt: row.created_at,
    dateLabel: formatDateRange(row.request_start_date, row.request_end_date),
    id: row.id,
    listingId: row.listing_id,
    listingTitle: row.listings?.title || 'Ilmoitus',
    message: row.message,
    otherUserName: otherUserName || 'Neyrlo-käyttäjä',
    requestEndDate: row.request_end_date,
    requestStartDate: row.request_start_date,
    returnDueDate: row.return_due_date,
    role,
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
