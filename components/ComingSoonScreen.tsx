import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '@/constants/theme';

type ComingSoonScreenProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
};

export function ComingSoonScreen({ icon, title, description }: ComingSoonScreenProps) {
  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Ionicons color={colors.primary} name={icon} size={32} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    maxWidth: 360,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
  },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radii.pill,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  description: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
    textAlign: 'center',
  },
});
