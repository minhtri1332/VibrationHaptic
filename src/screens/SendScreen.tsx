import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import RNHapticFeedback, {
  HapticFeedbackTypes,
} from 'react-native-haptic-feedback';
import { Header } from '../components/Header';
import { Device } from '../device';
import { LETTERS, Letter, pulseCount, sendSignal } from '../signal';
import { SEND_COLOR, useTheme } from '../theme';

type Status =
  | { kind: 'idle' }
  | { kind: 'sending'; letter: Letter }
  | { kind: 'sent'; letter: Letter }
  | { kind: 'error'; letter: Letter };

type Props = { device: Device; onBack: () => void };

export function SendScreen({ device, onBack }: Props) {
  const theme = useTheme();
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const onPress = (letter: Letter) => {
    RNHapticFeedback.trigger(HapticFeedbackTypes.impactLight);
    setStatus({ kind: 'sending', letter });
    sendSignal(device.id, letter)
      .then(() => setStatus({ kind: 'sent', letter }))
      .catch(error => {
        console.warn('sendSignal', error);
        setStatus({ kind: 'error', letter });
      });
  };

  return (
    <View>
      <Header title={"Gửi tới: " + device.name} onBack={onBack} />
      <Text
        testID="send-status"
        style={[
          styles.status,
          status.kind === 'error' ? styles.statusError : { color: theme.muted },
        ]}
      >
        {statusText(status)}
      </Text>
      <View style={styles.grid}>
        {LETTERS.map(letter => (
          <Pressable
            key={letter}
            testID={`send-${letter}`}
            accessibilityRole="button"
            accessibilityLabel={`Gửi ${letter}`}
            onPress={() => onPress(letter)}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.letter}>{letter}</Text>
            <Text style={styles.pulses}>{pulseCount(letter)} lần rung</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function statusText(status: Status) {
  switch (status.kind) {
    case 'idle':
      return 'Chọn tín hiệu để gửi';
    case 'sending':
      return `Đang gửi ${status.letter}…`;
    case 'sent':
      return `Đã gửi ${status.letter}`;
    case 'error':
      return `Gửi ${status.letter} thất bại`;
  }
}

const styles = StyleSheet.create({
  status: {
    fontSize: 16,
    marginBottom: 16,
  },
  statusError: {
    color: '#d93025',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
  },
  button: {
    width: '47%',
    height: 160,
    borderRadius: 20,
    backgroundColor: SEND_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
  letter: {
    color: '#fff',
    fontSize: 64,
    fontWeight: '800',
  },
  pulses: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 4,
  },
});
