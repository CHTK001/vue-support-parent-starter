/**
 * 默认配置加载（core）
 *
 * 进入页面（登录 / 首页）时调用，从后端拉取默认配置（/v2/setting/default）
 * 合并进 getConfig，主要控制：
 *   - CheckCodeOpen 是否开启图形验证码
 *   - CheckTotpOpen 是否开启 TOTP 双因素
 *   - SlidingBlockOpen 是否开启滑块验证
 *   - SystemName / 登录页品牌展示项
 *   - Watermark* 全局水印配置（security.watermark）
 *
 * 调用方只需调 loadDefaultSetting()，无需关心接口与合并细节。
 *
 * 热重载：bindConfigHotReload() 监听 CONFIG_VERSION_CHANGE_EVENT（由
 * http 响应头 x-response-version 触发），版本变化后延迟重新拉取设置，
 * 并执行已注册的 onConfigHotReload 回调（安全防护/水印/标题刷新）。
 */
import { getConfig, setConfig, CONFIG_VERSION_CHANGE_EVENT } from "@repo/config";
import { getDefaultSetting, type SettingItem } from "./api";

/** 是否从后端拉取默认配置（config.enable 开关 + url.setting 非空，默认 true） */
function shouldFetchRemoteSetting(): boolean {
  return getConfig()?.config?.enable !== false && !!getConfig()?.url?.setting;
}

/**
 * setting 接口字段 → login 配置字段映射。
 *
 * 后端 /v2/setting/default 返回 default 分组的 sys_setting（sysSettingName → sysSettingValue），
 * 与本地 loginConfig 键名不同，这里做归一化。字段名以后端 SQL 初始化数据为准：
 *   - CheckCodeOpen    图形验证码开关
 *   - SlidingBlockOpen 滑块验证开关
 *   - SystemName       系统标题（登录页主标题）
 *   - OpenSmsLogin     短信登录开关（前端未实现短信登录，暂只透传顶层）
 *   - WatermarkOpen    水印开关（config 分组）
 *   - CheckTotpOpen    兼容：若后端开启 TOTP 双因素（6 位动态口令）
 */
const SETTING_TO_LOGIN_MAP: Record<string, string> = {
  /** 是否开启图形验证码 */
  CheckCodeOpen: "captcha",
  /** 是否开启 OTP 动态口令（TOTP） */
  CheckTotpOpen: "otp",
  /** 是否开启滑块验证 */
  SlidingBlockOpen: "slider",
  /** 系统标题 */
  SystemName: "title",
};

/** 后端水印字段 → security.watermark 子键映射（config 分组） */
const SETTING_TO_WATERMARK_MAP: Record<string, string> = {
  /** 水印开关 */
  WatermarkOpen: "enable",
  /** 水印颜色（hex） */
  WatermarkColor: "color",
  /** 水印透明度 */
  WatermarkAlpha: "alpha",
  /** 水印旋转角度 */
  WatermarkRotate: "rotate",
};

/** 后端 Socket 字段 → socket 子键映射（config 分组） */
const SETTING_TO_SOCKET_MAP: Record<string, string> = {
  /** Socket 开关 */
  SocketOpen: "enable",
  /** Socket 协议（socketio/websocket/sse） */
  SocketProtocol: "protocol",
  /** Socket 服务器地址（逗号分隔） */
  SocketUrl: "urls",
  /** Socket 上下文路径 */
  SocketPath: "context",
};

/** 把一条 setting 映射为 config 顶层键（true/false 布尔，其余原值） */
function mapSettingToConfig(key: string, value: string, result: Record<string, unknown>): void {
  const v = value;
  if (v === "true") result[key] = true;
  else if (v === "false") result[key] = false;
  else result[key] = v;
}

/** 解析数字类型的 setting 值（非数字原样返回） */
function toNumberOrRaw(raw: string): unknown {
  if (raw.trim() === "") return raw;
  const num = Number(raw);
  return Number.isFinite(num) ? num : raw;
}

/** 从默认配置组提取配置并合并进 getConfig */
export function mergeDefaultSetting(items: SettingItem[]): void {
  if (!Array.isArray(items)) return;
  const patch: Record<string, unknown> = {};
  items.forEach((item) => {
    if (!item?.sysSettingName || item.sysSettingValue == null) return;
    const key = item.sysSettingName;
    const raw = String(item.sysSettingValue);
    const boolVal = raw === "true" ? true : raw === "false" ? false : undefined;
    // 属于登录页配置：映射进 login 子配置（布尔开关直接映射，字符串如 SystemName 原样映射）
    const loginKey = SETTING_TO_LOGIN_MAP[key];
    if (loginKey) {
      patch.login = patch.login ?? {};
      (patch.login as Record<string, unknown>)[loginKey] = boolVal ?? raw;
      return;
    }
    // 属于全局水印配置：映射进 security.watermark 嵌套对象
    const watermarkKey = SETTING_TO_WATERMARK_MAP[key];
    if (watermarkKey) {
      patch.security = patch.security ?? {};
      const watermark = (patch.security as Record<string, unknown>).watermark =
        (patch.security as Record<string, unknown>).watermark ?? {};
      (watermark as Record<string, unknown>)[watermarkKey] =
        watermarkKey === "enable"
          ? (boolVal ?? raw === "1")
          : toNumberOrRaw(raw);
      return;
    }
    // 属于 Socket 配置：映射进 socket 嵌套对象
    const socketKey = SETTING_TO_SOCKET_MAP[key];
    if (socketKey) {
      patch.socket = patch.socket ?? {};
      (patch.socket as Record<string, unknown>)[socketKey] =
        socketKey === "enable"
          ? (boolVal ?? raw === "1")
          : socketKey === "protocol"
            ? raw.toLowerCase()
            : raw;
      return;
    }
    mapSettingToConfig(key, raw, patch);
  });
  if (Object.keys(patch).length > 0) {
    setConfig(patch as never);
  }
}

/**
 * 加载默认配置并合并到 getConfig。
 *
 * 后端未启动 / 接口失败时静默降级（返回 false），不抛出异常：
 * 本地 app.yaml 已含完整配置，远程配置仅用于覆盖，失败不影响登录页可用。
 * 返回 true 表示远程配置加载成功（或无需加载）。
 *
 * 并发去重：登录页容器与登录表单等多个挂载点都会调用本方法，
 * 通过进行中的 Promise 复用保证同一时刻只发一次 /v2/setting/default 请求。
 */
let defaultSettingPromise: Promise<boolean> | null = null;

export function loadDefaultSetting(): Promise<boolean> {
  if (!shouldFetchRemoteSetting()) {
    return Promise.resolve(true);
  }
  if (defaultSettingPromise) {
    return defaultSettingPromise;
  }
  defaultSettingPromise = doLoadDefaultSetting().finally(() => {
    defaultSettingPromise = null;
  });
  return defaultSettingPromise;
}

async function doLoadDefaultSetting(): Promise<boolean> {
  try {
    const { data } = await getDefaultSetting();
    if (Array.isArray(data)) {
      mergeDefaultSetting(data);
    }
    return true;
  } catch (error) {
    // 远程配置拉取失败：静默降级，保留本地 app.yaml 配置
    console.warn("[setting] 远程默认配置拉取失败，已降级使用本地配置", error);
    return false;
  }
}

// ==================== 配置热重载 ====================

/** 热重载后执行的回调集合（安全防护 / 水印 / 标题等刷新） */
const hotReloadCallbacks = new Set<() => void>();

/** 已绑定版本监听标志（幂等，避免重复绑定） */
let hotReloadBound = false;

/**
 * 注册配置热重载回调：版本升级、重新拉取设置后执行。
 * 返回取消注册函数。
 */
export function onConfigHotReload(cb: () => void): () => void {
  hotReloadCallbacks.add(cb);
  return () => hotReloadCallbacks.delete(cb);
}

/**
 * 绑定配置版本变更监听（幂等）。
 *
 * 触发链：后端配置变更 → 响应头 x-response-version / socket 推送 → upgrade()
 * → window 派发 CONFIG_VERSION_CHANGE_EVENT → 本监听 → 延迟 500ms 重新拉取
 * 设置 → 执行 onConfigHotReload 回调。
 */
export function bindConfigHotReload(): void {
  if (hotReloadBound || typeof window === "undefined") {
    return;
  }
  hotReloadBound = true;

  window.addEventListener(CONFIG_VERSION_CHANGE_EVENT, (event) => {
    const version = (event as CustomEvent<{ version?: string }>)?.detail?.version;
    if (!version) {
      return;
    }
    // 延迟等待版本写入 / 避免与首屏拉取竞争
    window.setTimeout(() => {
      void (async () => {
        try {
          await loadDefaultSetting();
        } finally {
          hotReloadCallbacks.forEach((cb) => {
            try {
              cb();
            } catch (error) {
              console.warn("[setting] 配置热重载回调失败", error);
            }
          });
        }
      })();
    }, 500);
  });
}
