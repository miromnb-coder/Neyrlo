import { getListingImagePublicUrl } from '@/lib/listingImages';
import { listingTypeLabel, type ListingImageSummary, type ListingType, type ListingWithRelations } from '@/lib/listings';
import { supabase } from '@/lib/supabase';
import type { NearbyItem } from '@/types/item';

type FavoriteListingRow = {
  listing_id: string;
  listings?: {
    id: string;
    owner_id: string;
    title: string;
    description: string | null;
    category_id: string | null;
    listing_type: ListingType;
    status: 'draft' | 'active' | 'paused' | 'reserved' | 'completed' | 'archived' | 'deleted';
    price_amount: number | null;
    price_currency: string;
    location_label: string | null;
    location_lat: number | null;
    location_lng: number | null;
    location_radius_m: number;
    created_at: string;
    updated_at: string;
    published_at: string | null;
    listing_images?: ListingImageSummary[] | null;
    profiles?: {
      display_name?: string | null;
      rating_average?: number | null;
    } | null;
  } | null;
};

const favoriteSelect = `
  listing_id,
  listings(
    *,
    profiles!listings_owner_id_fkey(display_name, rating_average),
    listing_images(id, storage_path, sort_order, width, height)
  )
`;

export async function isListingFavorite(listingId: string) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw toAppError(userError, 'Kirjautuneen käyttäjän tarkistus ei onnistunut.');
  }

  if (!user) {
    return false;
  }

  const { data, error } = await supabase
    .from('favorites')
    .select('listing_id')
    .eq('user_id', user.id)
    .eq('listing_id', listingId)
    .maybeSingle();

  if (error) {
    throw toAppError(error, 'Suosikin tarkistus ei onnistunut.');
  }

  return !!data;
}

export async function toggleFavorite(listingId: string) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw toAppError(userError, 'Kirjautuneen käyttäjän tarkistus ei onnistunut.');
  }

  if (!user) {
    throw new Error('Kirjaudu sisään tallentaaksesi suosikkeja.');
  }

  const favorite = await isListingFavorite(listingId);

  if (favorite) {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('listing_id', listingId);

    if (error) {
      throw toAppError(error, 'Suosikin poistaminen ei onnistunut.');
    }

    return false;
  }

  const { error } = await supabase.from('favorites').insert({
    listing_id: listingId,
    user_id: user.id,
  });

  if (error) {
    throw toAppError(error, 'Suosikin lisääminen ei onnistunut.');
  }

  return true;
}

export async function getFavoriteListingIds() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw toAppError(userError, 'Kirjautuneen käyttäjän tarkistus ei onnistunut.');
  }

  if (!user) {
    return new Set<string>();
  }

  const { data, error } = await supabase
    .from('favorites')
    .select('listing_id')
    .eq('user_id', user.id);

  if (error) {
    throw toAppError(error, 'Suosikkien lataus ei onnistunut.');
  }

  return new Set((data ?? []).map((favorite) => favorite.listing_id as string));
}

export async function getMyFavoriteListings() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw toAppError(userError, 'Kirjautuneen käyttäjän tarkistus ei onnistunut.');
  }

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('favorites')
    .select(favoriteSelect)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw toAppError(error, 'Suosikkien lataus ei onnistunut.');
  }

  return (data ?? [])
    .map((row) => mapFavoriteListing(row as FavoriteListingRow))
    .filter(Boolean) as NearbyItem[];
}

function mapFavoriteListing(row: FavoriteListingRow): NearbyItem | null {
  const listing = row.listings;

  if (!listing || listing.status !== 'active') {
    return null;
  }

  const images = [...(listing.listing_images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const ownerName = listing.profiles?.display_name || 'Neyrlo-käyttäjä';
  const ownerRating = Number(listing.profiles?.rating_average ?? 0);

  return {
    accentColor: '#F8F2EA',
    availability: 'Vapaa tänään',
    categoryId: listing.category_id ?? undefined,
    distanceKm: 0,
    id: listing.id,
    imageUrl: images[0] ? getListingImagePublicUrl(images[0].storage_path) : 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=420&h=320&fit=crop&auto=format',
    latitude: listing.location_lat ?? undefined,
    locationLabel: listing.location_label ?? undefined,
    longitude: listing.location_lng ?? undefined,
    mode: listing.listing_type,
    ownerName,
    priceLabel: listingTypeLabel(listing.listing_type),
    rating: ownerRating,
    title: listing.title,
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
