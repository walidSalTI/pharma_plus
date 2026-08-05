let unauthorizedHandler = null;

export const registerUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
  return () => {
    if (unauthorizedHandler === handler) {
      unauthorizedHandler = null;
    }
  };
};

export const emitUnauthorized = () => {
  if (typeof unauthorizedHandler === "function") {
    try {
      unauthorizedHandler();
    } catch (e) {
      console.error("[AuthEvents] unauthorized handler threw:", e);
    }
  }
};
