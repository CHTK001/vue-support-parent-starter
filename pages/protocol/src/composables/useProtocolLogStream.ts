import { computed, getCurrentScope, onScopeDispose, ref } from "vue";
import { ProtocolTopics, type WsMessage } from "@repo/core";
import type {
  FirewallEventRecord,
  SystemServerFilterLogRecord,
} from "@/api/system-server";
import { useProtocolSocketService } from "./useProtocolSocketService";

export type ProtocolLogEvent =
  (typeof ProtocolTopics.EVENTS)[keyof typeof ProtocolTopics.EVENTS];

export interface ProtocolRealtimeEnvelope {
  module: typeof ProtocolTopics.MODULE;
  event: ProtocolLogEvent;
  dataId?: string | number;
  data?: unknown;
  timestamp?: number | string;
}

export interface ProtocolLogStreamState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  lastEventAt: number | null;
}

export interface ProtocolLogStreamOptions {
  maxRecords?: number;
  onRecord?: (
    record: SystemServerFilterLogRecord,
    envelope: ProtocolRealtimeEnvelope,
  ) => void;
  onFirewallEvent?: (
    event: FirewallEventRecord,
    record: SystemServerFilterLogRecord,
    envelope: ProtocolRealtimeEnvelope,
  ) => void;
}

const DEFAULT_EVENTS: ProtocolLogEvent[] = [
  ProtocolTopics.EVENTS.REQUEST_LOG,
  ProtocolTopics.EVENTS.FIREWALL_LOG,
];

const toRecord = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object") {
    return {};
  }
  return value as Record<string, unknown>;
};

const text = (value: unknown): string => String(value ?? "").trim();

const numberValue = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const pad = (value: number): string => String(value).padStart(2, "0");

const formatLocalTime = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mi = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
};

const timeText = (value: unknown): string | undefined => {
  if (Array.isArray(value) && value.length >= 3) {
    const [year, month, day, hour = 0, minute = 0, second = 0] = value.map(Number);
    if ([year, month, day].every(Number.isFinite)) {
      return `${year}-${pad(month)}-${pad(day)} ${pad(hour)}:${pad(minute)}:${pad(second)}`;
    }
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return formatLocalTime(new Date(value));
  }
  const raw = text(value);
  if (!raw) {
    return undefined;
  }
  return raw.replace("T", " ").replace(/\.\d+$/, "");
};

const actionStatus = (raw: Record<string, unknown>): string => {
  const explicit = text(raw.actionStatus);
  if (explicit) {
    return explicit.toUpperCase();
  }
  const action = text(raw.action).toUpperCase();
  if (["DENY", "RATE_LIMIT", "BLOCK", "REJECT"].includes(action)) {
    return "DENY";
  }
  if (["ALLOW", "PASS", "OK"].includes(action)) {
    return "PASS";
  }
  return "";
};

export const normalizeProtocolLogRecord = (
  payload: unknown,
): SystemServerFilterLogRecord => {
  const raw = toRecord(payload);
  const status = actionStatus(raw);
  const action = text(raw.action).toUpperCase();
  const reason = text(raw.reason || raw.decisionReason);
  const process = text(raw.processStatus || reason || action);
  const rule = text(raw.ruleCategory || (action === "RATE_LIMIT" ? action : ""));
  const eventTime = timeText(raw.eventTime || raw.timestamp);
  const storeTime = timeText(raw.storeTime) || eventTime;
  const accessTime = timeText(raw.accessTime) || eventTime || storeTime;

  return {
    id: numberValue(raw.id || raw.systemServerLogId),
    systemServerLogId: numberValue(raw.systemServerLogId),
    serverId: numberValue(raw.serverId),
    filterType: text(raw.filterType),
    ruleCategory: rule || "UNKNOWN",
    actionStatus: status || (action === "ALLOW" ? "PASS" : action),
    processStatus: process || rule || "UNKNOWN",
    method: text(raw.method),
    path: text(raw.path),
    host: text(raw.host),
    referer: text(raw.referer),
    requestId: text(raw.requestId),
    clientIp: text(raw.clientIp),
    clientGeo: text(raw.clientGeo),
    userAgent: text(raw.userAgent),
    decisionReason: reason,
    statusCode: numberValue(raw.statusCode),
    accessTime,
    durationMs: numberValue(raw.durationMs),
    storeTime,
  };
};

export const isFirewallLogRecord = (
  record: SystemServerFilterLogRecord,
): boolean => {
  const filterType = text(record.filterType).toLowerCase();
  const rule = text(record.ruleCategory).toUpperCase();
  const process = text(record.processStatus).toUpperCase();
  return (
    filterType.includes("firewall") ||
    ["BLACKLIST", "WHITELIST", "RATE_LIMIT"].includes(rule) ||
    process.includes("BLACKLIST") ||
    process.includes("WHITELIST") ||
    process.includes("LIMIT")
  );
};

export const protocolLogRecordToFirewallEvent = (
  record: SystemServerFilterLogRecord,
): FirewallEventRecord => {
  const rule = text(record.ruleCategory).toUpperCase();
  const action = text(record.actionStatus).toUpperCase();
  return {
    serverKey: record.serverId == null ? undefined : String(record.serverId),
    serverId: record.serverId,
    requestId: record.requestId,
    clientIp: record.clientIp,
    clientGeo: record.clientGeo,
    method: record.method,
    path: record.path,
    host: record.host,
    referer: record.referer,
    userAgent: record.userAgent,
    action: action === "DENY" && rule === "RATE_LIMIT" ? "RATE_LIMIT" : action,
    reason: record.decisionReason || record.processStatus || record.ruleCategory,
    statusCode: record.statusCode,
    durationMs: record.durationMs,
    eventTime: record.storeTime || record.accessTime,
  };
};

const recordKey = (record: SystemServerFilterLogRecord): string => {
  const explicit = text(record.requestId || record.systemServerLogId || record.id);
  if (explicit) {
    return explicit;
  }
  return [
    record.serverId,
    record.storeTime || record.accessTime,
    record.method,
    record.path,
    record.clientIp,
    record.processStatus,
  ]
    .map(text)
    .join("|");
};

const matchesServer = (
  record: SystemServerFilterLogRecord,
  serverId: number,
): boolean => {
  if (!serverId) {
    return true;
  }
  return Number(record.serverId || 0) === serverId;
};

const toEnvelope = (message: WsMessage | unknown): ProtocolRealtimeEnvelope => {
  const envelope = toRecord(message);
  return {
    module: ProtocolTopics.MODULE,
    event: text(envelope.event) as ProtocolLogEvent,
    dataId: envelope.dataId as string | number | undefined,
    data: envelope.data ?? message,
    timestamp: envelope.timestamp as string | number | undefined,
  };
};

export function useProtocolLogStream(options: ProtocolLogStreamOptions = {}) {
  const socket = useProtocolSocketService();
  const state = ref<ProtocolLogStreamState>({
    connected: false,
    connecting: false,
    error: null,
    lastEventAt: null,
  });
  const records = ref<SystemServerFilterLogRecord[]>([]);
  const firewallEvents = ref<FirewallEventRecord[]>([]);
  const unsubscribers: Array<() => void> = [];
  const maxRecords = options.maxRecords ?? 500;
  let activeServerId = 0;

  const disconnect = () => {
    while (unsubscribers.length) {
      unsubscribers.pop()?.();
    }
    socket.clearSubscriptions();
    state.value.connected = false;
    state.value.connecting = false;
  };

  const appendRecord = (
    record: SystemServerFilterLogRecord,
    envelope: ProtocolRealtimeEnvelope,
  ) => {
    const key = recordKey(record);
    records.value = [
      record,
      ...records.value.filter(item => recordKey(item) !== key),
    ].slice(0, maxRecords);

    if (envelope.event === ProtocolTopics.EVENTS.FIREWALL_LOG || isFirewallLogRecord(record)) {
      const event = protocolLogRecordToFirewallEvent(record);
      firewallEvents.value = [
        event,
        ...firewallEvents.value.filter(item => {
          const itemRecord = normalizeProtocolLogRecord(item);
          return recordKey(itemRecord) !== key;
        }),
      ].slice(0, maxRecords);
      options.onFirewallEvent?.(event, record, envelope);
    }

    options.onRecord?.(record, envelope);
  };

  const connect = (
    serverId?: number | null,
    events: ProtocolLogEvent[] = DEFAULT_EVENTS,
  ) => {
    disconnect();
    activeServerId = Number(serverId || 0);
    state.value.connecting = true;
    state.value.error = null;
    const service = socket.ensureConnected();
    if (!service) {
      state.value.connecting = false;
      state.value.error = socket.state.value.error || "未找到可用的 Protocol Socket 服务";
      return;
    }

    const handleEnvelope = (message: WsMessage | unknown) => {
      const envelope = toEnvelope(message);
      const record = normalizeProtocolLogRecord(envelope.data);
      if (!matchesServer(record, activeServerId)) {
        return;
      }
      state.value.connected = true;
      state.value.connecting = false;
      state.value.error = null;
      state.value.lastEventAt = Date.now();
      appendRecord(record, envelope);
    };

    events.forEach(eventName => {
      unsubscribers.push(
        socket.subscribe(ProtocolTopics.MODULE, eventName, handleEnvelope),
      );
    });

    state.value.connected = true;
    state.value.connecting = false;
  };

  if (getCurrentScope()) {
    onScopeDispose(disconnect);
  }

  return {
    state: computed(() => state.value),
    records,
    firewallEvents,
    connect,
    disconnect,
  };
}
