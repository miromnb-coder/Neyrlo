import { getListingImagePublicUrl } from '@/lib/listingImages';
import { getPublishMissingFields, type CreateDraftListingInput, type ListingImageSummary, type ListingStatus, type ListingType, type ListingWithRelations } from '@/lib/listings';
import { supabase } from '@/lib/supabase';

type ListingRow = {
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

export async function getMyListings() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw toAppError(userError, 'Kirjautuneen käyttäjän tarkistus ei onnistunut.');
  }

  if (!user) {
    throw new Error('Kirjaudu sisään nähdäksesi omat ilmoitukset.');
  }

  const { data, error } = await supabase
    .from('listings')
    .select(listingSelect)
    .eq('owner_id', user.id)
    .neq('status', 'deleted')
    .order('updated_at', { ascending: false });

  if (error) {
    throw toAppError(error, 'Omien ilmoitusten lataus ei onnistunut.');
  }

  return (data ?? []).map((row) => mapListingRow(row as ListingRow));
}

export async function getMyListingForEdit(listingId: string) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw toAppError(userError, 'Kirjautuneen käyttäjän tarkistus ei onnistunut.');
  }

  if (!user) {
    throw new Error('Kirjaudu sisään muokataksesi ilmoitusta.');
  }

  const { data, error } = await supabase
    .from('listings')
    .select(listingSelect)
    .eq('id', listingId)
    .eq('owner_id', user.id)
    .single();

  if (error) {
    throw toAppError(error, 'Ilmoituksen lataus ei onnistunut.');
  }

  return mapListingRow(data as ListingRow);
}

export async function updateMyListingDetails(listingId: string, input: CreateDraftListingInput) {
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
    .select(listingSelect)
    .single();

  if (error) {
    throw toAppError(error, 'Ilmoituksen päivitys ei onnistunut.');
  }

  return mapListingRow(data as ListingRow);
}

export async function updateMyListingStatus(listingId: string, status: Exclude<ListingStatus, 'active'>) {
  const payload: { deleted_at?: string | null; status: ListingStatus } = { status };

  if (status === 'deleted') {
    payload.deleted_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('listings')
    .update(payload)
    .eq('id', listingId)
    .select(listingSelect)
    .single();

  if (error) {
    throw toAppError(error, 'Ilmoituksen tilan päivitys ei onnistunut.');
  }

  return mapListingRow(data as ListingRow);
}

export async function activateMyListing(listingId: string) {
  const listing = await getMyListingForEdit(listingId);
  const missingFields = getPublishMissingFields(listing);

  if (missingFields.length > 0) {
    throw new Error(`Täydennä ennen aktivointia: ${missingFields.join(', ')}.`);
  }

  const { data, error } = await supabase
    .from('listings')
    .update({
      published_at: listing.published_at ?? new Date().toISOString(),
      status: 'active',
    })
    .eq('id', listingId)
    .select(listingSelect)
    .single();

  if (error) {
    throw toAppError(error, 'Ilmoituksen aktivointi ei onnistunut.');
  }

  return mapListingRow(data as ListingRow);
}

export function statusLabel(status: ListingStatus) {
  switch (status) {
    case 'draft':
      return 'Luonnos';
    case 'active':
      return 'Julkaistu';
    case 'paused':
      return 'Keskeytetty';
    case 'reserved':
      return 'Varattu';
    case 'completed':
      return 'Valmis';
    case 'archived':
      return 'Arkistoitu';
    case 'deleted':
      return 'Poistettu';
    default:
      return status;
  }
}

export function mapListingRow(row: ListingRow): ListingWithRelations {
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
