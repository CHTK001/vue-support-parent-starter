/**
 * 认证核心类型定义（auth-core）
 *
 * 该模块为纯 TypeScript，不依赖任何框架（Vue / React），
 * 供各端（Vue / React / Node）共享登录、令牌、用户信息等基础类型。
 */

/**
 * 登录参数
 *
 * 对应 Spring 契约 /v2/user/login 的请求体。
 * 具体的账号字段（username / password 等）由使用方按业务约定传入，
 * 这里仅兜底允许任意字段，避免过度约束各端参数形态。
 */
export interface LoginParams {
  /** 用户名 */
  username?: string;
  /** 密码 */
  password?: string;
  /** 验证码 key（验证码校验开启时由后端下发） */
  verifyCodeKey?: string;
  /** 验证码答案 */
  verifyCode?: string;
  /** 是否记住登录（影响 token 有效期） */
  isRemembered?: boolean;
  /** 其余业务扩展字段 */
  [key: string]: unknown;
}

/**
 * 用户信息
 *
 * 描述当前登录用户的基础信息。字段均为可选，
 * 以兼容后端不同版本的返回结构；业务侧按需读取。
 */
export interface UserInfo {
  /** 用户唯一 ID */
  id?: string | number;
  /** 用户名（登录账号） */
  username?: string;
  /** 昵称 */
  nickname?: string;
  /** 头像地址 */
  avatar?: string;
  /** 邮箱 */
  email?: string;
  /** 手机号 */
  phone?: string;
  /** 角色编码列表 */
  roles?: string[];
  /** 权限标识列表 */
  perms?: string[];
  /** 其余业务扩展字段 */
  [key: string]: unknown;
}

/**
 * 登录返回结构
 *
 * 兼容 core 包的 LoginResult 字段：accessToken / refreshToken / userInfo /
 * expires / roles / perms 等。后端返回的其它字段透传保留。
 */
export interface LoginResult {
  /** 访问令牌 */
  accessToken?: string;
  /** 刷新令牌 */
  refreshToken?: string;
  /** 用户信息 */
  userInfo?: UserInfo;
  /** 过期时间（秒级时间戳或相对时长，视后端约定） */
  expires?: number;
  /** 是否记住登录 */
  isRemembered?: boolean;
  /** 角色编码列表 */
  roles?: string[];
  /** 权限标识列表 */
  perms?: string[];
  /** 头像地址 */
  avatar?: string;
  /** 用户名 */
  username?: string;
  /** 昵称 */
  nickname?: string;
  /** 其余业务扩展字段 */
  [key: string]: unknown;
}

/**
 * 认证状态
 *
 * - checking       ：正在校验（如应用启动读取本地会话、刷新 token 中）
 * - authenticated  ：已认证
 * - unauthenticated：未认证
 */
export type AuthStatus = "checking" | "authenticated" | "unauthenticated";

/**
 * 认证接口地址集合
 *
 * 用于把各接口 URL 从 createAuthApi 中解耦出来，便于不同环境（baseUrl）或
 * 不同后端版本统一配置。字段为绝对地址（含 baseUrl）时直接使用，
 * 也可只传相对路径（baseUrl 为空时）。
 */
export interface AuthEndpoints {
  /** 登录接口地址，默认 /v2/user/login */
  login: string;
  /** 登出接口地址，默认 /v2/user/logout */
  logout: string;
  /** 当前用户信息接口地址，默认 /v2/user/me */
  me: string;
  /** 刷新令牌接口地址，默认 /v2/user/refresh-token */
  refreshToken: string;
}
