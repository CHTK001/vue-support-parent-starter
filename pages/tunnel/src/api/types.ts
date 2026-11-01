/**
 * @pages/tunnel 隧道数据模型
 *
 * <p>与后端 {@code spring-support-common-starter} 的
 * {@code com.chua.starter.common.support.tunnel} 包保持同名字段、全覆盖，
 * 读写通过 JSON 文件（{@code TunnelFileStore}）持久化。</p>
 *
 * @author CH
 * @since 4.0.0.52
 */

/** Provider：ngrok / Cloudflare Tunnel */
export type TunnelProvider = "ngrok" | "cloudflared";

/** 隧道记录（持久化到 JSON 文件） */
export interface TunnelRecord {
  /** 隧道 ID（UUID） */
  id: string;
  /** Provider */
  provider: TunnelProvider;
  /** 映射名称 */
  name: string;
  /** 本地端口 */
  localPort: number;
  /** 隧道模式 */
  mode: "http" | "tcp" | "tls" | "quick" | "named";
  /** 域名 / 主机名 */
  domain: string;
  /** 远程地址（TCP） */
  remoteAddress: string;
  /** Basic 认证 user:password */
  basicAuth: string;
  /** ngrok authtoken */
  authtoken: string;
  /** Cloudflare Zero Trust Token */
  token: string;
  /** 元数据 */
  metadata: string;
  /** 自动启动 */
  autoStart: boolean;
  /** 启用 */
  enabled: boolean;
  /** 备注 */
  remark: string;
  /** 创建时间 */
  createdAt: number;
  /** 更新时间 */
  updatedAt: number;
}

/** 隧道台账 + 运行状态 */
export interface TunnelView extends TunnelRecord {
  /** 是否运行中 */
  running: boolean;
  /** 公网地址列表 */
  publicUrls: string[];
  /** 最近一条错误 */
  error: string;
  /** 启动时间 */
  startedAt: number;
}
