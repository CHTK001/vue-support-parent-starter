import { inject, provide, type InjectionKey } from "vue";
import {
  clearOverlayStack,
  configureOverlayStack,
  getOverlayStackItem,
  removeOverlayStackItem,
  removeOverlayStackItemsBySource,
  upsertOverlayStackItem,
  useOverlayStackState,
} from "./service";
import type { OverlayStackConfig, OverlayStackItem } from "./types";

export interface OverlayStackProvider {
  readonly state: ReturnType<typeof useOverlayStackState>;
  configure(payload: Partial<OverlayStackConfig>): void;
  upsert(input: OverlayStackItem): string;
  get(itemId: string): OverlayStackItem | null;
  remove(itemId: string): void;
  removeBySource(source: string, retainIds?: string[]): void;
  clear(source?: string): void;
}

export const OverlayStackProviderKey: InjectionKey<OverlayStackProvider> =
  Symbol("OverlayStackProvider");

export const overlayStackProvider: OverlayStackProvider = {
  state: useOverlayStackState(),
  configure: configureOverlayStack,
  upsert: upsertOverlayStackItem,
  get: getOverlayStackItem,
  remove: removeOverlayStackItem,
  removeBySource: removeOverlayStackItemsBySource,
  clear: clearOverlayStack,
};

export const provideOverlayStack = () => {
  provide(OverlayStackProviderKey, overlayStackProvider);
  return overlayStackProvider;
};

export const useOverlayStack = () =>
  inject(OverlayStackProviderKey, overlayStackProvider);

export const tryUseOverlayStack = () =>
  inject<OverlayStackProvider | null>(OverlayStackProviderKey, null);
