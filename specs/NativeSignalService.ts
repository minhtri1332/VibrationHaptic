import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

/**
 * Android-only foreground service that listens to `/signals/{deviceId}` and vibrates,
 * also while the app is in the background. Not implemented on iOS.
 */
export interface Spec extends TurboModule {
  start(deviceId: string): void;
  stop(): void;
  setVibrationSettings(durationMs: number, amplitude: number): void;
}

export default TurboModuleRegistry.get<Spec>('SignalService');
