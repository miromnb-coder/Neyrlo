import type { User } from '@supabase/supabase-js';

import { getListingImagePublicUrl } from '@/lib/listingImages';
import { supabase } from '@/lib/supabase';
import type { NearbyItem } from '@/types/item';

export type ListingType = 'borrow' | 'rent' | 'swap' | 'free';
export type ListingStatus = 'draft' | 'active' | 'paused' | 'reserved' | 'completed' | 'archived' | 'deleted';

export type CreateDraftListingInput = {
  categoryId?: string | null;
  description?: string | null;
  listingType: ListingType;
  location?: {
    label: string;
    latitude?: number;
    longitude?: number;
  } | null;
  priceAmount?: number | null;
  title: string;
};

export type ListingRecord = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  listing_type: ListingType;
  status: ListingStatus;
  price_amount: number | null;
  price_currency: string;
  location_label: string | null;
  location_lat: number | null;
  location_lng: number | null;
  location_radius_m: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

export type ListingImageSummary = {
  id?: string;
  storage_path: string;
  sort_order: number;
  width?: number | null;
  height?: number | null;
};

export type ListingWithRelations = ListingRecord & {
  image_urls: string[];
  listing_images: ListingImageSummary[];
  owner_name: string;
  owner_rating: number;
};

type ListingRow = ListingRecord & {
  listing_images?: ListingImageSummary[] | null;
  profiles?: {
    display_name?: string | null;
    rating_average?: number | null;
  } | null;
};

const listingSelect = `
  *,
  profiles!listings_owner_id_fkey(display_name, rating_average),
  listing_images(id, storage_path, sort_order, width, height)
`;

export function toListingType(label: string): ListingType {
  switch (label) {
    case 'Vuokraa':
      return 'rent';
    case 'Vaihda':
      return 'swap';
    case 'Ilmainen':
      return 'free';
    case 'Lainaa':
    default:
      return 'borrow';
  }
}

export function listingTypeLabel(type: ListingType) {
  switch (type) {
    case 'rent':
      return 'Vuokraa';
    case 'swap':
      return 'Vaihda';
    case 'free':
      return 'Ilmainen';
    case 'borrow':
    default:
      return 'Lainaa';
  }
}

export function categoryIcon(categoryId?: string | null) {
  switch (categoryId) {
    case 'tools':
      return 'construct-outline';
    case 'outdoors':
      return 'trail-sign-outline';
    case 'travel':
      return 'briefcase-outline';
    case 'electronics':
      return 'camera-outline';
    case 'home':
      return 'home-outline';
    case 'sports':
      return 'football-outline';
    case 'kids':
      return 'happy-outline';
    case 'events':
      return 'sparkles-outline';
    default:
      return 'cube-outline';
  }
}

export function parsePriceAmount(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const normalizedValue = trimmedValue.replace(',', '.').replace(/[€\s]/g, '');
  const numberValue = Number(normalizedValue);

  if (!Number.isFinite(numberValue) || numberValue < 0) {
    return null;
  }

  return numberValue;
}

export async function createDraftListing(input: CreateDraftListingInput) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw toAppError(userError, 'Kirjautuneen käyttäjän tarkistus ei onnistunut.');
  }

  if (!user) {
    throw new Error('Kirjaudu sisään ennen ilmoituksen luomista.');
  }

  await ensureCurrentUserProfile(user);

  const title = input.title.trim();

  if (title.length < 2) {
    throw new Error('Lisää ilmoitukselle otsikko.');
  }

  const { data, error } = await supabase
    .from('listings')
    .insert({
      category_id: input.categoryId ?? null,
      description: input.description?.trim() || null,
      listing_type: input.listingType,
      location_label: input.location?.label ?? null,
      location_lat: input.location?.latitude ?? null,
      location_lng: input.location?.longitude ?? null,
      location_radius_m: 500,
      owner_id: user.id,
      price_amount: input.priceAmount ?? null,
      price_currency: 'EUR',
      status: 'draft',
      title,
    })
    .select('*')
    .single();

  if (error) {
    throw toAppError(error, 'Luonnoksen tallennus ei onnistunut.');
  }

  return data as ListingRecord;
}

export async function updateDraftListing(listingId: string, input: CreateDraftListingInput) {
  const title = input.title.trim();

  if (title.length < 2) {
    throw new Error('Lisää ilmoitukselle otsikko.');
  }

  const { data, error } = await supabase
    .from('listings')
    .update({
      category_id: input.categoryId ?? null,
      description: input.description?.trim() || null,
      listing_type: input.listingType,
      location_label: input.location?.label ?? null,
      location_lat: input.location?.latitude ?? null,
      location_lng: input.location?.longitude ?? null,
      price_amount: input.priceAmount ?? null,
      title,
    })
    .eq('id', listingId)
    .eq('status', 'draft')
    .select('*')
    .single();

  if (error) {
    throw toAppError(error, 'Luonnoksen päivitys ei onnistunut.');
  }

  return data as ListingRecord;
}

export async function getListingForReview(listingId: string) {
  const { data, error } = await supabase
    .from('listings')
    .select(listingSelect)
    .eq('id', listingId)
    .single();

  if (error) {
    throw toAppError(error, 'Ilmoituksen lataus ei onnistunut.');
  }

  return mapListingRow(data as ListingRow);
}

export async function getActiveListings(limit = 50) {
  const { data, error } = await supabase
    .from('listings')
    .select(listingSelect)
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw toAppError(error, 'Julkaistujen ilmoitusten lataus ei onnistunut.');
  }

  return (data ?? []).map((row) => mapListingRow(row as ListingRow));
}

export async function publishListing(listingId: string) {
  const listing = await getListingForReview(listingId);
  const missingFields = getPublishMissingFields(listing);

  if (missingFields.length > 0) {
    throw new Error(`Täydennä ennen julkaisua: ${missingFields.join(', ')}.`);
  }

  const { data, error } = await supabase
    .from('listings')
    .update({
      published_at: new Date().toISOString(),
      status: 'active',
    })
    .eq('id', listingId)
    .eq('status', 'draft')
    .select(listingSelect)
    .single();

  if (error) {
    throw toAppError(error, 'Julkaisu ei onnistunut.');
  }

  return mapListingRow(data as ListingRow);
}

export function getPublishMissingFields(listing: ListingWithRelations) {
  const missingFields: string[] = [];

  if (listing.title.trim().length < 2) {
    missingFields.push('otsikko');
  }

  if (!listing.description?.trim()) {
    missingFields.push('kuvaus');
  }

  if (!listing.category_id) {
    missingFields.push('kategoria');
  }

  if (!listing.location_label) {
    missingFields.push('sijainti');
  }

  if (listing.image_urls.length === 0) {
    missingFields.push('vähintään yksi kuva');
  }

  return missingFields;
}

export function listingToNearbyItem(listing: ListingWithRelations): NearbyItem {
  return {
    accentColor: '#F8F2EA',
    availability: 'Vapaa tänään',
    categoryId: listing.category_id ?? undefined,
    distanceKm: 0,
    id: listing.id,
    imageUrl: listing.image_urls[0] ?? 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=420&h=320&fit=crop&auto=format',
    latitude: listing.location_lat ?? undefined,
    locationLabel: listing.location_label ?? undefined,
    longitude: listing.location_lng ?? undefined,
    mode: listing.listing_type,
    ownerName: listing.owner_name,
    priceLabel: listingTypeLabel(listing.listing_type),
    rating: listing.owner_rating,
    title: listing.title,
  };
}

async function ensureCurrentUserProfile(user: User) {
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

function mapListingRow(row: ListingRow): ListingWithRelations {
  const images = [...(row.listing_images ?? [])].sort((a, b) => a.sort_order - b.sort_order);

  return {
    ...row,
    image_urls: images.map((image) => getListingImagePublicUrl(image.storage_path)),
    listing_images: images,
    owner_name: row.profiles?.display_name || 'Neyrlo-käyttäjä',
    owner_rating: Number(row.profiles?.rating_average ?? 0),
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
