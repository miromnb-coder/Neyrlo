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
  createdAt: string;
};

type RequestRow = {
  id: string;
  listing_id: string;
  requester_id: string;
  owner_id: string;
  status: ListingRequestStatus;
  message: string | null;
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
  const { data: request, error: requestError } = await supabase
    .from('listing_requests')
    .update({ status })
    .eq('id', requestId)
    .select('id, listing_id, requester_id, owner_id, status, message, created_at, listings(title), owner:profiles!listing_requests_owner_id_fkey(display_name), requester:profiles!listing_requests_requester_id_fkey(display_name)')
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

function mapRequest(row: RequestRow, currentUserId: string): ListingRequestSummary {
  const role = row.owner_id === currentUserId ? 'owner' : 'requester';
  const otherUserName = role === 'owner' ? row.requester?.display_name : row.owner?.display_name;

  return {
    createdAt: row.created_at,
    id: row.id,
    listingId: row.listing_id,
    listingTitle: row.listings?.title || 'Ilmoitus',
    message: row.message,
    otherUserName: otherUserName || 'Neyrlo-käyttäjä',
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
