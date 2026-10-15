import { PermissionsAndroid, Platform, Vibration } from 'react-native';
import {
  getDatabase,
  ref,
  serverTimestamp,
  set,
} from '@react-native-firebase/database';
import NativeSignalService from '../specs/NativeSignalService';

export const LETTERS = ['A', 'B', 'C', 'D'] as const;
export type Letter = (typeof LETTERS)[number];

export type Signal = { letter: Letter; at: number };

// Each device listens only to its own node, so a signal reaches exactly one device.
export const signalRefFor = (deviceId: string) =>
  ref(getDatabase(), `signals/${deviceId}`);

// A = 1 pulse, B = 2, C = 3, D = 4.
export const pulseCount = (letter: Letter) => LETTERS.indexOf(letter) + 1;

export const isLetter = (value: unknown): value is Letter =>
  LETTERS.includes(value as Letter);

export function sendSignal(deviceId: string, letter: Letter) {
  // serverTimestamp makes every write a new value, so repeating a letter still fires.
  return set(signalRefFor(deviceId), { letter, at: serverTimestamp() });
}

const PULSE_MS = 300;
// iOS ignores the duration and always vibrates ~400ms, so leave room for it.
const PULSE_INTERVAL_MS = 700;

// Returns a cancel function.
export function vibratePulses(count: number) {
  const timers = Array.from({ length: count }, (_, i) =>
    setTimeout(() => Vibration.vibrate(PULSE_MS), i * PULSE_INTERVAL_MS),
  );
  return () => {
    timers.forEach(clearTimeout);
    Vibration.cancel();
  };
}

/**
 * Starts the native listener that vibrates even in the background (Android only).
 * Returns false when JS has to vibrate itself.
 */
export function startBackgroundListener(deviceId: string) {
  if (Platform.OS !== 'android' || !NativeSignalService) {
    return false;
  }
  // Without it the service still runs, its notification is just hidden.
  if (Platform.Version >= 33) {
    PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    ).catch(() => {});
  }
  NativeSignalService.start(deviceId);
  return true;
}

export function stopBackgroundListener() {
  NativeSignalService?.stop();
}
