/**
 * ReProgress —— 任务进度类型定义
 */

/** 任务状态 */
export type ReProgressStatus = "pending" | "running" | "success" | "failed" | "cancelled";

/** 颜色预设 */
export type ReProgressColor = "primary" | "success" | "warning" | "danger" | "info";

/** 任务分类（用于面板分组 / 图标） */
export type ReProgressCategory = "download" | "upload" | "install" | "sync" | "compute" | "other";

/** 单个任务的进度历史快照（用于时间轴） */
export interface ReProgressSnapshot {
  /** 快照时间戳（ms） */
  time: number;
  /** 进度 0~1 */
  progress: number;
  /** 状态文字描述 */
  text?: string;
  /** 状态 */
  status: ReProgressStatus;
}

/** 任务基础信息 */
export interface ReProgressTask {
  /** 唯一 key */
  id: string;
  /** 任务标题 */
  title: string;
  /** 副标题 / 描述 */
  description?: string;
  /** 分类 */
  category?: ReProgressCategory;
  /** 颜色预设 */
  color?: ReProgressColor;
  /** 当前状态 */
  status: ReProgressStatus;
  /** 当前进度 0~1 */
  progress: number;
  /** 当前进度文字 */
  text?: string;
  /** 进度历史（用于时间轴） */
  history: ReProgressSnapshot[];
  /** 创建时间戳 */
  createdAt: number;
  /** 开始时间戳 */
  startedAt?: number;
  /** 结束时间戳 */
  finishedAt?: number;
  /** 错误信息 */
  error?: string;
  /** 是否可关闭 */
  closable?: boolean;
  /** 自定义图标 */
  icon?: string;
  /** 是否可点击查看历史（默认 true） */
  hasHistory?: boolean;
}

/** 创建任务的输入（除 id / status / progress / history / createdAt 外的字段） */
export type ReProgressTaskInput = Omit<
  ReProgressTask,
  "status" | "progress" | "history" | "createdAt"
> & {
  initialStatus?: ReProgressStatus;
  initialProgress?: number;
};

/** 系统设置 */
export interface ReProgressSettings {
  /** 显示模式：compact=折叠条 / expanded=展开卡片 */
  displayMode: "compact" | "expanded";
  /** 默认颜色 */
  defaultColor: ReProgressColor;
  /** 完成后是否弹出 message */
  showSuccessMessage: boolean;
  /** 失败后是否弹出 message */
  showFailedMessage: boolean;
  /** 任务存在时间（ms），0 表示永久 */
  lifetime: number;
  /** 是否显示历史 popover */
  showHistoryPopover: boolean;
  /** 是否启用多个并存 */
  multiTask: boolean;
  /** 是否显示面板标题 */
  showPanelTitle: boolean;
  /** 面板位置 */
  panelPosition: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}

/** 任务管理器 API */
export interface ReProgressApi {
  /** 当前任务列表 */
  tasks: ReProgressTask[];
  /** 设置（响应式） */
  settings: ReProgressSettings;
  /** 创建任务 */
  create(input: ReProgressTaskInput): ReProgressTask;
  /** 开始任务 */
  start(id: string, text?: string): void;
  /** 更新进度 */
  update(id: string, progress: number, text?: string): void;
  /** 完成 */
  complete(id: string, text?: string): void;
  /** 失败 */
  fail(id: string, error: string, text?: string): void;
  /** 取消 */
  cancel(id: string, text?: string): void;
  /** 手动设置进度（不改变状态） */
  setProgress(id: string, progress: number, text?: string): void;
  /** 重置 */
  reset(id: string): void;
  /** 移除任务 */
  remove(id: string): void;
  /** 清空所有（仅历史） */
  clearHistory(): void;
  /** 更新设置 */
  updateSettings(patch: Partial<ReProgressSettings>): void;
}