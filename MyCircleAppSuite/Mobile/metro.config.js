const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/** @type {import('@react-native/metro-config').MetroConfig} */
const config = mergeConfig(getDefaultConfig(__dirname), {});

module.exports = config;