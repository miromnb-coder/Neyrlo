import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/constants/theme';

type MapPinProps = {
  icon: keyof typeof Ionicons.glyphMap;
  left: `${number}%`;
  top: `${number}%`;
};

export function MapPin({ icon, left, top }: MapPinProps) {
  return (
    <View style={[styles.container, { left, top }]}> 
      <View style={styles.pinBody}>
        <Ionicons color={colors.surface} name={icon} size={19} />
      </View>
      <View style={styles.pinTail} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    height: 58,
    justifyContent: 'flex-start',
    marginLeft: -21,
    marginTop: -52,
    position: 'absolute',
    width: 42,
    zIndex: 3,
  },
  pinBody: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderColor: colors.surface,
    borderRadius: 21,
    borderWidth: 3,
    height: 42,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { height: 7, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    width: 42,
    zIndex: 2,
  },
  pinTail: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 3,
    height: 18,
    marginTop: -11,
    transform: [{ rotate: '45deg' }],
    width: 18,
  },
});