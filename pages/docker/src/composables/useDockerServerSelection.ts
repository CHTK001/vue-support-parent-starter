import { computed, ref } from "vue";
import { listServerHosts } from "@pages/server";
import { listDockerServerOptions } from "../api";
import type { DockerServerOption } from "../types";

/**
 * Docker 服务器选择数据源。
 * <p>
 * 按需求同时使用：
 * 1) @pages/server 的服务器主数据；
 * 2) docker 后端聚合接口返回的数据。
 * </p>
 */
export function useDockerServerSelection() {
  const loading = ref(false);
  const serverPageOptions = ref<DockerServerOption[]>([]);
  const dockerBackendOptions = ref<DockerServerOption[]>([]);

  /**
   * 合并两个来源的数据：
   * - 以 @pages/server 为主；
   * - docker 后端补齐缺失项。
   */
  const mergedOptions = computed<DockerServerOption[]>(() => {
    const map = new Map<number, DockerServerOption>();
    serverPageOptions.value.forEach(item => {
      map.set(item.serverId, item);
    });
    dockerBackendOptions.value.forEach(item => {
      const current = map.get(item.serverId);
      if (!current) {
        map.set(item.serverId, item);
        return;
      }
      map.set(item.serverId, {
        ...item,
        ...current,
      });
    });
    return Array.from(map.values()).sort((a, b) => a.serverId - b.serverId);
  });

  /**
   * 读取服务器列表。
   */
  const loadServers = async (keyword?: string) => {
    loading.value = true;
    try {
      const [serverResult, dockerResult] = await Promise.all([
        listServerHosts({ keyword }),
        listDockerServerOptions({ keyword }),
      ]);

      serverPageOptions.value = (serverResult.data || []).map((item: any) => ({
        serverId: Number(item.serverId),
        serverName: String(item.serverName || ""),
        serverType: item.serverType,
        osType: item.osType,
        host: item.host,
        port: item.port,
        enabled: item.enabled,
      }));

      dockerBackendOptions.value = (dockerResult.data || []).map(item => ({
        serverId: Number(item.serverId),
        serverName: item.serverName,
        serverType: item.serverType,
        osType: item.osType,
        host: item.host,
        port: item.port,
        enabled: item.enabled,
      }));
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    mergedOptions,
    loadServers,
  };
}
