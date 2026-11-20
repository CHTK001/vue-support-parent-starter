/**
 * 主题配置抽屉「分区注册表」—— koi 布局的通用配置扩展点。
 *
 * <p>主题包（{@code @repo/theme}）只提供注册机制与渲染位置，<b>不实现任何业务分区</b>。
 * 业务模块（如 {@code @pages/ai}）在宿主启动时把自定义分区注册进来：</p>
 *
 * <pre>{@code
 * import { registerThemeConfigSection } from "@repo/theme/koi/layouts/components/ThemeConfig/registry";
 *
 * registerThemeConfigSection({
 *   id: "ai-chat",
 *   tab: "advanced",
 *   order: 15,
 *   visible: () => getConfig().other.aiChat?.enable !== false, // yaml 决定「允不允许」
 *   component: () => import("./AiChatSettingSection.vue"),     // 懒加载
 * });
 * }</pre>
 *
 * <p>约定：</p>
 * <ul>
 *   <li><b>yaml 开 + 模块在场 = 分区出现</b>：yaml（{@code other.aiChat.enable} 等）
 *       决定允不允许展示；模块不在场时没人调用注册，分区天然不存在。</li>
 *   <li>{@code visible} 在每次渲染分区列表时求值，可读任意响应式配置；返回 false 的
 *       分区不渲染（但注册关系保留，重新打开抽屉会再次求值）。</li>
 *   <li>{@code component} 支持三种返回值（同步组件 / {@code {default}} / Promise），
 *       Promise 会被包装成 {@code defineAsyncComponent} 并缓存，避免重复创建。</li>
 *   <li>注册表按 {@code order} 升序插入（缺省 100，同序号按注册先后）；注销函数
 *       可用于 HMR / 模块卸载场景。</li>
 * </ul>
 */
import { defineAsyncComponent, shallowRef, triggerRef, type Component } from "vue";

/** 主题配置抽屉的 tab 名（与 ThemeConfig/index.vue 的 configTabs 一致） */
export type ThemeConfigTab = "appearance" | "interface" | "extension" | "advanced";

/** 组件加载器：与 home widget 注册表同构（同步 / {default} / 动态 import） */
export type ThemeConfigSectionLoader = () =>
  | Component
  | { default: Component }
  | Promise<Component | { default: Component }>;

/** 一个可注册进主题配置抽屉的分区 */
export interface ThemeConfigSectionRegistration {
  /** 全局唯一 id（用于 key 与排错日志），建议 {@code <模块>-<功能>} 形式 */
  readonly id: string;
  /** 挂到哪个 tab 下 */
  readonly tab: ThemeConfigTab;
  /** 排序权重（小在前，缺省 100） */
  readonly order?: number;
  /** 是否可见（每次渲染求值；缺省可见）。yaml 开关在这里接入 */
  readonly visible?: () => boolean;
  /** 分区组件（支持懒加载） */
  readonly component: ThemeConfigSectionLoader;
}

const sections: ThemeConfigSectionRegistration[] = [];

/**
 * 注册表版本号：注册 / 注销时自增。
 * ThemeConfig/index.vue 的 computed 读取它，从而在注册发生时重新求值分区列表
 * （数组本身不是响应式的，靠版本号驱动）。
 */
const registryVersion = shallowRef(0);

/**
 * 注册一个主题配置分区。
 *
 * @param registration 分区描述
 * @returns 注销函数（调用后该分区不再渲染）
 */
export function registerThemeConfigSection(
  registration: ThemeConfigSectionRegistration,
): () => void {
  const existing = sections.findIndex((s) => s.id === registration.id);
  if (existing >= 0) {
    // 同 id 重复注册：以后注册者为准（热更新场景），不累积脏分区
    sections.splice(existing, 1);
  }
  sections.push(registration);
  sections.sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
  registryVersion.value++;
  triggerRef(registryVersion);
  return () => {
    const index = sections.indexOf(registration);
    if (index >= 0) sections.splice(index, 1);
    registryVersion.value++;
    triggerRef(registryVersion);
  };
}

/**
 * 当前注册的全部分区（只读视图，按 order 升序）。
 * 内部读取 {@link registryVersion} 以建立响应式依赖。
 */
export function getThemeConfigSections(): readonly ThemeConfigSectionRegistration[] {
  void registryVersion.value;
  return sections;
}

/**
 * 某个 tab 下当前可见的分区（order 升序）。
 *
 * @param tab tab 名
 */
export function sectionsForTab(tab: ThemeConfigTab): ThemeConfigSectionRegistration[] {
  return getThemeConfigSections().filter((s) => s.tab === tab && (s.visible?.() ?? true));
}

/** loader → 归一组件 的缓存：保证 defineAsyncComponent 只创建一次，渲染 key 稳定 */
const resolvedComponents = new WeakMap<ThemeConfigSectionRegistration, Component>();

function unwrap(m: Component | { default: Component }): Component {
  return (m as { default?: Component }).default ?? (m as Component);
}

/**
 * 把分区的 component loader 归一成可直接渲染的 Vue 组件。
 * Promise 返回值包装为异步组件并缓存。
 *
 * @param registration 分区注册项
 */
export function resolveSectionComponent(
  registration: ThemeConfigSectionRegistration,
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
