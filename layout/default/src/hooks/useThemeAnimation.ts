
import { nextTick } from "vue";
import { storageLocal } from "@pureadmin/utils";

/**
 * 启动主题切换动画
 * @param callback 执行状态变更的回调函数
 * @param event 触发事件（可选），如果提供则从点击位置扩散，否则默认从配置位置扩散
 */
export function useThemeAnimation(callback: () => void, event?: MouseEvent) {
  // 检查浏览器是否支持 View Transitions API
  if (!document.startViewTransition) {
    callback();
    return;
  }

  // 获取配置
  const configure = storageLocal().getItem<any>("responsive-configure");
  const mode = configure?.themeAnimationMode ?? 'fixed';
  
  if (mode === 'disabled') {
    callback();
    return;
  }

  const validDirections = [
    'top-right', 'top-left', 'bottom-right', 'bottom-left', 
    'center', 'left', 'right', 'top', 'bottom', 'cursor'
  ];
  
  let direction = configure?.themeAnimationDirection ?? 'top-right';

  if (mode === 'random') {
    direction = validDirections[Math.floor(Math.random() * validDirections.length)];
  }

  // 如果是 cursor 模式但没有 event，降级为 center
  if (direction === 'cursor' && !event) {
    direction = 'center';
  }

  // 启动 View Transition
  const transition = document.startViewTransition(async () => {
    callback();
    await nextTick();
  });

  transition.ready.then(() => {
    let clipPath = [];
    let x = 0;
    let y = 0;
    const { innerWidth, innerHeight } = window;

    switch (direction) {
      case 'cursor':
        x = event!.clientX;
        y = event!.clientY;
        const endRadiusCursor = Math.hypot(
          Math.max(x, innerWidth - x),
          Math.max(y, innerHeight - y)
        );
        clipPath = [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadiusCursor}px at ${x}px ${y}px)`,
        ];
        break;
      
      case 'top-right':
        const endRadiusTR = Math.hypot(innerWidth, innerHeight);
        clipPath = [
          `circle(0px at 100% 0)`,
          `circle(${endRadiusTR}px at 100% 0)`,
        ];
        break;

      case 'top-left':
        const endRadiusTL = Math.hypot(innerWidth, innerHeight);
        clipPath = [
          `circle(0px at 0 0)`,
          `circle(${endRadiusTL}px at 0 0)`,
        ];
        break;

      case 'bottom-right':
        const endRadiusBR = Math.hypot(innerWidth, innerHeight);
        clipPath = [
          `circle(0px at 100% 100%)`,
          `circle(${endRadiusBR}px at 100% 100%)`,
        ];
        break;

      case 'bottom-left':
        const endRadiusBL = Math.hypot(innerWidth, innerHeight);
        clipPath = [
          `circle(0px at 0 100%)`,
          `circle(${endRadiusBL}px at 0 100%)`,
        ];
        break;

      case 'center':
        const endRadiusCenter = Math.hypot(innerWidth / 2, innerHeight / 2);
        clipPath = [
          `circle(0px at 50% 50%)`,
          `circle(${endRadiusCenter}px at 50% 50%)`,
        ];
        break;

      case 'left': // Left to Right
        clipPath = [
          `inset(0 100% 0 0)`,
          `inset(0 0 0 0)`,
        ];
        break;

      case 'right': // Right to Left
        clipPath = [
          `inset(0 0 0 100%)`,
          `inset(0 0 0 0)`,
        ];
        break;

      case 'top': // Top to Bottom
        clipPath = [
          `inset(0 0 100% 0)`,
          `inset(0 0 0 0)`,
        ];
        break;

      case 'bottom': // Bottom to Top
        clipPath = [
          `inset(100% 0 0 0)`,
          `inset(0 0 0 0)`,
        ];
        break;
        
      default: // Fallback to top-right
        const endRadiusDef = Math.hypot(innerWidth, innerHeight);
        clipPath = [
          `circle(0px at 100% 0)`,
          `circle(${endRadiusDef}px at 100% 0)`,
        ];
    }

    document.documentElement.animate(
      {
        clipPath: clipPath,
      },
      {
        duration: 500,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      }
    );
  });
}
