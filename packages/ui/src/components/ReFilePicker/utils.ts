/**
 * ReFilePicker 纯函数工具集。
 *
 * <p>从 index.vue 里抽出来的一层：路径运算、文件类型判定、accept 匹配、
 * 排序比较、体积/时间格式化。全部无状态、无 Vue 依赖，便于单测与复用，
 * 也让 index.vue / 子组件不再各写一份。</p>
 */
import type { FilePickerColumn, FilePickerItem, FilePickerSortKey } from "./types";

/* ==================== 路径运算 ==================== */

/** 归一化路径：去掉结尾分隔符；空串保持空串、`/`\\` 归一到 `/` */
export const normalizePath = (value: string): string => {
  const text = String(value || "");
  if (!text || text === "/" || text === "\\") return text === "" ? "" : "/";
  const trimmed = text.replace(/[\\/]+$/, "");
  return trimmed || "/";
};

/** 两条路径是否指向同一位置（空串与 `/` 等价） */
export const samePath = (a: string, b: string): boolean => {
  const na = normalizePath(a);
  const nb = normalizePath(b);
  return na === nb || (na === "" && nb === "/") || (na === "/" && nb === "");
};

/** 是否根路径：空串、`/`、或 Windows 盘符 `C:` */
export const isRootPath = (path: string): boolean => {
  const p = normalizePath(path);
  return p === "" || p === "/" || /^[A-Za-z]:$/.test(p);
};

/** 路径使用的分隔符（按原串是否含 `\` 判定） */
export const separatorOf = (path: string): string => (path.includes("\\") ? "\\" : "/");

/**
 * 盘符根补上分隔符：`C:` → `C:\`。
 *
 * <p>Windows 后端用 {@code Paths.get(x).isAbsolute()} 判绝对路径，而 `C:` 在 Windows 上
 * <b>不是</b>绝对路径（驱动器相对）—— 发出去会被判「必须使用绝对路径」。所以盘符根
 * 一律带分隔符，导航时报错的那条路径才会消失。</p>
 */
export const driveRootPath = (drive: string): string =>
  `${String(drive).replace(/[\\/]+$/, "")}\\`;

/** 拼接子路径，保留盘符/根语义 */
export const joinPath = (base: string, name: string): string => {
  const root = normalizePath(base);
  const sep = base.includes("\\") || /^[A-Za-z]:$/.test(root) ? "\\" : "/";
  if (!root || root === "/" || /^[A-Za-z]:$/.test(root)) {
    return root === "/" ? `/${name}` : name ? `${root}${sep}${name}` : `/${name}`;
  }
  return `${root}${sep}${name}`;
};

/** 父目录路径；根/盘符的父仍是 `/`（盘符的父就是组件的虚拟根，即盘符列表） */
export const parentPathOf = (path: string): string => {
  const current = normalizePath(path);
  if (!current || current === "/" || /^[A-Za-z]:$/.test(current)) return "/";
  const idx = Math.max(current.lastIndexOf("/"), current.lastIndexOf("\\"));
  if (idx <= 0) return "/";
  const parent = current.slice(0, idx);
  if (!parent) return "/";
  // `C:\Program Files` 的父是盘符根 `C:\`，不是 `C:`（后者不是绝对路径）
  return /^[A-Za-z]:$/.test(parent) ? driveRootPath(parent) : parent;
};

/** 拆成非空片段 */
export const pathSegments = (path: string): string[] =>
  normalizePath(path)
    .split(/[\\/]+/)
    .filter(Boolean);

export interface FilePickerCrumb {
  name: string;
  path: string;
}

/**
 * 面包屑：根目录 + 逐级片段。
 *
 * <p>Windows 盘符也挂在「根目录」之下：`C:\` → 根目录 › C:。组件把「文件系统根」
 * 表达成虚拟根 `/`（Windows 后端下就是盘符列表），盘符若取代根节点，进了盘符
 * 就再也点不回盘符列表了。</p>
 */
export const breadcrumbOf = (path: string): FilePickerCrumb[] => {
  const p = normalizePath(path);
  if (!p || p === "/") return [{ name: "根目录", path: "/" }];
  const segs = pathSegments(p);
  const firstDrive = /^[A-Za-z]:$/.test(segs[0] || "");
  const crumbs: FilePickerCrumb[] = [{ name: "根目录", path: "/" }];
  let current = "";
  if (firstDrive) {
    current = driveRootPath(segs[0]);
    crumbs.push({ name: segs[0], path: current });
  }
  for (const seg of segs.slice(firstDrive ? 1 : 0)) {
    current = joinPath(current, seg);
    crumbs.push({ name: seg, path: current });
  }
  return crumbs;
};

/* ==================== 文件类型判定 ==================== */

export type FilePickerKind = "dir" | "image" | "video" | "audio" | "pdf" | "file";

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|svg|avif|bmp)$/i;
const VIDEO_EXT = /\.(mp4|webm|ogg|mov|avi|mkv)$/i;
const AUDIO_EXT = /\.(mp3|wav|ogg|flac|m4a|aac)$/i;
const PDF_EXT = /\.pdf$/i;
const ARCHIVE_EXT = /\.(zip|rar|7z|tar|gz|bz2|xz|jar|war)$/i;

/** accept 里代表「目录」的 token（与文件类型并列，如 `accept="dir,.zip"`） */
const DIR_ACCEPT_TOKENS = new Set(["dir", "folder", "directory"]);

/** 扩展名（小写，无点）；无扩展名返回空串 */
export const extensionOf = (name: string): string => {
  const idx = name.lastIndexOf(".");
  return idx > 0 ? name.slice(idx + 1).toLowerCase() : "";
};

/**
 * 归一到单一类型，供图标/类型列/排序共用。
 *
 * <p>优先级与历史模板一致：目录 → 图片 → 视频 → 音频 → PDF → 普通文件；
 * mimeType 优先于扩展名，两者都缺时回落「文件」。</p>
 */
export const fileKindOf = (item: FilePickerItem): FilePickerKind => {
  if (item.isDir) return "dir";
  const mime = item.mimeType ?? "";
  if (mime.startsWith("image/") || IMAGE_EXT.test(item.name)) return "image";
  if (mime.startsWith("video/") || VIDEO_EXT.test(item.name)) return "video";
  if (mime.startsWith("audio/") || AUDIO_EXT.test(item.name)) return "audio";
  if (mime === "application/pdf" || PDF_EXT.test(item.name)) return "pdf";
  return "file";
};

export const isImage = (item: FilePickerItem): boolean => fileKindOf(item) === "image";
export const isVideo = (item: FilePickerItem): boolean => fileKindOf(item) === "video";
export const isAudio = (item: FilePickerItem): boolean => fileKindOf(item) === "audio";
export const isPdf = (item: FilePickerItem): boolean => fileKindOf(item) === "pdf";

/** 类型列的展示文案 */
export const fileTypeText = (name: string): string => {
  const ext = extensionOf(name);
  const map: Record<string, string> = {
    csv: "CSV",
    xls: "Excel",
    xlsx: "Excel",
    doc: "Word",
    docx: "Word",
    pdf: "PDF",
    json: "JSON",
    xml: "XML",
    txt: "文本",
    md: "Markdown",
    jpg: "图片",
    jpeg: "图片",
    png: "图片",
    gif: "图片",
    webp: "图片",
    svg: "图片",
    avif: "图片",
    bmp: "图片",
    mp4: "视频",
    webm: "视频",
    mov: "视频",
    avi: "视频",
    mp3: "音频",
    wav: "音频",
    flac: "音频",
    m4a: "音频",
    zip: "压缩包",
    rar: "压缩包",
    tar: "压缩包",
    gz: "压缩包",
    jar: "JAR",
    war: "WAR",
  };
  return map[ext] || (ext ? `${ext.toUpperCase()} 文件` : "文件");
};

/** 单个 accept token 是否放行某个条目（目录恒放行） */
export const matchesAccept = (item: FilePickerItem, token: string): boolean => {
  if (token === "*/*" || token === "*") return true;
  if (DIR_ACCEPT_TOKENS.has(token)) return item.isDir;
  if (token === "image" || token.startsWith("image/")) {
    return !!item.mimeType?.startsWith("image/") || IMAGE_EXT.test(item.name);
  }
  if (token === "video" || token.startsWith("video/")) {
    return !!item.mimeType?.startsWith("video/") || VIDEO_EXT.test(item.name);
  }
  if (token === "audio" || token.startsWith("audio/")) {
    return !!item.mimeType?.startsWith("audio/") || AUDIO_EXT.test(item.name);
  }
  if (token === "pdf") return !!item.mimeType?.startsWith("application/pdf") || PDF_EXT.test(item.name);
  if (token === "archive") return ARCHIVE_EXT.test(item.name);
  if (token === "text" || token.startsWith("text/")) {
    return !!item.mimeType?.startsWith("text/") || /\.(txt|md|json|xml|csv|log|ya?ml)$/i.test(item.name);
  }
  if (token.startsWith(".")) return item.name.toLowerCase().endsWith(token.toLowerCase());
  return true;
};

/** accept 串里的 token 列表（小写去空） */
export const acceptTokens = (accept: string): string[] =>
  String(accept || "")
    .split(",")
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);

/**
 * accept 是否显式放行「目录」。
 *
 * <p>列出目录恒允许（不然进不去下一级），但<b>能不能选中目录</b>由它决定：
 * `accept="dir"` / `accept="dir,.zip"` 都可选目录；空 accept 或纯文件类型
 * 只可选文件（选目录仍走 {@code directoryMode}）。</p>
 */
export const acceptHasDir = (accept: string): boolean =>
  acceptTokens(accept).some((token) => DIR_ACCEPT_TOKENS.has(token));

/** 把 accept 转成原生 input[accept]（去掉 dir/类别等非原生 token） */
export const toNativeAccept = (accept: string): string =>
  acceptTokens(accept)
    .filter((token) => token.startsWith(".") || token.includes("/"))
    .join(",");

/** 把 accept 串编译成谓词；空 accept 放行全部 */
export const buildAcceptFilter = (accept: string): ((item: FilePickerItem) => boolean) => {
  const tokens = acceptTokens(accept);
  if (!tokens.length) return () => true;
  return (item) => item.isDir || tokens.some((token) => matchesAccept(item, token));
};

/* ==================== 排序 ==================== */

/** 列的声明式配置：表头渲染与宽度类名都由此驱动，避免四段重复模板。
 *  列序沿用 Windows 资源管理器详细信息视图：名称 / 修改时间 / 类型 / 大小。 */
export const FILE_PICKER_COLUMNS: FilePickerColumn[] = [
  { key: "name", label: "名称" },
  { key: "updatedAt", label: "修改时间", className: "rfp-details__time" },
  { key: "type", label: "类型" },
  { key: "size", label: "大小", className: "rfp-details__size", align: "right" },
];

/**
 * 列表排序：目录恒在前，其余按列比较。
 *
 * <p>「类型」列按<b>扩展名</b>排序（而非本地化中文标签），否则同后缀文件
 * 会被标签文案打散、跨语言下顺序还会变。</p>
 */
export const compareItems = (
  a: FilePickerItem,
  b: FilePickerItem,
  key: FilePickerSortKey,
  asc: boolean,
): number => {
  const dirOrder = Number(b.isDir) - Number(a.isDir);
  if (dirOrder !== 0) return dirOrder;
  let left: string | number = "";
  let right: string | number = "";
  if (key === "name") {
    left = a.name.toLowerCase();
    right = b.name.toLowerCase();
  } else if (key === "type") {
    left = extensionOf(a.name);
    right = extensionOf(b.name);
  } else if (key === "size") {
    left = a.isDir ? -1 : a.size ?? 0;
    right = b.isDir ? -1 : b.size ?? 0;
  } else {
    left = a.updatedAt ?? 0;
    right = b.updatedAt ?? 0;
  }
  const cmp = left < right ? -1 : left > right ? 1 : 0;
  return asc ? cmp : -cmp;
};

/* ==================== 展示格式化 ==================== */

/** 人类可读体积；0 字节显示 `0 B`（历史把 0 与未知一起显示为 `-`，是 bug） */
export const formatSize = (bytes?: number): string => {
  if (bytes === undefined || bytes === null || Number.isNaN(bytes) || bytes < 0) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
};

/** yyyy-MM-dd HH:mm；缺失/非法返回 `-` */
export const formatTime = (value?: number): string => {
  if (!value || Number.isNaN(value)) return "-";
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

/** 按 key（回落 name）去重，避免远端返回重复条目时渲染出重复行/重复 key */
export const dedupeItems = (list: FilePickerItem[]): FilePickerItem[] => {
  const seen = new Set<string>();
  const out: FilePickerItem[] = [];
  for (const item of list) {
    const key = String(item.key || item.name);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
};
