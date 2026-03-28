type GenericConfig = Record<string, any> | null | undefined;

export interface ResolvedRequestConfig {
  timeout: number;
  retryCount: number;
  retryDelay: number;
  showLoading: boolean;
  enable: boolean;
  enableSign: boolean;
  enableEncrypt: boolean;
  codecRequestKey: string;
  secretKey: string;
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

const toNumber = (
  value: unknown,
  defaultValue: number,
): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim();
    if (!normalized) {
      return defaultValue;
    }
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return defaultValue;
};

const firstNonEmptyString = (...values: unknown[]): string => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
};

const requestSection = (config: GenericConfig) => config?.Request ?? {};

export const resolveRequestEncryptConfig = (config: GenericConfig) => {
  const request = requestSection(config);

  return {
    enableEncrypt: toBoolean(
      request?.enableEncrypt ??
        config?.CodecRequestOpen ??
        config?.requestCodecOpen,
      false,
    ),
    codecRequestKey: firstNonEmptyString(
      request?.codecRequestKey,
      config?.CodecRequestKey,
      config?.codecRequestKey,
    ),
  };
};

export const resolveRequestSecretKey = (
  config: GenericConfig,
  defaultSecretKey = "",
): string =>
  firstNonEmptyString(requestSection(config)?.secretKey, config?.secretKey) ||
  defaultSecretKey;

export const resolveRequestConfig = (
  config: GenericConfig,
): ResolvedRequestConfig => {
  const request = requestSection(config);
  const encryptConfig = resolveRequestEncryptConfig(config);

  return {
    timeout: toNumber(request?.timeout ?? config?.baseHttpTimeout, 30000),
    retryCount: toNumber(request?.retryCount, 3),
    retryDelay: toNumber(request?.retryDelay, 1000),
    showLoading: toBoolean(request?.showLoading, true),
    enable: toBoolean(request?.enable, true),
    enableSign: toBoolean(request?.enableSign, true),
    enableEncrypt: encryptConfig.enableEncrypt,
    codecRequestKey: encryptConfig.codecRequestKey,
    secretKey: resolveRequestSecretKey(config),
  };
};
