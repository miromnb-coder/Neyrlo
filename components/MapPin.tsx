import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/constants/theme';

type MapPinProps = {
  icon: keyof typeof Ionicons.glyphMap;
};

export function MapPin({ icon }: MapPinProps) {
  return (
    <View style={styles.container}>
      <View style={styles.tailBorder} />
      <View style={styles.pinTail} />
      <View style={styles.pinBody}>
        <Ionicons color={colors.surface} name={icon} size={18} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    height: 52,
    justifyContent: 'flex-start',
    width: 42,
  },
  pinBody: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderColor: colors.surface,
    borderRadius: 20,
    borderWidth: 3,
    height: 40,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { height: 7, width: 0 },
    shadowOpacity: 0.17,
    shadowRadius: 11,
    width: 40,
    zIndex: 3,
  },
  tailBorder: {
    backgroundColor: colors.surface,
    borderBottomRightRadius: 3,
    height: 19,
    position: 'absolute',
    top: 27,
    transform: [{ rotate: '45deg' }],
    width: 19,
    zIndex: 1,
  },
  pinTail: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 2,
    height: 14,
    position: 'absolute',
    top: 28,
    transform: [{ rotate: '45deg' }],
    width: 14,
    zIndex: 2,
  },
});