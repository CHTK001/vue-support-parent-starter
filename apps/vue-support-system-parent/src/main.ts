import { createStandardApp } from "@repo/core";

createStandardApp({
  setup(app) {
    app.config.errorHandler = (error, _instance, info) => {
      console.error("[SystemBootstrap] vue-error", info, error);
    };

    if (typeof window === "undefined") {
      return;
    }

    window.addEventListener("error", (event) => {
      console.error("[SystemBootstrap] window-error", {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error instanceof Error ? event.error.stack : undefined,
      });
    });

    window.addEventListener("unhandledrejection", (event) => {
      const reason = event.reason;
      console.error("[SystemBootstrap] unhandledrejection", {
        message: reason instanceof Error ? reason.message : String(reason),
        stack: reason instanceof Error ? reason.stack : undefined,
      });
    });
  },
})
  .then((bootstrap) => bootstrap.mount("#app"))
  .catch((error) => {
    console.error("[SystemBootstrap] bootstrap-failed", error);
  });
