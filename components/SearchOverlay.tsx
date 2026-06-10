import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TextInput, View } from 'react-native';

import { colors } from '@/constants/theme';

type SearchOverlayProps = {
  onChangeText?: (value: string) => void;
  onFilterPress?: () => void;
  placeholder?: string;
  value?: string;
};

export function SearchOverlay({
  onChangeText,
  onFilterPress,
  placeholder = 'Hae tavaroita tai kategorioita',
  value,
}: SearchOverlayProps) {
  return (
    <View style={styles.searchCard}>
      <Ionicons color={colors.primaryDark} name="search" size={22} />
      <TextInput
        allowFontScaling={false}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#5F665F"
        returnKeyType="search"
        style={styles.input}
        value={value}
      />
      <View style={styles.divider} />
      <View onTouchEnd={onFilterPress} style={styles.filterButton}>
        <Ionicons color={colors.primaryDark} name="options-outline" size={21} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  searchCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 253, 247, 0.96)',
    borderColor: 'rgba(229, 218, 206, 0.72)',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 13,
    height: 56,
    paddingLeft: 18,
    paddingRight: 13,
    shadowColor: '#000',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.045,
    shadowRadius: 15,
  },
  input: {
    color: colors.text,
    flex: 1,
    fontSize: 15.2,
    fontWeight: '600',
    letterSpacing: -0.08,
    padding: 0,
  },
  divider: {
    backgroundColor: 'rgba(111, 117, 109, 0.14)',
    height: 30,
    width: 1,
  },
  filterButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 38,
  },
});
