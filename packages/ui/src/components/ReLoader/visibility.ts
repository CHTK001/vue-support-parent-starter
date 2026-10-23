/**
 * 页面不可见时暂停动画（省电）。
 *
 * <p>背景：标签页切到后台后，浏览器虽会节流 rAF，但 CSS 动画仍可能继续消耗
 * 合成/绘制资源；笔记本上开一晚上多个后台标签会明显耗电。而用户根本看不见
 * 这些动画 —— 切回来时它应该从"当前状态"继续，而不是从头开始。</p>
 *
 * <p>实现方式：用一个**响应式**的"页面是否可见"状态，各变体按它加上
 * {@code .is-paused} 类；CSS 里写「容器带 .is-paused 时内部动画 play-state: paused」。</p>
 *
 * <p>为什么不用 {@code html.is-page-hidden} + scoped：scoped 编译会把
 * {@code :global(html.x) .y} 里的后代选择器退化成孤立的 {@code html.x}，
 * 规则匹配不到动画元素（实测 play-state 始终 running）。改成"标记打在动画容器
 * 自己身上"就绕开了这个问题。</p>
 */
import { ref, type Ref } from "vue";

/** 页面是否可见（响应式；各组件 watch 它来加/摘暂停类） */
export const pageVisible: Ref<boolean> = ref(typeof document === "undefined" ? true : !document.hidden);

/** 暂停态的 class 名（各变体 CSS 需配合） */
export const PAUSED_CLASS = "is-paused";

/** 已注册的监听解绑函数 */
let unbind: (() => void) | null = null;

/**
 * 监听页面可见性（幂等：多次调用只绑定一次）。
 *
 * <p><b>不解绑</b>：页面可见性是**进程级**状态，不是某个加载遮罩的生命周期。
 * 之前把它挂在「宿主应用创建/销毁」上，结果遮罩一开一关就把监听摘掉了 ——
 * 之后页面再切后台，动画照旧在跑（实测 {@link pageVisible} 一直停在 true）。</p>
 *
 * <p>改为模块级单例绑定：首次调用时注册，之后一直有效。</p>
 */
export function bindVisibilityPause(): () => void {
  if (typeof document === "undefined") {
    return () => {};
  }
  if (unbind) {
    return unbind;
  }
  const apply = () => {
    pageVisible.value = !document.hidden;
  };
  apply();
  document.addEventListener("visibilitychange", apply);
  unbind = () => {
    document.removeEventListener("visibilitychange", apply);
    unbind = null;
  };
  return unbind;
}
