import { supabase } from '@/lib/supabase';

export type NotificationEventType =
  | 'message'
  | 'request'
  | 'request_accepted'
  | 'request_declined'
  | 'request_cancelled'
  | 'request_completed'
  | 'pickup_scheduled'
  | 'picked_up'
  | 'return_due'
  | 'returned'
  | 'return_reminder';

export type NotificationEvent = {
  id: string;
  userId: string;
  actorId: string | null;
  type: NotificationEventType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  readAt: string | null;
  sentAt: string | null;
  sendError: string | null;
  createdAt: string;
};

type NotificationEventRow = {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: NotificationEventType;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  read_at: string | null;
  sent_at: string | null;
  send_error: string | null;
  created_at: string;
};

type PushDispatchInput =
  | string
  | { eventId: string }
  | { messageId: string }
  | { requestId: string; status: string };

export async function createNotificationEvent(input: {
  actorId?: string | null;
  body: string;
  data?: Record<string, unknown>;
  sendPush?: boolean;
  title: string;
  type: NotificationEventType;
  userId: string;
}) {
  const { data, error } = await supabase
    .from('notification_events')
    .insert({
      actor_id: input.actorId ?? null,
      body: input.body,
      data: input.data ?? {},
      title: input.title,
      type: input.type,
      user_id: input.userId,
    })
    .select('id, user_id, actor_id, type, title, body, data, read_at, sent_at, send_error, created_at')
    .single();

  if (error) {
    throw toAppError(error, 'Ilmoituksen luonti ei onnistunut.');
  }

  const event = mapNotificationEvent(data as NotificationEventRow);

  if (input.sendPush !== false) {
    await sendNotificationEventPush({ eventId: event.id });
  }

  return event;
}

export async function createNotificationEventSafely(input: Parameters<typeof createNotificationEvent>[0]) {
  try {
    return await createNotificationEvent(input);
  } catch (error) {
    console.warn('Notification event failed', error);
    return null;
  }
}

export async function sendNotificationEventPush(input: PushDispatchInput) {
  const body = typeof input === 'string' ? { eventId: input } : input;
  const { error } = await supabase.functions.invoke('send-notification-event', { body });

  if (error) {
    throw toAppError(error, 'Push-ilmoituksen lähetys ei onnistunut.');
  }
}

export async function sendNotificationEventPushSafely(input: PushDispatchInput) {
  try {
    await sendNotificationEventPush(input);
  } catch (error) {
    console.warn('Push notification dispatch failed', error);
  }
}

export async function getMyNotificationEvents(limit = 50) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw toAppError(userError, 'Kirjautuneen käyttäjän tarkistus ei onnistunut.');
  }

  if (!user) {
    throw new Error('Kirjaudu sisään nähdäksesi ilmoitukset.');
  }

  const { data, error } = await supabase
    .from('notification_events')
    .select('id, user_id, actor_id, type, title, body, data, read_at, sent_at, send_error, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw toAppError(error, 'Ilmoitusten lataus ei onnistunut.');
  }

  return (data ?? []).map((row) => mapNotificationEvent(row as NotificationEventRow));
}

export async function markAllNotificationEventsRead() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw toAppError(userError, 'Kirjautuneen käyttäjän tarkistus ei onnistunut.');
  }

  if (!user) {
    throw new Error('Kirjaudu sisään muokataksesi ilmoituksia.');
  }

  const { error } = await supabase
    .from('notification_events')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('read_at', null);

  if (error) {
    throw toAppError(error, 'Ilmoitusten lukukuittaus ei onnistunut.');
  }
}

export async function markNotificationEventRead(eventId: string) {
  const { error } = await supabase
    .from('notification_events')
    .update({ read_at: new Date().toISOString() })
    .eq('id', eventId);

  if (error) {
    throw toAppError(error, 'Ilmoituksen lukukuittaus ei onnistunut.');
  }
}

function mapNotificationEvent(row: NotificationEventRow): NotificationEvent {
  return {
    actorId: row.actor_id,
    body: row.body,
    createdAt: row.created_at,
    data: row.data ?? {},
    id: row.id,
    readAt: row.read_at,
    sendError: row.send_error,
    sentAt: row.sent_at,
    title: row.title,
    type: row.type,
    userId: row.user_id,
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
