import {
  type SocketTemplate,
  closeNamedSocketServiceIfIdle,
  ensureManagedSocketConnected,
  resolveManagedSocketService,
} from "@repo/core";

export const DOCKER_SOCKET_NAME = "docker-page-global";

export const resolveDockerSocketService = (
  preferredSocket?: SocketTemplate | null,
)=>
  resolveManagedSocketService({
    name: DOCKER_SOCKET_NAME,
    preferredSocket,
    missingError: "未解析到可用的 Docker Socket 地址",
    autoConnect: false,
  });

export const ensureDockerSocketConnected = (
  preferredSocket?: SocketTemplate | null,
)=>
  ensureManagedSocketConnected({
    name: DOCKER_SOCKET_NAME,
    preferredSocket,
    missingError: "未解析到可用的 Docker Socket 地址",
    autoConnect: false,
  });

export const closeDockerNamedSocketIfIdle = (): void => {
  closeNamedSocketServiceIfIdle(DOCKER_SOCKET_NAME);
};
