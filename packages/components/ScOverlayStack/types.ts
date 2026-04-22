export type OverlayStackPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "left-center"
  | "right-center"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export type OverlayStackTone =
  | "default"
  | "info"
  | "success"
  | "warning"
  | "error";

export type OverlayStackMessageLevel =
  | "info"
  | "success"
  | "warning"
  | "error";

export type OverlayStackCloseReason = "manual" | "auto" | "overflow";

export interface OverlayStackMessage {
  id: string;
  content: string;
  level?: OverlayStackMessageLevel;
  timestamp?: number;
}

export interface OverlayStackItem {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  tone?: OverlayStackTone;
  position?: OverlayStackPosition;
  timestamp?: number;
  createdAt?: number;
  latestMessage?: string;
  summary?: string;
  messages?: OverlayStackMessage[];
  progress?: number | null;
  progressLabel?: string;
  progressSecondary?: string;
  showPercent?: boolean;
  closeable?: boolean;
  autoClose?: boolean;
  autoCloseDelay?: number;
  source?: string;
}

export interface ResolvedOverlayStackItem extends OverlayStackItem {
  tone: OverlayStackTone;
  position: OverlayStackPosition;
  timestamp?: number;
  latestMessage: string;
  messages: OverlayStackMessage[];
  progress: number | null;
  showPercent: boolean;
  closeable: boolean;
  autoClose: boolean;
  autoCloseDelay: number;
}

export interface OverlayStackClosePayload {
  item: ResolvedOverlayStackItem;
  reason: OverlayStackCloseReason;
}

export interface OverlayStackConfig {
  defaultPosition: OverlayStackPosition;
  maxVisible: number;
  width: number | string;
  stacked: boolean;
  stackExpanded: boolean;
  expandOnHover: boolean;
  detailsCollapsible: boolean;
  detailsCollapsed: boolean;
  closeable: boolean;
  autoClose: boolean;
  autoCloseDelay: number;
  messageLimit: number;
  teleportTo: string;
  zIndex: number;
}
