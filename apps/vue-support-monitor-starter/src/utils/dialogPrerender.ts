import { nextTick, onMounted, watch, type Ref } from "vue";

/**
 * 弹窗预渲染 —— 已禁用
 *
 * 之前实现在页面空闲时自动打开弹窗预渲染，导致每次进页面都能看到
 * 弹窗闪烁一下。改为空操作，不再预渲染。
 */
export function useDialogPrerender(_visible: Ref<boolean>, _delay = 2500): void {
  // 已禁用：不再预渲染弹窗
}
