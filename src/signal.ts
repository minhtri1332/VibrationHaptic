import { PermissionsAndroid, Platform, Vibration } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

export const MIN_DURATION_MS = 300;
export const MAX_DURATION_MS = 500;
export const DEFAULT_DURATION_MS = 400;

export const MIN_AMPLITUDE = 100;
export const MAX_AMPLITUDE = 255;
export const DEFAULT_AMPLITUDE = 255;

const STORAGE_KEY_DURATION = '@vibration_duration_ms';
const STORAGE_KEY_AMPLITUDE = '@vibration_amplitude';

let currentDurationMs = DEFAULT_DURATION_MS;
let currentAmplitude = DEFAULT_AMPLITUDE;

export async function loadVibrationSettings(): Promise<{
  durationMs: number;
  amplitude: number;
}> {
  try {
    const [storedDuration, storedAmplitude] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEY_DURATION),
      AsyncStorage.getItem(STORAGE_KEY_AMPLITUDE),
    ]);
    if (storedDuration) {
      const parsed = parseInt(storedDuration, 10);
      if (!isNaN(parsed) && parsed >= MIN_DURATION_MS && parsed <= MAX_DURATION_MS) {
        currentDurationMs = parsed;
      }
    }
    if (storedAmplitude) {
      const parsed = parseInt(storedAmplitude, 10);
      if (!isNaN(parsed) && parsed >= MIN_AMPLITUDE && parsed <= MAX_AMPLITUDE) {
        currentAmplitude = parsed;
      }
    }
  } catch (e) {
    console.warn('loadVibrationSettings error:', e);
  }

  syncNativeSettings();
  return { durationMs: currentDurationMs, amplitude: currentAmplitude };
}

function syncNativeSettings() {
  if (Platform.OS === 'android' && NativeSignalService?.setVibrationSettings) {
    try {
      NativeSignalService.setVibrationSettings(currentDurationMs, currentAmplitude);
    } catch (e) {
      console.warn('Failed to sync vibration settings to native:', e);
    }
  }
}

// Automatically load stored settings on startup
loadVibrationSettings().catch(() => {});

export async function saveVibrationSettings(
  durationMs: number,
  amplitude: number,
): Promise<void> {
  currentDurationMs = Math.min(MAX_DURATION_MS, Math.max(MIN_DURATION_MS, Math.round(durationMs)));
  currentAmplitude = Math.min(MAX_AMPLITUDE, Math.max(MIN_AMPLITUDE, Math.round(amplitude)));

  syncNativeSettings();

  try {
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEY_DURATION, currentDurationMs.toString()),
      AsyncStorage.setItem(STORAGE_KEY_AMPLITUDE, currentAmplitude.toString()),
    ]);
  } catch (e) {
    console.warn('saveVibrationSettings error:', e);
  }
}

export function testVibrate(durationMs?: number, amplitude?: number) {
  const d = durationMs ?? currentDurationMs;
  const a = amplitude ?? currentAmplitude;
  if (Platform.OS === 'android' && NativeSignalService?.setVibrationSettings) {
    try {
      NativeSignalService.setVibrationSettings(d, a);
    } catch {}
  }
  Vibration.cancel();
  Vibration.vibrate(d);
}

// Returns a cancel function.
export function vibratePulses(count: number, durationMs?: number) {
  const pulseMs = durationMs ?? currentDurationMs;
  const pulseIntervalMs = Platform.OS === 'ios' ? 700 : pulseMs + 250;
  const timers = Array.from({ length: count }, (_, i) =>
    setTimeout(() => Vibration.vibrate(pulseMs), i * pulseIntervalMs),
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
  syncNativeSettings();
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

