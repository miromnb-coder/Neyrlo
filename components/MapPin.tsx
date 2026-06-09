import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { colors, radii } from '@/constants/theme';

type MapPinProps = {
  icon: keyof typeof Ionicons.glyphMap;
  left: `${number}%`;
  top: `${number}%`;
};

export function MapPin({ icon, left, top }: MapPinProps) {
  return (
    <View style={[styles.pin, { left, top }]}>
      <Ionicons color={colors.surface} name={icon} size={22} />
    </View>
  );
}

const styles = StyleSheet.create({
  pin: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderColor: colors.surface,
    borderRadius: radii.pill,
    borderWidth: 4,
    height: 54,
    justifyContent: 'center',
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    width: 54,
    zIndex: 3,
  },
});
