import { nextTick, onMounted, type Ref } from "vue";

/**
 * 弹窗预渲染 —— 空闲时把弹窗"不可见地"开关一次
 *
 * 原理：ElDialog 默认惰性挂载（首次打开才渲染内容树），dev 下首次打开
 * 需要现场实例化整棵组件树（几百 ms~数秒）。本工具在页面空闲时以
 * visibility:hidden 状态开关一次弹窗——内容树提前挂载、样式提前计算，
 * 用户真正打开时只剩"显示"，毫秒级。
 *
 * 防闪：预渲染期间 body.dialog-prerender 使 .el-overlay 不可见且不可交互
 * （配套全局 CSS 在 styles/pages.css）。
 *
 * 安全性：预渲染触发的 modelValue=true 会走各弹窗的 watch 初始化逻辑，
 * host 为 null 时均直接 return / resetForm，不会发出数据请求。
 */
export function useDialogPrerender(visible: Ref<boolean>, delay = 2500): void {
  if (typeof window === "undefined") return;

  const run = (): void => {
    if (visible.value) return;
    document.body.classList.add("dialog-prerender");
    visible.value = true;
    void nextTick().then(() => {
      // 等两帧，确保组件树挂载 + 样式计算完成
      requestAnimationFrame(() => requestAnimationFrame(() => {
        visible.value = false;
        // 等关闭过渡结束（约 300ms）再恢复可见性，避免关闭动画闪现
        window.setTimeout(() => {
          document.body.classList.remove("dialog-prerender");
          // 焦点陷阱可能在预渲染期间捕获焦点，归还 body
          (document.activeElement as HTMLElement | null)?.blur?.();
        }, 450);
      }));
    });
  };

  onMounted(() => {
    const w = window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number };
    const schedule = w.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, delay));
    schedule(run);
  });
}
