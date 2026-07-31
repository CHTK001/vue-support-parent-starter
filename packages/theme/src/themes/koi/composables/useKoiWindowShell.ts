import { ref, watch, computed, onScopeDispose, type Ref } from "vue";

/** 最底一条距视口下沿 */
export const KOI_MINIMIZED_DOCK_EDGE = 16;
/** 相邻两条浮标之间的竖向间隔（px） */
export const KOI_MINIMIZED_DOCK_GAP = 8;
/** 与 KoiShellMinimizedDock 的 min-height 保持一致，用于计算堆叠步进 */
export const KOI_MINIMIZED_DOCK_ROW = 32;
/** 自下而上每条 bottom 的增量 = 行高 + 间隔 */
export const KOI_MINIMIZED_DOCK_STEP = KOI_MINIMIZED_DOCK_ROW + KOI_MINIMIZED_DOCK_GAP;

let dockSeq = 0;
const dockOrder = ref<number[]>([]);

function pushDock(id: number) {
  if (!dockOrder.value.includes(id)) {
    dockOrder.value = [...dockOrder.value, id];
  }
}

function removeDock(id: number) {
  dockOrder.value = dockOrder.value.filter((x) => x !== id);
}

/**
 * 抽屉 / 弹窗：收起至左下角浮标、全屏切换；多实例收起时在左侧自下而上排列（间隔见 KOI_MINIMIZED_DOCK_GAP）
 */
export function useKoiWindowShell(visible: Ref<boolean>, getInitialFullscreen?: () => boolean) {
  const minimized = ref(false);
  const fullscreen = ref(getInitialFullscreen?.() ?? false);
  const dockId = ++dockSeq;

  watch(
    minimized,
    (v) => {
      if (v) pushDock(dockId);
      else removeDock(dockId);
    },
    { immediate: true }
  );

  onScopeDispose(() => removeDock(dockId));

  const dockStackIndex = computed(() => dockOrder.value.indexOf(dockId));

  watch(visible, (v) => {
    if (v) {
      minimized.value = false;
      if (getInitialFullscreen) fullscreen.value = getInitialFullscreen();
    }
  });

  function minimize() {
    minimized.value = true;
    visible.value = false;
  }

  function restoreFromDock() {
    minimized.value = false;
    visible.value = true;
  }

  function toggleFullscreen() {
    fullscreen.value = !fullscreen.value;
    queueMicrotask(() => {
      window.dispatchEvent(new Event("resize"));
    });
  }

  function clearMinimized() {
    minimized.value = false;
  }

  return {
    minimized,
    fullscreen,
    minimize,
    restoreFromDock,
    toggleFullscreen,
    clearMinimized,
    dockStackIndex
  };
}
