import { supabase } from '@/lib/supabase';

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
    throw userError;
  }

  if (!user) {
    throw new Error('Kirjaudu sisään ennen ilmoituksen luomista.');
  }

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
    throw error;
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
    throw error;
  }

  return data as ListingRecord;
}

export async function publishListing(listingId: string) {
  const { data, error } = await supabase
    .from('listings')
    .update({
      published_at: new Date().toISOString(),
      status: 'active',
    })
    .eq('id', listingId)
    .eq('status', 'draft')
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as ListingRecord;
}
