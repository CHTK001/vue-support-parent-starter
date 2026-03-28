import type { ProtocolType } from "@repo/core";

export interface MonitorGlobalSocketStartupOptions {
  enabled: boolean;
  startupConnect: boolean;
  protocol: ProtocolType;
  context: string;
  urls: string[];
}

const toBoolean = (
  value: unknown,
  defaultValue: boolean,
): boolean => {
  if (value === null || value === undefined || value === "") {
    return defaultValue;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      return defaultValue;
    }
    if (["true", "1", "yes", "on"].includes(normalized)) {
      return true;
    }
    if (["false", "0", "no", "off"].includes(normalized)) {
      return false;
    }
  }

  return defaultValue;
};

const splitSocketUrls = (value: unknown): string[] => {
  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const resolveOriginFromValue = (value: unknown): string | null => {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  try {
    if (typeof window !== "undefined" && window.location?.origin) {
      return new URL(value, window.location.origin).origin;
    }

    return new URL(value).origin;
  } catch {
    return null;
  }
};

const resolveDefaultSocketUrls = (
  config?: Record<string, any> | null,
): string[] => {
  const explicitUrls = splitSocketUrls(config?.SocketUrl);
  if (explicitUrls.length > 0) {
    return explicitUrls;
  }

  const baseUrlCandidates = [
    config?.BaseUrl,
    config?.Request?.baseURL,
  ];

  for (const candidate of baseUrlCandidates) {
    const origin = resolveOriginFromValue(candidate);
    if (origin) {
      return [origin];
    }
  }

  if (
    typeof window !== "undefined" &&
    typeof window.location?.origin === "string" &&
    /^https?:/i.test(window.location.origin)
  ) {
    return [window.location.origin];
  }

  return [];
};

export const resolveMonitorGlobalSocketStartupOptions = (
  config?: Record<string, any> | null,
): MonitorGlobalSocketStartupOptions => {
  const protocol =
    typeof config?.SocketProtocol === "string" && config.SocketProtocol.trim()
      ? config.SocketProtocol.trim().toLowerCase()
      : "socketio";

  return {
    enabled: toBoolean(config?.SocketOpen, true),
    startupConnect: toBoolean(config?.SocketStartupConnect, true),
    protocol: ["socketio", "rsocket", "websocket", "sse"].includes(protocol)
      ? (protocol as ProtocolType)
      : "socketio",
    context:
      typeof config?.SocketPath === "string" && config.SocketPath.trim()
        ? config.SocketPath.trim()
        : "/socket.io",
    urls: resolveDefaultSocketUrls(config),
  };
};
