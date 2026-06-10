import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';

const tabItems = {
  index: {
    activeIcon: 'location',
    inactiveIcon: 'location-outline',
    label: 'Kartta',
  },
  browse: {
    activeIcon: 'grid',
    inactiveIcon: 'grid-outline',
    label: 'Selaa',
  },
  add: {
    activeIcon: 'add-circle',
    inactiveIcon: 'add-circle-outline',
    label: 'Lisää',
  },
  messages: {
    activeIcon: 'chatbubble',
    inactiveIcon: 'chatbubble-outline',
    label: 'Viestit',
  },
  profile: {
    activeIcon: 'person',
    inactiveIcon: 'person-outline',
    label: 'Profiili',
  },
} as const;

type TabRouteName = keyof typeof tabItems;

type TabBarProps = {
  descriptors: Record<string, { options: { title?: string } }>;
  navigation: {
    emit: (event: { canPreventDefault?: boolean; target: string; type: string }) => { defaultPrevented?: boolean };
    navigate: (name: string) => void;
  };
  state: {
    index: number;
    routes: { key: string; name: string }[];
  };
};

function NeyrloTabBar({ descriptors, navigation, state }: TabBarProps) {
  const activeRouteName = state.routes[state.index]?.name;

  if (activeRouteName === 'add') {
    return null;
  }

  return (
    <View style={styles.tabBar}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const config = tabItems[route.name as TabRouteName];
        const options = descriptors[route.key]?.options;
        const label = config?.label ?? options?.title ?? route.name;
        const iconName = (focused ? config?.activeIcon : config?.inactiveIcon) ?? 'ellipse-outline';
        const color = focused ? colors.primary : '#697068';

        const onPress = () => {
          const event = navigation.emit({
            canPreventDefault: true,
            target: route.key,
            type: 'tabPress',
          });

          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            key={route.key}
            onPress={onPress}
            style={({ pressed }) => [styles.tabButton, pressed && styles.tabButtonPressed]}
          >
            <View style={styles.iconSlot}>
              <Ionicons
                color={color}
                name={iconName as keyof typeof Ionicons.glyphMap}
                size={focused ? 26 : 25}
              />
            </View>
            <Text allowFontScaling={false} style={[styles.tabLabel, focused && styles.activeTabLabel]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <NeyrloTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: 'Kartta' }} />
      <Tabs.Screen name="browse" options={{ title: 'Selaa' }} />
      <Tabs.Screen name="add" options={{ title: 'Lisää' }} />
      <Tabs.Screen name="messages" options={{ title: 'Viestit' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profiili' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    alignItems: 'flex-start',
    backgroundColor: '#FFFDF7',
    borderTopWidth: 0,
    bottom: 0,
    elevation: 0,
    flexDirection: 'row',
    height: 84,
    justifyContent: 'space-between',
    left: 0,
    paddingBottom: Platform.OS === 'ios' ? 17 : 12,
    paddingHorizontal: 12,
    paddingTop: 8,
    position: 'absolute',
    right: 0,
    shadowOpacity: 0,
  },
  tabButton: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-start',
  },
  tabButtonPressed: {
    opacity: 0.78,
  },
  iconSlot: {
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
    marginBottom: -1,
  },
  tabLabel: {
    color: '#697068',
    fontSize: 11.8,
    fontWeight: '700',
    letterSpacing: -0.06,
    lineHeight: 15,
  },
  activeTabLabel: {
    color: colors.primary,
  },
});
