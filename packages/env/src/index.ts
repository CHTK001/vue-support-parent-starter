/**
 * 环境变量安全读取工具（@repo/env）
 *
 * 环境标识（dev/test/prod）以 @repo/config 的 AppConfig.env 为准；
 * VITE_ 原始变量仍从 import.meta.env 读取（Vite 注入），
 * 非 Vite 环境（纯 TS 校验 / SSR / 测试）自动返回默认值，避免运行时崩溃。
 */
import { getConfig } from "@repo/config";

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

/** 当前环境（dev / test / prod），以 @repo/config 为准 */
export const getAppEnv = (): string => getConfig().env.env;

/** 是否为开发环境（config.env.env === "dev"） */
export const isDev = (): boolean => getAppEnv() === "dev";

/** 是否为测试环境 */
export const isTest = (): boolean => getAppEnv() === "test";

/** 是否为生产环境 */
export const isProd = (): boolean => getAppEnv() === "prod";

/** 当前路由模式（hash / history），由 VITE_ROUTER_MODE 决定，默认 hash */
export const getRouterMode = (): "hash" | "history" =>
  getEnv("VITE_ROUTER_MODE") === "history" ? "history" : "hash";

/** 获取不同路由模式所对应的 url + params */
export const getUrlWithParams = (): string => {
  const url = {
    hash: location.hash.substring(1),
    history: location.pathname + location.search,
  };
  // @ts-ignore
  return url[getRouterMode()];
};
