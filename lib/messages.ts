import { supabase } from '@/lib/supabase';
import type { ListingRequestStatus } from '@/lib/requests';

export type ConversationSummary = {
  id: string;
  listingId: string | null;
  listingTitle: string;
  listingImageUrl?: string;
  otherUserName: string;
  lastMessageBody: string;
  lastMessageAt: string;
};

export type ConversationMessage = {
  id: string;
  body: string;
  senderId: string;
  createdAt: string;
};

export type ConversationDetails = {
  id: string;
  listingId: string | null;
  listingTitle: string;
  ownerId: string;
  requesterId: string;
  requestId: string | null;
  requestStatus: ListingRequestStatus | null;
  otherUserName: string;
  messages: ConversationMessage[];
};

type MessageRow = {
  id: string;
  body: string;
  sender_id: string;
  created_at: string;
};

type ConversationRow = {
  id: string;
  listing_id: string | null;
  owner_id: string;
  requester_id: string;
  request_id: string | null;
  last_message_at: string | null;
  created_at: string;
  listings?: {
    title?: string | null;
    listing_images?: { storage_path: string; sort_order: number }[] | null;
  } | null;
  messages?: MessageRow[] | null;
  owner?: { display_name?: string | null } | null;
  requester?: { display_name?: string | null } | null;
};

const conversationSelect = `
  id,
  listing_id,
  owner_id,
  requester_id,
  request_id,
  last_message_at,
  created_at,
  listings(title, listing_images(storage_path, sort_order)),
  owner:profiles!conversations_owner_id_fkey(display_name),
  requester:profiles!conversations_requester_id_fkey(display_name),
  messages(id, body, sender_id, created_at)
`;

export async function createContactForListing(params: { listingId: string; message: string }) {
  const messageBody = params.message.trim();

  if (messageBody.length < 1) {
    throw new Error('Kirjoita viesti ennen lähettämistä.');
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw toAppError(userError, 'Kirjautuneen käyttäjän tarkistus ei onnistunut.');
  }

  if (!user) {
    throw new Error('Kirjaudu sisään ennen yhteydenottoa.');
  }

  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .select('id, owner_id, title, status')
    .eq('id', params.listingId)
    .single();

  if (listingError) {
    throw toAppError(listingError, 'Ilmoituksen lataus ei onnistunut.');
  }

  if (!listing || listing.status !== 'active') {
    throw new Error('Tähän ilmoitukseen ei voi vielä ottaa yhteyttä.');
  }

  if (listing.owner_id === user.id) {
    throw new Error('Et voi lähettää pyyntöä omaan ilmoitukseesi.');
  }

  const { data: existingConversation, error: existingConversationError } = await supabase
    .from('conversations')
    .select('id, request_id')
    .eq('listing_id', params.listingId)
    .eq('requester_id', user.id)
    .maybeSingle();

  if (existingConversationError) {
    throw toAppError(existingConversationError, 'Keskustelun tarkistus ei onnistunut.');
  }

  let requestId = existingConversation?.request_id ?? null;

  if (!requestId) {
    const { data: request, error: requestError } = await supabase
      .from('listing_requests')
      .insert({
        listing_id: params.listingId,
        message: messageBody,
        owner_id: listing.owner_id,
        requester_id: user.id,
        status: 'pending',
      })
      .select('id')
      .single();

    if (requestError) {
      throw toAppError(requestError, 'Pyynnön luonti ei onnistunut.');
    }

    requestId = request.id;
  }

  let conversationId = existingConversation?.id;

  if (!conversationId) {
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .insert({
        listing_id: params.listingId,
        owner_id: listing.owner_id,
        request_id: requestId,
        requester_id: user.id,
        status: 'active',
      })
      .select('id')
      .single();

    if (conversationError) {
      throw toAppError(conversationError, 'Keskustelun luonti ei onnistunut.');
    }

    conversationId = conversation.id;
  }

  const { error: messageError } = await supabase.from('messages').insert({
    body: messageBody,
    conversation_id: conversationId,
    sender_id: user.id,
  });

  if (messageError) {
    throw toAppError(messageError, 'Viestin lähetys ei onnistunut.');
  }

  return conversationId;
}

export async function getConversations() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw toAppError(userError, 'Kirjautuneen käyttäjän tarkistus ei onnistunut.');
  }

  if (!user) {
    throw new Error('Kirjaudu sisään nähdäksesi viestit.');
  }

  const { data, error } = await supabase
    .from('conversations')
    .select(conversationSelect)
    .or(`owner_id.eq.${user.id},requester_id.eq.${user.id}`)
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw toAppError(error, 'Keskustelujen lataus ei onnistunut.');
  }

  return (data ?? []).map((row) => mapConversationSummary(row as ConversationRow, user.id));
}

export async function getConversationDetails(conversationId: string) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw toAppError(userError, 'Kirjautuneen käyttäjän tarkistus ei onnistunut.');
  }

  if (!user) {
    throw new Error('Kirjaudu sisään nähdäksesi keskustelun.');
  }

  const { data, error } = await supabase
    .from('conversations')
    .select(conversationSelect)
    .eq('id', conversationId)
    .single();

  if (error) {
    throw toAppError(error, 'Keskustelun lataus ei onnistunut.');
  }

  const row = data as ConversationRow;
  const summary = mapConversationSummary(row, user.id);
  const messages = [...(row.messages ?? [])]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((message) => ({
      body: message.body,
      createdAt: message.created_at,
      id: message.id,
      senderId: message.sender_id,
    }));

  let requestStatus: ListingRequestStatus | null = null;

  if (row.request_id) {
    const { data: request, error: requestError } = await supabase
      .from('listing_requests')
      .select('status')
      .eq('id', row.request_id)
      .maybeSingle();

    if (requestError) {
      throw toAppError(requestError, 'Pyynnön tilan lataus ei onnistunut.');
    }

    requestStatus = (request?.status as ListingRequestStatus | undefined) ?? null;
  }

  return {
    id: row.id,
    listingId: row.listing_id,
    listingTitle: summary.listingTitle,
    messages,
    otherUserName: summary.otherUserName,
    ownerId: row.owner_id,
    requesterId: row.requester_id,
    requestId: row.request_id,
    requestStatus,
  } satisfies ConversationDetails;
}

export async function sendMessage(conversationId: string, body: string) {
  const trimmedBody = body.trim();

  if (trimmedBody.length < 1) {
    throw new Error('Kirjoita viesti ennen lähettämistä.');
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw toAppError(userError, 'Kirjautuneen käyttäjän tarkistus ei onnistunut.');
  }

  if (!user) {
    throw new Error('Kirjaudu sisään ennen viestin lähettämistä.');
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      body: trimmedBody,
      conversation_id: conversationId,
      sender_id: user.id,
    })
    .select('id, body, sender_id, created_at')
    .single();

  if (error) {
    throw toAppError(error, 'Viestin lähetys ei onnistunut.');
  }

  return {
    body: data.body,
    createdAt: data.created_at,
    id: data.id,
    senderId: data.sender_id,
  } satisfies ConversationMessage;
}

function mapConversationSummary(row: ConversationRow, currentUserId: string): ConversationSummary {
  const isOwner = row.owner_id === currentUserId;
  const otherUserName = isOwner ? row.requester?.display_name : row.owner?.display_name;
  const messages = [...(row.messages ?? [])].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const lastMessage = messages[0];
  const listingImages = [...(row.listings?.listing_images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const firstImagePath = listingImages[0]?.storage_path;

  return {
    id: row.id,
    lastMessageAt: row.last_message_at ?? row.created_at,
    lastMessageBody: lastMessage?.body ?? 'Ei viestejä vielä',
    listingId: row.listing_id,
    listingImageUrl: firstImagePath ? getPublicListingImageUrl(firstImagePath) : undefined,
    listingTitle: row.listings?.title || 'Ilmoitus',
    otherUserName: otherUserName || 'Neyrlo-käyttäjä',
  };
}

function getPublicListingImageUrl(storagePath: string) {
  const { data } = supabase.storage.from('listing-images').getPublicUrl(storagePath);
  return data.publicUrl;
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
