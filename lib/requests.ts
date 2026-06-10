import { formatDateRange, isDateRangeAvailable } from '@/lib/availability';
import { createNotificationEventSafely, type NotificationEventType } from '@/lib/notificationEvents';
import { supabase } from '@/lib/supabase';

export type ListingRequestStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'cancelled'
  | 'pickup_scheduled'
  | 'picked_up'
  | 'return_due'
  | 'returned'
  | 'completed';

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
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw toAppError(userError, 'Kirjautuneen käyttäjän tarkistus ei onnistunut.');
  }

  if (!user) {
    throw new Error('Kirjaudu sisään päivittääksesi pyynnön tilan.');
  }

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

  const recipientId = request.owner_id === user.id ? request.requester_id : request.owner_id;
  await createStatusNotification(request as RequestRow, user.id, recipientId, status);

  return mapRequest(request as RequestRow, user.id);
}

export function requestStatusLabel(status: ListingRequestStatus) {
  switch (status) {
    case 'accepted':
      return 'Hyväksytty';
    case 'declined':
      return 'Hylätty';
    case 'cancelled':
      return 'Peruttu';
    case 'pickup_scheduled':
      return 'Nouto sovittu';
    case 'picked_up':
      return 'Noudettu';
    case 'return_due':
      return 'Palautus tulossa';
    case 'returned':
      return 'Palautettu';
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
    case 'pickup_scheduled':
      return 'Nouto on sovittu. Varmistakaa aika ja paikka viesteissä.';
    case 'picked_up':
      return 'Tavara on luovutettu lainaajalle.';
    case 'return_due':
      return 'Palautuspäivä lähestyy. Sopikaa palautuksen yksityiskohdat.';
    case 'returned':
      return 'Tavara on merkitty palautetuksi. Omistaja voi viimeistellä tapahtuman.';
    case 'completed':
      return 'Tapahtuma on merkitty valmiiksi. Nyt voitte jättää arvion.';
    default:
      return 'Lainaustapahtumaa ei ole vielä aloitettu.';
  }
}

export function nextRequestActions(status: ListingRequestStatus | null, role: 'owner' | 'requester') {
  if (role === 'owner') {
    switch (status) {
      case 'pending':
        return ['accepted', 'declined'] as ListingRequestStatus[];
      case 'accepted':
        return ['pickup_scheduled'] as ListingRequestStatus[];
      case 'pickup_scheduled':
        return ['picked_up'] as ListingRequestStatus[];
      case 'picked_up':
        return ['return_due'] as ListingRequestStatus[];
      case 'returned':
        return ['completed'] as ListingRequestStatus[];
      default:
        return [] as ListingRequestStatus[];
    }
  }

  switch (status) {
    case 'pending':
      return ['cancelled'] as ListingRequestStatus[];
    case 'picked_up':
    case 'return_due':
      return ['returned'] as ListingRequestStatus[];
    default:
      return [] as ListingRequestStatus[];
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

async function createStatusNotification(request: RequestRow, actorId: string, recipientId: string, status: ListingRequestStatus) {
  if (recipientId === actorId) return;

  const eventType = statusToNotificationType(status);
  if (!eventType) return;

  const listingTitle = request.listings?.title || 'Ilmoitus';

  await createNotificationEventSafely({
    actorId,
    body: requestStatusDescription(status),
    data: {
      listingId: request.listing_id,
      requestId: request.id,
      status,
    },
    title: `${listingTitle}: ${requestStatusLabel(status)}`,
    type: eventType,
    userId: recipientId,
  });
}

function statusToNotificationType(status: ListingRequestStatus): NotificationEventType | null {
  switch (status) {
    case 'accepted':
      return 'request_accepted';
    case 'declined':
      return 'request_declined';
    case 'cancelled':
      return 'request_cancelled';
    case 'pickup_scheduled':
      return 'pickup_scheduled';
    case 'picked_up':
      return 'picked_up';
    case 'return_due':
      return 'return_due';
    case 'returned':
      return 'returned';
    case 'completed':
      return 'request_completed';
    case 'pending':
    default:
      return null;
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
