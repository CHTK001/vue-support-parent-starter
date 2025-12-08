/**
 * 文件图标工具类
 * 提供文件类型识别、图标映射和分类功能
 *
 * @author CH
 * @since 1.0
 */

/**
 * 文件分类类型
 */
export type FileCategory =
  | "folder"
  | "image"
  | "document"
  | "text"
  | "archive"
  | "video"
  | "audio"
  | "code"
  | "executable"
  | "email"
  | "unknown";

/**
 * 标签类型（用于 el-tag）
 */
export type TagType = "warning" | "success" | "primary" | "info" | "danger";

/**
 * 文件项接口
 */
export interface FileItem {
  name?: string;
  ext?: string;
  suffix?: string;
  directory?: boolean;
}

/**
 * 文件分类到后缀的映射
 */
export const FILE_CATEGORY_EXTENSIONS: Record<FileCategory, readonly string[]> =
  {
    folder: [],
    image: [
      "jpg",
      "jpeg",
      "png",
      "gif",
      "bmp",
      "webp",
      "svg",
      "tiff",
      "heic",
      "ico",
    ],
    document: [
      "pdf",
      "doc",
      "docx",
      "xls",
      "xlsx",
      "xlsm",
      "ppt",
      "pptx",
      "ofd",
    ],
    text: ["txt", "md", "csv", "log", "ini", "conf"],
    archive: ["zip", "rar", "7z", "gz", "tgz", "bz2", "tar"],
    video: ["mp4", "avi", "mov", "wmv", "flv", "mkv", "webm"],
    audio: ["mp3", "wav", "flac", "aac", "ogg", "wma"],
    code: [
      "js",
      "ts",
      "py",
      "java",
      "html",
      "css",
      "scss",
      "xml",
      "json",
      "yaml",
      "yml",
      "sql",
      "sh",
      "bat",
    ],
    executable: ["exe", "jar", "msi", "apk", "dmg"],
    email: ["eml", "msg"],
    unknown: [],
  };

/**
 * 文件分类的中文标签
 */
export const FILE_CATEGORY_LABELS: Record<FileCategory, string> = {
  folder: "文件夹",
  image: "图片",
  document: "文档",
  text: "文本",
  archive: "压缩包",
  video: "视频",
  audio: "音频",
  code: "代码",
  executable: "程序",
  email: "邮件",
  unknown: "文件",
};

/**
 * 文件分类的标签类型映射
 */
export const FILE_CATEGORY_TAG_TYPES: Record<FileCategory, TagType> = {
  folder: "warning",
  image: "success",
  document: "primary",
  text: "info",
  archive: "danger",
  video: "primary",
  audio: "success",
  code: "warning",
  executable: "danger",
  email: "info",
  unknown: "info",
};

/**
 * 文件图标管理器
 * 用于批量加载和管理文件图标
 */
export class FileIconManager {
  private iconMap: Record<string, string> = {};
  private fallbackIcon: string = "";

  /**
   * 构造函数
   * @param iconModules 通过 import.meta.glob 加载的图标模块
   * @param fallbackIcon 默认图标（找不到对应图标时使用）
   */
  constructor(iconModules: Record<string, string>, fallbackIcon?: string) {
    this.loadIcons(iconModules);
    if (fallbackIcon) {
      this.fallbackIcon = fallbackIcon;
    }
  }

  /**
   * 加载图标模块
   * @param iconModules 图标模块映射
   */
  private loadIcons(iconModules: Record<string, string>): void {
    for (const path in iconModules) {
      // 从路径提取文件名作为 key，如 /assets/images/pdf.png -> pdf
      const match = path.match(/\/([^/]+)\.(png|svg|jpg|jpeg|webp)$/i);
      if (match) {
        const key = match[1].toLowerCase();
        this.iconMap[key] = iconModules[path];
      }
    }
  }

  /**
   * 设置默认图标
   * @param icon 默认图标路径
   */
  setFallbackIcon(icon: string): void {
    this.fallbackIcon = icon;
  }

  /**
   * 获取图标映射
   * @returns 图标映射对象
   */
  getIconMap(): Record<string, string> {
    return { ...this.iconMap };
  }

  /**
   * 根据后缀获取图标
   * @param ext 文件后缀
   * @returns 图标路径
   */
  getIconByExt(ext: string): string {
    const key = ext.toLowerCase();
    return this.iconMap[key] || this.fallbackIcon;
  }

  /**
   * 根据文件项获取图标
   * @param item 文件项
   * @returns 图标路径
   */
  getIcon(item: FileItem): string {
    if (item?.directory) {
      return this.iconMap["folder"] || this.fallbackIcon;
    }
    const ext = getFileExt(item);
    return this.getIconByExt(ext);
  }
}

/**
 * 从文件项中提取后缀
 * @param item 文件项
 * @returns 文件后缀（小写）
 */
export function getFileExt(item: FileItem | null | undefined): string {
  if (!item) return "";

  // 优先使用 ext 或 suffix 字段
  const direct = String(item.ext || item.suffix || "").toLowerCase();
  if (direct) return direct;

  // 从文件名提取后缀
  const name = String(item.name || "");
  const lastDotIndex = name.lastIndexOf(".");
  return lastDotIndex > -1 ? name.slice(lastDotIndex + 1).toLowerCase() : "";
}

/**
 * 获取文件分类
 * @param item 文件项
 * @returns 文件分类
 */
export function getFileCategory(
  item: FileItem | null | undefined
): FileCategory {
  if (!item) return "unknown";
  if (item.directory) return "folder";

  const ext = getFileExt(item);
  for (const [category, extensions] of Object.entries(
    FILE_CATEGORY_EXTENSIONS
  )) {
    if ((extensions as readonly string[]).includes(ext)) {
      return category as FileCategory;
    }
  }
  return "unknown";
}

/**
 * 获取文件类型标签
 * @param item 文件项
 * @returns 中文标签
 */
export function getFileTypeLabel(item: FileItem | null | undefined): string {
  if (!item) return "文件";
  if (item.directory) return "文件夹";

  const category = getFileCategory(item);
  if (category !== "unknown") {
    return FILE_CATEGORY_LABELS[category];
  }

  // 未知类型返回后缀大写
  const ext = getFileExt(item);
  return ext ? ext.toUpperCase() : "文件";
}

/**
 * 获取文件标签类型（用于 el-tag）
 * @param item 文件项
 * @returns 标签类型
 */
export function getFileTagType(item: FileItem | null | undefined): TagType {
  const category = getFileCategory(item);
  return FILE_CATEGORY_TAG_TYPES[category] || "info";
}

/**
 * 判断文件是否为图片
 * @param item 文件项
 * @returns 是否为图片
 */
export function isImageFile(item: FileItem | null | undefined): boolean {
  return getFileCategory(item) === "image";
}

/**
 * 创建文件图标管理器
 * 使用示例：
 * ```typescript
 * const iconModules = import.meta.glob('@/assets/images/*.png', { eager: true, import: 'default' });
 * const iconManager = createFileIconManager(iconModules as Record<string, string>);
 * const icon = iconManager.getIcon({ name: 'test.pdf' });
 * ```
 *
 * @param iconModules 通过 import.meta.glob 加载的图标模块
 * @param fallbackIcon 默认图标
 * @returns 文件图标管理器实例
 */
export function createFileIconManager(
  iconModules: Record<string, string>,
  fallbackIcon?: string
): FileIconManager {
  return new FileIconManager(iconModules, fallbackIcon);
}
