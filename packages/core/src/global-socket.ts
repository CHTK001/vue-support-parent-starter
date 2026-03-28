import type { App } from "vue";
import { socket } from "./config/socket";
import { getConfig } from "@repo/config";
import { splitToArray } from "@repo/utils";
import { useConfigStore } from "./store/modules/ConfigStore";

type Handler = (data: any) => void;

class GlobalSocket {
  private client: any | null = null;
  private connecting = false;
  private connectPromise: Promise<boolean> | null = null;

  connect(): Promise<boolean> {
    if (this.client) return Promise.resolve(true);
    if (this.connectPromise) return this.connectPromise;
    this.connectPromise = this.doConnect();
    return this.connectPromise;
  }

  private async doConnect(): Promise<boolean> {
    if (this.connecting) return false;
    this.connecting = true;
    try {
      await useConfigStore().load();
      this.client = useConfigStore().getSocket();
      if (this.client == null) {
        const cfg = getConfig();
        if (cfg.SocketOpen === false || cfg.SocketOpen === "false") {
          return false;
        }
        if (cfg.SocketUrl) {
          this.client = socket(splitToArray(cfg.SocketUrl), undefined, {});
        }
      }
      return this.client != null;
    } catch (e) {
      console.warn("[GlobalSocket] 连接失败:", e);
      this.client = null;
      return false;
    } finally {
      this.connecting = false;
      this.connectPromise = null;
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
        const payload =
          typeof raw === "string" ? JSON.parse(raw)
          : raw?.data ? JSON.parse(raw.data)
          : raw;
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
  return (
    (window as any).__GLOBAL_SOCKET__ ||
    ((window as any).__GLOBAL_SOCKET__ = new GlobalSocket())
  );
}

/** Vue 插件：provide globalSocket，并在 fullScreen 路由时自动连接 */
export const GlobalSocketPlugin = {
  install(app: App) {
    const gs = getGlobalSocket();
    app.provide("globalSocket", gs);
  },
};
