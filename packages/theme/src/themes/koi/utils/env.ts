/**
 * 环境变量安全读取工具
 *
 * koi 作为 @repo/theme 库被业务应用消费时，业务侧 vite 注入 import.meta.env；
 * 在无 vite 环境（纯 TS 校验 / SSR / 测试）下自动返回默认值，避免运行时崩溃。
 */

/** 获取 vite 环境变量对象（非 vite 环境返回空对象） */
const getMetaEnv = (): Record<string, string> => {
  const meta = import.meta as unknown as { env?: Record<string, string> };
  return meta.env ?? {};
};

/** 读取环境变量，未配置时返回默认值 */
export const getEnv = (key: string, fallback = ""): string => {
  const value = getMetaEnv()[key];
  return value ?? fallback;
};

/** 读取环境变量为布尔值 */
export const getEnvBoolean = (key: string, fallback = false): boolean => {
  const value = getMetaEnv()[key];
  if (value === undefined || value === "") return fallback;
  return value === "true" || value === "1";
};

/** 是否为开发环境 */
export const isDev = (): boolean => {
  return getEnv("DEV", "") === "true" || import.meta.env?.DEV === true;
};
