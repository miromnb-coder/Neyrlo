import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';

export function SearchOverlay() {
  return (
    <View style={styles.searchCard}>
      <Ionicons color={colors.primaryDark} name="search" size={24} />
      <Text allowFontScaling={false} numberOfLines={1} style={styles.placeholder}>
        Hae tavaroita tai kategorioita
      </Text>
      <View style={styles.divider} />
      <View style={styles.filterButton}>
        <Ionicons color={colors.primaryDark} name="options-outline" size={22} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  searchCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 253, 247, 0.96)',
    borderColor: 'rgba(229, 218, 206, 0.76)',
    borderRadius: 28,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    height: 58,
    paddingLeft: 19,
    paddingRight: 14,
    shadowColor: '#000',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.045,
    shadowRadius: 15,
  },
  placeholder: {
    color: '#5F665F',
    flex: 1,
    fontSize: 15.5,
    fontWeight: '600',
    letterSpacing: -0.08,
  },
  divider: {
    backgroundColor: 'rgba(111, 117, 109, 0.15)',
    height: 31,
    width: 1,
  },
  filterButton: {
    alignItems: 'center',
    height: 42,
    justifyContent: 'center',
    width: 39,
  },
});