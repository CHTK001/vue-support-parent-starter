
/**
 * 主题切换动画封装
 * 使用轻量覆盖层实现从指定方向/点击位置扩散的渐变效果
 * 避免使用 View Transitions，兼容性更好且不会导致递归调用问题
 *
 * 注意：
 * - 只能在组件 setup / 组合式函数中调用本方法（内部使用 useGlobal）
 * - 返回的 runAnimation 函数可以在任意事件回调中安全调用
 */
import { useGlobal } from "@pureadmin/utils";

export function useThemeAnimation() {
  const { $storage } = useGlobal<GlobalPropertiesApi>();

  const getConfigure = () => {
    return $storage?.configure ?? {};
  };

  const runAnimation = (callback: () => void, event?: MouseEvent) => {
    const configure = getConfigure();
    const mode = (configure.themeAnimationMode as string) ?? "fixed"; // random | fixed | disabled
    const direction = (configure.themeAnimationDirection as string) ?? "top-right";

    // 关闭动画时直接执行
    if (mode === "disabled") {
      callback();
      return;
    }

    // 计算动画起点
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let originX = viewportWidth * 0.5;
    let originY = viewportHeight * 0.5;

    if (mode === "random" && event) {
      originX = event.clientX;
      originY = event.clientY;
    } else {
      switch (direction) {
        case "top-left":
          originX = 0;
          originY = 0;
          break;
        case "top-right":
          originX = viewportWidth;
          originY = 0;
          break;
        case "bottom-left":
          originX = 0;
          originY = viewportHeight;
          break;
        case "bottom-right":
          originX = viewportWidth;
          originY = viewportHeight;
          break;
        case "left":
          originX = 0;
          originY = viewportHeight / 2;
          break;
        case "right":
          originX = viewportWidth;
          originY = viewportHeight / 2;
          break;
        case "top":
          originX = viewportWidth / 2;
          originY = 0;
          break;
        case "bottom":
          originX = viewportWidth / 2;
          originY = viewportHeight;
          break;
        case "center":
        default:
          originX = viewportWidth / 2;
          originY = viewportHeight / 2;
          break;
      }
    }

    // 创建覆盖层
    const overlay = document.createElement("div");
    overlay.className = "theme-switch-overlay";
    overlay.style.setProperty("--theme-origin-x", `${originX}px`);
    overlay.style.setProperty("--theme-origin-y", `${originY}px`);

    document.body.appendChild(overlay);

    // 在下一帧启动动画并执行主题变更
    requestAnimationFrame(() => {
      overlay.classList.add("is-active");
      try {
        callback();
      } finally {
        overlay.addEventListener(
          "animationend",
          () => {
            overlay.remove();
          },
          { once: true },
        );
      }
    });
  };

  return runAnimation;
}
