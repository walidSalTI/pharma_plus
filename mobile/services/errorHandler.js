const LOG_PREFIX = "[GlobalError]";

export const setupGlobalErrorHandling = () => {
  if (global.ErrorUtils && typeof global.ErrorUtils.setGlobalHandler === "function") {
    const previousHandler = global.ErrorUtils.getGlobalHandler();
    global.ErrorUtils.setGlobalHandler((error, isFatal) => {
      console.error(LOG_PREFIX, isFatal ? "FATAL" : "NON-FATAL", error);
      if (typeof previousHandler === "function") {
        try {
          previousHandler(error, isFatal);
        } catch (e) {
          console.error(LOG_PREFIX, "previous handler threw", e);
        }
      }
    });
  }

  if (typeof global.addEventListener === "function") {
    global.addEventListener("unhandledrejection", (event) => {
      console.error(LOG_PREFIX, "Unhandled promise rejection", event && event.reason);
    });
  }
};
