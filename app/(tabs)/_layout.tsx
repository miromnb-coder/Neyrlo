import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { colors } from '@/constants/theme';

const tabIcons = {
  index: {
    active: 'location',
    inactive: 'location-outline',
  },
  browse: {
    active: 'grid',
    inactive: 'grid-outline',
  },
  add: {
    active: 'add-circle',
    inactive: 'add-circle-outline',
  },
  messages: {
    active: 'chatbubble',
    inactive: 'chatbubble-outline',
  },
  profile: {
    active: 'person',
    inactive: 'person-outline',
  },
} as const;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#697068',
        tabBarItemStyle: {
          paddingTop: 3,
        },
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: '800',
          lineHeight: 17,
        },
        tabBarStyle: {
          backgroundColor: 'rgba(255, 253, 247, 0.98)',
          borderTopColor: 'rgba(229, 218, 206, 0.95)',
          borderTopWidth: 1,
          elevation: 0,
          height: 92,
          paddingBottom: 20,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { height: -3, width: 0 },
          shadowOpacity: 0.03,
          shadowRadius: 10,
        },
        tabBarIcon: ({ color, focused }) => {
          const iconSet = tabIcons[route.name as keyof typeof tabIcons] ?? {
            active: 'ellipse',
            inactive: 'ellipse-outline',
          };
          const iconName = focused ? iconSet.active : iconSet.inactive;

          return <Ionicons color={color} name={iconName} size={focused ? 31 : 30} />;
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
