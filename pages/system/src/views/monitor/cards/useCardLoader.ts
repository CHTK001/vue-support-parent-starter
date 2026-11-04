/**
 * 卡片组件加载器
 *
 * <p>与首页 {@code useWidgetLoader} 同构，但绑定监控卡片注册表：</p>
 * <ul>
 *   <li>{@code ready} —— 组件就绪</li>
 *   <li>{@code loading} —— 正在动态 import</li>
 *   <li>{@code error} —— 已注册但加载失败（chunk 丢失 / 网络），可重试</li>
 *   <li>{@code unregistered} —— 当前应用未注册该 type，渲染**占位卡片**（不是失败卡片）</li>
 * </ul>
 *
 * <p>{@code unregistered} 与 {@code error} 必须分开：前者是「这个 app 没启用该模块」的
 * 正常状态，重试永远不会成功，给「重试」按钮是骗人的。</p>
 */
import { markRaw, onScopeDispose, ref, shallowRef, watch, type Component, type Ref } from "vue";
import { getMonitorCardRegistration, isMonitorCardRegistered } from "./registry";

/** 加载状态 */
export type CardLoaderState = "loading" | "ready" | "error" | "unregistered";

/** 加载结果 */
export interface CardLoaderResult {
  state: Ref<CardLoaderState>;
  Component: Ref<Component | undefined>;
  error: Ref<unknown>;
  reload: () => void;
}

/** 同 type 跨多个卡片共享组件（避免每张卡片独立加载同一个 chunk） */
const componentCache = new Map<string, Component>();

/** 归一化注册项 component 的三种合法写法 */
function normalizeComponent(raw: Component | { default: Component }): Component {
  if (raw && typeof raw === "object" && "default" in raw && raw.default) {
    return (raw as { default: Component }).default;
  }
  return raw as Component;
}

/** 加载组件（Promise），命中缓存直接返回 */
async function loadCardComponent(type: string): Promise<Component> {
  const cached = componentCache.get(type);
  if (cached) return cached;
  const reg = getMonitorCardRegistration(type);
  // 页面区块（page: 前缀）只登记元数据、没有加载器，正常走不到这里（画布用 #block 插槽渲染）；
  // 真走到这里说明存档里出现了无加载器的普通卡片，按未注册处理。
  if (!reg || !reg.component) throw new Error(`[monitor-card-loader] 未注册的卡片 type: ${type}`);
  const component = markRaw(normalizeComponent(await reg.component()));
  componentCache.set(type, component);
  return component;
}

/**
 * 按卡片类型加载组件。
 *
 * @param getType 返回当前卡片类型（传 getter 以便类型变化时跟随）
 */
export function useCardLoader(getType: () => string): CardLoaderResult {
  const state = ref<CardLoaderState>("loading");
  const error = ref<unknown>(undefined);
  // shallowRef + markRaw：组件对象不需要变成响应式（否则每张卡片都白付一层 Proxy
  // 开销，Vue 也会警告 "received a Component that was made a reactive object"）
  const Component = shallowRef<Component | undefined>(undefined);
  let ticker = 0;
  let loadingType = "";

  const tryLoad = (type: string): void => {
    const tag = ++ticker;
    loadingType = type;
    error.value = undefined;
    Component.value = undefined;

    // 未注册：正常状态，不进 loading、不抛错
    if (!isMonitorCardRegistered(type)) {
      state.value = "unregistered";
      return;
    }

    state.value = "loading";
    loadCardComponent(type)
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

  tryLoad(getType());

  // 跟随 type 变化重新加载；并覆盖「注册晚于首次渲染」的情形（模块在 mount() 期注册）
  const stopWatch = watch(getType, (type) => {
    if (type === loadingType && state.value !== "unregistered") return;
    tryLoad(type);
  });
  onScopeDispose(stopWatch);

  return { state, Component, error, reload: () => tryLoad(getType()) };
}
