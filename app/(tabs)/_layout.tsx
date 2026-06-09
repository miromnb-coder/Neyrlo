import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { colors } from '@/constants/theme';

const tabIcons = {
  index: 'map-outline',
  browse: 'grid-outline',
  add: 'add-circle-outline',
  messages: 'chatbubble-outline',
  profile: 'person-outline',
} as const;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 86,
          paddingBottom: 22,
          paddingTop: 10,
        },
        tabBarIcon: ({ color, size }) => {
          const iconName = tabIcons[route.name as keyof typeof tabIcons] ?? 'ellipse-outline';
          return <Ionicons color={color} name={iconName} size={size} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Kartta' }} />
      <Tabs.Screen name="browse" options={{ title: 'Selaa' }} />
      <Tabs.Screen name="add" options={{ title: 'Lisää' }} />
      <Tabs.Screen name="messages" options={{ title: 'Viestit' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profiili' }} />
    </Tabs>
  );
}
