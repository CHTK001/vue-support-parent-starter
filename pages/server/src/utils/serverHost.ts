import { Md5 } from "ts-md5";
import type { ServerHost, ServerMetricsSnapshot } from "../api";

export type HostMetricTone = "online" | "offline" | "warning" | "disabled";

const lower = (value?: string | number | null) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

export const normalizeText = (value?: string | number | null) => lower(value);

export const normalizeOs = (value?: string | null) => {
  const text = lower(value);
  if (text.includes("win")) return "windows";
  if (
    text.includes("linux") ||
    text.includes("ubuntu") ||
    text.includes("centos")
  )
    return "linux";
  if (text.includes("mac") || text.includes("darwin")) return "macos";
  return text;
};

export const normalizeArch = (value?: string | null) => {
  const text = lower(value);
  if (["x64", "x86_64", "amd64"].includes(text)) return "amd64";
  if (["arm64", "aarch64"].includes(text)) return "arm64";
  return text;
};

export const safePercent = (value?: number | null) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.min(Math.max(numeric, 0), 100);
};

export const osLabel = (value?: string | null) =>
  ({
    windows: "Windows",
    linux: "Linux",
    macos: "macOS",
  })[normalizeOs(value)] || (value ? String(value) : "未知系统");

export const osIcon = (value?: string | null) =>
  ({
    windows: "ri:windows-line",
    linux: "ri:ubuntu-line",
    macos: "ri:apple-fill",
  })[normalizeOs(value)] || "ri:computer-line";

export const archLabel = (value?: string | null) => {
  const normalized = normalizeArch(value);
  return (
    {
      amd64: "AMD64",
      arm64: "ARM64",
    }[normalized] || (value ? String(value).toUpperCase() : "未知架构")
  );
};

export const serverTypeLabel = (value?: string | null) =>
  ({
    LOCAL: "本机",
    SSH: "SSH",
    WINRM: "WinRM",
  })[String(value || "").toUpperCase()] || "未知类型";

export const hostAddress = (host?: ServerHost | null) => {
  if (!host) return "-";
  const address = host.host || "127.0.0.1";
  return host.port ? `${address}:${host.port}` : address;
};

export const hostAvatarIcon = (host?: ServerHost | null) => {
  const serverType = String(host?.serverType || "").toUpperCase();
  if (serverType === "LOCAL") return "ri:home-smile-2-line";
  if (normalizeOs(host?.osType) === "windows") return "ri:windows-line";
  if (normalizeOs(host?.osType) === "linux") return "ri:server-line";
  return "ri:cpu-line";
};

const resolveServerType = (serverType?: string | null) =>
  String(serverType || "LOCAL")
    .trim()
    .toUpperCase();

export const resolveServerHostValue = (
  serverType?: string | null,
  host?: string | null,
) => {
  if (resolveServerType(serverType) === "LOCAL") {
    return String(host || "127.0.0.1").trim() || "127.0.0.1";
  }
  return String(host || "").trim();
};

export const resolveServerUsernameValue = (
  serverType?: string | null,
  username?: string | null,
) => {
  const value = String(username || "").trim();
  if (value) return value;
  return resolveServerType(serverType) === "LOCAL" ? "local" : "anonymous";
};

export const buildServerCode = (
  serverType?: string | null,
  host?: string | null,
  username?: string | null,
) => {
  const hostValue = lower(resolveServerHostValue(serverType, host));
  const usernameValue = lower(resolveServerUsernameValue(serverType, username));
  return Md5.hashStr(`${hostValue}${usernameValue}`).toString();
};

export const buildServerCodeFromHost = (host?: Partial<ServerHost> | null) =>
  buildServerCode(host?.serverType, host?.host, host?.username);

export const metricTone = (
  snapshot?: ServerMetricsSnapshot | null,
  enabled = true,
): HostMetricTone => {
  if (!enabled) return "disabled";
  if (!snapshot?.online) return "offline";
  if (
    safePercent(snapshot.cpuUsage) >= 85 ||
    safePercent(snapshot.memoryUsage) >= 90 ||
    safePercent(snapshot.diskUsage) >= 90 ||
    Number(snapshot.latencyMs || 0) >= 350
  ) {
    return "warning";
  }
  return "online";
};

export const metricToneClass = (
  snapshot?: ServerMetricsSnapshot | null,
  enabled = true,
) => `is-${metricTone(snapshot, enabled)}`;

export const metricDotClass = (
  snapshot?: ServerMetricsSnapshot | null,
  enabled = true,
) => `is-${metricTone(snapshot, enabled)}`;

export const formatMetricPercent = (value?: number | null) =>
  `${Math.round(safePercent(value))}%`;

export const formatLatency = (value?: number | null) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return "--";
  }
  return `${Math.round(numeric)} ms`;
};

export const formatByteSize = (value?: number | null) => {
  const size = Number(value);
  if (!Number.isFinite(size) || size <= 0) {
    return "--";
  }
  if (size < 1024) {
    return `${Math.round(size)} B`;
  }
  if (size < 1024 ** 2) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  if (size < 1024 ** 3) {
    return `${(size / 1024 ** 2).toFixed(1)} MB`;
  }
  if (size < 1024 ** 4) {
    return `${(size / 1024 ** 3).toFixed(1)} GB`;
  }
  return `${(size / 1024 ** 4).toFixed(1)} TB`;
};

export const formatThroughput = (value?: number | null) => {
  const size = Number(value);
  if (!Number.isFinite(size) || size <= 0) {
    return "--";
  }
  return `${formatByteSize(size)}/s`;
};

export const formatPacketCount = (value?: number | null) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "--";
  }
  if (numeric < 1_000) {
    return `${Math.round(numeric)} 包`;
  }
  if (numeric < 1_000_000) {
    return `${(numeric / 1_000).toFixed(1)} K 包`;
  }
  if (numeric < 1_000_000_000) {
    return `${(numeric / 1_000_000).toFixed(1)} M 包`;
  }
  return `${(numeric / 1_000_000_000).toFixed(1)} G 包`;
};

export const formatPacketRate = (value?: number | null) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "--";
  }
  if (numeric < 1_000) {
    return `${Math.round(numeric)} 包/s`;
  }
  if (numeric < 1_000_000) {
    return `${(numeric / 1_000).toFixed(1)} K 包/s`;
  }
  if (numeric < 1_000_000_000) {
    return `${(numeric / 1_000_000).toFixed(1)} M 包/s`;
  }
  return `${(numeric / 1_000_000_000).toFixed(1)} G 包/s`;
};

const formatCompactThroughput = (value?: number | null) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "0 B/s";
  }
  if (numeric < 1024) {
    return `${Math.round(numeric)} B/s`;
  }
  if (numeric < 1024 ** 2) {
    return `${(numeric / 1024).toFixed(1)} KB/s`;
  }
  if (numeric < 1024 ** 3) {
    return `${(numeric / 1024 ** 2).toFixed(1)} MB/s`;
  }
  return `${(numeric / 1024 ** 3).toFixed(1)} GB/s`;
};

export const resolveIoTotal = (snapshot?: ServerMetricsSnapshot | null) =>
  Math.max(0, Number(snapshot?.ioReadBytesPerSecond || 0)) +
  Math.max(0, Number(snapshot?.ioWriteBytesPerSecond || 0));

export const resolveNetworkPacketTotal = (
  snapshot?: ServerMetricsSnapshot | null,
) =>
  Math.max(0, Number(snapshot?.networkRxPacketsPerSecond || 0)) +
  Math.max(0, Number(snapshot?.networkTxPacketsPerSecond || 0));

export const latencyToneClass = (value?: number | null) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return "is-idle";
  }
  if (numeric >= 350) {
    return "is-danger";
  }
  if (numeric >= 160) {
    return "is-warning";
  }
  return "is-success";
};

const formatTimePoint = (timestamp?: number | null) => {
  if (!timestamp) return "--";
  return new Date(timestamp).toLocaleTimeString("zh-CN", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

export const buildMetricChartOption = (
  history: ServerMetricsSnapshot[] = [],
) => {
  const data = history.slice(-20);
  const labels = data.map((item) => formatTimePoint(item.collectTimestamp));
  return {
    tooltip: {
      trigger: "axis",
      confine: true,
    },
    legend: {
      bottom: 0,
      icon: "circle",
      itemWidth: 8,
      itemHeight: 8,
      textStyle: {
        fontSize: 12,
      },
    },
    grid: {
      left: 10,
      right: 10,
      top: 28,
      bottom: 42,
      containLabel: true,
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: labels,
    },
    yAxis: [
      {
        type: "value",
        min: 0,
        max: 100,
        axisLabel: {
          formatter: "{value}%",
        },
      },
      {
        type: "value",
        min: 0,
        axisLabel: {
          formatter: (value: number) => formatCompactThroughput(value),
        },
      },
    ],
    series: [
      {
        name: "CPU",
        type: "line",
        smooth: true,
        showSymbol: false,
        data: data.map((item) => Math.round(safePercent(item.cpuUsage))),
      },
      {
        name: "内存",
        type: "line",
        smooth: true,
        showSymbol: false,
        data: data.map((item) => Math.round(safePercent(item.memoryUsage))),
      },
      {
        name: "磁盘",
        type: "line",
        smooth: true,
        showSymbol: false,
        data: data.map((item) => Math.round(safePercent(item.diskUsage))),
      },
      {
        name: "网络IO",
        type: "line",
        smooth: true,
        showSymbol: false,
        yAxisIndex: 1,
        data: data.map((item) => Math.round(resolveIoTotal(item))),
      },
    ],
  };
};

type MetricSparkType = "cpu" | "memory" | "disk" | "io";

const resolveMetricSparkData = (
  history: ServerMetricsSnapshot[],
  type: MetricSparkType,
) =>
  history.slice(-20).map((item) => {
    if (type === "cpu") return Math.round(safePercent(item.cpuUsage));
    if (type === "memory") return Math.round(safePercent(item.memoryUsage));
    if (type === "disk") return Math.round(safePercent(item.diskUsage));
    return Math.round(resolveIoTotal(item));
  });

const resolveMetricSparkColor = (type: MetricSparkType) =>
  ({
    cpu: "#3b82f6",
    memory: "#14b8a6",
    disk: "#f59e0b",
    io: "#8b5cf6",
  })[type];

export const buildMetricSparkOption = (
  history: ServerMetricsSnapshot[] = [],
  type: MetricSparkType,
  thresholds?: { warning?: number | null; danger?: number | null },
) => {
  const data = resolveMetricSparkData(history, type);
  const color = resolveMetricSparkColor(type);
  const isPercent = type !== "io";
  const maxValue = isPercent
    ? 100
    : Math.max(
        1,
        Number(thresholds?.warning || 0),
        Number(thresholds?.danger || 0),
        ...data.map((item) => Number(item || 0)),
      );
  return {
    animation: false,
    tooltip: {
      trigger: "axis",
      confine: true,
      formatter: (params: Array<{ data?: number }>) => {
        const value = Number(params?.[0]?.data || 0);
        return isPercent ? `${value}%` : formatThroughput(value);
      },
    },
    grid: {
      left: 0,
      right: 0,
      top: 8,
      bottom: 8,
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      show: false,
      data: history
        .slice(-20)
        .map((item) => formatTimePoint(item.collectTimestamp)),
    },
    yAxis: {
      type: "value",
      show: false,
      min: 0,
      max: maxValue,
    },
    series: [
      {
        type: "line",
        smooth: true,
        showSymbol: false,
        data,
        lineStyle: {
          width: 2,
          color,
        },
        areaStyle: {
          color: `${color}22`,
        },
        markLine: {
          symbol: "none",
          animation: false,
          label: {
            show: false,
          },
          lineStyle: {
            width: 1,
            type: "dashed",
          },
          data: isPercent
            ? [
                Number.isFinite(Number(thresholds?.warning))
                  ? {
                      yAxis: Number(thresholds?.warning),
                      lineStyle: {
                        color: "#f59e0b",
                      },
                    }
                  : null,
                Number.isFinite(Number(thresholds?.danger))
                  ? {
                      yAxis: Number(thresholds?.danger),
                      lineStyle: {
                        color: "#ef4444",
                      },
                    }
                  : null,
              ].filter(Boolean)
            : [
                Number.isFinite(Number(thresholds?.warning))
                  ? {
                      yAxis: Number(thresholds?.warning),
                      lineStyle: {
                        color: "#f59e0b",
                      },
                    }
                  : null,
                Number.isFinite(Number(thresholds?.danger))
                  ? {
                      yAxis: Number(thresholds?.danger),
                      lineStyle: {
                        color: "#ef4444",
                      },
                    }
                  : null,
              ].filter(Boolean),
        },
      },
    ],
  };
};
