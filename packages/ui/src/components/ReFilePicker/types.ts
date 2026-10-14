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
