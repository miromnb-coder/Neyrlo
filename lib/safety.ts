import { supabase } from '@/lib/supabase';

export type ReviewInput = {
  comment?: string;
  listingId?: string | null;
  rating: number;
  revieweeId: string;
};

export type ReportReason = 'spam' | 'scam' | 'inappropriate' | 'unsafe' | 'other';

export async function createReview(input: ReviewInput) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw toAppError(userError, 'Kirjautuneen käyttäjän tarkistus ei onnistunut.');
  }

  if (!user) {
    throw new Error('Kirjaudu sisään ennen arvion jättämistä.');
  }

  if (user.id === input.revieweeId) {
    throw new Error('Et voi arvioida itseäsi.');
  }

  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    throw new Error('Valitse arvosana 1–5.');
  }

  const { error } = await supabase.from('reviews').insert({
    comment: input.comment?.trim() || null,
    listing_id: input.listingId ?? null,
    rating: input.rating,
    reviewee_id: input.revieweeId,
    reviewer_id: user.id,
  });

  if (error) {
    throw toAppError(error, 'Arvion tallennus ei onnistunut.');
  }
}

export async function reportListing(params: { details?: string; listingId: string; reason: ReportReason; reportedUserId?: string | null }) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw toAppError(userError, 'Kirjautuneen käyttäjän tarkistus ei onnistunut.');
  }

  if (!user) {
    throw new Error('Kirjaudu sisään ennen raportointia.');
  }

  const { error } = await supabase.from('reports').insert({
    details: params.details?.trim() || null,
    listing_id: params.listingId,
    reason: params.reason,
    reported_user_id: params.reportedUserId ?? null,
    reporter_id: user.id,
  });

  if (error) {
    throw toAppError(error, 'Raportin lähetys ei onnistunut.');
  }
}

export async function blockUser(blockedUserId: string) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw toAppError(userError, 'Kirjautuneen käyttäjän tarkistus ei onnistunut.');
  }

  if (!user) {
    throw new Error('Kirjaudu sisään ennen käyttäjän blokkaamista.');
  }

  if (user.id === blockedUserId) {
    throw new Error('Et voi blokata itseäsi.');
  }

  const { error } = await supabase.from('user_blocks').insert({
    blocked_id: blockedUserId,
    blocker_id: user.id,
  });

  if (error && !String(error.message).toLowerCase().includes('duplicate')) {
    throw toAppError(error, 'Käyttäjän blokkaus ei onnistunut.');
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
