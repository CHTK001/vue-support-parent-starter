const GATEWAY_HTTP = import.meta.env.VITE_GATEWAY_HTTP || 'http://localhost:9001'
const GATEWAY_WS = import.meta.env.VITE_GATEWAY_WS || 'ws://localhost:9002'

/**
 * Agent 校验结果
 * @author CH
 * @since 4.0.0
 */
export interface VerifyResult {
  success: boolean
  message?: string
  agentType?: string
  gatewayWsUrl?: string
  targetHost?: string
  targetPort?: number
  targetUsername?: string
  targetPassword?: string
}

/**
 * 校验 Agent 连通性
 * @param agentId Agent ID
 * @param verifyCode 校验码
 * @param reverseTunnelEnabled 是否启用反向隧道
 * @returns 校验结果
 */
export async function verifyAgent(agentId: string, verifyCode: string, reverseTunnelEnabled: boolean): Promise<VerifyResult> {
  const resp = await fetch(`${GATEWAY_HTTP}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `agentId=${encodeURIComponent(agentId)}&verifyCode=${encodeURIComponent(verifyCode)}&reverseTunnelEnabled=${reverseTunnelEnabled}`
  })
  return resp.json()
}

/**
 * 构造网关 WebSocket 连接 URL
 * @param agentId Agent ID
 * @returns WebSocket URL
 */
export function createGatewayWsUrl(agentId: string): string {
  return `${GATEWAY_WS}?clientId=${encodeURIComponent(agentId)}`
}
