export type TaskCenterStatus =
  | "pending"
  | "running"
  | "success"
  | "error"
  | "warning";

export type TaskCenterMode = "progress" | "stream";

export type TaskCenterPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "left-center"
  | "right-center"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export type TaskCenterMessageLevel = "info" | "success" | "warning" | "error";

export type TaskCenterSource = "manual" | "socket" | "system";

export interface TaskCenterMessageInput {
  content: string;
  level?: TaskCenterMessageLevel;
  timestamp?: number;
}

export interface TaskCenterMessage extends TaskCenterMessageInput {
  id: string;
  level: TaskCenterMessageLevel;
  timestamp: number;
}

export interface TaskCenterTaskInput {
  id?: string;
  requestId?: string | number;
  title?: string;
  description?: string;
  icon?: string;
  status?: TaskCenterStatus;
  mode?: TaskCenterMode;
  progress?: number | null;
  current?: number | null;
  total?: number | null;
  stageLabel?: string;
  message?: string;
  messages?: Array<string | TaskCenterMessageInput>;
  position?: TaskCenterPosition;
  closeable?: boolean;
  showPercent?: boolean;
  autoClose?: boolean;
  autoCloseDelay?: number;
  maxLogs?: number;
  source?: TaskCenterSource;
  meta?: Record<string, unknown>;
  retainHistory?: boolean;
  overlayVisible?: boolean;
  reopenOverlay?: boolean;
}

export interface TaskCenterTask extends TaskCenterTaskInput {
  id: string;
  title: string;
  status: TaskCenterStatus;
  mode: TaskCenterMode;
  position: TaskCenterPosition;
  closeable: boolean;
  showPercent: boolean;
  autoClose: boolean;
  autoCloseDelay: number;
  maxLogs: number;
  source: TaskCenterSource;
  retainHistory: boolean;
  overlayVisible: boolean;
  overlayDismissed: boolean;
  progress: number | null;
  current: number | null;
  total: number | null;
  messages: TaskCenterMessage[];
  createdAt: number;
  updatedAt: number;
  startedAt: number;
  endedAt?: number;
  latestMessage?: string;
}

export interface TaskCenterState {
  panelVisible: boolean;
  selectedTaskId: string | null;
  maxVisible: number;
  maxHistory: number;
  tasks: TaskCenterTask[];
}
