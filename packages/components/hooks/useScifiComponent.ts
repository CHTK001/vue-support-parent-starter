import { ref, watch, computed, getCurrentInstance, type Ref } from "vue";

/**
 * 模块级单例 — 保证 @techui/scifi 在整个应用中只加载一次。
 * 多个组件同时调用 useScifiComponent 时，共享同一个 Promise。
 */
let scifiReady: Promise<boolean> | null = null;
let scifiLoaded = false;
let scifiFailed = false;

async function ensureScifiLoaded(app: any): Promise<boolean> {
  if (scifiLoaded) return true;
  if (scifiFailed) return false;
  if (!scifiReady) {
    scifiReady = (async () => {
      try {
        await import("@techui/scifi/dist/index.css");
        const { default: techuiScifiInit } = await import("@techui/scifi");
        await techuiScifiInit({
          app,
          license: null,
          features: {},
          debug: false,
        });
        scifiLoaded = true;
        return true;
      } catch (e) {
        console.warn("[useScifiComponent] @techui/scifi 加载失败:", e);
        scifiFailed = true;
        return false;
      }
    })();
  }
  return scifiReady;
}

/**
 * 按需异步加载 @techui/scifi 的组合函数。
 *
 * 当 `isScifi` 为 true 时，首次调用会触发 @techui/scifi 的动态导入。
 * 加载完成后，Scifi 组件通过全局注册机制可用。
 *
 * @param componentName - 目标 scifi 组件名，如 "ScifiPanelB1"
 * @param isScifi - 是否处于 scifi 模式
 * @returns resolvedComponent: 加载完成后返回组件名字符串，否则 null
 *          loaded / failed / loading: 状态标志
 */
export function useScifiComponent(
  componentName: Ref<string>,
  isScifi: Ref<boolean>,
) {
  const loaded = ref(scifiLoaded);
  const failed = ref(scifiFailed);
  const loading = ref(false);
  const app = getCurrentInstance()?.appContext?.app;

  // 检测组件是否已全局注册（enableTech 模式下由核心 bootstrap 注册）
  const isGloballyRegistered = (name: string) => {
    if (!app) return false;
    return !!app.component(name);
  };

  watch(
    isScifi,
    async (v) => {
      if (!v || loaded.value || failed.value) return;
      // 已由核心 bootstrap 全局注册，跳过重复加载
      if (isGloballyRegistered(componentName.value)) {
        scifiLoaded = true;
        loaded.value = true;
        return;
      }
      if (scifiLoaded) {
        loaded.value = true;
        return;
      }
      if (scifiFailed) {
        failed.value = true;
        return;
      }
      loading.value = true;
      const ok = await ensureScifiLoaded(app);
      loading.value = false;
      if (ok) loaded.value = true;
      else failed.value = true;
    },
    { immediate: true },
  );

  // 如果单例在其他组件中已加载完毕，直接同步标记
  if (scifiLoaded && !loaded.value) loaded.value = true;
  if (scifiFailed && !failed.value) failed.value = true;

  const resolvedComponent = computed(() => {
    if (!isScifi.value) return null;
    // 已全局注册，直接返回组件名
    if (isGloballyRegistered(componentName.value)) return componentName.value;
    if (failed.value) return null;
    if (!loaded.value) return null;
    return componentName.value;
  });

  return { resolvedComponent, loaded, failed, loading };
}
