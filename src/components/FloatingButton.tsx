import { Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SEND_COLOR } from '../theme';

type Props = {
  onPress: () => void;
  accessibilityLabel: string;
  testID?: string;
};

export function FloatingButton({ onPress, accessibilityLabel, testID }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { bottom: insets.bottom + 24 },
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.plus}>+</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: SEND_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  plus: {
    color: '#fff',
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '400',
  },
});
