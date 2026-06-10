import * as ImagePicker from 'expo-image-picker';

import { supabase } from '@/lib/supabase';

export type SelectedProfileImage = {
  height?: number;
  mimeType: string;
  uri: string;
  width?: number;
};

export async function pickProfileImage(): Promise<SelectedProfileImage | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    throw new Error('Kuvien käyttöoikeutta ei annettu. Voit sallia kuvat puhelimen asetuksista.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: true,
    aspect: [1, 1],
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.72,
  });

  if (result.canceled || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];

  return {
    height: asset.height,
    mimeType: asset.mimeType ?? mimeTypeFromUri(asset.uri),
    uri: asset.uri,
    width: asset.width,
  };
}

export async function uploadCurrentUserProfileImage(image: SelectedProfileImage) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw toAppError(userError, 'Kirjautuneen käyttäjän tarkistus ei onnistunut.');
  }

  if (!user) {
    throw new Error('Kirjaudu sisään päivittääksesi profiilikuvan.');
  }

  const extension = extensionFromMimeType(image.mimeType);
  const storagePath = `${user.id}/avatar-${Date.now()}.${extension}`;
  const response = await fetch(image.uri);
  const blob = await response.blob();

  const { error: uploadError } = await supabase.storage
    .from('profile-images')
    .upload(storagePath, blob, {
      contentType: image.mimeType,
      upsert: false,
    });

  if (uploadError) {
    throw toAppError(uploadError, 'Profiilikuvan lataus ei onnistunut.');
  }

  const { data } = supabase.storage.from('profile-images').getPublicUrl(storagePath);

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: data.publicUrl })
    .eq('id', user.id);

  if (updateError) {
    throw toAppError(updateError, 'Profiilikuvan tallennus profiiliin ei onnistunut.');
  }

  return data.publicUrl;
}

function mimeTypeFromUri(uri: string) {
  const lowercaseUri = uri.toLowerCase();

  if (lowercaseUri.endsWith('.png')) return 'image/png';
  if (lowercaseUri.endsWith('.webp')) return 'image/webp';
  if (lowercaseUri.endsWith('.heic')) return 'image/heic';
  if (lowercaseUri.endsWith('.heif')) return 'image/heif';

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
