/**
 * 顶栏 / 布局开关的「用户偏好」层
 *
 * <p>与天气同一套双开关口径：</p>
 * <ul>
 *   <li>部署侧 yaml 的 {@code other.toolbar.<key>} 是 master：写 false 时该条目
 *       直接不渲染，主题配置抽屉里也不再出现这一行开关（没部署的功能不该让用户拨）；</li>
 *   <li>用户偏好只决定「我自己看不看」，存本机 localStorage（与主题色、布局同一档），
 *       刷新 / 重登保持，不影响其他账号。</li>
 * </ul>
 *
 * <p>没设过偏好的用户默认显示，与改造前逐字一致。</p>
 */
import { reactive } from "vue";
import { getConfig } from "@repo/config";

/** 本地偏好键（版本化，改结构时换 v2 自动回落默认） */
const KEY = "koi:toolbar:prefs:v1";

function readPrefs(): Record<string, boolean> {
  if (typeof window === "undefined" || !window.localStorage) return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const out: Record<string, boolean> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "boolean") out[key] = value;
    }
    return out;
  } catch {
    return {};
  }
}

/** 用户偏好（响应式）：true = 用户要显示 */
export const toolbarPrefs = reactive<Record<string, boolean>>(readPrefs());

function persist(): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(toolbarPrefs));
  } catch {
    /* 存不下不影响本次会话 */
  }
}

/**
 * 部署侧是否提供了这个开关
 *
 * @param key 开关键（toolbar.<key>）
 * @returns yaml 里不是显式 false 时为 true
 */
export function isToolbarDeployed(key: string): boolean {
  const toolbar = getConfig()?.other?.toolbar as unknown as Record<string, unknown> | undefined;
  return toolbar?.[key] !== false;
}

/**
 * 用户自己的选择
 *
 * @param key 开关键
 * @returns 没设过时默认 true（显示）
 */
export function isToolbarUserEnabled(key: string): boolean {
  return toolbarPrefs[key] ?? true;
}

/**
 * 最终是否显示：部署侧开放且用户没关
 *
 * @param key 开关键
 * @returns 是否渲染
 */
export function isToolbarVisible(key: string): boolean {
  return isToolbarDeployed(key) && isToolbarUserEnabled(key);
}

/**
 * 写入用户偏好
 *
 * @param key   开关键
 * @param value 是否显示
 */
export function setToolbarUserPref(key: string, value: boolean): void {
  toolbarPrefs[key] = value;
  persist();
}
