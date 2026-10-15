import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { createDevice, useDeviceName, useMyDeviceId } from '../device';
import { SEND_COLOR, useTheme } from '../theme';

type Props = { visible: boolean; onClose: () => void };

export function FormCreateDevice({ visible, onClose }: Props) {
  const theme = useTheme();
  const deviceId = useMyDeviceId();
  const existingName = useDeviceName(deviceId);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Opening the form on an already created device renames it.
  useEffect(() => {
    if (visible) {
      setName(existingName ?? '');
      setError(null);
    }
  }, [visible, existingName]);

  const trimmed = name.trim();
  const canSave = !!deviceId && trimmed.length > 0 && !saving;

  const onSave = () => {
    if (!deviceId || !canSave) {
      return;
    }
    setSaving(true);
    setError(null);
    createDevice(deviceId, trimmed)
      .then(onClose)
      .catch(e => setError(e.message))
      .finally(() => setSaving(false));
  };

  const inputStyle = [
    styles.input,
    {
      color: theme.text,
      borderColor: theme.border,
      backgroundColor: theme.background,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.title, { color: theme.text }]}>
            {existingName ? 'Sửa thiết bị' : 'Tạo thiết bị'}
          </Text>

          <Text style={[styles.label, { color: theme.muted }]}>
            Tên thiết bị
          </Text>
          <TextInput
            testID="device-name-input"
            value={name}
            onChangeText={setName}
            placeholder="VD: Điện thoại của Trí"
            placeholderTextColor={theme.muted}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={onSave}
            style={inputStyle}
          />

          <Text style={[styles.label, { color: theme.muted }]}>Mã nhận dạng</Text>
          <TextInput
            testID="device-id-input"
            value={deviceId ?? 'Đang lấy…'}
            editable={false}
            style={[inputStyle, { color: theme.muted }]}
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.actions}>
            <Pressable
              testID="device-form-cancel"
              accessibilityRole="button"
              onPress={onClose}
              style={styles.button}
            >
              <Text style={[styles.buttonText, { color: theme.muted }]}>
                Huỷ
              </Text>
            </Pressable>
            <Pressable
              testID="device-form-save"
              accessibilityRole="button"
              disabled={!canSave}
              onPress={onSave}
              style={[styles.button, styles.save, !canSave && styles.disabled]}
            >
              <Text style={[styles.buttonText, styles.saveText]}>
                {saving ? 'Đang lưu…' : 'Lưu'}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  card: {
    borderRadius: 20,
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  error: {
    color: '#d93025',
    fontSize: 14,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    columnGap: 12,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  save: {
    backgroundColor: SEND_COLOR,
  },
  disabled: {
    opacity: 0.4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveText: {
    color: '#fff',
  },
});
