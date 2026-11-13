/**
 * 登录凭据记忆（@repo/utils）
 *
 * 负责「记住账号密码」这一件事：
 * - 强制 AES 加密后写入 localStorage（不随 app.yaml 的 storage.encode=false 退化为明文）；
 * - key 按登录入口隔离，平台 / 租户站点等多入口互不覆盖；
 * - 浏览器密码本只做「尽力而为」的写入，不支持时静默跳过。
 *
 * <p><b>安全边界</b>：前端加密只能避免明文直接躺在 localStorage 里被一眼看到，
 * 不能防御 XSS —— 密钥随 bundle 下发，能执行页面脚本的人同样能解密。真正需要
 * 抗 XSS 的场景应改存后端签发的 remember token（可撤销、可轮换），而不是口令。</p>
 */
import { getConfig } from "@repo/config";
import { decrypt as aesDecrypt, encrypt as aesEncrypt, secretKey } from "./aes";
import { browserLocalStorage, createStorage, type StorageWrapper } from "./../storage";

/** 记住的登录凭据 */
export interface RememberedLogin {
  /** 登录账号 */
  loginName: string;
  /** 登录口令（强制 AES 加密后落盘） */
  password: string;
  /** 租户编码（多租户入口时一并记住） */
  tenantCode?: string;
  /** 写入时间（毫秒时间戳），便于以后做过期策略 */
  savedAt: number;
}

/** 存储 key 前缀；不是用户级 key，登录前没有 userId 也必须能读到 */
export const REMEMBER_KEY_PREFIX = "login.remember";

/** 凭据专用存储实例（prefix / key 与框架 storage 同口径，但强制开启 AES） */
let credentialStorage: StorageWrapper | null = null;

/** 当前实例对应的 prefix|key 签名；配置热更新后自动重建 */
let credentialStorageSignature = "";

/**
 * 取凭据专用加密存储。
 *
 * <p>这里没有复用 {@code getFrameworkStorage()}：后者是否加密取决于
 * {@code storage.encode}，而「记住密码」不应该因为宿主把全局缓存加密关掉
 * 就退化成明文。编码函数显式传入，StorageWrapper 的 encode 覆盖也随之固定。</p>
 *
 * @returns 强制 AES 的存储实例
 */
function getCredentialStorage(): StorageWrapper {
  const cfg = getConfig();
  const key = cfg.storage?.key || secretKey.AES_PWD_SECRET_KEY;
  const prefix = cfg.storage?.prefix || cfg.app?.systemCode || "system";
  const signature = `${prefix}|${key}`;
  if (credentialStorage && credentialStorageSignature === signature) return credentialStorage;
  credentialStorage = createStorage(browserLocalStorage, {
    prefix,
    encode: true,
    encodeFn: (plain: string) => aesEncrypt(plain, key),
    decodeFn: (encrypted: string) => aesDecrypt(encrypted, key),
  });
  credentialStorageSignature = signature;
  return credentialStorage;
}

/**
 * 归一化登录入口标识，避免 yaml 里的任意字符进入存储 key。
 *
 * @param entry 登录入口标识（loginConfig.types[].type），空值按 default 处理
 * @returns 只含字母、数字、下划线与中划线的 key 片段
 */
function safeEntry(entry: string): string {
  const normalized = String(entry || "default")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "_");
  return normalized || "default";
}

/**
 * 生成某个登录入口的存储 key。
 *
 * @param entry 登录入口标识
 * @returns 带前缀的存储 key
 */
function rememberKey(entry: string): string {
  return `${REMEMBER_KEY_PREFIX}.${safeEntry(entry)}`;
}

/**
 * 读取指定入口记住的登录凭据。
 *
 * <p>数据不完整（缺账号 / 口令）时按「没记住」处理，避免把半截脏数据回填到表单。</p>
 *
 * @param entry 登录入口标识
 * @returns 记住的凭据；没有、损坏或存储不可用时返回 null
 */
export function readRememberedLogin(entry: string): RememberedLogin | null {
  try {
    const value = getCredentialStorage().get<RememberedLogin>(rememberKey(entry));
    if (!value || typeof value !== "object") return null;
    if (typeof value.loginName !== "string" || !value.loginName) return null;
    if (typeof value.password !== "string" || !value.password) return null;
    return {
      loginName: value.loginName,
      password: value.password,
      tenantCode: typeof value.tenantCode === "string" ? value.tenantCode : undefined,
      savedAt: typeof value.savedAt === "number" ? value.savedAt : 0,
    };
  } catch {
    return null;
  }
}

/**
 * 记住指定入口的登录凭据。
 *
 * @param entry 登录入口标识
 * @param data  账号、口令与可选租户编码
 * @returns 是否写入成功（隐私模式 / 配额满等场景为 false）
 */
export function saveRememberedLogin(
  entry: string,
  data: Pick<RememberedLogin, "loginName" | "password" | "tenantCode">,
): boolean {
  if (!data.loginName || !data.password) return false;
  try {
    return getCredentialStorage().set<RememberedLogin>(rememberKey(entry), {
      loginName: data.loginName,
      password: data.password,
      ...(data.tenantCode ? { tenantCode: data.tenantCode } : {}),
      savedAt: Date.now(),
    });
  } catch {
    return false;
  }
}

/**
 * 清除指定入口记住的登录凭据（取消勾选「记住账号密码」并登录成功时调用）。
 *
 * @param entry 登录入口标识
 */
export function clearRememberedLogin(entry: string): void {
  try {
    getCredentialStorage().remove(rememberKey(entry));
  } catch {
    /* 存储不可用时无需处理 */
  }
}

/** 浏览器 PasswordCredential 构造器（lib.dom 未声明，按需最小化定义） */
type PasswordCredentialCtor = new (data: {
  id: string;
  password: string;
  name?: string;
}) => Credential;

/**
 * 当前环境能否把凭据交给浏览器密码本。
 *
 * <p>Credential Management API 要求安全上下文（HTTPS 或 localhost）；
 * Chromium 支持 PasswordCredential，Firefox 未实现，Safari 视版本而定。
 * 因此这里只做能力探测，调用方必须接受 false 并回退到本地加密存储。</p>
 *
 * @returns 支持 navigator.credentials.store + PasswordCredential 时返回 true
 */
export function canSaveBrowserCredential(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined" || !window.isSecureContext) {
    return false;
  }
  const ctor = (window as Window & { PasswordCredential?: unknown }).PasswordCredential;
  const store = navigator.credentials?.store;
  return typeof ctor === "function" && typeof store === "function";
}

/**
 * 请求浏览器密码本保存本次登录凭据（尽力而为，失败不影响登录）。
 *
 * <p>这一步只是补上浏览器原生「是否保存密码」提示：SPA 用 fetch / axios 登录，
 * 浏览器按表单提交判断保存的启发式经常不触发。浏览器不支持、非 HTTPS、
 * 用户拒绝或不在用户手势上下文时都会静默失败。</p>
 *
 * @param input 账号、口令与可选展示名
 * @returns 浏览器接受保存请求时返回 true；其余情况返回 false
 */
export async function saveBrowserCredential(input: {
  username: string;
  password: string;
  displayName?: string;
}): Promise<boolean> {
  if (!input.username || !input.password || !canSaveBrowserCredential()) return false;
  try {
    const PasswordCredential = (
      window as unknown as Window & { PasswordCredential: PasswordCredentialCtor }
    ).PasswordCredential;
    await navigator.credentials.store(
      new PasswordCredential({
        id: input.username,
        password: input.password,
        name: input.displayName || input.username,
      }),
    );
    return true;
  } catch {
    // 用户拒绝 / 浏览器策略拒绝 / 非安全上下文：都按「没保存」处理
    return false;
  }
}
