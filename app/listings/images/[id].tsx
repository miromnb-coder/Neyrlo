import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/lib/auth';
import {
  deleteListingImage,
  getListingImagePublicUrl,
  moveListingImage,
  pickListingImages,
  reorderListingImages,
  setListingCoverImage,
  uploadListingImages,
  type ListingImageRecord,
} from '@/lib/listingImages';
import { getMyListingForEdit } from '@/lib/myListings';

const BACKGROUND = '#FFFDF7';
const GREEN = '#55633F';
const GREEN_DARK = '#3F4E2F';
const TEXT = '#20251F';
const MUTED = '#77736B';
const BORDER = 'rgba(64, 80, 48, 0.13)';
const CARD = 'rgba(255, 253, 247, 0.94)';

export default function ListingImagesScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const params = useLocalSearchParams<{ id?: string }>();
  const listingId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [listingTitle, setListingTitle] = useState('Ilmoitus');
  const [images, setImages] = useState<ListingImageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const coverImage = images[0];

  const loadImages = useCallback(async () => {
    if (!listingId) {
      setFeedback('Ilmoituksen tunniste puuttuu.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const listing = await getMyListingForEdit(listingId);
      setListingTitle(listing.title);
      setImages(
        listing.listing_images
          .map((image) => ({
            created_at: '',
            height: image.height ?? null,
            id: image.id ?? image.storage_path,
            listing_id: listing.id,
            sort_order: image.sort_order,
            storage_path: image.storage_path,
            width: image.width ?? null,
          }))
          .sort((a, b) => a.sort_order - b.sort_order),
      );
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Kuvien lataus ei onnistunut.');
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    void loadImages();
  }, [loadImages]);

  const addImages = async () => {
    if (!listingId || busy) return;

    if (!session?.user.id) {
      setFeedback('Kirjaudu sisään lisätäksesi kuvia.');
      return;
    }

    setBusy(true);
    setFeedback(null);

    try {
      const selectedImages = await pickListingImages(images.length);

      if (selectedImages.length === 0) return;

      const uploaded = await uploadListingImages({
        images: selectedImages,
        listingId,
        startSortOrder: images.length,
        userId: session.user.id,
      });

      setImages((current) => [...current, ...uploaded].sort((a, b) => a.sort_order - b.sort_order));
      setFeedback(`${uploaded.length} kuva${uploaded.length === 1 ? '' : 'a'} lisätty.`);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Kuvien lisäys ei onnistunut.');
    } finally {
      setBusy(false);
    }
  };

  const setCover = async (imageId: string) => {
    if (busy) return;

    setBusy(true);
    setFeedback(null);

    try {
      const nextImages = await setListingCoverImage(images, imageId);
      setImages(nextImages);
      setFeedback('Pääkuva päivitetty.');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Pääkuvan päivitys ei onnistunut.');
    } finally {
      setBusy(false);
    }
  };

  const moveImage = async (imageId: string, direction: 'down' | 'up') => {
    if (busy) return;

    const nextImages = moveListingImage(images, imageId, direction);

    if (nextImages === images) return;

    setBusy(true);
    setFeedback(null);

    try {
      await reorderListingImages(nextImages);
      setImages(nextImages);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Järjestyksen päivitys ei onnistunut.');
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = (image: ListingImageRecord) => {
    if (images.length <= 1) {
      setFeedback('Ilmoituksessa pitää olla vähintään yksi kuva ennen julkaisua. Lisää uusi kuva ennen viimeisen poistamista.');
      return;
    }

    Alert.alert('Poista kuva?', 'Kuva poistetaan ilmoituksesta ja tallennuksesta.', [
      { style: 'cancel', text: 'Peruuta' },
      {
        onPress: async () => {
          setBusy(true);
          setFeedback(null);

          try {
            await deleteListingImage(image);
            const remainingImages = images.filter((item) => item.id !== image.id).map((item, index) => ({ ...item, sort_order: index }));
            await reorderListingImages(remainingImages);
            setImages(remainingImages);
            setFeedback('Kuva poistettu.');
          } catch (error) {
            setFeedback(error instanceof Error ? error.message : 'Kuvan poisto ei onnistunut.');
          } finally {
            setBusy(false);
          }
        },
        style: 'destructive',
        text: 'Poista',
      },
    ]);
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable accessibilityLabel="Takaisin" onPress={() => router.back()} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
          <Ionicons color={TEXT} name="chevron-back" size={27} />
        </Pressable>
        <View style={styles.headerText}>
          <Text allowFontScaling={false} style={styles.pageTitle}>Kuvat</Text>
          <Text allowFontScaling={false} numberOfLines={1} style={styles.subtitle}>{listingTitle}</Text>
        </View>
        <Pressable accessibilityLabel="Lisää kuvia" onPress={addImages} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
          {busy ? <ActivityIndicator color={GREEN_DARK} size="small" /> : <Ionicons color={GREEN_DARK} name="add" size={24} />}
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={GREEN} size="small" />
          <Text allowFontScaling={false} style={styles.loadingText}>Ladataan kuvia...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {coverImage ? (
            <View style={styles.coverCard}>
              <Image source={{ uri: getListingImagePublicUrl(coverImage.storage_path) }} style={styles.coverImage} />
              <View style={styles.coverBadge}>
                <Ionicons color="#FFFFFF" name="star" size={15} />
                <Text allowFontScaling={false} style={styles.coverBadgeText}>Pääkuva</Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptyHero}>
              <Ionicons color={GREEN_DARK} name="image-outline" size={36} />
              <Text allowFontScaling={false} style={styles.emptyTitle}>Ei kuvia vielä</Text>
              <Text allowFontScaling={false} style={styles.emptyText}>Lisää vähintään yksi kuva, jotta ilmoitus voidaan julkaista.</Text>
            </View>
          )}

          <Pressable disabled={busy || images.length >= 10} onPress={addImages} style={({ pressed }) => [styles.primaryButton, (busy || images.length >= 10) && styles.disabledButton, pressed && styles.pressed]}>
            <Ionicons color="#FFFFFF" name="camera-outline" size={20} />
            <Text allowFontScaling={false} style={styles.primaryButtonText}>{images.length >= 10 ? 'Kuvien enimmäismäärä täynnä' : 'Lisää kuvia'}</Text>
          </Pressable>

          <View style={styles.grid}>
            {images.map((image, index) => {
              const uri = getListingImagePublicUrl(image.storage_path);
              const isCover = index === 0;

              return (
                <View key={image.id} style={styles.imageCard}>
                  <Image source={{ uri }} style={styles.imageThumb} />
                  <View style={styles.imageInfo}>
                    <Text allowFontScaling={false} style={styles.imageTitle}>{isCover ? 'Pääkuva' : `Kuva ${index + 1}`}</Text>
                    <Text allowFontScaling={false} style={styles.imageMeta}>{image.width && image.height ? `${image.width} × ${image.height}` : 'Kuva'}</Text>
                  </View>
                  <View style={styles.actionRow}>
                    {!isCover && <ImageAction icon="star-outline" label="Pääkuva" onPress={() => void setCover(image.id)} />}
                    <ImageAction disabled={index === 0} icon="arrow-up-outline" label="Ylös" onPress={() => void moveImage(image.id, 'up')} />
                    <ImageAction disabled={index === images.length - 1} icon="arrow-down-outline" label="Alas" onPress={() => void moveImage(image.id, 'down')} />
                    <ImageAction danger icon="trash-outline" label="Poista" onPress={() => confirmDelete(image)} />
                  </View>
                </View>
              );
            })}
          </View>

          {!!feedback && (
            <View style={styles.feedbackCard}>
              <Ionicons color={GREEN_DARK} name="information-circle-outline" size={20} />
              <Text allowFontScaling={false} style={styles.feedbackText}>{feedback}</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function ImageAction({ danger, disabled, icon, label, onPress }: { danger?: boolean; disabled?: boolean; icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.imageAction, danger && styles.imageActionDanger, disabled && styles.disabledButton, pressed && styles.pressed]}>
      <Ionicons color={danger ? '#9F2E2E' : GREEN_DARK} name={icon} size={16} />
      <Text allowFontScaling={false} style={[styles.imageActionText, danger && styles.imageActionTextDanger]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: BACKGROUND, flex: 1 },
  topBar: { alignItems: 'center', flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 8 },
  iconButton: { alignItems: 'center', backgroundColor: CARD, borderColor: BORDER, borderRadius: 14, borderWidth: 1, height: 44, justifyContent: 'center', width: 44 },
  headerText: { alignItems: 'center', flex: 1, minWidth: 0 },
  pageTitle: { color: TEXT, fontSize: 20, fontWeight: '900' },
  subtitle: { color: MUTED, fontSize: 12.5, fontWeight: '700', marginTop: 2, maxWidth: '100%' },
  loadingWrap: { alignItems: 'center', flex: 1, gap: 12, justifyContent: 'center' },
  loadingText: { color: MUTED, fontSize: 14, fontWeight: '700' },
  content: { paddingBottom: 32, paddingHorizontal: 22, paddingTop: 22 },
  coverCard: { borderRadius: 24, height: 260, marginBottom: 14, overflow: 'hidden' },
  coverImage: { backgroundColor: '#F8F2EA', height: '100%', width: '100%' },
  coverBadge: { alignItems: 'center', backgroundColor: 'rgba(63, 78, 47, 0.92)', borderRadius: 999, flexDirection: 'row', gap: 6, left: 14, paddingHorizontal: 12, paddingVertical: 7, position: 'absolute', top: 14 },
  coverBadgeText: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '900' },
  emptyHero: { alignItems: 'center', backgroundColor: CARD, borderColor: BORDER, borderRadius: 22, borderWidth: 1, gap: 8, marginBottom: 14, padding: 28 },
  emptyTitle: { color: TEXT, fontSize: 16, fontWeight: '900' },
  emptyText: { color: MUTED, fontSize: 13.2, fontWeight: '700', lineHeight: 19, textAlign: 'center' },
  primaryButton: { alignItems: 'center', backgroundColor: GREEN, borderRadius: 16, flexDirection: 'row', gap: 8, height: 54, justifyContent: 'center', marginBottom: 14 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  grid: { gap: 12 },
  imageCard: { backgroundColor: CARD, borderColor: BORDER, borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  imageThumb: { backgroundColor: '#F8F2EA', height: 170, width: '100%' },
  imageInfo: { paddingHorizontal: 14, paddingTop: 12 },
  imageTitle: { color: TEXT, fontSize: 15, fontWeight: '900' },
  imageMeta: { color: MUTED, fontSize: 12.5, fontWeight: '700', marginTop: 3 },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 12 },
  imageAction: { alignItems: 'center', borderColor: BORDER, borderRadius: 999, borderWidth: 1, flexDirection: 'row', gap: 5, paddingHorizontal: 10, paddingVertical: 7 },
  imageActionDanger: { borderColor: 'rgba(159, 46, 46, 0.24)' },
  imageActionText: { color: GREEN_DARK, fontSize: 11.8, fontWeight: '900' },
  imageActionTextDanger: { color: '#9F2E2E' },
  feedbackCard: { alignItems: 'flex-start', backgroundColor: 'rgba(85, 99, 63, 0.08)', borderColor: 'rgba(85, 99, 63, 0.18)', borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 9, marginTop: 14, padding: 13 },
  feedbackText: { color: GREEN_DARK, flex: 1, fontSize: 13.5, fontWeight: '700', lineHeight: 19 },
  disabledButton: { opacity: 0.48 },
  pressed: { opacity: 0.78 },
});
