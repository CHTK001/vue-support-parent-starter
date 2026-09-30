/**
 * Widget 组件加载器
 *
 * 按 widget.type 从**注册表**（{@link ./registry}）取组件加载器并异步加载：
 *   - ready        组件就绪
 *   - loading      正在动态 import
 *   - error        已注册但加载失败（网络 / chunk 丢失）→ 展示可重试的失败卡片
 *   - unregistered 当前应用未注册该 type → 展示**占位卡片**（不是失败卡片）
 *
 * <p>{@code unregistered} 与 {@code error} 必须分开：前者是「这个 app 没启用该模块」
 * 的<b>正常</b>状态，重试永远不会成功，给「重试」按钮是骗人的；后者才是真故障。
 * 此前两者混在一起，未注册会走进「加载失败 + 重试」，且重试必然再失败 ——
 * 这正是坏卡片的由来。</p>
 */
import { onScopeDispose, ref, watch, type Component } from "vue";
import { getWidgetRegistration, isWidgetRegistered } from "./registry";

export type WidgetLoaderState = "loading" | "ready" | "error" | "unregistered";

export interface WidgetLoaderResult {
  state: WidgetLoaderState;
  Component?: Component;
  error?: unknown;
  reload(): void;
}

/** 同 type 跨多个 widget 共享组件（避免每个 widget 独立加载） */
const componentCache: Map<string, Component> = new Map();

/**
 * 归一化注册项的 component 返回值。
 *
 * <p>注册契约允许三种写法（见 {@code WidgetRegistration.component}）：
 * 动态 import 的模块对象（取 {@code .default}）、{@code defineAsyncComponent} 的产物、
 * 或同步组件本身。三种都要能吃下，否则模块作者只能被迫用某一种。</p>
 */
function normalizeComponent(raw: Component | { default: Component }): Component {
  if (raw && typeof raw === "object" && "default" in raw && raw.default) {
    return (raw as { default: Component }).default;
  }
  return raw as Component;
}

/**
 * 加载组件（Promise），命中缓存直接 resolve。
 *
 * @param type 已注册的 widget 类型
 * @returns 组件
 * @throws 调用方需先确认该 type 已注册（见 {@link isWidgetRegistered}）
 */
async function loadWidgetComponent(type: string): Promise<Component> {
  const cached = componentCache.get(type);
  if (cached) return cached;
  const reg = getWidgetRegistration(type);
  if (!reg) {
    throw new Error(`[widget-loader] 未注册的 widget type: ${type}`);
  }
  const component = normalizeComponent(await reg.component());
  componentCache.set(type, component);
  return component;
}

/**
 * 组合式：按 type 加载组件。
 *
 * @param getType 返回当前 widget 类型（传 getter 而非值，以便 type 变化时跟随）
 * @returns 加载状态、组件、错误与重载入口
 */
export function useWidgetLoader(getType: () => string): WidgetLoaderResult {
  const state = ref<WidgetLoaderState>("loading");
  const error = ref<unknown>(undefined);
  const Component = ref<Component | undefined>(undefined);
  let ticker = 0;
  /** 当前正在加载 / 已加载的 type：watch 据此判断是否需要重新加载 */
  let loadingType = "";

  const tryLoad = (type: string): void => {
    const tag = ++ticker;
    loadingType = type;
    error.value = undefined;
    Component.value = undefined;

    // 未注册：正常状态（该模块未在本 app 启用），不进 loading、不抛错
    if (!isWidgetRegistered(type)) {
      state.value = "unregistered";
      return;
    }

    state.value = "loading";
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

  /**
   * 跟随 type 变化重新加载。
   *
   * <p>此前只在 setup 里调一次 {@link tryLoad}，全文件没有任何 watch：一旦同一个
   * {@link WidgetRenderer} 实例被复用给另一种 type（v-for 的 key 写错、keep-alive 复用、
   * 或调用方直接改 prop），界面会一直显示**上一个** widget 的组件，且不报错 ——
   * 比抛错更难发现。这里显式跟随；type 未变则不重复加载，避免无谓的 loading 闪烁。</p>
   *
   * <p>另需覆盖「注册晚于首次渲染」的情形：各 pages 模块是在 app 的 mount() 阶段
   * 才注册的，而首页可能先渲染出占位卡片。注册完成后需要重试一次才能变成真实组件。</p>
   */
  const stopWatch = watch(getType, (type) => {
    if (type === loadingType && state.value !== "unregistered") return;
    tryLoad(type);
  });
  onScopeDispose(stopWatch);

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

/**
 * 预热缓存（可选，在 home/index.vue 启动时调用）。
 *
 * <p>未注册的 type 直接跳过 —— 预热不该为「本 app 没有的模块」产生未捕获的
 * Promise rejection。</p>
 *
 * @param types 要预热的 widget 类型列表
 */
export function preloadWidgetComponents(types: string[]): void {
  types.forEach((t) => {
    if (!isWidgetRegistered(t)) return;
    void loadWidgetComponent(t).catch(() => undefined);
  });
}
