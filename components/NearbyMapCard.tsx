import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';

export function NearbyMapCard() {
  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Text allowFontScaling={false} style={styles.title}>Lähellä sinua</Text>
        <Ionicons color={colors.primary} name="location-outline" size={13} />
      </View>
      <Text allowFontScaling={false} style={styles.text}>14 tavaraa</Text>
      <Text allowFontScaling={false} style={styles.text}>2 km säteellä</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 253, 247, 0.95)',
    borderColor: 'rgba(229, 218, 206, 0.78)',
    borderRadius: 13,
    borderWidth: 1,
    minWidth: 132,
    paddingHorizontal: 12,
    paddingVertical: 9,
    shadowColor: '#000',
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
  },
  title: {
    color: colors.text,
    fontSize: 13.2,
    fontWeight: '800',
    letterSpacing: -0.08,
  },
  text: {
    color: '#56605A',
    fontSize: 11.8,
    fontWeight: '500',
    lineHeight: 16,
  },
});