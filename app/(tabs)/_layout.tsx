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
                size={focused ? 27 : 26}
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
    backgroundColor: 'rgba(255, 253, 247, 0.99)',
    borderTopColor: 'rgba(229, 218, 206, 0.62)',
    borderTopWidth: 1,
    bottom: 0,
    elevation: 0,
    flexDirection: 'row',
    height: 86,
    justifyContent: 'space-between',
    left: 0,
    paddingBottom: Platform.OS === 'ios' ? 18 : 12,
    paddingHorizontal: 12,
    paddingTop: 7,
    position: 'absolute',
    right: 0,
    shadowColor: '#000',
    shadowOffset: { height: -2, width: 0 },
    shadowOpacity: 0.018,
    shadowRadius: 8,
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
    height: 30,
    justifyContent: 'center',
    marginBottom: 0,
  },
  tabLabel: {
    color: '#697068',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.08,
    lineHeight: 15,
  },
  activeTabLabel: {
    color: colors.primary,
  },
});
