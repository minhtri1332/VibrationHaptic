import { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { onValue } from '@react-native-firebase/database';
import { Header } from '../components/Header';
import { useDeviceName, useMyDeviceId } from '../device';
import {
  Letter,
  isLetter,
  pulseCount,
  signalRefFor,
  startBackgroundListener,
  stopBackgroundListener,
  vibratePulses,
} from '../signal';
import { RECEIVE_COLOR, useTheme } from '../theme';

type Props = { onBack: () => void };

export function ReceiveScreen({ onBack }: Props) {
  const theme = useTheme();
  const [last, setLast] = useState<{ letter: Letter; at: Date } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const deviceId = useMyDeviceId();
  const deviceName = useDeviceName(deviceId);

  useEffect(() => {
    if (!deviceId) {
      return;
    }
    // The first snapshot is whatever was sent before this screen opened; skip it.
    let isInitial = true;
    let cancelVibration: (() => void) | undefined;
    const nativeVibrates = startBackgroundListener(deviceId);

    const unsubscribe = onValue(
      signalRefFor(deviceId),
      snapshot => {
        if (isInitial) {
          isInitial = false;
          return;
        }
        const letter = snapshot.val()?.letter;
        if (!isLetter(letter)) {
          return;
        }
        if (!nativeVibrates) {
          cancelVibration?.();
          cancelVibration = vibratePulses(pulseCount(letter));
        }
        setLast({ letter, at: new Date() });
      },
      e => setError(e.message),
    );

    return () => {
      unsubscribe();
      cancelVibration?.();
      stopBackgroundListener();
    };
  }, [deviceId]);

  return (
    <View>
      <Header title={deviceName || 'Nhận tín hiệu'} onBack={onBack} />
      {deviceName === null && (
        <Text testID="receive-unregistered" style={styles.warning}>
          Thiết bị chưa được tạo nên không ai gửi tới được. Bấm + ở màn hình
          chính để tạo.
        </Text>
      )}
      <View
        style={[
          styles.panel,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        {error ? (
          <Text testID="receive-error" style={styles.error}>
            {error}
          </Text>
        ) : last ? (
          <>
            <Text testID="received-letter" style={styles.letter}>
              {last.letter}
            </Text>
            <Text style={[styles.detail, { color: theme.text }]}>
              Rung {pulseCount(last.letter)} lần
            </Text>
            <Text style={[styles.time, { color: theme.muted }]}>
              lúc {last.at.toLocaleTimeString()}
            </Text>
          </>
        ) : (
          <>
            <View style={styles.dot} />
            <Text
              testID="receive-waiting"
              style={[styles.detail, { color: theme.muted }]}
            >
              Đang chờ tín hiệu…
            </Text>
          </>
        )}
      </View>
      {deviceId && (
        <Text
          testID="receive-device-id"
          style={[styles.hint, { color: theme.muted }]}
        >
          ID: {deviceId}
        </Text>
      )}
      <Text style={[styles.hint, { color: theme.muted }]}>
        A = 1 lần · B = 2 lần · C = 3 lần · D = 4 lần
      </Text>
      {Platform.OS === 'android' && (
        <Text style={[styles.hint, { color: theme.muted }]}>
          Vẫn rung khi app chạy nền, kể cả ở chế độ im lặng. Thoát màn này để
          dừng.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 280,
    padding: 24,
  },
  letter: {
    color: RECEIVE_COLOR,
    fontSize: 120,
    fontWeight: '800',
  },
  detail: {
    fontSize: 18,
    fontWeight: '600',
  },
  time: {
    marginTop: 4,
    fontSize: 14,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: RECEIVE_COLOR,
    marginBottom: 12,
  },
  error: {
    color: '#d93025',
    fontSize: 16,
    textAlign: 'center',
  },
  warning: {
    color: '#b26a00',
    fontSize: 15,
    marginBottom: 16,
  },
  hint: {
    marginTop: 16,
    fontSize: 14,
    textAlign: 'center',
  },
});
