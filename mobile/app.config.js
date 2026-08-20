module.exports = ({ config }) => {
  return {
    ...config,
    name: config.name || "Pharma Plus",
    slug: "pharma-plus",
    plugins: [
      ...(config.plugins || []),
      ["expo-image-picker", { microphonePermission: false }]
    ],
    extra: {
      ...(config.extra || {}),
      eas: {
        projectId: "0669596a-2bc7-4628-8677-e23752044b87",
      },
    },
    updates: {
      enabled: true,
      checkAutomatically: "ON_LOAD",
      fallbackToCacheTimeout: 0,
      url: "https://u.expo.dev/0669596a-2bc7-4628-8677-e23752044b87",
      ...(config.updates || {}),
    },
    runtimeVersion: {
      policy: "appVersion",
    },
  };
};