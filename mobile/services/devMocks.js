export const isMockLoginEnabled = () => {
  if (process.env.EXPO_PUBLIC_DISABLE_MOCK_LOGIN === "1") return false;
  if (process.env.EXPO_PUBLIC_ALLOW_MOCK_LOGIN === "1") return true;
  return __DEV__;
};

export const isConnectionError = (error) => {
  if (!error) return false;
  if (error.status) return false;
  const message = String(error.message || "").toLowerCase();
  return (
    message.includes("timed out") ||
    message.includes("timeout") ||
    message.includes("network") ||
    message.includes("connection") ||
    message.includes("fetch") ||
    message.includes("api_base_url")
  );
};
