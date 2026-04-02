import { createStandardApp } from "@repo/core";

const bootDebugEnabled = (() => {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return new URLSearchParams(window.location.search).has("__bootDebug");
  } catch {
    return false;
  }
})();

type SystemBootTraceItem = {
  stage: string;
  detail?: unknown;
  time: number;
};

const pushBootTrace = (stage: string, detail?: unknown) => {
  if (!bootDebugEnabled || typeof window === "undefined") {
    return;
  }

  const payload: SystemBootTraceItem = {
    stage,
    detail,
    time: Date.now(),
  };
  const target = window as typeof window & {
    __SYSTEM_BOOT_TRACE__?: SystemBootTraceItem[];
    __SYSTEM_BOOT_LAST__?: SystemBootTraceItem;
  };
  target.__SYSTEM_BOOT_TRACE__ = target.__SYSTEM_BOOT_TRACE__ || [];
  target.__SYSTEM_BOOT_TRACE__?.push(payload);
  target.__SYSTEM_BOOT_LAST__ = payload;
};

pushBootTrace("main:start");

const bootstrapPromise = createStandardApp();

pushBootTrace("main:createStandardApp-called");

if (bootDebugEnabled) {
  window.setTimeout(() => {
    pushBootTrace("main:still-pending-after-5000ms");
  }, 5000);
}

bootstrapPromise
  .then((bootstrap) => {
    const app = bootstrap.getApp();
    app.config.errorHandler = (error, _instance, info) => {
      pushBootTrace("main:vue-error", {
        info,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      console.error("[SystemBootstrap] vue-error", info, error);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("error", (event) => {
        pushBootTrace("main:window-error", {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error instanceof Error ? event.error.stack : undefined,
        });
      });
      window.addEventListener("unhandledrejection", (event) => {
        const reason = event.reason;
        pushBootTrace("main:unhandledrejection", {
          message: reason instanceof Error ? reason.message : String(reason),
          stack: reason instanceof Error ? reason.stack : undefined,
        });
      });
    }
    pushBootTrace("main:createStandardApp-resolved");
    return bootstrap.mount("#app");
  })
  .then(() => {
    pushBootTrace("main:mount-resolved");
  })
  .catch((error) => {
    pushBootTrace("main:bootstrap-failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    console.error("[SystemBootstrap] main:bootstrap-failed", error);
  });
