import { nextTick, ref } from "vue";

const resolvePoint = (event?: any): { x: number; y: number } | null => {
  const touch = event?.changedTouches?.[0] ?? event?.touches?.[0] ?? event?.detail;
  if (typeof touch?.clientX === "number" && typeof touch?.clientY === "number") {
    return { x: touch.clientX, y: touch.clientY };
  }
  if (typeof touch?.x === "number" && typeof touch?.y === "number") {
    return { x: touch.x, y: touch.y };
  }
  const target = event?.currentTarget ?? event?.target;
  if (target?.getBoundingClientRect) {
    const rect = target.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }
  return null;
};

const resolveTarget = (selector: string): { x: number; y: number } | null => {
  if (typeof document === "undefined") {
    return null;
  }
  const element = document.querySelector(selector);
  if (!element) {
    return null;
  }
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
};

export const useCartAnimation = (targetSelector: string) => {
  const flyVisible = ref(false);
  const flyStyle = ref<Record<string, string>>({});
  const pulseKey = ref(0);

  const pulse = () => {
    pulseKey.value = Date.now();
  };

  const animate = async (event?: any) => {
    const start = resolvePoint(event);
    const end = resolveTarget(targetSelector);
    if (!start || !end) {
      pulse();
      return;
    }

    flyVisible.value = true;
    flyStyle.value = {
      left: `${start.x}px`,
      top: `${start.y}px`,
      opacity: "1",
      transform: "translate(-50%, -50%) scale(1)",
    };

    await nextTick();
    requestAnimationFrame(() => {
      flyStyle.value = {
        left: `${end.x}px`,
        top: `${end.y}px`,
        opacity: "0.18",
        transform: "translate(-50%, -50%) scale(0.32)",
      };
    });

    window.setTimeout(() => {
      flyVisible.value = false;
      pulse();
    }, 620);
  };

  return {
    flyVisible,
    flyStyle,
    pulseKey,
    animate,
    pulse,
  };
};
