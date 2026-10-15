import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';

type Props = { title: string; onBack?: () => void; right?: ReactNode };

export function Header({ title, onBack, right }: Props) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      {onBack && (
        <Pressable
          testID="back-button"
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          onPress={onBack}
          hitSlop={12}
          style={styles.back}
        >
          <Text style={[styles.backText, { color: theme.text }]}>‹</Text>
        </Pressable>
      )}
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      {right && <View style={styles.right}>{right}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  back: {
    marginRight: 8,
    paddingRight: 4,
  },
  backText: {
    fontSize: 36,
    lineHeight: 36,
    fontWeight: '300',
  },
  title: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
  },
  right: {
    marginLeft: 12,
  },
});
