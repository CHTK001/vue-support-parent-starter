/**
 * router 单例注入（core）
 *
 * createAppRouter 创建 router 后，通过 setRouter() 注入，
 * 供各模块（http 401 处理、标签页导航等）使用，避免模块级循环依赖。
 */
import type { Router } from "vue-router";

let routerInstance: Router | null = null;

/** 注入 router（createApp / 应用入口调用） */
export function setRouter(router: Router): void {
  routerInstance = router;
}

/** 获取 router；未注入时抛错 */
export function getRouter(): Router {
  if (!routerInstance) {
    throw new Error("[core] router 未注入，请先调用 setRouter()");
  }
  return routerInstance;
}

/** 是否存在已注入的 router */
export function hasRouter(): boolean {
  return routerInstance !== null;
}
