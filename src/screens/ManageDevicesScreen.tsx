import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Header } from '../components/Header';
import { Device, deleteDevice, useDevices, useMyDeviceId } from '../device';
import { SEND_COLOR, useTheme } from '../theme';

const DANGER_COLOR = '#d93025';

type Props = { onBack: () => void };

export function ManageDevicesScreen({ onBack }: Props) {
  const theme = useTheme();
  const { devices, loading, error } = useDevices();
  const myDeviceId = useMyDeviceId();
  const [deleting, setDeleting] = useState<string | null>(null);

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
