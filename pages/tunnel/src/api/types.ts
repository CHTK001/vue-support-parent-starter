/**
 * @pages/tunnel 隧道数据模型
 *
 * <p>与后端 {@code spring-support-common-starter} 的
 * {@code com.chua.starter.common.support.tunnel} 包保持同名字段、全覆盖，
 * 读写通过 JSON 文件（{@code TunnelFileStore}）持久化。</p>
 *
 * <p>Provider 不再是前端的固定枚举，而是后端 {@code TunnelProvider} SPI 的
 * 实现清单（{@code GET /ms/tunnel/providers}）：引入哪个实现 jar，页面下拉里
 * 就多一项。{@link TunnelProvider} 只是内置两种的名字集合，用于给已知取值
 * 提供字面量提示。</p>
 *
 * @author CH
 * @since 4.0.0.52
 */

/** 内置 Provider 标识（ngrok / Cloudflare Tunnel）；后端注册的其它实现按 string 处理 */
export type TunnelProvider = "ngrok" | "cloudflared";

/** 隧道模式：ngrok 为 http / tcp / tls，cloudflared 为 quick / named */
export type TunnelMode = "http" | "tcp" | "tls" | "quick" | "named";

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
  mode: TunnelMode;
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

/**
 * 后端已注册的提供方描述（{@code GET /ms/tunnel/providers}）。
 *
 * <p>字段与后端 {@code TunnelProviderRegistry.describe()} 一一对应：页面据此
 * 渲染提供方下拉与模式选项，不把「有哪些提供方」写死在代码里。</p>
 */
export interface TunnelProviderInfo {
  /** 提供方标识，与 {@link TunnelRecord.provider} 同值 */
  name: TunnelProvider;
  /** 展示名称 */
  displayName: string;
  /** 运行环境是否具备执行条件（客户端 jar / 可执行文件） */
  available: boolean;
  /** 支持的隧道模式 */
  modes: string[];
  /** 新建时的默认模式 */
  defaultMode: string;
  /** 能力探测信息（凭据是否配置、客户端路径等） */
  capabilities: Record<string, unknown>;
}
