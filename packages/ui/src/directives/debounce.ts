/**
 * v-debounce / v-throttle 指令
 *
 * 用法：
 *   <button v-debounce="onClick">点击</button>          <!-- 默认 300ms -->
 *   <button v-debounce="[onClick, 500]">点击</button>   <!-- 自定义延迟 -->
 *   <input v-debounce:500="onInput" />                  <!-- 修饰符写法 -->
 *   <button v-throttle="onScroll">滚动</button>
 */
import type { Directive, DirectiveBinding } from "vue";
import { debounce, throttle } from "../utils";

type Handler = (...args: unknown[]) => unknown;

type ElBound = HTMLElement & {
  __debounce_handler__?: ReturnType<typeof debounce>;
  __throttle_handler__?: ReturnType<typeof throttle>;
};

/** 解析 binding.value 为 [handler, wait] */
function parseArgs(binding: DirectiveBinding<unknown>): [Handler, number] | null {
  const v = binding.value as unknown;
  if (typeof v === "function") {
    return [v as Handler, Number(binding.arg) || 300];
  }
  if (Array.isArray(v) && typeof v[0] === "function") {
    return [v[0] as Handler, Number(v[1]) || 300];
  }
  return null;
}

function attach(
  el: ElBound,
  binding: DirectiveBinding<unknown>,
  factory: (fn: Handler, wait: number) => ReturnType<typeof debounce>,
  storeKey: "__debounce_handler__" | "__throttle_handler__",
): void {
  const args = parseArgs(binding);
  if (!args) return;
  const [handler, wait] = args;
  // 清理旧的
  const old = el[storeKey];
  if (old && typeof old.cancel === "function") old.cancel();
  el[storeKey] = factory(handler, wait);
  el.addEventListener("click", el[storeKey] as unknown as EventListener);
}

function detach(el: ElBound, storeKey: "__debounce_handler__" | "__throttle_handler__"): void {
  const handler = el[storeKey];
  if (handler) {
    el.removeEventListener("click", handler as unknown as EventListener);
    if (typeof handler.cancel === "function") handler.cancel();
    delete el[storeKey];
  }
}

export const vDebounce: Directive<ElBound, unknown> = {
  mounted(el, binding) {
    attach(el, binding, debounce, "__debounce_handler__");
  },
  updated(el, binding) {
    if (binding.value === binding.oldValue) return;
    detach(el, "__debounce_handler__");
    attach(el, binding, debounce, "__debounce_handler__");
  },
  unmounted(el) {
    detach(el, "__debounce_handler__");
  },
};

export const vThrottle: Directive<ElBound, unknown> = {
  mounted(el, binding) {
    attach(el, binding, throttle, "__throttle_handler__");
  },
  updated(el, binding) {
    if (binding.value === binding.oldValue) return;
    detach(el, "__throttle_handler__");
    attach(el, binding, throttle, "__throttle_handler__");
  },
  unmounted(el) {
    detach(el, "__throttle_handler__");
  },
};