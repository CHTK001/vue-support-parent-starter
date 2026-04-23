import { render } from "vue";

export const STANDALONE_OVERLAY_HOST_ID = "sc-standalone-overlay-host";

const OVERLAY_STACK_HOST_COUNT_KEY = "__SC_OVERLAY_STACK_HOST_COUNT__";

const resolveWindow = () =>
  typeof window === "undefined" ? null : (window as typeof window & Record<string, unknown>);

export const getOverlayStackHostCount = () => {
  const target = resolveWindow();
  if (!target) {
    return 0;
  }
  const value = Number(target[OVERLAY_STACK_HOST_COUNT_KEY] || 0);
  return Number.isFinite(value) ? value : 0;
};

export const updateOverlayStackHostCount = (delta: number) => {
  const target = resolveWindow();
  if (!target) {
    return 0;
  }
  const nextValue = Math.max(0, getOverlayStackHostCount() + delta);
  target[OVERLAY_STACK_HOST_COUNT_KEY] = nextValue;
  return nextValue;
};

export const disposeStandaloneOverlayHost = () => {
  if (typeof document === "undefined") {
    return;
  }
  const container = document.getElementById(STANDALONE_OVERLAY_HOST_ID);
  if (!container) {
    return;
  }
  render(null, container);
  container.remove();
};
