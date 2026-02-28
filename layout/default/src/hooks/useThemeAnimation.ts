
import { nextTick } from "vue";
import { storageLocal } from "@pureadmin/utils";

/**
 * 根据配置与事件计算 clipPath 关键帧
 * 这里单独抽出来，方便在有无 View Transition 的情况下复用
 */
function getThemeClipPathKeyframes(
  direction: string,
  event?: MouseEvent,
): string[] {
  const { innerWidth, innerHeight } = window;
  let x = 0;
  let y = 0;

  switch (direction) {
    case "cursor": {
      if (!event) {
        // 理论上上游已做降级，这里兜底一次
        const endRadiusCenter = Math.hypot(innerWidth / 2, innerHeight / 2);
        return [
          `circle(0px at 50% 50%)`,
          `circle(${endRadiusCenter}px at 50% 50%)`,
        ];
      }
      x = event.clientX;
      y = event.clientY;
      const endRadiusCursor = Math.hypot(
        Math.max(x, innerWidth - x),
        Math.max(y, innerHeight - y),
      );
      return [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadiusCursor}px at ${x}px ${y}px)`,
      ];
    }

    case "top-right": {
      const endRadiusTR = Math.hypot(innerWidth, innerHeight);
      return [
        `circle(0px at 100% 0)`,
        `circle(${endRadiusTR}px at 100% 0)`,
      ];
    }

    case "top-center": {
      const endRadiusTC = Math.hypot(innerWidth / 2, innerHeight);
      return [
        `circle(0px at 50% 0)`,
        `circle(${endRadiusTC}px at 50% 0)`,
      ];
    }

    case "top-left": {
      const endRadiusTL = Math.hypot(innerWidth, innerHeight);
      return [
        `circle(0px at 0 0)`,
        `circle(${endRadiusTL}px at 0 0)`,
      ];
    }

    case "bottom-right": {
      const endRadiusBR = Math.hypot(innerWidth, innerHeight);
      return [
        `circle(0px at 100% 100%)`,
        `circle(${endRadiusBR}px at 100% 100%)`,
      ];
    }

    case "bottom-center": {
      const endRadiusBC = Math.hypot(innerWidth / 2, innerHeight);
      return [
        `circle(0px at 50% 100%)`,
        `circle(${endRadiusBC}px at 50% 100%)`,
      ];
    }

    case "bottom-left": {
      const endRadiusBL = Math.hypot(innerWidth, innerHeight);
      return [
        `circle(0px at 0 100%)`,
        `circle(${endRadiusBL}px at 0 100%)`,
      ];
    }

    case "center": {
      const endRadiusCenter = Math.hypot(innerWidth / 2, innerHeight / 2);
      return [
        `circle(0px at 50% 50%)`,
        `circle(${endRadiusCenter}px at 50% 50%)`,
      ];
    }

    case "left-center": {
      const endRadiusLC = Math.hypot(innerWidth, innerHeight / 2);
      return [
        `circle(0px at 0 50%)`,
        `circle(${endRadiusLC}px at 0 50%)`,
      ];
    }

    case "right-center": {
      const endRadiusRC = Math.hypot(innerWidth, innerHeight / 2);
      return [
        `circle(0px at 100% 50%)`,
        `circle(${endRadiusRC}px at 100% 50%)`,
      ];
    }

    case "left":
      // 左到右
      return [`inset(0 100% 0 0)`, `inset(0 0 0 0)`];

    case "right":
      // 右到左
      return [`inset(0 0 0 100%)`, `inset(0 0 0 0)`];

    case "top":
      // 上到下
      return [`inset(0 0 100% 0)`, `inset(0 0 0 0)`];

    case "bottom":
      // 下到上
      return [`inset(100% 0 0 0)`, `inset(0 0 0 0)`];

    default: {
      // 兜底：右上角扩散
      const endRadiusDef = Math.hypot(innerWidth, innerHeight);
      return [
        `circle(0px at 100% 0)`,
        `circle(${endRadiusDef}px at 100% 0)`,
      ];
    }
  }
}

/**
 * 启动主题切换动画
 * @param callback 执行状态变更的回调函数，支持同步或异步（如切换主题时需要预加载资源）
 * @param event 触发事件（可选），如果提供则从点击位置扩散，否则默认从配置位置扩散
 */
export function useThemeAnimation(
  // 回调允许返回 Promise，兼容需要异步预加载资源的场景
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callback: () => void | Promise<void> | any,
  event?: MouseEvent,
) {
  // 获取配置
  const configure = storageLocal().getItem<any>("responsive-configure");
  const mode = configure?.themeAnimationMode ?? "fixed";

  // 统一封装回调执行，兼容同步和异步两种情况
  const runCallback = async () => {
    // 使用 Promise.resolve 兼容同步和异步返回值，避免判断 Promise 实例
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await Promise.resolve(callback());
  };

  // 显式禁用时直接执行回调（不做动画）
  if (mode === "disabled") {
    void runCallback();
    return;
  }

  const validDirections = [
    "top-right",
    "top-left",
    "bottom-right",
    "bottom-left",
    "top-center",
    "bottom-center",
    "left-center",
    "right-center",
    "center",
    "left",
    "right",
    "top",
    "bottom",
    "cursor",
  ];

  let direction = configure?.themeAnimationDirection ?? "top-right";

  if (mode === "random") {
    direction = validDirections[Math.floor(Math.random() * validDirections.length)];
  }

  // 如果是 cursor 模式但没有 event，降级为 center，避免运行时异常
  if (direction === "cursor" && !event) {
    direction = "center";
  }

  // 统一计算关键帧
  const clipPath = getThemeClipPathKeyframes(direction, event);

  // 优先尝试 View Transition，如果不支持则退化为普通动画
  if (typeof (document as any).startViewTransition === "function") {
    const transition = (document as any).startViewTransition(async () => {
      // 等待回调（包括异步主题切换、资源预加载等）完成，再开始过渡
      await runCallback();
      await nextTick();
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath,
        },
        {
          duration: 500,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    });
    return;
  }

  // 不支持 View Transition 时的兼容路径：直接在根节点上做一个 clipPath 动画
  void runCallback()
    .then(() => nextTick())
    .then(() => {
      document.documentElement.animate(
        {
          clipPath,
        },
        {
          duration: 500,
          easing: "ease-in-out",
        },
      );
    });
}
