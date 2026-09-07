const GATEWAY_HTTP = import.meta.env.VITE_GATEWAY_HTTP || 'http://localhost:9001'
const GATEWAY_WS = import.meta.env.VITE_GATEWAY_WS || 'ws://localhost:9002'

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

export async function verifyAgent(agentId: string, verifyCode: string, reverseTunnelEnabled: boolean): Promise<VerifyResult> {
  const resp = await fetch(`${GATEWAY_HTTP}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `agentId=${encodeURIComponent(agentId)}&verifyCode=${encodeURIComponent(verifyCode)}&reverseTunnelEnabled=${reverseTunnelEnabled}`
  })
  return resp.json()
}

export function createGatewayWsUrl(agentId: string): string {
  return `${GATEWAY_WS}?clientId=${encodeURIComponent(agentId)}`
}
