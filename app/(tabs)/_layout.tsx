import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';

const INACTIVE = '#686D66';
const BAR_BACKGROUND = 'rgba(255, 253, 247, 0.97)';

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
    activeIcon: 'chatbubble-outline',
    inactiveIcon: 'chatbubble-outline',
    label: 'Viestit',
  },
  profile: {
    activeIcon: 'person-outline',
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
          const color = focused && !isAdd ? colors.primary : INACTIVE;

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
                <View style={styles.addCircle}>
                  <Ionicons color="#FFFFFF" name="add" size={27} />
                </View>
              ) : (
                <View style={styles.iconSlot}>
                  <Ionicons color={color} name={iconName as keyof typeof Ionicons.glyphMap} size={25} />
                </View>
              )}
              <Text allowFontScaling={false} style={[styles.tabLabel, focused && !isAdd && styles.activeTabLabel, isAdd && styles.addTabLabel]}>
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
    position: 'absolute',
    right: 0,
  },
  tabBar: {
    alignItems: 'flex-start',
    backgroundColor: BAR_BACKGROUND,
    borderColor: 'rgba(64, 80, 48, 0.10)',
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    borderWidth: 1,
    borderBottomWidth: 0,
    elevation: 16,
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 91 : 84,
    justifyContent: 'space-between',
    paddingBottom: Platform.OS === 'ios' ? 18 : 12,
    paddingHorizontal: 8,
    paddingTop: 14,
    shadowColor: '#1F261B',
    shadowOffset: { height: -7, width: 0 },
    shadowOpacity: 0.075,
    shadowRadius: 20,
  },
  tabButton: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-start',
    minHeight: 58,
  },
  addTabButton: {
    marginTop: -24,
  },
  tabButtonPressed: {
    opacity: 0.76,
  },
  iconSlot: {
    alignItems: 'center',
    height: 29,
    justifyContent: 'center',
    marginBottom: 4,
  },
  addCircle: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderColor: 'rgba(255, 253, 247, 0.98)',
    borderRadius: 999,
    borderWidth: 3,
    elevation: 10,
    height: 56,
    justifyContent: 'center',
    marginBottom: 2,
    shadowColor: '#1F261B',
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    width: 56,
  },
  tabLabel: {
    color: INACTIVE,
    fontSize: 12.2,
    fontWeight: '700',
    letterSpacing: -0.06,
    lineHeight: 15,
  },
  addTabLabel: {
    marginTop: -1,
  },
  activeTabLabel: {
    color: colors.primary,
    fontWeight: '800',
  },
});
