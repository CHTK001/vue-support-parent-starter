import type { App } from "vue";
import { initGlobalSocketService, getGlobalSocketService } from "@repo/core";
import { getConfig } from "@repo/config";

type Handler = (data: any) => void;

/**
 * GlobalSocket 代理 — 委托给 @repo/core socketService
 * 保持原有 connect / on / emit / disconnect API 不变
 */
class GlobalSocketProxy {
  /** 确保 socketService 已初始化，返回是否成功 */
  async connect(): Promise<boolean> {
    // 若已初始化直接返回
    if (getGlobalSocketService()) return true;

    try {
      const cfg = getConfig();
      const url = cfg?.SocketUrl;
      if (!url) {
        console.warn("[GlobalSocket] 未配置 SocketUrl，跳过连接");
        return false;
      }
      // 支持逗号分隔多地址，取第一个
      const urls = String(url)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      initGlobalSocketService({ urls, reconnection: true });
      getGlobalSocketService()?.connect();
      return true;
    } catch (e) {
      console.warn("[GlobalSocket] 连接失败:", e);
      return false;
    }
  }

  disconnect() {
    getGlobalSocketService()?.close();
  }

  on(topic: string, handler: Handler): () => void {
    const svc = getGlobalSocketService();
    if (!svc) return () => {};
    // socketService 的 on 直接监听原始事件
    svc.on(topic, handler);
    return () => svc.off?.(topic);
  }

  emit(topic: string, data: any): boolean {
    const svc = getGlobalSocketService();
    if (!svc) return false;
    svc.emit(topic, typeof data === "string" ? data : JSON.stringify(data));
    return true;
  }
}

export function getGlobalSocket(): GlobalSocketProxy {
  return (
    (window as any).__GLOBAL_SOCKET__ ||
    ((window as any).__GLOBAL_SOCKET__ = new GlobalSocketProxy())
  );
}

const plugin = {
  install(app: App) {
    app.provide("globalSocket", getGlobalSocket());
  },
};

export default plugin;
