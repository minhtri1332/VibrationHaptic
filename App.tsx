/**
 * Vibration signal: send A–D to Firebase, receive and vibrate.
 *
 * @format
 */

import { useEffect, useState } from 'react';
import {
  BackHandler,
  ScrollView,
  StatusBar,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { FloatingButton } from './src/components/FloatingButton';
import { FormCreateDevice } from './src/components/FormCreateDevice';
import { Device } from './src/device';
import { DeviceListScreen } from './src/screens/DeviceListScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ManageDevicesScreen } from './src/screens/ManageDevicesScreen';
import { ReceiveScreen } from './src/screens/ReceiveScreen';
import { SendScreen } from './src/screens/SendScreen';
import { useTheme } from './src/theme';

type Screen =
  | { name: 'home' }
  | { name: 'devices' }
  | { name: 'send'; device: Device }
  | { name: 'receive' }
  | { name: 'manage' };

const HOME: Screen = { name: 'home' };

// Where the back button / gesture goes from each screen.
const parentOf = (screen: Screen): Screen =>
  screen.name === 'send' ? { name: 'devices' } : HOME;

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaProvider>
  );
}

const GRADIENT_LIGHT = ['#e8f0fe', '#d4e4fc', '#e0d7f8'];
const GRADIENT_DARK = ['#0a0a1a', '#111233', '#1a0e2e'];

function AppContent() {
  const safeAreaInsets = useSafeAreaInsets();
  const theme = useTheme();
  const isDark = useColorScheme() === 'dark';
  const [screen, setScreen] = useState<Screen>(HOME);
  const [formVisible, setFormVisible] = useState(false);
  const goBack = () => setScreen(parentOf(screen));

  useEffect(() => {
    if (screen.name === 'home') {
      return;
    }
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        setScreen(parentOf(screen));
        return true;
      },
    );
    return () => subscription.remove();
  }, [screen]);

  const rootProps =
  {
    colors: isDark ? GRADIENT_DARK : GRADIENT_LIGHT,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
    style: styles.root,
  }


  return (
    <LinearGradient {...rootProps}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{
          paddingTop: safeAreaInsets.top + 16,
          paddingBottom: safeAreaInsets.bottom + 16,
        }}
      >
        {/* A real, keyed root per screen: Fabric then removes one native view on
          navigation instead of diffing flattened children (which hit
          "Unable to find viewState ... for removeViewAt" leaving ReceiveScreen). */}
        <View key={screen.name} collapsable={false}>
          {screen.name === 'home' && (
            <HomeScreen
              onSend={() => setScreen({ name: 'devices' })}
              onReceive={() => setScreen({ name: 'receive' })}
              onEdit={() => setScreen({ name: 'manage' })}
            />
          )}
          {screen.name === 'devices' && (
            <DeviceListScreen
              onBack={goBack}
              onSelect={device => setScreen({ name: 'send', device })}
            />
          )}
          {screen.name === 'send' && (
            <SendScreen device={screen.device} onBack={goBack} />
          )}
          {screen.name === 'receive' && <ReceiveScreen onBack={goBack} />}
          {screen.name === 'manage' && <ManageDevicesScreen onBack={goBack} />}
        </View>
      </ScrollView>
      {screen.name === 'home' && (
        <FloatingButton
          testID="fab-create-device"
          accessibilityLabel="Tạo thiết bị"
          onPress={() => setFormVisible(true)}
        />
      )}
      <FormCreateDevice
        visible={formVisible}
        onClose={() => setFormVisible(false)}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
});

export default App;
