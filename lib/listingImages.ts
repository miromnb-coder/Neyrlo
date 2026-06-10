import * as ImagePicker from 'expo-image-picker';

import { supabase } from '@/lib/supabase';

export type SelectedListingImage = {
  assetId?: string | null;
  fileName: string;
  height?: number;
  mimeType: string;
  uri: string;
  width?: number;
};

export type ListingImageRecord = {
  id: string;
  listing_id: string;
  storage_path: string;
  sort_order: number;
  width: number | null;
  height: number | null;
  created_at: string;
};

const MAX_IMAGES = 10;

export async function pickListingImages(currentCount = 0): Promise<SelectedListingImage[]> {
  const remainingSlots = Math.max(MAX_IMAGES - currentCount, 0);

  if (remainingSlots <= 0) {
    throw new Error('Voit lisätä enintään 10 kuvaa.');
  }

  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    throw new Error('Kuvien käyttöoikeutta ei annettu. Voit sallia kuvat puhelimen asetuksista.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    allowsMultipleSelection: true,
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    orderedSelection: true,
    quality: 0.72,
    selectionLimit: remainingSlots,
  });

  if (result.canceled) {
    return [];
  }

  return result.assets.slice(0, remainingSlots).map((asset, index) => {
    const mimeType = asset.mimeType ?? mimeTypeFromUri(asset.uri);
    const extension = extensionFromMimeType(mimeType);

    return {
      assetId: asset.assetId,
      fileName: asset.fileName ?? `listing-image-${Date.now()}-${index}.${extension}`,
      height: asset.height,
      mimeType,
      uri: asset.uri,
      width: asset.width,
    };
  });
}

export async function uploadListingImage(params: {
  image: SelectedListingImage;
  listingId: string;
  sortOrder: number;
  userId: string;
}) {
  const { image, listingId, sortOrder, userId } = params;
  const extension = extensionFromMimeType(image.mimeType);
  const storagePath = `${userId}/${listingId}/${Date.now()}-${sortOrder}.${extension}`;

  const response = await fetch(image.uri);
  const blob = await response.blob();

  const { error: uploadError } = await supabase.storage
    .from('listing-images')
    .upload(storagePath, blob, {
      contentType: image.mimeType,
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data, error } = await supabase
    .from('listing_images')
    .insert({
      height: image.height ?? null,
      listing_id: listingId,
      sort_order: sortOrder,
      storage_path: storagePath,
      width: image.width ?? null,
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as ListingImageRecord;
}

export async function uploadListingImages(params: {
  images: SelectedListingImage[];
  listingId: string;
  startSortOrder?: number;
  userId: string;
}) {
  const { images, listingId, startSortOrder = 0, userId } = params;
  const uploadedImages: ListingImageRecord[] = [];

  for (const [index, image] of images.entries()) {
    const uploadedImage = await uploadListingImage({
      image,
      listingId,
      sortOrder: startSortOrder + index,
      userId,
    });

    uploadedImages.push(uploadedImage);
  }

  return uploadedImages;
}

export async function deleteListingImage(image: Pick<ListingImageRecord, 'id' | 'storage_path'>) {
  const { error: storageError } = await supabase.storage.from('listing-images').remove([image.storage_path]);

  if (storageError) {
    throw storageError;
  }

  const { error } = await supabase.from('listing_images').delete().eq('id', image.id);

  if (error) {
    throw error;
  }
}

export async function reorderListingImages(images: Pick<ListingImageRecord, 'id'>[]) {
  for (const [index, image] of images.entries()) {
    const { error } = await supabase.from('listing_images').update({ sort_order: index }).eq('id', image.id);

    if (error) {
      throw error;
    }
  }
}

export async function setListingCoverImage(images: ListingImageRecord[], imageId: string) {
  const selectedImage = images.find((image) => image.id === imageId);

  if (!selectedImage) {
    throw new Error('Kuvaa ei löytynyt.');
  }

  const nextImages = [selectedImage, ...images.filter((image) => image.id !== imageId)];
  await reorderListingImages(nextImages);
  return nextImages.map((image, index) => ({ ...image, sort_order: index }));
}

export function moveListingImage(images: ListingImageRecord[], imageId: string, direction: 'down' | 'up') {
  const currentIndex = images.findIndex((image) => image.id === imageId);

  if (currentIndex < 0) {
    return images;
  }

  const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

  if (nextIndex < 0 || nextIndex >= images.length) {
    return images;
  }

  const nextImages = [...images];
  const [image] = nextImages.splice(currentIndex, 1);
  nextImages.splice(nextIndex, 0, image);

  return nextImages.map((item, index) => ({ ...item, sort_order: index }));
}

export function getListingImagePublicUrl(storagePath: string) {
  const { data } = supabase.storage.from('listing-images').getPublicUrl(storagePath);
  return data.publicUrl;
}

function mimeTypeFromUri(uri: string) {
  const lowercaseUri = uri.toLowerCase();

  if (lowercaseUri.endsWith('.png')) {
    return 'image/png';
  }

  if (lowercaseUri.endsWith('.webp')) {
    return 'image/webp';
  }

  if (lowercaseUri.endsWith('.heic')) {
    return 'image/heic';
  }

  if (lowercaseUri.endsWith('.heif')) {
    return 'image/heif';
  }

  return 'image/jpeg';
}

function extensionFromMimeType(mimeType: string) {
  switch (mimeType) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/heic':
      return 'heic';
    case 'image/heif':
      return 'heif';
    case 'image/jpeg':
    default:
      return 'jpg';
  }
}
