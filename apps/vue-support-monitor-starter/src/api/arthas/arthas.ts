import request from "../config";

/**
 * 获取节点 Arthas 客户端配置（enable、tunnelAddress 等）
 */
export function getNodeArthasClientConfig(nodeId: string) {
  return request({
    url: "/v1/arthas/client-config",
    method: "get",
    params: { nodeId },
  });
}

/**
 * 获取服务器 tunnel 地址
 */
export function getServerTunnelAddress(serverId: number) {
  return request({
    url: "/v1/arthas/tunnel-address",
    method: "get",
    params: { serverId },
  });
}

/**
 * 设置服务器 tunnel 地址
 */
export function setServerTunnelAddress(
  serverId: number,
  tunnelAddress: string
) {
  return request({
    url: "/v1/arthas/tunnel-address/set",
    method: "post",
    params: { serverId, tunnelAddress },
  });
}
