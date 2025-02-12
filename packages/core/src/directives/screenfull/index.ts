import { message } from "@repo/utils";
import type { Directive } from "vue";
import screenfull from "screenfull";

/** 文本复制指令（默认双击复制） */
export const fullscreen: Directive = {
  beforeMount(el, binding) {
    // 检查是否绑定了目标元素，默认为当前元素
    const targetElement = binding.value || el;

    el.addEventListener("click", () => {
      if (!screenfull.isEnabled) {
        message("您的浏览器不支持全屏功能", { type: "warning" });
        return;
      }

      if (screenfull.isFullscreen) {
        screenfull.exit().catch((err) => {
          message("退出全屏失败", { type: "error" });
        });
      } else {
        screenfull.request(targetElement).catch((err) => {
          message("退出全屏失败", { type: "error" });
        });
      }
    });
  },
  beforeUnmount(el) {
    el.removeEventListener("click", () => {});
  },
};
