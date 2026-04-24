import { type SocketTemplate, useModuleSocketService } from "@repo/core";
import { DOCKER_SOCKET_NAME } from "../socket/dockerSocket";

export function useDockerSocketService(preferredSocket?: SocketTemplate | null) {
  return useModuleSocketService({
    name: DOCKER_SOCKET_NAME,
    preferredSocket,
    missingError: "未解析到可用的 Docker Socket 地址",
    autoConnect: false,
    mapState: state => ({
      usingPreferred: state.source === "provider",
      connected: state.connected,
      error: state.error,
    }),
  });
}
