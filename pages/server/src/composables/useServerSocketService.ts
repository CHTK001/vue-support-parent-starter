import { useModuleSocketService } from "@repo/core";

const SERVER_SOCKET_NAME = "server";

export function useServerSocketService() {
  return useModuleSocketService({
    name: SERVER_SOCKET_NAME,
    missingError: "未解析到可用的 Socket 地址",
    autoConnect: false,
    mapState: state => ({
      connected: state.connected,
      error: state.error,
    }),
  });
}
