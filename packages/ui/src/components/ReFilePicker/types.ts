/**
 * ReFilePicker 类型定义
 */

export interface FilePickerItem {
  /** 全路径/Key */
  key: string;
  /** 文件名 */
  name: string;
  /** 是否目录 */
  isDir: boolean;
  /** 文件大小 (字节) */
  size?: number;
  /** 修改时间 (ms) */
  updatedAt?: number;
  /** 缩略图 URL */
  thumbnail?: string;
  /** MIME 类型 */
  mimeType?: string;
}

export interface FilePickerListResult {
  /** 当前目录 */
  current: string;
  /** 上一层目录 */
  parent?: string;
  /** 文件列表 */
  items: FilePickerItem[];
}

export type FilePickerData = FilePickerItem[] | FilePickerListResult;

export type FilePickerLoader = (path: string) => Promise<FilePickerItem[]>;

/** 可排序列 */
export type FilePickerSortKey = "name" | "type" | "size" | "updatedAt";

/**
 * 行单击的修饰键 —— 多选语义对齐资源管理器：
 * 普通单击<b>改选</b>，Ctrl/⌘ 单击加/减选，Shift 单击从锚点连选。
 */
export interface FilePickerSelectModifiers {
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
}

/** 列表列定义（表头与网格宽度同源，避免四段重复模板） */
export interface FilePickerColumn {
  key: FilePickerSortKey;
  label: string;
  /** 额外类名（如大小列的右对齐类） */
  className?: string;
  align?: "left" | "right";
}

/** 左侧「位置」导航节点 */
export interface FilePickerTreeNode {
  key: string;
  name: string;
  depth: number;
}

/* ==================== 右键菜单 ==================== */

/** 右键菜单可开关的动作 */
export type FilePickerContextMenuAction =
  | "refresh"
  | "properties"
  | "preview"
  | "newFolder"
  | "rename"
  | "remove"
  | "upload"
  | "download";

/**
 * 右键菜单逐项开关。
 *
 * <p>默认：{@code refresh / properties} 开，{@code preview} 在有预览通道时开，
 * 其余（新建文件夹 / 重命名 / 删除 / 上传 / 下载）默认关 —— 它们要动真实文件，
 * 由宿主的回调决定是否可用。</p>
 */
export type FilePickerContextMenuOptions = Partial<Record<FilePickerContextMenuAction, boolean>>;

/** 右键菜单项（由组件内部按开关 + 宿主回调拼出） */
export interface FilePickerContextMenuItem {
  key: FilePickerContextMenuAction;
  label: string;
  /** 图标组件（EP 图标） */
  icon?: unknown;
  /** 与前一项之间加分隔线 */
  divided?: boolean;
  disabled?: boolean;
}

/**
 * ReFilePicker 默认目录树（仅作本地 JSON 示例/兼容导出，不再作为无 loader 时的兜底 mock）。
 */
export const DEFAULT_MOCK_TREE: FilePickerItem[] = [
  { key: "/", name: "/", isDir: true },
  { key: "/images", name: "images", isDir: true },
  { key: "/images/avatar.png", name: "avatar.png", isDir: false, size: 12480, mimeType: "image/png" },
  { key: "/images/banner.jpg", name: "banner.jpg", isDir: false, size: 89320, mimeType: "image/jpeg" },
  { key: "/docs", name: "docs", isDir: true },
  { key: "/docs/spec.pdf", name: "spec.pdf", isDir: false, size: 1240000, mimeType: "application/pdf" },
  { key: "/videos", name: "videos", isDir: true },
  { key: "/videos/intro.mp4", name: "intro.mp4", isDir: false, size: 12400000, mimeType: "video/mp4" },
];
