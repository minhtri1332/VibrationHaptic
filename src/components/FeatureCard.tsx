import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';

type CardProps = {
  testID: string;
  title: string;
  description: string;
  color: string;
  onPress: () => void;
};

export function FeatureCard({
  testID,
  title,
  description,
  color,
  onPress,
}: CardProps) {
  const theme = useTheme();

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.border },
        pressed && styles.cardPressed,
      ]}
    >
      <View style={[styles.accent, { backgroundColor: color }]} />
      <View style={styles.body}>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.description, { color: theme.muted }]}>
          {description}
        </Text>
      </View>
      <Text style={[styles.chevron, { color: theme.muted }]}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
    overflow: 'hidden',
    minHeight: 120,
  },
  cardPressed: {
    opacity: 0.7,
  },
  accent: {
    alignSelf: 'stretch',
    width: 8,
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  description: {
    marginTop: 6,
    fontSize: 15,
  },
  chevron: {
    fontSize: 32,
    paddingRight: 20,
  },
});
