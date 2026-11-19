/**
 * 页签常驻保活（v-show 切换）下的「切回本页签」回调。
 *
 * <p>工作台在页签切换时会广播 {@code APM_TAB_ACTIVATED_EVENT}。首次挂载不经过
 * 这条路 —— 异步组件还在加载、无人监听，由各页自己的 {@code onMounted} 负责；
 * 切回已挂载的页签时 {@code onMounted} 不会重跑，只能在这里接住。两条路互斥，
 * 一次性跳转上下文不会被消费两次。</p>
 *
 * @param tabName 本页签名（与 tabs.ts 里的 name 一致）
 * @param onActivated 切回本页签时的回调
 * @since 4.0.0.51
 */
import { onBeforeUnmount, onMounted } from "vue";
import { APM_TAB_ACTIVATED_EVENT } from "../tabs";

export function useApmTabActivated(tabName: string, onActivated: () => void): void {
  function handler(event: Event): void {
    const detail = (event as CustomEvent<{ tab?: string }>).detail;
    if (detail?.tab === tabName) {
      onActivated();
    }
  }
  onMounted(() => window.addEventListener(APM_TAB_ACTIVATED_EVENT, handler));
  onBeforeUnmount(() => window.removeEventListener(APM_TAB_ACTIVATED_EVENT, handler));
}
