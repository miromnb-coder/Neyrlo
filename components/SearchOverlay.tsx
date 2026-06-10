import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

const DARK_OLIVE = '#41482C';
const TEXT_MUTED = '#686D66';
const SURFACE = 'rgba(255, 253, 247, 0.96)';

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
        <Ionicons color={TEXT_MUTED} name="search-outline" size={23} />
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
  shadowOffset: { height: 8, width: 0 },
  shadowOpacity: 0.06,
  shadowRadius: 16,
};

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  searchCard: {
    ...shadow,
    alignItems: 'center',
    backgroundColor: SURFACE,
    borderColor: 'rgba(229, 218, 206, 0.78)',
    borderRadius: 24,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 12,
    height: 58,
    paddingLeft: 18,
    paddingRight: 18,
  },
  input: {
    color: '#20251F',
    flex: 1,
    fontSize: 15.2,
    fontWeight: '600',
    letterSpacing: -0.08,
    padding: 0,
  },
  filterButton: {
    ...shadow,
    alignItems: 'center',
    backgroundColor: 'rgba(248, 241, 229, 0.96)',
    borderColor: 'rgba(229, 218, 206, 0.78)',
    borderRadius: 999,
    borderWidth: 1,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
});
