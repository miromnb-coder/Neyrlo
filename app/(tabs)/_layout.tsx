import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';

const tabItems = {
  index: {
    activeIcon: 'map',
    inactiveIcon: 'map-outline',
    label: 'Kartta',
  },
  browse: {
    activeIcon: 'search',
    inactiveIcon: 'search-outline',
    label: 'Selaa',
  },
  add: {
    activeIcon: 'add',
    inactiveIcon: 'add',
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
    <View pointerEvents="box-none" style={styles.tabBarWrap}>
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const isAdd = route.name === 'add';
          const config = tabItems[route.name as TabRouteName];
          const options = descriptors[route.key]?.options;
          const label = config?.label ?? options?.title ?? route.name;
          const iconName = (focused ? config?.activeIcon : config?.inactiveIcon) ?? 'ellipse-outline';
          const color = focused ? colors.primary : '#686D66';

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
              style={({ pressed }) => [styles.tabButton, isAdd && styles.addTabButton, pressed && styles.tabButtonPressed]}
            >
              {isAdd ? (
                <View style={[styles.addCircle, focused && styles.addCircleActive]}>
                  <Ionicons color="#FFFFFF" name="add" size={31} />
                </View>
              ) : (
                <View style={styles.iconSlot}>
                  <Ionicons color={color} name={iconName as keyof typeof Ionicons.glyphMap} size={27} />
                </View>
              )}
              <Text allowFontScaling={false} style={[styles.tabLabel, focused && styles.activeTabLabel, isAdd && styles.addTabLabel]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
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
  tabBarWrap: {
    bottom: 0,
    left: 0,
    paddingHorizontal: 0,
    position: 'absolute',
    right: 0,
  },
  tabBar: {
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 253, 247, 0.97)',
    borderColor: 'rgba(64, 80, 48, 0.10)',
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    borderWidth: 1,
    borderBottomWidth: 0,
    elevation: 18,
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 98 : 90,
    justifyContent: 'space-between',
    paddingBottom: Platform.OS === 'ios' ? 20 : 14,
    paddingHorizontal: 10,
    paddingTop: 16,
    shadowColor: '#1F261B',
    shadowOffset: { height: -8, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 22,
  },
  tabButton: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-start',
    minHeight: 62,
  },
  addTabButton: {
    marginTop: -30,
  },
  tabButtonPressed: {
    opacity: 0.76,
  },
  iconSlot: {
    alignItems: 'center',
    height: 29,
    justifyContent: 'center',
    marginBottom: 5,
  },
  addCircle: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderColor: 'rgba(255, 253, 247, 0.96)',
    borderRadius: 999,
    borderWidth: 3,
    elevation: 10,
    height: 64,
    justifyContent: 'center',
    marginBottom: 2,
    shadowColor: '#1F261B',
    shadowOffset: { height: 7, width: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 13,
    width: 64,
  },
  addCircleActive: {
    backgroundColor: '#3F4E2F',
  },
  tabLabel: {
    color: '#686D66',
    fontSize: 12.8,
    fontWeight: '700',
    letterSpacing: -0.08,
    lineHeight: 16,
  },
  addTabLabel: {
    marginTop: -1,
  },
  activeTabLabel: {
    color: colors.primary,
    fontWeight: '800',
  },
});
