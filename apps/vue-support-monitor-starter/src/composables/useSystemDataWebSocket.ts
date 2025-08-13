import { ref } from "vue";
import { socket } from "@repo/core";
import { getConfig } from "@repo/config";
import { splitToArray } from "@repo/utils";

export interface SystemDataWebSocketState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
}

export type SystemDataMessage = {
  settingId?: number | string;
  type?: string;
  event?: string;
  data?: any;
  timestamp?: number;
};

export type TopicHandler = (message: SystemDataMessage) => void;

export function useSystemDataWebSocket() {
  const client = ref<any>(null);
  const state = ref<SystemDataWebSocketState>({ connected: false, connecting: false, error: null });

  const connect = async (): Promise<boolean> => {
    if (client.value) {
      return true;
    }
    if (state.value.connecting) return false;
    try {
      state.value.connecting = true;
      state.value.error = null;
      const config = getConfig();
      client.value = socket(splitToArray(config.SocketUrl), undefined, {});
      state.value.connected = true;
      state.value.connecting = false;
      return true;
    } catch (e: any) {
      state.value.error = e?.message || "连接失败";
      state.value.connected = false;
      state.value.connecting = false;
      setTimeout(() => { if (!state.value.connected) connect(); }, 5000);
      return false;
    }
  };

  const disconnect = () => {
    if (!client.value) return;
    try {
      if (typeof client.value.close === "function") client.value.close();
      else if (typeof client.value.disconnect === "function") client.value.disconnect();
    } catch (_) {}
    client.value = null;
    state.value.connected = false;
    state.value.connecting = false;
    state.value.error = null;
  };

  const onTopic = (topic: string, handler: TopicHandler) => {
    if (!client.value) return () => {};
    const callback = (raw: any) => {
      try {
        const payload = typeof raw === "string" ? JSON.parse(raw) : (raw?.data ? JSON.parse(raw.data) : raw);
        handler(payload as SystemDataMessage);
      } catch {
        handler({ data: raw });
      }
    };
    client.value.on(topic, callback);
    return () => {
      if (client.value && typeof client.value.off === "function") {
        client.value.off(topic, callback);
      }
    };
  };

  return { state, connect, disconnect, onTopic };
}


