import { useModuleSocketService } from "@repo/core";

const SOFT_SOCKET_NAME = "soft";

export function useSoftSocketService() {
  return useModuleSocketService({
    name: SOFT_SOCKET_NAME,
    missingError: "未解析到可用的 Socket 地址",
    autoConnect: false,
    mapState: state => ({
      usingGlobal: state.source === "global",
      connected: state.connected,
      error: state.error,
    }),
  });
}
