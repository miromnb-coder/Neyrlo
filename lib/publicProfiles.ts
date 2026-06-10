import { getListingImagePublicUrl } from '@/lib/listingImages';
import { listingTypeLabel, type ListingImageSummary, type ListingType } from '@/lib/listings';
import { supabase } from '@/lib/supabase';
import type { NearbyItem } from '@/types/item';

export type PublicProfile = {
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
};

type ListingRow = {
  id: string;
  owner_id: string;
  title: string;
  category_id: string | null;
  listing_type: ListingType;
  price_amount: number | null;
  location_label: string | null;
  location_lat: number | null;
  location_lng: number | null;
  listing_images?: ListingImageSummary[] | null;
  profiles?: {
    display_name?: string | null;
    rating_average?: number | null;
  } | null;
};

type ReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer?: { display_name?: string | null } | null;
};

export type PublicReview = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewerName: string;
};

const publicListingSelect = `
  id,
  owner_id,
  title,
  category_id,
  listing_type,
  price_amount,
  location_label,
  location_lat,
  location_lng,
  profiles!listings_owner_id_fkey(display_name, rating_average),
  listing_images(id, storage_path, sort_order, width, height)
`;

export async function getPublicProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, username, avatar_url, bio, city, rating_average, rating_count, is_verified, created_at')
    .eq('id', userId)
    .single();

  if (error) {
    throw toAppError(error, 'Profiilin lataus ei onnistunut.');
  }

  return data as PublicProfile;
}

export async function getPublicUserListings(userId: string) {
  const { data, error } = await supabase
    .from('listings')
    .select(publicListingSelect)
    .eq('owner_id', userId)
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(30);

  if (error) {
    throw toAppError(error, 'Käyttäjän ilmoitusten lataus ei onnistunut.');
  }

  return (data ?? []).map((row) => mapListingToItem(row as ListingRow));
}

export async function getPublicUserReviews(userId: string) {
  const { data, error } = await supabase
    .from('reviews')
    .select('id, rating, comment, created_at, reviewer:profiles!reviews_reviewer_id_fkey(display_name)')
    .eq('reviewee_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    throw toAppError(error, 'Arvioiden lataus ei onnistunut.');
  }

  return (data ?? []).map((row) => {
    const review = row as ReviewRow;

    return {
      comment: review.comment,
      createdAt: review.created_at,
      id: review.id,
      rating: review.rating,
      reviewerName: review.reviewer?.display_name || 'Neyrlo-käyttäjä',
    } satisfies PublicReview;
  });
}

function mapListingToItem(listing: ListingRow): NearbyItem {
  const images = [...(listing.listing_images ?? [])].sort((a, b) => a.sort_order - b.sort_order);

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
    ownerName: listing.profiles?.display_name || 'Neyrlo-käyttäjä',
    priceLabel: listingTypeLabel(listing.listing_type),
    rating: Number(listing.profiles?.rating_average ?? 0),
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
