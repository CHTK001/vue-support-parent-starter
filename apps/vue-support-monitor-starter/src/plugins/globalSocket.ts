import type { App } from "vue";
import { socket } from "@repo/core";
import { getConfig } from "@repo/config";
import { splitToArray } from "@repo/utils";

type Handler = (data: any) => void;

class GlobalSocket {
  private client: any | null = null;
  private connecting = false;

  async connect(): Promise<boolean> {
    debugger
    if (this.client) return true;
    if (this.connecting) return false;
    this.connecting = true;
    try {
      const cfg = getConfig();
      this.client = socket(splitToArray(cfg.SocketUrl), undefined, {});
      this.connecting = false;
      return true;
    } catch (e) {
      this.client = null;
      this.connecting = false;
      return false;
    }
  }

  disconnect() {
    if (!this.client) return;
    try {
      if (typeof this.client.close === "function") this.client.close();
      else if (typeof this.client.disconnect === "function") this.client.disconnect();
    } catch {}
    this.client = null;
  }

  on(topic: string, handler: Handler) {
    if (!this.client) return () => {};
    const cb = (raw: any) => {
      try {
        const payload = typeof raw === "string" ? JSON.parse(raw) : (raw?.data ? JSON.parse(raw.data) : raw);
        handler(payload);
      } catch {
        handler(raw);
      }
    };
    this.client.on(topic, cb);
    return () => {
      if (this.client && typeof this.client.off === "function") this.client.off(topic, cb);
    };
  }

  emit(topic: string, data: any) {
    if (!this.client) return false;
    this.client.emit(topic, typeof data === "string" ? data : JSON.stringify(data));
    return true;
  }
}

export function getGlobalSocket(): GlobalSocket {
  return (window as any).__GLOBAL_SOCKET__ || ((window as any).__GLOBAL_SOCKET__ = new GlobalSocket());
}

const plugin = {
  install(app: App) {
    const gs = getGlobalSocket();
    app.provide("globalSocket", gs);
  },
};

export default plugin;


