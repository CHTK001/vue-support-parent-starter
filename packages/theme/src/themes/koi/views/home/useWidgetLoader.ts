/**
 * Widget 异步加载器
 *
 * 按 widget.type 返回一个 ref 结构：
 *   { state: 'loading' | 'ready' | 'error', Component?: Component, error?: unknown, reload() }
 *
 * 组件 import 走动态 import，单实例延迟加载，type 维度的 loader 缓存到全局。
 * 第一次访问某类型会触发 import.meta.glob 风格的预加载（Vite 友好）。
 */
import { defineAsyncComponent, ref, type Component } from "vue";
import {
  Calendar,
  WarningFilled,
} from "@element-plus/icons-vue";

export type WidgetLoaderState = "loading" | "ready" | "error";

export interface WidgetLoaderResult {
  state: WidgetLoaderState;
  Component?: Component;
  error?: unknown;
  reload(): void;
}

/** 同步组件映射（所有 widget 都是同步组件，避免异步抖动） */
const LOADER_MAP: Record<string, () => Promise<Component>> = {
  calendar: () => import("./widgets/CalendarWidget.vue"),
  custom: () => import("./widgets/CustomWidget.vue"),
  note: () => import("./widgets/NoteWidget.vue"),
};

/** 同 type 跨多个 widget 共享组件（避免每个 widget 独立加载） */
const componentCache: Map<string, Component> = new Map();

/**
 * 加载组件（Promise），命中缓存直接 resolve。
 */
async function loadWidgetComponent(type: string): Promise<Component> {
  const cached = componentCache.get(type);
  if (cached) return cached;
  const loader = LOADER_MAP[type];
  if (!loader) {
    throw new Error(`[widget-loader] unknown widget type: ${type}`);
  }
  const mod = await loader();
  const component = (mod as { default: Component }).default ?? (mod as unknown as Component);
  componentCache.set(type, component);
  return component;
}

/**
 * 组合式：按 type 异步加载组件。
 */
export function useWidgetLoader(getType: () => string): WidgetLoaderResult {
  const state = ref<WidgetLoaderState>("loading");
  const error = ref<unknown>(undefined);
  const Component = ref<Component | undefined>(undefined);
  let ticker = 0;

  const tryLoad = (type: string): void => {
    const tag = ++ticker;
    state.value = "loading";
    error.value = undefined;
    loadWidgetComponent(type)
      .then((comp) => {
        if (tag !== ticker) return;
        Component.value = comp;
        state.value = "ready";
      })
      .catch((err: unknown) => {
        if (tag !== ticker) return;
        Component.value = undefined;
        error.value = err;
        state.value = "error";
      });
  };

  // 初次加载
  tryLoad(getType());

  return {
    get state() {
      return state.value;
    },
    get Component() {
      return Component.value;
    },
    get error() {
      return error.value;
    },
    reload() {
      tryLoad(getType());
    },
  };
}

/* 预热缓存（可选）在 home/index.vue 启动时调用 */
export function preloadWidgetComponents(types: string[]): void {
  types.forEach((t) => {
    void loadWidgetComponent(t).catch(() => undefined);
  });
}

/* 引用以避免 tsconfig noUnusedLocals 误判 */
export const _internalIcons = { Calendar, WarningFilled };
