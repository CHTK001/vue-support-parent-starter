/**
 * 布局事件管理 Hook
 * @description 统一管理 emitter 事件的注册和注销，避免内存泄漏
 * @version 1.0.0
 */
import { onBeforeUnmount } from "vue";
import { emitter } from "@repo/core";

/**
 * 布局事件类型定义
 */
export type LayoutEventType =
  | "breadcrumbChange"
  | "keepAliveChange"
  | "menuTransitionChange"
  | "hideFooterChange"
  | "confirmOnLeaveChange"
  | "tagViewsChange"
  | "tagViewsShowModel"
  | "openPanel"
  | "resize"
  | "logoChange"
  | "menuActiveChange";

/**
 * 单个事件监听 Hook
 * @description 注册单个事件监听器，组件卸载时自动注销
 * @param eventName 事件名称
 * @param handler 事件处理函数
 * 
 * @example
 * ```ts
 * // 监听面包屑变化
 * useLayoutEvent('breadcrumbChange', (value: boolean) => {
 *   showBreadcrumb.value = value;
 * });
 * ```
 */
export function useLayoutEvent<T = any>(
  eventName: LayoutEventType | string,
  handler: (value: T) => void
) {
  // 注册事件
  emitter.on(eventName, handler);

  // 组件卸载时自动注销
  onBeforeUnmount(() => {
    emitter.off(eventName, handler);
  });

  // 返回手动注销方法（可选）
  return () => {
    emitter.off(eventName, handler);
  };
}

/**
 * 多事件监听 Hook
 * @description 批量注册多个事件监听器，组件卸载时自动注销
 * @param events 事件配置数组
 * 
 * @example
 * ```ts
 * useLayoutEvents([
 *   { name: 'breadcrumbChange', handler: (v) => showBreadcrumb.value = v },
 *   { name: 'keepAliveChange', handler: (v) => isKeepAlive.value = v },
 * ]);
 * ```
 */
export function useLayoutEvents<T = any>(
  events: Array<{ name: LayoutEventType | string; handler: (value: T) => void }>
) {
  const unsubscribeFns: Array<() => void> = [];

  // 注册所有事件
  events.forEach(({ name, handler }) => {
    emitter.on(name, handler);
    unsubscribeFns.push(() => emitter.off(name, handler));
  });

  // 组件卸载时自动注销所有事件
  onBeforeUnmount(() => {
    unsubscribeFns.forEach((fn) => fn());
  });

  // 返回手动注销所有方法
  return () => {
    unsubscribeFns.forEach((fn) => fn());
  };
}

/**
 * 事件发射 Hook
 * @description 发射布局事件
 * @param eventName 事件名称
 * @param value 事件值
 * 
 * @example
 * ```ts
 * emitLayoutEvent('breadcrumbChange', true);
 * ```
 */
export function emitLayoutEvent<T = any>(
  eventName: LayoutEventType | string,
  value: T
) {
  emitter.emit(eventName, value);
}
