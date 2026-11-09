module.exports = {
  preset: 'react-native',
  setupFiles: ['./jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(@react-native|react-native|@react-navigation|react-native-reanimated|@tanstack|@notifee|@shopify|lucide-react-native)/)',
  ],
};
