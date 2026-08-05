// Reads app.json as the base manifest and applies build-time overrides.
// app.config.js takes precedence over app.json when both exist.
const appJson = require("./app.json");

const googleMapsApiKey =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "YOUR_GOOGLE_MAPS_API_KEY";

const plugins = Array.isArray(appJson.expo.plugins) ? [...appJson.expo.plugins] : [];
if (!plugins.some((p) => p === "expo-image-picker" || (Array.isArray(p) && p[0] === "expo-image-picker"))) {
  plugins.push(["expo-image-picker", { microphonePermission: false }]);
}

module.exports = {
  ...appJson.expo,
  android: {
    ...(appJson.expo.android || {}),
    config: {
      ...(appJson.expo.android?.config || {}),
      googleMaps: {
        apiKey: googleMapsApiKey,
      },
    },
  },
  plugins,
};
