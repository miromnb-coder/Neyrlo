import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';

export function NearbyMapCard() {
  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Text allowFontScaling={false} style={styles.title}>Lähellä sinua</Text>
        <Ionicons color={colors.primary} name="location-outline" size={14} />
      </View>
      <Text allowFontScaling={false} style={styles.text}>14 tavaraa</Text>
      <Text allowFontScaling={false} style={styles.text}>2 km säteellä</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 253, 247, 0.95)',
    borderColor: 'rgba(229, 218, 206, 0.82)',
    borderRadius: 14,
    borderWidth: 1,
    minWidth: 145,
    paddingHorizontal: 14,
    paddingVertical: 11,
    shadowColor: '#000',
    shadowOffset: { height: 7, width: 0 },
    shadowOpacity: 0.055,
    shadowRadius: 13,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    marginBottom: 5,
  },
  title: {
    color: colors.text,
    fontSize: 14.2,
    fontWeight: '800',
    letterSpacing: -0.08,
  },
  text: {
    color: '#56605A',
    fontSize: 12.4,
    fontWeight: '500',
    lineHeight: 17,
  },
});