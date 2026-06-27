// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Bundle 3D model assets so `require('*.glb')` resolves like an image/font.
config.resolver.assetExts.push('glb', 'gltf', 'bin');

module.exports = config;
