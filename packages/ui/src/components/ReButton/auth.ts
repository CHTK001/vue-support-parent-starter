/**
 * ReButton 权限控制
 *
 * 业务侧通过 provide 注入全局权限判断函数：
 *   app.provide(RE_AUTH_KEY, (key: string) => hasPermission(key));
 */
import type { InjectionKey } from "vue";

/** 权限判断函数：接收 auth 字符串，返回 boolean */
export type ReAuthFn = (key: string) => boolean;

/** 全局权限函数注入 key */
export const RE_AUTH_KEY: InjectionKey<ReAuthFn> = Symbol("ReButtonAuth");
