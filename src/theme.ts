import { useColorScheme } from 'react-native';

const light = {
  background: '#f4f4f6',
  card: '#ffffff',
  text: '#111111',
  muted: '#6b6b75',
  border: '#e2e2e8',
};

const dark: typeof light = {
  background: '#000000',
  card: '#1c1c1f',
  text: '#ffffff',
  muted: '#9a9aa3',
  border: '#2c2c31',
};

export const SEND_COLOR = '#3b6cf6';
export const RECEIVE_COLOR = '#12a36b';

export function useTheme() {
  return useColorScheme() === 'dark' ? dark : light;
}
