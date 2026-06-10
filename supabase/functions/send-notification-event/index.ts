import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type NotificationEvent = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
};

type PushToken = {
  expo_push_token: string;
};

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Missing Supabase server environment variables' }), { status: 500 });
  }

  const { eventId } = await request.json().catch(() => ({ eventId: null }));

  if (!eventId || typeof eventId !== 'string') {
    return new Response(JSON.stringify({ error: 'eventId is required' }), { status: 400 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: event, error: eventError } = await supabase
    .from('notification_events')
    .select('id, user_id, title, body, data')
    .eq('id', eventId)
    .single<NotificationEvent>();

  if (eventError || !event) {
    return new Response(JSON.stringify({ error: eventError?.message ?? 'Notification event not found' }), { status: 404 });
  }

  const { data: tokens, error: tokenError } = await supabase
    .from('push_tokens')
    .select('expo_push_token')
    .eq('user_id', event.user_id)
    .eq('enabled', true)
    .returns<PushToken[]>();

  if (tokenError) {
    return new Response(JSON.stringify({ error: tokenError.message }), { status: 500 });
  }

  const messages = (tokens ?? []).map((token) => ({
    to: token.expo_push_token,
    sound: 'default',
    title: event.title,
    body: event.body,
    data: event.data ?? {},
  }));

  if (messages.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), { status: 200 });
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

  const result = await expoResponse.json();

  return new Response(JSON.stringify({ result, sent: messages.length }), {
    headers: { 'Content-Type': 'application/json' },
    status: expoResponse.ok ? 200 : 502,
  });
});
