/**
 * koi 布局「浮动组件注册表」—— 常驻布局的可插拔悬浮能力（如 AI 悬浮球）。
 *
 * <p>主题包只提供注册机制与挂载位置（Main/index.vue 渲染注册表），<b>不实现任何
 * 具体浮动业务</b>。业务模块（如 {@code @pages/ai} 经 {@code @repo/web-llm}）把
 * 悬浮组件注册进来：</p>
 *
 * <pre>{@code
 * import { registerFloatingWidget } from "@repo/theme/koi/layouts/floatingWidgets";
 *
 * registerFloatingWidget({
 *   id: "ai-character",
 *   visible: () => getConfig().other.aiChat?.enable !== false,
 *   component: () => import("@repo/web-llm/ReAiCharacter.vue"), // 懒加载
 * });
 * }</pre>
 *
 * <p>与 {@code ThemeConfig/registry.ts} 同一套约定：yaml 决定允不允许、模块在场才注册、
 * 组件支持懒加载并缓存、注销函数可用于卸载。</p>
 */
import { defineAsyncComponent, shallowRef, triggerRef, type Component } from "vue";

/** 组件加载器（同步 / {default} / 动态 import） */
export type FloatingWidgetLoader = () =>
  | Component
  | { default: Component }
  | Promise<Component | { default: Component }>;

/** 一个可注册进 koi 主布局的浮动组件 */
export interface FloatingWidgetRegistration {
  /** 全局唯一 id（用于 key 与排错日志） */
  readonly id: string;
  /** 排序权重（小在前，缺省 100） */
  readonly order?: number;
  /** 是否可见（每次渲染求值；缺省可见）。yaml 开关在这里接入 */
  readonly visible?: () => boolean;
  /** 浮动组件（支持懒加载） */
  readonly component: FloatingWidgetLoader;
}

const widgets: FloatingWidgetRegistration[] = [];

/** 注册表版本号：驱动 Main/index.vue 的 computed 重新求值 */
const registryVersion = shallowRef(0);

/**
 * 注册一个浮动组件。
 *
 * @param registration 浮动组件描述
 * @returns 注销函数
 */
export function registerFloatingWidget(
  registration: FloatingWidgetRegistration,
): () => void {
  const existing = widgets.findIndex((w) => w.id === registration.id);
  if (existing >= 0) {
    widgets.splice(existing, 1);
  }
  widgets.push(registration);
  widgets.sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
  registryVersion.value++;
  triggerRef(registryVersion);
  return () => {
    const index = widgets.indexOf(registration);
    if (index >= 0) widgets.splice(index, 1);
    registryVersion.value++;
    triggerRef(registryVersion);
  };
}

/**
 * 当前注册的全部浮动组件（只读视图，order 升序）。
 */
export function getFloatingWidgets(): readonly FloatingWidgetRegistration[] {
  void registryVersion.value;
  return widgets;
}

/** 当前可见的浮动组件（order 升序） */
export function visibleFloatingWidgets(): FloatingWidgetRegistration[] {
  return getFloatingWidgets().filter((w) => w.visible?.() ?? true);
}

/** loader → 归一组件 的缓存：defineAsyncComponent 只创建一次 */
const resolvedComponents = new WeakMap<FloatingWidgetRegistration, Component>();

function unwrap(m: Component | { default: Component }): Component {
  return (m as { default?: Component }).default ?? (m as Component);
}

/**
 * 把浮动组件的 loader 归一成可直接渲染的 Vue 组件（Promise 包装为异步组件并缓存）。
 *
 * @param registration 浮动组件注册项
 */
export function resolveFloatingComponent(
  registration: FloatingWidgetRegistration,
): Component {
  const cached = resolvedComponents.get(registration);
  if (cached) return cached;
  const loaded = registration.component();
  const component: Component =
    loaded instanceof Promise
      ? defineAsyncComponent(() => loaded.then(unwrap))
      : unwrap(loaded);
  resolvedComponents.set(registration, component);
  return component;
}
