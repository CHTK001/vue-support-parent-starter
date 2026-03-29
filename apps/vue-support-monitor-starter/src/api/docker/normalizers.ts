export type NormalizableContainer = {
  systemSoftContainerId?: number | string;
  containerId?: number | string;
  systemServerId?: number | string;
  systemSoftContainerStatus?: string;
  systemSoftContainerServerName?: string;
  systemServerName?: string;
  serverName?: string;
  systemSoftContainerName?: string;
  systemSoftContainerImage?: string;
  systemSoftContainerImageTag?: string;
  systemSoftContainerDockerId?: string;
  [key: string]: any;
};

export const normalizeImageStatusValue = (status?: string) => {
  if (!status) {
    return status;
  }

  return status.trim().replace(/-/g, "_").toUpperCase();
};

export const normalizeContainerStatusValue = (status?: string) => {
  if (!status) {
    return status;
  }

  const normalized = status.trim().replace(/-/g, "_").toLowerCase();

  if (normalized === "exited") {
    return "stopped";
  }

  if (
    [
      "create_failed",
      "start_failed",
      "restart_failed",
      "stop_failed",
      "delete_failed",
      "dead",
    ].includes(normalized)
  ) {
    return "error";
  }

  return normalized;
};

export const normalizeContainer = <T extends NormalizableContainer>(
  container: T,
) => {
  const primaryId =
    container?.systemSoftContainerId ?? container?.containerId;
  const normalizedStatus = normalizeContainerStatusValue(
    container?.status ?? container?.systemSoftContainerStatus,
  );
  const serverName =
    container?.systemSoftContainerServerName ??
    container?.systemServerName ??
    container?.serverName ??
    (container?.systemServerId ? `服务器 #${container.systemServerId}` : undefined);

  return {
    ...container,
    id: container?.id ?? primaryId,
    containerId:
      container?.containerId ??
      (primaryId !== undefined && primaryId !== null ? String(primaryId) : ""),
    name: container?.name ?? container?.systemSoftContainerName,
    image: container?.image ?? container?.systemSoftContainerImage,
    imageTag: container?.imageTag ?? container?.systemSoftContainerImageTag,
    serverId: container?.serverId ?? container?.systemServerId,
    serverName,
    systemSoftContainerServerName: serverName,
    dockerId: container?.dockerId ?? container?.systemSoftContainerDockerId,
    systemSoftContainerStatus: normalizedStatus,
    status: normalizedStatus,
  };
};

const toTrimmedString = (value: unknown) => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return undefined;
};

const toBoolean = (value: unknown) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    if (value === "true") {
      return true;
    }
    if (value === "false") {
      return false;
    }
  }

  return undefined;
};

const tryParseJson = (value: unknown) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed || !["[", "{"].includes(trimmed[0])) {
    return value;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
};

const toStringArray = (value: unknown) => {
  const parsed = tryParseJson(value);

  if (Array.isArray(parsed)) {
    return parsed
      .map((item) => toTrimmedString(item))
      .filter((item): item is string => Boolean(item));
  }

  if (parsed && typeof parsed === "object") {
    return Object.values(parsed)
      .map((item) => toTrimmedString(item))
      .filter((item): item is string => Boolean(item));
  }

  const single = toTrimmedString(parsed);
  return single ? [single] : [];
};

const normalizePortBindingEntry = (entry: any): string | undefined => {
  if (typeof entry === "string") {
    const normalized = entry.trim();
    if (!normalized) {
      return undefined;
    }
    return normalized.includes("/") ? normalized : `${normalized}/tcp`;
  }

  if (!entry || typeof entry !== "object") {
    return undefined;
  }

  const hostPort = toTrimmedString(
    entry.hostPort ?? entry.host ?? entry.HostPort ?? entry.publicPort,
  );
  const containerPort = toTrimmedString(
    entry.containerPort ?? entry.container ?? entry.privatePort ?? entry.port,
  );
  const protocol =
    toTrimmedString(entry.protocol ?? entry.type)?.toLowerCase() || "tcp";

  if (!hostPort || !containerPort) {
    return undefined;
  }

  return `${hostPort}:${containerPort}/${protocol}`;
};

const normalizePortBindings = (value: unknown) => {
  const parsed = tryParseJson(value);

  if (Array.isArray(parsed)) {
    return parsed
      .map((item) => normalizePortBindingEntry(item))
      .filter((item): item is string => Boolean(item));
  }

  if (parsed && typeof parsed === "object") {
    return Object.entries(parsed)
      .flatMap(([containerPort, hostBindings]) => {
        const normalizedContainerPort = toTrimmedString(containerPort);
        if (!normalizedContainerPort) {
          return [];
        }

        const bindings = Array.isArray(hostBindings)
          ? hostBindings
          : [hostBindings];
        return bindings
          .map((binding) => {
            const hostPort = toTrimmedString(
              binding?.HostPort ?? binding?.hostPort ?? binding?.host,
            );
            if (!hostPort) {
              return undefined;
            }

            return normalizePortBindingEntry({
              hostPort,
              containerPort: normalizedContainerPort,
            });
          })
          .filter((item): item is string => Boolean(item));
      });
  }

  return [];
};

const normalizeEnvironmentVariables = (value: unknown) => {
  const parsed = tryParseJson(value);

  if (Array.isArray(parsed)) {
    return parsed.flatMap((item) => {
      if (typeof item === "string") {
        const normalized = item.trim();
        return normalized ? [normalized] : [];
      }

      if (!item || typeof item !== "object") {
        return [];
      }

      const key = toTrimmedString(item.key ?? item.name);
      if (!key) {
        return [];
      }

      return [`${key}=${item.value ?? ""}`];
    });
  }

  if (parsed && typeof parsed === "object") {
    return Object.entries(parsed)
      .map(([key, itemValue]) => {
        const normalizedKey = toTrimmedString(key);
        return normalizedKey ? `${normalizedKey}=${itemValue ?? ""}` : undefined;
      })
      .filter((item): item is string => Boolean(item));
  }

  const single = toTrimmedString(parsed);
  return single ? [single] : [];
};

const normalizeVolumeBindingEntry = (entry: any): string | undefined => {
  if (typeof entry === "string") {
    const normalized = entry.trim();
    return normalized || undefined;
  }

  if (!entry || typeof entry !== "object") {
    return undefined;
  }

  const hostPath = toTrimmedString(entry.hostPath ?? entry.host ?? entry.source);
  const containerPath = toTrimmedString(
    entry.containerPath ?? entry.container ?? entry.destination ?? entry.target,
  );
  const readOnly = Boolean(entry.readOnly ?? entry.ro);

  if (!hostPath || !containerPath) {
    return undefined;
  }

  return `${hostPath}:${containerPath}${readOnly ? ":ro" : ""}`;
};

const normalizeVolumeBindings = (value: unknown) => {
  const parsed = tryParseJson(value);

  if (Array.isArray(parsed)) {
    return parsed
      .map((item) => normalizeVolumeBindingEntry(item))
      .filter((item): item is string => Boolean(item));
  }

  const single = normalizeVolumeBindingEntry(parsed);
  return single ? [single] : [];
};

const normalizeLabels = (value: unknown) => {
  const parsed = tryParseJson(value);

  if (Array.isArray(parsed)) {
    return parsed.flatMap((item) => {
      if (typeof item === "string") {
        const normalized = item.trim();
        return normalized ? [normalized] : [];
      }

      if (!item || typeof item !== "object") {
        return [];
      }

      const key = toTrimmedString(item.key ?? item.name);
      if (!key) {
        return [];
      }

      return [`${key}=${item.value ?? ""}`];
    });
  }

  if (parsed && typeof parsed === "object") {
    return Object.entries(parsed)
      .map(([key, itemValue]) => {
        const normalizedKey = toTrimmedString(key);
        return normalizedKey ? `${normalizedKey}=${itemValue ?? ""}` : undefined;
      })
      .filter((item): item is string => Boolean(item));
  }

  return [];
};

const parseMemoryLimit = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.round(value);
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }

  const match = normalized.match(/^(\d+(?:\.\d+)?)([kmgt]i?b?|b)?$/);
  if (!match) {
    return undefined;
  }

  const amount = Number(match[1]);
  const unit = match[2] || "b";
  if (!Number.isFinite(amount) || amount <= 0) {
    return undefined;
  }

  const multiplier =
    unit === "b"
      ? 1
      : unit.startsWith("k")
        ? 1024
        : unit.startsWith("m")
          ? 1024 ** 2
          : unit.startsWith("g")
            ? 1024 ** 3
            : 1024 ** 4;

  return Math.round(amount * multiplier);
};

const parseCpuLimit = (value: unknown) => {
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : Number.NaN;

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return undefined;
  }

  if (numeric <= 256) {
    return Math.round(numeric * 1_000_000_000);
  }

  return Math.round(numeric);
};

export const normalizeImageContainerStartConfig = (
  config: Record<string, any> = {},
) => {
  const normalized = {
    imageName: toTrimmedString(config.imageName),
    containerName: toTrimmedString(
      config.containerName ?? config.systemSoftContainerName,
    ),
    portBindings: normalizePortBindings(
      config.portBindings ??
        config.ports ??
        config.portMappings ??
        config.systemSoftContainerPortBindings,
    ),
    environmentVariables: normalizeEnvironmentVariables(
      config.environmentVariables ??
        config.envVars ??
        config.env ??
        config.systemSoftContainerEnv,
    ),
    volumeBindings: normalizeVolumeBindings(
      config.volumeBindings ??
        config.volumes ??
        config.volumeMounts ??
        config.systemSoftContainerBinds,
    ),
    command: toTrimmedString(
      config.command ?? config.systemSoftContainerCommand,
    ),
    args: toTrimmedString(config.args ?? config.systemSoftContainerArgs),
    workingDirectory: toTrimmedString(
      config.workingDirectory ??
        config.workDir ??
        config.systemSoftContainerWorkDir,
    ),
    autoRemove: toBoolean(config.autoRemove),
    autoStart: toBoolean(config.autoStart ?? config.systemSoftContainerAutoStart),
    restartPolicy: toTrimmedString(
      config.restartPolicy ?? config.systemSoftContainerRestartPolicy,
    ),
    networkMode: toTrimmedString(
      config.networkMode ?? config.systemSoftContainerNetworkMode,
    ),
    cpuLimit: parseCpuLimit(
      config.cpuLimit ?? config.systemSoftContainerCpuLimit,
    ),
    memoryLimit: parseMemoryLimit(
      config.memoryLimit ?? config.systemSoftContainerMemoryLimit,
    ),
    privileged: toBoolean(config.privileged),
    user: toTrimmedString(config.user),
    hostname: toTrimmedString(
      config.hostname ?? config.systemSoftContainerHostname,
    ),
    dnsServers: toStringArray(config.dnsServers),
    extraHosts: toStringArray(config.extraHosts),
    labels: normalizeLabels(config.labels),
  } satisfies Record<string, any>;

  return Object.fromEntries(
    Object.entries(normalized).filter(([, value]) => {
      if (value === undefined || value === null || value === "") {
        return false;
      }
      if (Array.isArray(value) && value.length === 0) {
        return false;
      }
      return true;
    }),
  );
};
