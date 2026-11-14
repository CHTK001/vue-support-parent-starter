/**
 * 主机文件页的纯展示逻辑。
 *
 * <p>抽出来是为了可单测：路径面包屑、字节格式化、类型徽标这三样一旦口径不一致，
 * 表现是「点面包屑进了别的目录」「文件大小差 1024 倍」「jar 被当成压缩包」，
 * 而页面本身不报错。</p>
 *
 * @author CH
 * @since 4.0.0.62
 */
import type { ReleaseHostFileItem, ReleaseHostFileKind } from "../api/releaseHostFile";

/** 类型筛选项（顺序即界面顺序：目录 / 安装包 / 压缩包 / 图片 / 文本 / 代码 / 音视频 / 其它） */
export const KIND_OPTIONS: Array<{ value: ReleaseHostFileKind; label: string; icon: string }> = [
  { value: "folder", label: "目录", icon: "Folder" },
  { value: "package", label: "安装包", icon: "Box" },
  { value: "archive", label: "压缩包", icon: "Files" },
  { value: "image", label: "图片", icon: "Picture" },
  { value: "text", label: "文本", icon: "Document" },
  { value: "code", label: "代码", icon: "Cpu" },
  { value: "media", label: "音视频", icon: "VideoPlay" },
  { value: "other", label: "其它", icon: "Tickets" },
];

/**
 * 类型中文名。
 *
 * @param kind 后端类型
 * @returns 展示名
 */
export function kindLabel(kind?: string): string {
  return KIND_OPTIONS.find((it) => it.value === kind)?.label ?? "文件";
}

/**
 * 类型图标名（Element Plus 图标名，由页面统一渲染）。
 *
 * @param kind 后端类型
 * @returns 图标名
 */
export function kindIcon(kind?: string): string {
  return KIND_OPTIONS.find((it) => it.value === kind)?.icon ?? "Document";
}

/**
 * 类型色板 key（用于 CSS class，不直接给颜色：颜色定义留在样式里）。
 *
 * @param kind 后端类型
 * @returns CSS 后缀
 */
export function kindTone(kind?: string): string {
  const known = KIND_OPTIONS.some((it) => it.value === kind);
  return known ? String(kind) : "other";
}

/**
 * 条目标签：目录显示「DIR」，文件显示大写扩展名（最长 4 位）。
 *
 * @param item 条目
 * @returns 标签文本
 */
export function badgeOf(item: Pick<ReleaseHostFileItem, "directory" | "ext" | "name">): string {
  if (item.directory) {
    return "DIR";
  }
  const ext = (item.ext || "").trim().toUpperCase();
  if (ext) {
    return ext.length > 4 ? ext.slice(0, 4) : ext;
  }
  return "FILE";
}

/**
 * 字节数转可读大小（1024 进制，1 位小数）。
 *
 * @param size 字节数
 * @returns 形如 12.4 MB
 */
export function formatSize(size?: number | null): string {
  const value = Number(size || 0);
  if (!Number.isFinite(value) || value <= 0) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB", "TB"];
  let rest = value;
  let unit = 0;
  while (rest >= 1024 && unit < units.length - 1) {
    rest /= 1024;
    unit += 1;
  }
  return `${unit === 0 ? Math.round(rest) : rest.toFixed(1)} ${units[unit]}`;
}

/**
 * 时间戳转本地「YYYY-MM-DD HH:mm」。
 *
 * @param ms 毫秒
 * @returns 展示文本；无值返回 —
 */
export function formatDateTime(ms?: number | null): string {
  if (!ms) {
    return "—";
  }
  const d = new Date(Number(ms));
  if (Number.isNaN(d.getTime())) {
    return "—";
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * 相对时间：今天只显示时分，更早显示日期，避免整列都是长串。
 *
 * @param ms  毫秒
 * @param now 参照时间（默认当前）
 * @returns 展示文本
 */
export function relativeTime(ms?: number | null, now: number = Date.now()): string {
  if (!ms) {
    return "—";
  }
  const value = Number(ms);
  const diff = now - value;
  if (diff >= 0 && diff < 60 * 1000) {
    return "刚刚";
  }
  if (diff >= 0 && diff < 60 * 60 * 1000) {
    return `${Math.floor(diff / 60000)} 分钟前`;
  }
  if (diff >= 0 && diff < 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / 3600000)} 小时前`;
  }
  return formatDateTime(value);
}

/**
 * 目录 key 转面包屑：根永远在第一段，之后每一段都可点。
 *
 * @param key 当前目录 key
 * @returns 面包屑节点（key 为该段的完整路径）
 */
export function breadcrumbOf(key: string): Array<{ label: string; key: string }> {
  const segments = String(key || "")
    .split("/")
    .filter(Boolean);
  const nodes: Array<{ label: string; key: string }> = [{ label: "存储根", key: "" }];
  let cursor = "";
  for (const segment of segments) {
    cursor = cursor ? `${cursor}/${segment}` : segment;
    nodes.push({ label: segment, key: cursor });
  }
  return nodes;
}

/**
 * 取父目录 key。
 *
 * @param key 条目 key
 * @returns 父目录 key；顶层返回空串
 */
export function parentKey(key: string): string {
  const text = String(key || "").replace(/\/+$/, "");
  const index = text.lastIndexOf("/");
  return index < 0 ? "" : text.slice(0, index);
}

/**
 * 拼接主机绝对路径（仅用于展示 / 复制，不参与接口调用）。
 *
 * @param root 存储根
 * @param key  条目 key
 * @returns 绝对路径；根为空时退回 key
 */
export function absoluteOf(root: string, key: string): string {
  const base = String(root || "").replace(/[\\/]+$/, "");
  const rel = String(key || "").replace(/^\/+/, "");
  if (!base) {
    return rel;
  }
  const sep = base.includes("\\") ? "\\" : "/";
  return rel ? `${base}${sep}${rel.replace(/\//g, sep)}` : base;
}

/**
 * 大小条的相对长度：按目录内最大文件归一，避免大包把其它条目压成 0 像素。
 *
 * @param size 当前大小
 * @param max  目录内最大大小
 * @returns 0~100
 */
export function sizePercent(size: number, max: number): number {
  if (!max || max <= 0 || !size || size <= 0) {
    return 0;
  }
  return Math.max(2, Math.min(100, Math.round((size / max) * 100)));
}
