import type { User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

export type ProfileRecord = {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  rating_average: number;
  rating_count: number;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
};

export async function getCurrentProfile() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw toAppError(userError, 'Kirjautuneen käyttäjän tarkistus ei onnistunut.');
  }

  if (!user) {
    throw new Error('Kirjaudu sisään nähdäksesi profiilin.');
  }

  await ensureCurrentUserProfile(user);

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    throw toAppError(error, 'Profiilin lataus ei onnistunut.');
  }

  return data as ProfileRecord;
}

export async function updateCurrentProfile(input: { bio?: string | null; city?: string | null; displayName?: string | null }) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw toAppError(userError, 'Kirjautuneen käyttäjän tarkistus ei onnistunut.');
  }

  if (!user) {
    throw new Error('Kirjaudu sisään päivittääksesi profiilin.');
  }

  await ensureCurrentUserProfile(user);

  const { data, error } = await supabase
    .from('profiles')
    .update({
      bio: input.bio?.trim() || null,
      city: input.city?.trim() || null,
      display_name: input.displayName?.trim() || null,
    })
    .eq('id', user.id)
    .select('*')
    .single();

  if (error) {
    throw toAppError(error, 'Profiilin päivitys ei onnistunut.');
  }

  return data as ProfileRecord;
}

export async function ensureCurrentUserProfile(user: User) {
  const { data: existingProfile, error: selectError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (selectError) {
    throw toAppError(selectError, 'Käyttäjäprofiilin tarkistus ei onnistunut.');
  }

  if (existingProfile) {
    return;
  }

  const displayName =
    user.user_metadata?.display_name ||
    user.user_metadata?.full_name ||
    user.email?.split('@')[0] ||
    'Neyrlo-käyttäjä';

  const { error: insertError } = await supabase.from('profiles').insert({
    display_name: displayName,
    id: user.id,
  });

  if (insertError) {
    throw toAppError(insertError, 'Käyttäjäprofiilin luonti ei onnistunut.');
  }
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
