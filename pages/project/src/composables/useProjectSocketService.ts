import { useModuleSocketService } from "@repo/core";

const PROJECT_SOCKET_NAME = "project-container-software";

export function useProjectSocketService(preferredSocket?: any) {
  return useModuleSocketService({
    name: PROJECT_SOCKET_NAME,
    preferredSocket,
    missingError: "未解析到可用的项目 Socket 地址",
    autoConnect: false,
    mapState: state => ({
      usingGlobal: state.source === "global" || state.source === "provider",
      connected: state.connected,
      error: state.error,
    }),
  });
}
