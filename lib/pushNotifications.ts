import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

export type PushRegistrationResult = {
  status: 'granted' | 'denied' | 'unsupported';
  token?: string;
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: true,
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications() {
  if (Platform.OS === 'web') {
    return { status: 'unsupported' } satisfies PushRegistrationResult;
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw toAppError(userError, 'Kirjautuneen käyttäjän tarkistus ei onnistunut.');
  }

  if (!user) {
    throw new Error('Kirjaudu sisään ottaaksesi ilmoitukset käyttöön.');
  }

  const permission = await Notifications.getPermissionsAsync();
  let finalStatus = permission.status;

  if (finalStatus !== 'granted') {
    const requestedPermission = await Notifications.requestPermissionsAsync();
    finalStatus = requestedPermission.status;
  }

  if (finalStatus !== 'granted') {
    return { status: 'denied' } satisfies PushRegistrationResult;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      importance: Notifications.AndroidImportance.DEFAULT,
      name: 'Neyrlo',
    });
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  const token = projectId
    ? (await Notifications.getExpoPushTokenAsync({ projectId })).data
    : (await Notifications.getExpoPushTokenAsync()).data;

  const { error } = await supabase.from('push_tokens').upsert(
    {
      device_platform: Platform.OS,
      enabled: true,
      expo_push_token: token,
      updated_at: new Date().toISOString(),
      user_id: user.id,
    },
    { onConflict: 'user_id,expo_push_token' },
  );

  if (error) {
    throw toAppError(error, 'Push-tokenin tallennus ei onnistunut.');
  }

  return { status: 'granted', token } satisfies PushRegistrationResult;
}

export async function disableCurrentDevicePushNotifications() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw toAppError(userError, 'Kirjautuneen käyttäjän tarkistus ei onnistunut.');
  }

  if (!user) {
    throw new Error('Kirjaudu sisään muuttaaksesi ilmoitusasetuksia.');
  }

  const { error } = await supabase
    .from('push_tokens')
    .update({ enabled: false, updated_at: new Date().toISOString() })
    .eq('user_id', user.id);

  if (error) {
    throw toAppError(error, 'Push-ilmoitusten poisto käytöstä ei onnistunut.');
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
