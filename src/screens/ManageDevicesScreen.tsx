import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Header } from '../components/Header';
import { SliderBar } from '../components/SliderBar';
import { Device, deleteDevice, useDevices, useMyDeviceId } from '../device';
import {
  DEFAULT_AMPLITUDE,
  DEFAULT_DURATION_MS,
  MAX_AMPLITUDE,
  MAX_DURATION_MS,
  MIN_AMPLITUDE,
  MIN_DURATION_MS,
  loadVibrationSettings,
  saveVibrationSettings,
  testVibrate,
} from '../signal';
import { SEND_COLOR, useTheme } from '../theme';

const DANGER_COLOR = '#d93025';

type Props = { onBack: () => void };

export function ManageDevicesScreen({ onBack }: Props) {
  const theme = useTheme();
  const { devices, loading, error } = useDevices();
  const myDeviceId = useMyDeviceId();
  const [deleting, setDeleting] = useState<string | null>(null);

  const [durationMs, setDurationMs] = useState(DEFAULT_DURATION_MS);
  const [amplitude, setAmplitude] = useState(DEFAULT_AMPLITUDE);

  useEffect(() => {
    loadVibrationSettings().then(s => {
      setDurationMs(s.durationMs);
      setAmplitude(s.amplitude);
    });
  }, []);

  const updateDuration = (val: number) => {
    setDurationMs(val);
    saveVibrationSettings(val, amplitude);
  };

  const updateAmplitude = (val: number) => {
    setAmplitude(val);
    saveVibrationSettings(durationMs, val);
  };

  const confirmDelete = (device: Device) => {
    Alert.alert('Xoá thiết bị', `Xoá "${device.name}" khỏi danh sách?`, [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: () => {
          setDeleting(device.id);
          deleteDevice(device.id)
            .catch(e => Alert.alert('Xoá thất bại', e.message))
            .finally(() => setDeleting(null));
        },
      },
    ]);
  };

  return (
    <View>
      <Header title="Quản lý thiết bị" onBack={onBack} />

      {/* Cài đặt rung máy nhận */}
      <View
        style={[
          styles.settingsCard,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Cài đặt rung máy nhận
        </Text>
        <Text style={[styles.sectionSubtitle, { color: theme.muted }]}>
          Kéo thanh bar để tuỳ chỉnh độ dài và cường độ rung khi nhận tín hiệu
        </Text>

        <SliderBar
          label="Thời gian 1 lần rung"
          value={durationMs}
          min={MIN_DURATION_MS}
          max={MAX_DURATION_MS}
          step={10}
          unit="ms"
          onChange={updateDuration}
          accentColor="#3b6cf6"
        />

        <SliderBar
          label="Độ rung (Biên độ)"
          value={amplitude}
          min={MIN_AMPLITUDE}
          max={MAX_AMPLITUDE}
          step={5}
          formatValue={val => `${val}${val === 255 ? ' (Tối đa)' : ''}`}
          onChange={updateAmplitude}
          accentColor="#7928ca"
        />

        <Pressable
          accessibilityRole="button"
          onPress={() => testVibrate(durationMs, amplitude)}
          style={({ pressed }) => [
            styles.testButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.testButtonText}>⚡ Thử rung mẫu</Text>
        </Pressable>
      </View>

      <Text style={[styles.deviceListHeader, { color: theme.muted }]}>
        DANH SÁCH THIẾT BỊ
      </Text>

      {loading ? (
        <ActivityIndicator color={SEND_COLOR} style={styles.message} />
      ) : error ? (
        <Text style={[styles.message, styles.error]}>{error}</Text>
      ) : devices.length === 0 ? (
        <Text
          testID="manage-empty"
          style={[styles.message, { color: theme.muted }]}
        >
          Chưa có thiết bị nào.
        </Text>
      ) : (
        devices.map(device => (
          <View
            key={device.id}
            testID={`manage-${device.id}`}
            style={[
              styles.row,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <View style={styles.body}>
              <Text style={[styles.name, { color: theme.text }]}>
                {device.id === myDeviceId
                  ? `${device.name} (máy này)`
                  : device.name}
              </Text>
              <Text style={[styles.id, { color: theme.muted }]}>
                {device.id}
              </Text>
            </View>
            {deleting === device.id ? (
              <ActivityIndicator color={DANGER_COLOR} style={styles.delete} />
            ) : (
              <Pressable
                testID={`delete-${device.id}`}
                accessibilityRole="button"
                accessibilityLabel={`Xoá ${device.name}`}
                onPress={() => confirmDelete(device)}
                style={({ pressed }) => [
                  styles.delete,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.deleteText}>Xoá</Text>
              </Pressable>
            )}
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  message: {
    marginTop: 32,
    fontSize: 16,
    textAlign: 'center',
  },
  error: {
    color: DANGER_COLOR,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
    paddingLeft: 20,
    paddingRight: 12,
    paddingVertical: 16,
  },
  body: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
  },
  id: {
    marginTop: 4,
    fontSize: 13,
  },
  settingsCard: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: 14,
    lineHeight: 18,
  },
  testButton: {
    marginTop: 10,
    backgroundColor: '#3b6cf6',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  deviceListHeader: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 4,
  },
  delete: {
    minWidth: 64,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(217,48,37,0.1)',
  },
  pressed: {
    opacity: 0.6,
  },
  deleteText: {
    color: DANGER_COLOR,
    fontSize: 15,
    fontWeight: '600',
  },
});
