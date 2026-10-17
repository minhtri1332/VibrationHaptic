import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FeatureCard } from '../components/FeatureCard';
import { Header } from '../components/Header';
import { RECEIVE_COLOR, SEND_COLOR, useTheme } from '../theme';

type Props = {
  onSend: () => void;
  onReceive: () => void;
  onEdit: () => void;
};

export function HomeScreen({ onSend, onReceive, onEdit }: Props) {
  const theme = useTheme();

  return (
    <View>
      <Header
        title="Tín hiệu rung"
        right={
          <Pressable
            testID="edit-devices"
            accessibilityRole="button"
            accessibilityLabel="Quản lý thiết bị"
            onPress={onEdit}
            hitSlop={12}
          >
            <Text style={[styles.edit, { color: theme.text }]}>✎</Text>
          </Pressable>
        }
      />
      <FeatureCard
        testID="card-send"
        title="Truyền tín hiệu"
        description="Chọn thiết bị rồi gửi 1, 2, 3 hoặc 4"
        color={SEND_COLOR}
        onPress={onSend}
      />
      <FeatureCard
        testID="card-receive"
        title="Nhận tín hiệu"
        description="Chờ tín hiệu và rung theo"
        color={RECEIVE_COLOR}
        onPress={onReceive}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  edit: {
    fontSize: 28,
  },
});

