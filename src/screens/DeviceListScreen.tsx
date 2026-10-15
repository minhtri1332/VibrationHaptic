import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { FeatureCard } from '../components/FeatureCard';
import { Header } from '../components/Header';
import { Device, useDevices, useMyDeviceId } from '../device';
import { SEND_COLOR, useTheme } from '../theme';

type Props = { onBack: () => void; onSelect: (device: Device) => void };

export function DeviceListScreen({ onBack, onSelect }: Props) {
  const theme = useTheme();
  const { devices, loading, error } = useDevices();
  const myDeviceId = useMyDeviceId();

  return (
    <View>
      <Header title="Chọn thiết bị" onBack={onBack} />
      {loading ? (
        <ActivityIndicator color={SEND_COLOR} style={styles.message} />
      ) : error ? (
        <Text testID="devices-error" style={[styles.message, styles.error]}>
          {error}
        </Text>
      ) : devices.length === 0 ? (
        <Text
          testID="devices-empty"
          style={[styles.message, { color: theme.muted }]}
        >
          Chưa có thiết bị. Bấm + ở màn hình chính để tạo.
        </Text>
      ) : (
        devices.map(device => (
          <FeatureCard
            key={device.id}
            testID={`device-${device.id}`}
            title={
              device.id === myDeviceId
                ? `${device.name} (máy này)`
                : device.name
            }
            description={device.id}
            color={SEND_COLOR}
            onPress={() => onSelect(device)}
          />
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
    color: '#d93025',
  },
});
