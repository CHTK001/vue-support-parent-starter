/**
 * 主机账号 —— 页面视图模型与共用纯函数
 *
 * <p>页面数据来自三处：身份（{@code /ms/server/identity}）、密钥库
 * （{@code /ms/server/key}）、主机（{@code /ms/server/host}）。原始行是扁平的
 * 接口对象，四个版式各有各的排版，但都要「账号 + 引用密钥 + 绑定主机」这三块，
 * 所以先在容器里拼成 {@link HaAccount}，版式只负责画。</p>
 *
 * @author CH
 * @since 4.0.0.44
 */

/** 一个主机账号（身份 + 密钥引用 + 绑定主机的合并视图） */
export interface HaAccount {
  /** 身份主键 */
  id: number;
  /** 账号名称 */
  name: string;
  /** 认证方式原值（PASSWORD / PUBLIC_KEY / MAILBOX …） */
  authType: string;
  /** 认证方式中文名 */
  authLabel: string;
  /** 登录用户名 */
  username: string;
  /** 引用密钥主键（仅公钥登录） */
  keyId: number | null;
  /** 引用密钥名称 */
  keyName: string;
  /** 引用密钥类型 */
  keyType: string;
  /** 引用密钥公钥指纹 */
  keyFp: string;
  /** 备注 */
  remark: string;
  /** 绑定的主机主键 */
  hostIds: number[];
}

/** 主机（页面里只用到这几个字段） */
export interface HaHost {
  id: number;
  name: string;
  address: string;
  port: number;
  online: boolean;
  osType: string;
}

/** 顶部分面/聚合条用的口径 */
export interface HaStats {
  /** 账号总数 */
  total: number;
  /** 主机登录类账号数（口令 + 公钥） */
  hostLogin: number;
  /** 公钥登录账号数 */
  publicKey: number;
  /** 通用凭据数（邮箱 / Token 等） */
  generic: number;
  /** 已绑定至少一台主机的账号数 */
  bound: number;
  /** 未绑定任何主机的账号数 */
  unbound: number;
  /** 密钥库密钥数 */
  keys: number;
  /** 被账号引用的密钥数 */
  keyRefs: number;
}

/** 认证方式 → 中文名 */
export function authLabelOf(type: string | null | undefined): string {
  switch (normAuth(type)) {
    case "PASSWORD": return "密码登录";
    case "PUBLIC_KEY": return "公钥登录";
    case "MAILBOX": return "邮箱账号";
    case "TOKEN": return "Token";
    case "API_KEY": return "API Key";
    case "OAUTH2": return "OAuth 2.0";
    case "COOKIE": return "Cookie";
    case "ACCOUNT": return "账号密码";
    default: return type || "未知";
  }
}

/**
 * 认证方式归一化。
 *
 * <p>历史数据里有小写值（{@code password}），表单又允许「选择或输入」，
 * 因此类型比较一律先转大写；否则同一种认证方式会分裂成两个分组。</p>
 *
 * @param type 原值
 * @returns 大写后的值（空值返回空串）
 */
export function normAuth(type: string | null | undefined): string {
  return String(type ?? "").toUpperCase();
}

/** 认证方式 → 语义色（落到 --tone，由 kit 的 a-* 类消费） */
export function authToneOf(type: string | null | undefined): string {
  switch (normAuth(type)) {
    case "PASSWORD": return "a-info";
    case "PUBLIC_KEY": return "a-warn";
    case "MAILBOX": return "a-ok";
    case "TOKEN":
    case "API_KEY": return "a-brand";
    default: return "a-mute";
  }
}

/** 认证方式分组（四个版式共用同一套分面口径） */
export function authGroupOf(type: string | null | undefined): "password" | "key" | "generic" {
  const t = normAuth(type);
  if (t === "PASSWORD") return "password";
  if (t === "PUBLIC_KEY") return "key";
  return "generic";
}

/** 分组中文名 */
export const AUTH_GROUP_LABEL: Record<"password" | "key" | "generic", string> = {
  password: "密码登录",
  key: "公钥登录",
  generic: "通用凭据",
};

/** 主机名首字母（卡片墙的主机头像堆叠用；IP 类名字取不到字母时退回「#」） */
export function hostInitial(name: string | undefined): string {
  const ch = (name ?? "").trim().charAt(0);
  if (!ch) return "?";
  return /[a-zA-Z]/.test(ch) ? ch.toUpperCase() : "#";
}

/** 公钥指纹：取前 16 字节的十六进制，便于人眼比对（与旧页口径一致） */
export function keyFingerprint(pub: string | undefined): string {
  if (!pub) return "";
  try {
    const raw = Uint8Array.from(pub, (c) => c.charCodeAt(0));
    return Array.from(raw.slice(0, 16))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(":");
  } catch {
    return pub.slice(0, 16);
  }
}
