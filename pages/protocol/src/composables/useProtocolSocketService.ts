import { useModuleSocketService } from "@repo/core";

const PROTOCOL_SOCKET_NAME = "protocol";

export function useProtocolSocketService() {
  return useModuleSocketService({
    name: PROTOCOL_SOCKET_NAME,
    missingError: "未解析到可用的 Protocol Socket 地址",
    autoConnect: false,
    mapState: state => ({
      connected: state.connected,
      error: state.error,
    }),
  });
}
