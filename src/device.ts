import { useEffect, useState } from 'react';
import {
  getDatabase,
  onValue,
  ref,
  remove,
  serverTimestamp,
  set,
} from '@react-native-firebase/database';
import { getUniqueId } from 'react-native-device-info';

export type Device = { id: string; name: string };

export const devicesRef = ref(getDatabase(), 'devices');

const deviceRef = (id: string) => ref(getDatabase(), `devices/${id}`);

let myDeviceId: Promise<string> | undefined;

/** Per-install id (Android: ANDROID_ID, iOS: identifierForVendor). */
export function getMyDeviceId() {
  myDeviceId ??= getUniqueId();
  return myDeviceId;
}

/** Creates the device, or renames it if it already exists. */
export function createDevice(id: string, name: string) {
  return set(deviceRef(id), { name, createdAt: serverTimestamp() });
}

/** Removes the device and its pending signal. */
export function deleteDevice(id: string) {
  return Promise.all([
    remove(deviceRef(id)),
    remove(ref(getDatabase(), `signals/${id}`)),
  ]);
}

export function useMyDeviceId() {
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getMyDeviceId().then(value => active && setId(value));
    return () => {
      active = false;
    };
  }, []);

  return id;
}

type DevicesState = {
  devices: Device[];
  loading: boolean;
  error: string | null;
};

export function useDevices() {
  const [state, setState] = useState<DevicesState>({
    devices: [],
    loading: true,
    error: null,
  });

  useEffect(
    () =>
      onValue(
        devicesRef,
        snapshot => {
          const value: Record<string, { name?: unknown }> | null =
            snapshot.val();
          const devices = Object.entries(value ?? {})
            .filter(([, device]) => typeof device?.name === 'string')
            .map(([id, device]) => ({ id, name: device.name as string }))
            .sort((a, b) => a.name.localeCompare(b.name));
          setState({ devices, loading: false, error: null });
        },
        e => setState(s => ({ ...s, loading: false, error: e.message })),
      ),
    [],
  );

  return state;
}

/** `undefined` while loading, `null` when the device was never created. */
export function useDeviceName(id: string | null) {
  const [name, setName] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    if (!id) {
      return;
    }
    return onValue(deviceRef(id), snapshot => {
      const value = snapshot.val()?.name;
      setName(typeof value === 'string' ? value : null);
    });
  }, [id]);

  return name;
}
