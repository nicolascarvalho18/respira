/* eslint-env jest */
/* eslint-disable @typescript-eslint/no-var-requires, @typescript-eslint/no-explicit-any */
require('@testing-library/jest-native/extend-expect');

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Expo SecureStore
const secureStoreMock: Record<string, string> = {};
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(async (key: string, value: string) => {
    secureStoreMock[key] = value;
  }),
  getItemAsync: jest.fn(async (key: string) => {
    return secureStoreMock[key] ?? null;
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    delete secureStoreMock[key];
  }),
}));

// Mock Expo Haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
}));

// Mock Expo Notifications
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  scheduleNotificationAsync: jest.fn(async () => 'mock-notification-id'),
  cancelAllScheduledNotificationsAsync: jest.fn(),
}));

// Mock Expo Router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({ id: 'mock-id' }),
  Tabs: Object.assign(({ children }: any) => children, {
    Screen: () => null,
  }),
  Stack: Object.assign(({ children }: any) => children, {
    Screen: () => null,
  }),
}));

// Mock React Native Reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock Expo AV
jest.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn(async () => ({
        sound: {
          playAsync: jest.fn(),
          pauseAsync: jest.fn(),
          unloadAsync: jest.fn(),
          setPositionAsync: jest.fn(),
          setVolumeAsync: jest.fn(),
        },
        status: { isLoaded: true },
      })),
    },
    setAudioModeAsync: jest.fn(),
  },
}));
