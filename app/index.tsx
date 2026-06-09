import { Redirect } from 'expo-router';

import { AuthLoadingScreen, useAuth } from '@/lib/auth';

export default function EntryScreen() {
  const { loading, session } = useAuth();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  return <Redirect href={session ? '/(tabs)' : '/auth'} />;
}
