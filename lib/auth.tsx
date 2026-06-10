import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';

type AuthContextValue = {
  isConfigured: boolean;
  loading: boolean;
  session: Session | null;
  signOut: () => Promise<void>;
};

const SPLASH_BACKGROUND = '#55633F';
const SPLASH_FOREGROUND = '#FFFDF7';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    if (!isSupabaseConfigured) {
      setLoading(false);
      return () => {
        isMounted = false;
      };
    }

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (isMounted) {
          setSession(data.session ?? null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isConfigured: isSupabaseConfigured,
      loading,
      session,
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [loading, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthGate({ children }: PropsWithChildren) {
  const { loading, session } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) {
      return;
    }

    const isAuthRoute = segments[0] === 'auth';

    if (!session && !isAuthRoute) {
      router.replace('/auth');
      return;
    }

    if (session && isAuthRoute) {
      router.replace('/(tabs)');
    }
  }, [loading, router, segments, session]);

  if (loading) {
    return <AuthLoadingScreen />;
  }

  return <>{children}</>;
}

export function AuthLoadingScreen() {
  return (
    <View style={styles.loadingScreen}>
      <StatusBar backgroundColor="transparent" style="light" translucent />
      <Text allowFontScaling={false} style={styles.logo}>
        Neyrlo
      </Text>
      <ActivityIndicator color={SPLASH_FOREGROUND} size="small" style={styles.spinner} />
    </View>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}

const serifFont = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

const styles = StyleSheet.create({
  loadingScreen: {
    alignItems: 'center',
    backgroundColor: SPLASH_BACKGROUND,
    flex: 1,
  },
  logo: {
    color: SPLASH_FOREGROUND,
    fontFamily: serifFont,
    fontSize: 70,
    fontWeight: Platform.OS === 'ios' ? '500' : '400',
    letterSpacing: -1.6,
    lineHeight: 82,
    position: 'absolute',
    top: '40%',
  },
  spinner: {
    position: 'absolute',
    top: '74%',
  },
});
