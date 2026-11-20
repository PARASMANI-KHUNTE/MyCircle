/* eslint-env jest */
require('react-native-gesture-handler/jestSetup');

jest.mock('@react-native-firebase/app', () => ({
  initializeApp: jest.fn(),
  getApp: jest.fn(() => ({})),
  getApps: jest.fn(() => [{}]),
  apps: [{}],
  utils: () => ({
    FilePath: {
      PICTURES_DIRECTORY: '/mock/pictures',
    },
  }),
}));

jest.mock('@react-native-firebase/messaging', () => {
  const AuthorizationStatus = {
    AUTHORIZED: 1,
    PROVISIONAL: 2,
    DENIED: 0,
  };
  const requestPermission = jest.fn().mockResolvedValue(AuthorizationStatus.AUTHORIZED);
  const getToken = jest.fn().mockResolvedValue('mock-fcm-token');
  const onMessage = jest.fn(() => () => {});
  const onNotificationOpenedApp = jest.fn(() => () => {});
  const getInitialNotification = jest.fn().mockResolvedValue(null);
  const setBackgroundMessageHandler = jest.fn();
  const messaging = () => ({
    requestPermission,
    getToken,
    onMessage,
    onNotificationOpenedApp,
    getInitialNotification,
    setBackgroundMessageHandler,
  });
  messaging.AuthorizationStatus = AuthorizationStatus;
  return {
    __esModule: true,
    default: messaging,
    getMessaging: messaging,
    AuthorizationStatus,
    requestPermission,
    getToken,
    onMessage,
    onNotificationOpenedApp,
    getInitialNotification,
    setBackgroundMessageHandler,
  };
});

jest.mock('@notifee/react-native', () => {
  const requestPermission = jest.fn().mockResolvedValue({ authorizationStatus: 1 });
  const getInitialNotification = jest.fn().mockResolvedValue(null);
  const createChannel = jest.fn().mockResolvedValue('mycircle_channel_v1');
  const displayNotification = jest.fn().mockResolvedValue('notification-id');
  const onForegroundEvent = jest.fn(() => () => {});
  const onBackgroundEvent = jest.fn(() => () => {});
  const notifee = {
    requestPermission,
    getInitialNotification,
    createChannel,
    displayNotification,
    onForegroundEvent,
    onBackgroundEvent,
  };

  return {
    __esModule: true,
    default: notifee,
    ...notifee,
    AndroidImportance: { NONE: 0, MIN: 1, LOW: 2, DEFAULT: 3, HIGH: 4, MAX: 5 },
    EventType: { PRESS: 1, ACTION_PRESS: 2, DISMISSED: 3 },
  };
});

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn().mockResolvedValue(true),
    signIn: jest.fn().mockResolvedValue({ idToken: 'mock-id-token' }),
    signOut: jest.fn().mockResolvedValue(null),
    getCurrentUser: jest.fn().mockReturnValue(null),
  },
  statusCodes: {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  },
}));

jest.mock('react-native-gesture-handler/ReanimatedSwipeable', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Swipeable = ({ children }) => React.createElement(View, null, children);
  return { __esModule: true, default: Swipeable };
});

jest.mock('@shopify/flash-list', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { FlashList: (props) => React.createElement(View, props) };
});

jest.mock('lucide-react-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Icon = () => React.createElement(View);
  return new Proxy({}, { get: () => Icon });
});

jest.mock('react-native-reanimated', () => {
  const { View, Text, Image, ScrollView } = require('react-native');
  const animation = () => ({});
  const Animated = {
    View,
    Text,
    Image,
    ScrollView,
    createAnimatedComponent: (Component) => Component,
  };
  return {
    __esModule: true,
    default: Animated,
    FadeIn: animation,
    FadeInDown: animation,
    FadeInUp: animation,
    FadeInRight: animation,
    FadeOutDown: animation,
    FadeOutLeft: animation,
    SlideInRight: animation,
    useSharedValue: (value) => ({ value }),
    useAnimatedStyle: () => ({}),
    withDelay: (delay, next) => next,
    withRepeat: (next) => next,
    withSequence: (...next) => next[next.length - 1],
    withSpring: (value) => value,
    withTiming: (value) => value,
    Easing: { ease: (value) => value, inOut: (easing) => easing },
    interpolate: () => 0,
    Extrapolation: { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' },
  };
});

jest.mock('react-native-sound', () => {
  class SoundMock {
    static setCategory = jest.fn();
    play = jest.fn((cb) => cb && cb(true));
    stop = jest.fn();
    release = jest.fn();
  }
  return SoundMock;
});

jest.mock('react-native-webview', () => {
  const { View } = require('react-native');
  return {
    WebView: View,
    default: View,
  };
});

jest.mock('@react-native-community/geolocation', () => ({
  setRNConfiguration: jest.fn(),
  requestAuthorization: jest.fn((success) => success && success()),
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(() => 1),
  clearWatch: jest.fn(),
}));

jest.mock('react-native-android-location-enabler', () => ({
  isLocationEnabled: jest.fn().mockResolvedValue(true),
  promptForEnableLocationIfNeeded: jest.fn().mockResolvedValue('already-enabled'),
}));

const { PermissionsAndroid } = require('react-native');
jest.spyOn(PermissionsAndroid, 'check').mockResolvedValue(true);
jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue(
  PermissionsAndroid.RESULTS.GRANTED
);

jest.mock('react-native-keychain', () => ({
  getGenericPassword: jest.fn().mockResolvedValue(false),
  setGenericPassword: jest.fn().mockResolvedValue(false),
  resetGenericPassword: jest.fn().mockResolvedValue(true),
}));

jest.mock('@react-native-clipboard/clipboard', () => ({
  setString: jest.fn(),
  getString: jest.fn().mockResolvedValue(''),
  hasString: jest.fn().mockResolvedValue(false),
}));

jest.mock('react-native-code-push', () => {
  const cp = (_app) => _app;
  cp.CheckFrequency = { ON_APP_START: 0 };
  cp.InstallMode = { IMMEDIATE: 0, ON_NEXT_RESTART: 1 };
  cp.sync = jest.fn();
  return cp;
});

jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map();
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (key) => (store.has(key) ? store.get(key) : null)),
      setItem: jest.fn(async (key, value) => {
        store.set(key, value);
      }),
      removeItem: jest.fn(async (key) => {
        store.delete(key);
      }),
      clear: jest.fn(async () => store.clear()),
      getAllKeys: jest.fn(async () => Array.from(store.keys())),
      multiGet: jest.fn(async (keys) => keys.map((key) => [key, store.get(key) ?? null])),
      multiSet: jest.fn(async (entries) => entries.forEach(([key, value]) => store.set(key, value))),
      multiRemove: jest.fn(async (keys) => keys.forEach((key) => store.delete(key))),
    },
  };
});

jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');
