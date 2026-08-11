/**
 * 网关 API 类型定义
 */

/**
 * 鉴权请求负载（authenticate 入参）
 *
 * - mode='key'    ：仅需 key，服务端按预配置映射协议/主机
 * - mode='custom'  ：自定义协议、主机、端口、用户、密码
 */
export interface AuthPayload {
  mode: "key" | "custom";
  key?: string;
  protocol?: string;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
}

/**
 * 鉴权响应：3 步流程第 2 步返回
 */
export interface AuthResponse {
  tunnelId: string;
  wsUrl: string;
  protocol: string;
  host: string;
  port: number;
}

/**
 * 协议信息（listProtocols 返回）
 */
export interface ProtocolInfo {
  protocol: string;
}

/**
 * 网关健康状态 */
export interface GatewayHealth {
  status: string;
  agents: number;
  targets: number;
}

/** 控制端连接信息 */
export interface ControllerInfo {
  id: string;
  type?: string;
  ipAddress: string;
  connectedAt?: number;
}

/** 被控端点 Target */
export interface AgentTarget {
  targetId: string;
  protocol: string;
  transport?: string;
  online: boolean;
}

/** 被控端点信息 */
export interface AgentInfo {
  agentId: string;
  agentType?: string;
  verifyCode?: string;
  ipAddress?: string;
  remotePort?: number;
  sshPort?: number;
  protocols?: string[];
  codecs?: string[];
  capabilities?: Record<string, string>;
  targets?: AgentTarget[];
  temporary?: boolean;
}

/** 令牌信息 */
export interface TokenInfo {
  token: string;
  agentId?: string;
  createdAt?: number;
  expiresAt?: number;
}

/** 网关完整状态响应 */
export interface GatewayInfo {
  health: GatewayHealth;
  controllers: ControllerInfo[];
  agents: AgentInfo[];
  tokens?: TokenInfo[];
}
