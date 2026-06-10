import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

const DARK_OLIVE = '#41482C';
const TEXT_MUTED = '#676B65';
const SURFACE = 'rgba(255, 253, 247, 0.965)';
const FILTER_SURFACE = 'rgba(249, 241, 229, 0.97)';

type SearchOverlayProps = {
  onChangeText?: (value: string) => void;
  onFilterPress?: () => void;
  placeholder?: string;
  value?: string;
};

export function SearchOverlay({
  onChangeText,
  onFilterPress,
  placeholder = 'Etsi tavaroita tai ihmisiä',
  value,
}: SearchOverlayProps) {
  return (
    <View style={styles.row}>
      <View style={styles.searchCard}>
        <Ionicons color={TEXT_MUTED} name="search-outline" size={22} />
        <TextInput
          allowFontScaling={false}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={TEXT_MUTED}
          returnKeyType="search"
          style={styles.input}
          value={value}
        />
      </View>

      <Pressable onPress={onFilterPress} style={({ pressed }) => [styles.filterButton, pressed && styles.pressed]}>
        <Ionicons color={DARK_OLIVE} name="options-outline" size={22} />
      </Pressable>
    </View>
  );
}

const shadow = {
  shadowColor: '#1F261B',
  shadowOffset: { height: 7, width: 0 },
  shadowOpacity: 0.05,
  shadowRadius: 14,
};

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  searchCard: {
    ...shadow,
    alignItems: 'center',
    backgroundColor: SURFACE,
    borderColor: 'rgba(229, 218, 206, 0.74)',
    borderRadius: 22,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 12,
    height: 54,
    paddingLeft: 17,
    paddingRight: 16,
  },
  input: {
    color: '#20251F',
    flex: 1,
    fontSize: 14.6,
    fontWeight: '600',
    letterSpacing: -0.08,
    padding: 0,
  },
  filterButton: {
    ...shadow,
    alignItems: 'center',
    backgroundColor: FILTER_SURFACE,
    borderColor: 'rgba(229, 218, 206, 0.74)',
    borderRadius: 999,
    borderWidth: 1,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
});
