import { reactive } from "vue";
import type {
  OverlayStackConfig,
  OverlayStackItem,
  OverlayStackState,
} from "./types";

const DEFAULT_OVERLAY_STACK_CONFIG: OverlayStackConfig = {
  defaultPosition: "bottom-right",
  maxVisible: 5,
  width: 360,
  stacked: true,
  stackExpanded: false,
  expandOnHover: true,
  detailsCollapsible: true,
  detailsCollapsed: true,
  closeable: true,
  autoClose: false,
  autoCloseDelay: 5000,
  messageLimit: 6,
  teleportTo: "body",
  zIndex: 4980,
};

const state = reactive<OverlayStackState>({
  items: [],
  config: { ...DEFAULT_OVERLAY_STACK_CONFIG },
});

export const configureOverlayStack = (
  payload: Partial<OverlayStackConfig>,
) => {
  Object.assign(state.config, payload);
};

export const upsertOverlayStackItem = (input: OverlayStackItem) => {
  const index = state.items.findIndex((item) => item.id === input.id);
  if (index >= 0) {
    state.items[index] = {
      ...state.items[index],
      ...input,
    };
    return input.id;
  }
  state.items.unshift(input);
  return input.id;
};

export const removeOverlayStackItem = (itemId: string) => {
  const index = state.items.findIndex((item) => item.id === itemId);
  if (index >= 0) {
    state.items.splice(index, 1);
  }
};

export const getOverlayStackItem = (itemId: string) =>
  state.items.find((item) => item.id === itemId) ?? null;

export const removeOverlayStackItemsBySource = (
  source: string,
  retainIds: string[] = [],
) => {
  const retainSet = new Set(retainIds);
  state.items = state.items.filter(
    (item) => item.source !== source || retainSet.has(item.id),
  );
};

export const clearOverlayStack = (source?: string) => {
  if (!source) {
    state.items = [];
    return;
  }
  state.items = state.items.filter((item) => item.source !== source);
};

export const resetOverlayStack = () => {
  state.items = [];
  state.config = { ...DEFAULT_OVERLAY_STACK_CONFIG };
};

export const useOverlayStackState = () => ({
  state,
  defaultConfig: DEFAULT_OVERLAY_STACK_CONFIG,
});
