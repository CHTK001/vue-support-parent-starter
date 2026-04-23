export type {
  OverlayStackClosePayload,
  OverlayStackCloseReason,
  OverlayStackConfig,
  OverlayStackMessage,
  OverlayStackMessageLevel,
  OverlayStackPosition,
  OverlayStackTone,
  ResolvedOverlayStackItem,
} from "../../../../../packages/components/ScOverlayStack/types";

import type {
  OverlayStackClosePayload,
  OverlayStackConfig,
  OverlayStackItem as BaseOverlayStackItem,
  ResolvedOverlayStackItem,
} from "../../../../../packages/components/ScOverlayStack/types";

export interface OverlayStackItem extends BaseOverlayStackItem {
  onOpen?: (item: ResolvedOverlayStackItem) => void;
  onClose?: (payload: OverlayStackClosePayload) => void;
  onMinimize?: (item: ResolvedOverlayStackItem) => void;
  onToggleDetails?: (payload: {
    item: ResolvedOverlayStackItem;
    collapsed: boolean;
  }) => void;
}

export interface OverlayStackState {
  items: OverlayStackItem[];
  config: OverlayStackConfig;
}
