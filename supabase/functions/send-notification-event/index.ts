import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type NotificationEvent = {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  sent_at: string | null;
};

type PushToken = { expo_push_token: string };

type ProfilePrefs = {
  notify_messages: boolean | null;
  notify_requests: boolean | null;
  notify_status_updates: boolean | null;
  notify_return_reminders: boolean | null;
};

type RequestBody = {
  eventId?: string;
  messageId?: string;
  requestId?: string;
  status?: string;
};

Deno.serve(async (request) => {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: 'Missing Supabase server environment variables' }, 500);
  }

  const jwt = (request.headers.get('Authorization') ?? '').replace('Bearer ', '').trim();
  if (!jwt) return json({ error: 'Missing authorization token' }, 401);

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data: userData, error: userError } = await supabase.auth.getUser(jwt);

  if (userError || !userData.user) return json({ error: 'Invalid authorization token' }, 401);

  const body = await request.json().catch(() => ({} as RequestBody));
  const eventResult = await resolveNotificationEvent(supabase, body as RequestBody, userData.user.id);

  if ('error' in eventResult) return json({ error: eventResult.error }, eventResult.status);

  const event = eventResult.event;
  if (event.sent_at) return json({ sent: 0, skipped: 'already_sent' }, 200);

  const { data: prefs } = await supabase
    .from('profiles')
    .select('notify_messages, notify_requests, notify_status_updates, notify_return_reminders')
    .eq('id', event.user_id)
    .maybeSingle<ProfilePrefs>();

  if (!shouldSendForPreferences(event.type, prefs ?? null)) {
    await markEventSent(supabase, event.id);
    return json({ sent: 0, skipped: 'disabled_by_preferences' }, 200);
  }

  const { data: tokens, error: tokenError } = await supabase
    .from('push_tokens')
    .select('expo_push_token')
    .eq('user_id', event.user_id)
    .eq('enabled', true)
    .returns<PushToken[]>();

  if (tokenError) {
    await supabase.from('notification_events').update({ send_error: tokenError.message }).eq('id', event.id);
    return json({ error: tokenError.message }, 500);
  }

  const messages = (tokens ?? []).map((token) => ({
    to: token.expo_push_token,
    sound: 'default',
    title: event.title,
    body: event.body,
    data: event.data ?? {},
  }));

  if (messages.length === 0) {
    await markEventSent(supabase, event.id);
    return json({ sent: 0, skipped: 'no_tokens' }, 200);
  }

  const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages),
  });

  const result = await expoResponse.json().catch(() => null);

  if (!expoResponse.ok) {
    await supabase.from('notification_events').update({ send_error: JSON.stringify(result) }).eq('id', event.id);
    return json({ result, sent: 0 }, 502);
  }

  await markEventSent(supabase, event.id);
  return json({ result, sent: messages.length }, 200);
});

async function resolveNotificationEvent(
  supabase: ReturnType<typeof createClient>,
  body: RequestBody,
  actorId: string,
): Promise<{ event: NotificationEvent } | { error: string; status: number }> {
  let query = supabase
    .from('notification_events')
    .select('id, user_id, actor_id, type, title, body, data, sent_at')
    .order('created_at', { ascending: false })
    .limit(1);

  if (body.eventId) {
    query = query.eq('id', body.eventId);
  } else if (body.messageId) {
    query = query.eq('type', 'message').eq('data->>messageId', body.messageId);
  } else if (body.requestId && body.status) {
    query = query.eq('data->>requestId', body.requestId).eq('data->>status', body.status);
  } else {
    return { error: 'eventId, messageId, or requestId + status is required', status: 400 };
  }

  const { data, error } = await query.returns<NotificationEvent[]>();
  if (error) return { error: error.message, status: 500 };

  const event = data?.[0];
  if (!event) return { error: 'Notification event not found', status: 404 };

  if (event.actor_id && event.actor_id !== actorId) {
    return { error: 'Not allowed to send this notification event', status: 403 };
  }

  return { event };
}

function shouldSendForPreferences(type: string, prefs: ProfilePrefs | null) {
  if (!prefs) return true;
  if (type === 'message') return prefs.notify_messages !== false;
  if (type === 'request') return prefs.notify_requests !== false;
  if (type === 'return_reminder') return prefs.notify_return_reminders !== false;
  return prefs.notify_status_updates !== false;
}

async function markEventSent(supabase: ReturnType<typeof createClient>, eventId: string) {
  await supabase
    .from('notification_events')
    .update({ sent_at: new Date().toISOString(), send_error: null })
    .eq('id', eventId);
}

function json(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    status,
  });
}
