<script setup lang="ts">
/**
 * 文件存储服务页 —— 现代云盘风格
 *
 * 对接独立文件存储服务器（FileStorageServerFilter），提供：
 *  - 顶部工具栏（服务器/存储桶配置、搜索、视图切换、上传）
 *  - 左侧边栏（存储桶统计、快捷操作）
 *  - 主区域（面包屑导航、网格/列表双视图）
 *  - 弹窗预览（图片/文本/Office/PDF/音视频）
 *  - 一次性链接（自定义过期时间）
 */
import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  ArrowDown,
  ArrowLeft,
  Close,
  CopyDocument,
  Delete,
  DeleteFilled,
  Document,
  DocumentAdd,
  DocumentCopy,
  Download,
  EditPen,
  Files,
  Folder,
  FolderAdd,
  FolderOpened,
  Grid,
  List,
  Lock,
  Menu,
  Operation,
  Refresh,
  Scissor,
  Search,
  Setting,
  Tickets,
  Upload,
} from "@element-plus/icons-vue";
import {
  DEFAULT_BUCKET,
  DEFAULT_SERVER,
  copyObjects,
  createDirectory,
  createFile,
  createOneTimeLink,
  deleteObject,
  downloadZip,
  existObject,
  getBucketConfig,
  getCapabilities,
  getDefaultBucket,
  getQuotaBytes,
  getServerBase,
  listObjects,
  moveObjects,
  objectUrl,
  renameObject,
  unzipObject,
  zipArchiveName,
  putObject,
  setBucketConfig,
  setDefaultBucket,
} from "../api/filestorageApi";
import type { BucketConfig, CapabilitiesResponse, StorageObject } from "../api/filestorageApi";
import PreviewIframePanel from "../components/PreviewIframePanel.vue";
import PreviewOfficePanel from "../components/PreviewOfficePanel.vue";
import { isClientRenderable, RENDER_SERVER } from "../utils/officeRenderer";

/**
 * Windows 风格彩色类型图标（SVG 标记，viewBox 48x48）。
 *
 * <p>目录为经典黄色双层文件夹；txt/json/代码/office/pdf/压缩包等常见类型
 * 均按 Windows 资源管理器风格绘制（白纸折角 + 类型色块/字符）。</p>
 */
const FS_TYPE_SVG: Record<string, string> = {
  /** 目录：黄色双层文件夹 */
  folder: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M5 13a4 4 0 0 1 4-4h10.2l4.6 4.6a2 2 0 0 0 1.4.6H39a4 4 0 0 1 4 4v3H5z" fill="#f0b429"/><path d="M5 18h38v16.5a4.5 4.5 0 0 1-4.5 4.5h-29A4.5 4.5 0 0 1 5 34.5z" fill="#ffd166"/><path d="M5 18h38v2.4H5z" fill="#ffe4a1"/></svg>`,
  /** 兜底：空白文档 */
  file: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M11 6a3 3 0 0 1 3-3h15l9 9v29a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3z" fill="#fff" stroke="#c8d3de" stroke-width="1.6"/><path d="M29 3l9 9h-7a2 2 0 0 1-2-2z" fill="#d9e4ee"/></svg>`,
  /** 文本：白纸 + 蓝色行 */
  txt: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M11 6a3 3 0 0 1 3-3h15l9 9v29a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3z" fill="#fff" stroke="#c8d3de" stroke-width="1.6"/><path d="M29 3l9 9h-7a2 2 0 0 1-2-2z" fill="#d9e4ee"/><path d="M16 23h16M16 29h16M16 35h10" stroke="#4a90d9" stroke-width="2.4" stroke-linecap="round"/></svg>`,
  /** JSON：白纸 + 橙色花括号 */
  json: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M11 6a3 3 0 0 1 3-3h15l9 9v29a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3z" fill="#fff" stroke="#c8d3de" stroke-width="1.6"/><path d="M29 3l9 9h-7a2 2 0 0 1-2-2z" fill="#d9e4ee"/><text x="24" y="31" text-anchor="middle" font-family="Consolas,Menlo,monospace" font-size="13" font-weight="700" fill="#e8833a">{ }</text></svg>`,
  /** 代码：白纸 + 蓝色尖括号 */
  code: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M11 6a3 3 0 0 1 3-3h15l9 9v29a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3z" fill="#fff" stroke="#c8d3de" stroke-width="1.6"/><path d="M29 3l9 9h-7a2 2 0 0 1-2-2z" fill="#d9e4ee"/><path d="M19.5 20l-5.5 5.5 5.5 5.5M28.5 20l5.5 5.5-5.5 5.5" fill="none" stroke="#2f74c0" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  /** Markdown：白纸 + 靛蓝 M↓ */
  md: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M11 6a3 3 0 0 1 3-3h15l9 9v29a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3z" fill="#fff" stroke="#c8d3de" stroke-width="1.6"/><path d="M29 3l9 9h-7a2 2 0 0 1-2-2z" fill="#d9e4ee"/><text x="21" y="32" text-anchor="middle" font-family="Arial,sans-serif" font-size="14" font-weight="700" fill="#5b6bd6">M</text><path d="M32 22v8m0 0l-3-3m3 3l3-3" fill="none" stroke="#5b6bd6" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  /** 图片：相纸 + 山与太阳 */
  image: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="8" width="36" height="30" rx="4" fill="#eaf4ff" stroke="#bcd7f0" stroke-width="1.6"/><circle cx="17" cy="18" r="3.6" fill="#ffd23f"/><path d="M9 38l10-12 7 8 5.5-5.5L38 34v2a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2z" fill="#57b368"/></svg>`,
  /** 视频：蓝色胶片 + 播放键 */
  video: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="10" width="38" height="28" rx="5" fill="#3d6fd6"/><path d="M20.5 18.5l11 5.5-11 5.5z" fill="#fff"/><rect x="5" y="10" width="38" height="28" rx="5" fill="none" stroke="#2c55a8" stroke-width="1.6"/></svg>`,
  /** 音频：紫色唱片 + 音符 */
  audio: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><rect x="7" y="7" width="34" height="34" rx="7" fill="#8e5bd6"/><path d="M20 31V19.5l11-2.8V27" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="17.6" cy="31.2" r="3.2" fill="#fff"/><circle cx="28.6" cy="27.2" r="3.2" fill="#fff"/></svg>`,
  /** PDF：白纸 + 红色徽标 */
  pdf: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M11 6a3 3 0 0 1 3-3h15l9 9v29a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3z" fill="#fff" stroke="#c8d3de" stroke-width="1.6"/><path d="M29 3l9 9h-7a2 2 0 0 1-2-2z" fill="#d9e4ee"/><rect x="10" y="25" width="24" height="9.5" rx="2.2" fill="#e5493a"/><text x="22" y="32.4" text-anchor="middle" font-family="Arial,sans-serif" font-size="7" font-weight="700" fill="#fff">PDF</text></svg>`,
  /** 压缩包：纸箱 + 拉链 */
  zip: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M13 16l3-7h16l3 7z" fill="#d98f2b"/><rect x="9" y="16" width="30" height="24" rx="4" fill="#f2a63c"/><path d="M23.2 16h1.6v3h-1.6zM23.2 21h1.6v3h-1.6zM23.2 26h1.6v3h-1.6z" fill="#fff" opacity="0.85"/><rect x="20.5" y="30" width="7" height="6" rx="1.5" fill="#fff"/></svg>`,
  /** Excel：白纸 + 绿色表格 */
  excel: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M11 6a3 3 0 0 1 3-3h15l9 9v29a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3z" fill="#fff" stroke="#c8d3de" stroke-width="1.6"/><path d="M29 3l9 9h-7a2 2 0 0 1-2-2z" fill="#d9e4ee"/><rect x="13" y="19" width="22" height="16" rx="2" fill="#2f9e5f"/><path d="M13 24.4h22M13 29.7h22M20.4 19v16M27.6 19v16" stroke="#fff" stroke-width="1.4"/></svg>`,
  /** Word：白纸 + 蓝色 W */
  word: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M11 6a3 3 0 0 1 3-3h15l9 9v29a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3z" fill="#fff" stroke="#c8d3de" stroke-width="1.6"/><path d="M29 3l9 9h-7a2 2 0 0 1-2-2z" fill="#d9e4ee"/><rect x="13" y="19" width="22" height="16" rx="2.4" fill="#2b6fd4"/><text x="24" y="31.5" text-anchor="middle" font-family="Arial,sans-serif" font-size="10" font-weight="700" fill="#fff">W</text></svg>`,
  /** PPT：白纸 + 橙色 P */
  ppt: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M11 6a3 3 0 0 1 3-3h15l9 9v29a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3z" fill="#fff" stroke="#c8d3de" stroke-width="1.6"/><path d="M29 3l9 9h-7a2 2 0 0 1-2-2z" fill="#d9e4ee"/><rect x="13" y="19" width="22" height="16" rx="2.4" fill="#e8833a"/><text x="24" y="31.5" text-anchor="middle" font-family="Arial,sans-serif" font-size="10" font-weight="700" fill="#fff">P</text></svg>`,
  /** 字体：白纸 + 紫色 Aa */
  font: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M11 6a3 3 0 0 1 3-3h15l9 9v29a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3z" fill="#fff" stroke="#c8d3de" stroke-width="1.6"/><path d="M29 3l9 9h-7a2 2 0 0 1-2-2z" fill="#d9e4ee"/><text x="24" y="32" text-anchor="middle" font-family="Georgia,serif" font-size="14" font-weight="700" fill="#8e5bd6">Aa</text></svg>`,
};

/**
 * 根据文件名/目录标记返回 Windows 风格 SVG 图标标记。
 *
 * <p>目录返回黄色文件夹；json/代码/markdown 等文本细分类型优先，
 * office 再按 Excel/PowerPoint/Word 三类区分，其余按大类兜底。</p>
 *
 * @param name  文件名称
 * @param isDir 是否为目录
 * @return SVG 标记字符串（配合 v-html 渲染）
 */
function fileSvg(name: string, isDir: boolean): string {
  if (isDir) {
    return FS_TYPE_SVG.folder;
  }
  const ext = name.slice(name.lastIndexOf(".") + 1).toLowerCase();
  switch (kindOf(name)) {
    case "image":
      return FS_TYPE_SVG.image;
    case "video":
      return FS_TYPE_SVG.video;
    case "audio":
      return FS_TYPE_SVG.audio;
    case "pdf":
      return FS_TYPE_SVG.pdf;
    case "archive":
      return FS_TYPE_SVG.zip;
    case "font":
      return FS_TYPE_SVG.font;
    case "office":
      // Excel 表格类 / PPT 演示类 / 其余按 Word 文档
      if (["xlsx", "xls", "ods"].includes(ext)) {
        return FS_TYPE_SVG.excel;
      }
      if (["pptx", "ppt", "odp", "pps"].includes(ext)) {
        return FS_TYPE_SVG.ppt;
      }
      return FS_TYPE_SVG.word;
    // 源代码统一蓝色尖括号图标
    case "code":
      return FS_TYPE_SVG.code;
    // Markdown 专属 M↓ 图标
    case "markdown":
      return FS_TYPE_SVG.md;
    // CSV 按表格类文件显示 Excel 图标
    case "csv":
      return FS_TYPE_SVG.excel;
    // 邮件 / 日历 / 名片 / Jupyter 暂无专属绘制，使用通用文档图标
    case "email":
    case "calendar":
    case "contact":
    case "notebook":
    case "model":
      return FS_TYPE_SVG.file;
    // HTML 网页沿用代码图标；数据库/大数据文件使用花括号图标
    case "webpage":
      return FS_TYPE_SVG.code;
    case "data":
      return FS_TYPE_SVG.json;
    // PSD 设计稿按图片图标
    case "design":
      return FS_TYPE_SVG.image;
    case "text":
      // json 专属花括号图标，标记类文本使用代码图标，其余普通文本
      if (ext === "json") {
        return FS_TYPE_SVG.json;
      }
      if (["xml", "yaml", "yml"].includes(ext)) {
        return FS_TYPE_SVG.code;
      }
      return FS_TYPE_SVG.txt;
    default:
      return FS_TYPE_SVG.file;
  }
}

/** 预览类型 */
type PreviewKind =
  | "image"
  | "text"
  | "code"
  | "markdown"
  | "csv"
  | "pdf"
  | "office"
  | "email"
  | "calendar"
  | "contact"
  | "notebook"
  | "webpage"
  | "data"
  | "design"
  | "model"
  | "video"
  | "audio"
  | "font"
  | "archive"
  | "unknown";

/** 图片扩展名（浏览器原生可解码） */
const IMAGE_EXTS = ["png", "jpg", "jpeg", "gif", "svg", "webp", "bmp", "ico", "avif", "apng", "jfif"];

/** 纯文本扩展名（前端直接拉取原文展示） */
const PLAIN_TEXT_EXTS = ["txt", "log", "json", "xml", "yaml", "yml"];

/** 源代码 / 配置文件扩展名（走后端语法高亮预览） */
const CODE_EXTS = [
  "js", "mjs", "cjs", "ts", "jsx", "tsx", "vue", "css", "scss", "less",
  "java", "kt", "groovy", "scala", "py", "rb", "go", "rs",
  "c", "h", "cpp", "hpp", "cs", "php", "swift", "dart", "lua", "pl",
  "sql", "sh", "bash", "zsh", "bat", "cmd", "ps1",
  "properties", "cfg", "conf", "ini", "env", "toml", "gradle",
];

/** Office 及其他服务端渲染的文档扩展名（统一走 iframe ?preview=true） */
const OFFICE_EXTS = [
  "xlsx", "xls", "docx", "doc", "pptx", "ppt",
  "odt", "ods", "odp", "vsd", "vsdx", "vssx", "vstx", "vdx",
  "dwg", "dgn", "rtf", "epub", "xmind",
];

/** 网页文件扩展名（后端沙箱渲染） */
const WEBPAGE_EXTS = ["html", "htm"];

/** 数据文件扩展名（数据库 / 大数据格式，服务端解析） */
const DATA_EXTS = ["sqlite", "sqlite3", "db", "parquet", "pq"];

/** 设计稿扩展名（服务端转图预览） */
const DESIGN_EXTS = ["psd", "psb"];

/** 3D / CAD / GIS 模型扩展名（服务端信息卡或在线渲染） */
const MODEL_EXTS = [
  "glb", "gltf", "obj", "stl", "dxf", "blend", "fbx",
  "step", "stp", "iges", "igs", "brep", "shp",
];

/** 邮件扩展名 */
const EMAIL_EXTS = ["eml", "msg"];

/** 日历事件扩展名 */
const CALENDAR_EXTS = ["ics", "ical", "ifb", "icalendar"];

/** 通讯录名片扩展名 */
const CONTACT_EXTS = ["vcf", "vcard"];

/** 视频扩展名（仅浏览器原生可播放容器） */
const VIDEO_EXTS = ["mp4", "webm", "ogg", "mov", "avi", "mkv", "flv", "wmv", "m4v", "3gp"];

/** 音频扩展名（浏览器原生可播放） */
const AUDIO_EXTS = ["mp3", "wav", "flac", "m4a", "oga", "opus", "weba"];

/** 字体扩展名 */
const FONT_EXTS = ["ttf", "otf", "woff", "woff2", "eot"];

/** 压缩包扩展名（走后端条目列表预览） */
const ARCHIVE_EXTS = [
  "zip", "zipx", "tar", "gz", "tgz", "bz2", "tbz2", "xz", "txz",
  "7z", "rar", "zst", "tzst", "jar", "war", "apk",
];

/** 视图模式：columns=分栏（macOS Finder 风格，默认）/ details / largeIcons / mediumIcons / smallIcons */
type ViewMode = "columns" | "details" | "largeIcons" | "mediumIcons" | "smallIcons";

/* ================== 连接 & 状态 ================== */

/**
 * 从当前页面 URL 解析存储桶。
 *
 * 服务返回的 Vue 壳页面 URL 即 {@code /{bucket}}，第一段路径即 bucket；
 * query 参数 bucket 优先级最高，便于测试覆盖。
 * 仅当页面由文件服务器自身提供（origin 与文件服务器一致）时才取首段路径，
 * 系统应用内嵌页面（/{appBase}/manage/filestorage）的首段是应用前缀，不能当作桶名。
 */
function resolveBucket(): string {
  try {
    const qs = new URLSearchParams(window.location.search);
    const qb = (qs.get("bucket") || "").trim();
    if (qb) return qb;
    const serverBase = getServerBase();
    if (serverBase && window.location.origin !== new URL(serverBase).origin) {
      return "";
    }
    const seg = (window.location.pathname || "").split("/").filter((s) => s.length > 0);
    const first = (seg[0] || "").trim();
    if (first && !["fs", "assets", "ot", "config"].includes(first.toLowerCase())) {
      return first;
    }
  } catch { /* ignore */ }
  return "";
}

const server = ref(getServerBase() || DEFAULT_SERVER);
const bucket = ref(resolveBucket() || getDefaultBucket() || DEFAULT_BUCKET);
const currentPath = ref("");
const objects = ref<StorageObject[]>([]);
const loading = ref(false);
const keyword = ref("");
/** 视图模式：columns=分栏（默认，macOS Finder 风格）/ largeIcons / mediumIcons / smallIcons / details */
const viewMode = ref<ViewMode>("columns");
/** 排序字段 */
const sortKey = ref<"name" | "size" | "lastModified">("name");
/** 排序方向：asc 升序 / desc 降序 */
const sortOrder = ref<"asc" | "desc">("asc");
/** 当前右键菜单 */
const ctxMenu = ref<{ visible: boolean; x: number; y: number; row: StorageObject | null }>({ visible: false, x: 0, y: 0, row: null });
/** 存储桶公开配置（?config） */
const bucketConfig = ref<BucketConfig | null>(null);
/** SPI 真实能力列表（?format=capabilities，滤镜/URL 参数动态渲染用） */
const capabilities = ref<CapabilitiesResponse | null>(null);
/** 存储桶配置加载状态 */
const configLoading = ref(false);
/** 选中的对象 name 集合（多选） */
const selected = ref<Set<string>>(new Set());
/** 最近一次点击的选中项（用于 Shift 连续多选） */
let lastSelectedIndex = -1;
/** 历史栈（KodExplorer 地址栏前进/后退） */
const historyStack = ref<string[]>([]);
/** 当前历史索引 */
const historyIndex = ref(-1);

const breadcrumbs = computed(() => {
  const segments = currentPath.value ? currentPath.value.split("/") : [];
  return [{ name: "根目录", path: "" }, ...segments.map((name, index) => ({
    name,
    path: segments.slice(0, index + 1).join("/"),
  }))];
});

const filteredObjects = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  const base = kw ? objects.value.filter((item) => item.name.toLowerCase().includes(kw)) : [...objects.value];
  return base.sort((a, b) => {
    // Windows 惯例：目录始终排在文件前面
    if (a.directory !== b.directory) return a.directory ? -1 : 1;
    const dir = sortOrder.value === "asc" ? 1 : -1;
    let r: number;
    switch (sortKey.value) {
      case "size":
        r = (a.size || 0) - (b.size || 0);
        break;
      case "lastModified":
        r = (a.lastModified || 0) - (b.lastModified || 0);
        break;
      default:
        r = a.name.localeCompare(b.name, "zh-CN");
    }
    return r * dir;
  });
});

const fileCount = computed(() => objects.value.filter((item) => !item.directory).length);
const dirCount = computed(() => objects.value.filter((item) => item.directory).length);
const totalSize = computed(() => objects.value.reduce((sum, item) => sum + (item.directory ? 0 : item.size || 0), 0));

function formatSize(bytes?: number): string {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function formatTime(ts?: number): string {
  if (!ts) return "-";
  return new Date(ts).toLocaleString();
}

function kindOf(name: string): PreviewKind {
  const ext = name.slice(name.lastIndexOf(".") + 1).toLowerCase();
  if (IMAGE_EXTS.includes(ext)) return "image";
  if (CODE_EXTS.includes(ext)) return "code";
  if (ext === "md" || ext === "markdown") return "markdown";
  if (ext === "csv") return "csv";
  if (PLAIN_TEXT_EXTS.includes(ext)) return "text";
  if (ext === "pdf") return "pdf";
  if (OFFICE_EXTS.includes(ext)) return "office";
  if (EMAIL_EXTS.includes(ext)) return "email";
  if (CALENDAR_EXTS.includes(ext)) return "calendar";
  if (CONTACT_EXTS.includes(ext)) return "contact";
  if (ext === "ipynb") return "notebook";
  if (WEBPAGE_EXTS.includes(ext)) return "webpage";
  if (DATA_EXTS.includes(ext)) return "data";
  if (DESIGN_EXTS.includes(ext)) return "design";
  if (MODEL_EXTS.includes(ext)) return "model";
  if (VIDEO_EXTS.includes(ext)) return "video";
  if (AUDIO_EXTS.includes(ext)) return "audio";
  if (FONT_EXTS.includes(ext)) return "font";
  if (ARCHIVE_EXTS.includes(ext)) return "archive";
  return "unknown";
}

/** 是否压缩文件（大图标模式下不参与 ?preview 预览） */
function isArchive(name: string): boolean {
  return kindOf(name) === "archive";
}

/** 直接可见文件类型（大图标可尝试 ?preview 渲染缩略图） */
function isPreviewable(name: string): boolean {
  const k = kindOf(name);
  return !["archive", "unknown"].includes(k);
}

/** 根据扩展名返回 SVG 图标类名 */
function fileIconClass(name: string, isDir: boolean): string {
  if (isDir) return "icon-folder";
  switch (kindOf(name)) {
    case "image": return "icon-image";
    case "video": return "icon-video";
    case "audio": return "icon-audio";
    case "pdf": return "icon-pdf";
    case "office": return "icon-office";
    case "archive": return "icon-archive";
    case "design": return "icon-image";
    // 代码 / Markdown / CSV / 邮件 / 网页 / 数据等文本类文档统一使用文本色系图标
    case "text":
    case "code":
    case "markdown":
    case "csv":
    case "email":
    case "calendar":
    case "contact":
    case "notebook":
    case "webpage":
    case "data":
      return "icon-text";
    default: return "icon-file";
  }
}

/** 文件类型描述（详细信息列 / 排序提示） */
function fileType(name: string): string {
  if (isArchive(name)) return "压缩文件";
  const ext = name.slice(name.lastIndexOf(".") + 1).toLowerCase();
  switch (kindOf(name)) {
    case "image": return "图片";
    case "text": return "文本";
    case "code": return "代码文件";
    case "markdown": return "Markdown 文档";
    case "csv": return "CSV 表格";
    case "pdf": return "PDF 文档";
    case "office": return "Office 文档";
    case "email": return "邮件";
    case "calendar": return "日历事件";
    case "contact": return "通讯录名片";
    case "notebook": return "Jupyter 笔记本";
    case "webpage": return "网页文件";
    case "data": return "数据文件";
    case "design": return "设计稿";
    case "model": return "3D / CAD 模型";
    case "video": return "视频";
    case "audio": return "音频";
    case "font": return "字体";
    default: return ext ? `${ext.toUpperCase()} 文件` : "文件";
  }
}

/**
 * 大图标缩略图 URL：所有可预览文件统一 ?preview=true（图片返回字节，其余转 HTML）
 * archive/unknown 返回空走图标兜底
 */
function objectThumbUrl(name: string): string {
  if (isArchive(name) || !isPreviewable(name)) return "";
  return objectUrl(bucket.value, fullKey(name), false) + "?preview=true";
}

/** 排序点击切换 */
function toggleSort(key: "name" | "size" | "lastModified"): void {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
  } else {
    sortKey.value = key;
    sortOrder.value = "asc";
  }
}

/** 排序指示箭头 */
function sortArrow(key: "name" | "size" | "lastModified"): string {
  if (sortKey.value !== key) return "";
  return sortOrder.value === "asc" ? "↑" : "↓";
}

function fullKey(name: string): string {
  return currentPath.value ? `${currentPath.value}/${name}` : name;
}

/* ================== 多选 & 状态栏 ================== */

/** 是否选中 */
function isSelected(name: string): boolean {
  return selected.value.has(name);
}

/** 点击行：支持 Ctrl/Shift 多选 */
function onRowClick(e: MouseEvent, item: StorageObject, index: number): void {
  if (e.ctrlKey || e.metaKey) {
    toggleSelect(item.name);
    lastSelectedIndex = index;
    return;
  }
  if (e.shiftKey && lastSelectedIndex >= 0) {
    // 连续多选（保留原选择）
    const from = Math.min(lastSelectedIndex, index);
    const to = Math.max(lastSelectedIndex, index);
    const next = new Set(selected.value);
    for (let i = from; i <= to; i++) {
      const it = filteredObjects.value[i];
      if (it) next.add(it.name);
    }
    selected.value = next;
    return;
  }
  // 单选：仅保留当前
  selected.value = new Set([item.name]);
  lastSelectedIndex = index;
}

/** 切换选中 */
function toggleSelect(name: string): void {
  const next = new Set(selected.value);
  if (next.has(name)) next.delete(name);
  else next.add(name);
  selected.value = next;
}

/** 清空选中 */
function clearSelect(): void {
  selected.value = new Set();
}

/** 选中文件数 */
const selectedCount = computed(() => selected.value.size);
/** 选中文件总大小 */
const selectedSize = computed(() => {
  let sum = 0;
  for (const obj of objects.value) {
    if (selected.value.has(obj.name) && !obj.directory) sum += obj.size || 0;
  }
  return sum;
});
/** 当前选中的对象实体（按选中名从当前目录对象列表解析） */
const selectedObjects = computed<StorageObject[]>(() =>
  objects.value.filter((obj) => selected.value.has(obj.name)),
);
/** 是否可解压：恰好选中一个非目录的压缩包（与右键菜单的解压显隐条件保持一致） */
const canUnzip = computed(() => {
  if (selected.value.size !== 1) {
    return false;
  }
  const target = selectedObjects.value[0];
  return !!target && !target.directory && isArchive(target.name);
});

/* ================== 左侧导航（目录树 + 快捷访问）/ 回收站 ================== */

/** 左侧导航视图：all=文件浏览 / recycle=回收站 */
type NavKey = "all" | "recycle";
const nav = ref<NavKey>("all");

/** 回收站目录（桶内隐藏目录，常规列表不展示） */
const RECYCLE_DIR = ".recycle";
/** localStorage：最近访问路径 */
const RECENT_KEY = "filestorage.recent";
/** localStorage：收藏夹路径 */
const FAVORITE_KEY = "filestorage.favorites";

/**
 * 读取 localStorage 列表（损坏时回退空数组）
 *
 * @param key 存储键
 * @return 列表
 */
function readList<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

/**
 * 写入 localStorage 列表（写入失败静默）
 *
 * @param key 存储键
 * @param list 列表
 */
function writeList(key: string, list: unknown[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch { /* ignore */ }
}

const recentPaths = ref<string[]>(readList<string>(RECENT_KEY));
const favoritePaths = ref<string[]>(readList<string>(FAVORITE_KEY));

/** 快捷访问：收藏在前、最近访问在后，去重 */
const quickPaths = computed<string[]>(() => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of [...favoritePaths.value, ...recentPaths.value]) {
    if (p && !seen.has(p)) {
      seen.add(p);
      out.push(p);
    }
  }
  return out;
});

/** 回收站条目 */
const recycleItems = ref<StorageObject[]>([]);
/** 回收站加载中 */
const recycleLoading = ref(false);
/** 回收站数量（导航徽标） */
const recycleCount = computed(() => recycleItems.value.length);

/**
 * 存储配额（字节）。
 *
 * <p>优先级：localStorage 覆盖 ＞ app.yaml {@code otherConfig.filestorage.quotaGb} ＞ 默认 5GB，
 * 由 {@link getQuotaBytes} 统一解析。</p>
 */
const quotaBytes = computed(() => getQuotaBytes());

/** 配额展示文案（GB，保留 1 位） */
const quotaText = computed(() => `${(quotaBytes.value / 1024 / 1024 / 1024).toFixed(1)} GB`);

/** 存储用量明细是否展开：默认折叠，只显示占用大小，点箭头才展开明细 */
const usageOpen = ref(false);

/** 当前目录占用占配额的比例（0-100，用于进度条）；占用取既有的 totalSize（排除目录） */
const usagePercent = computed(() => {
  if (quotaBytes.value <= 0) return 0;
  const pct = (totalSize.value / quotaBytes.value) * 100;
  return Math.min(100, Math.max(0, Number(pct.toFixed(2))));
});

/**
 * 记录最近访问目录（去重、最多 12 条）
 *
 * @param path 目录路径
 */
function recordRecent(path: string): void {
  if (!path) return;
  recentPaths.value = [path, ...recentPaths.value.filter((p) => p !== path)].slice(0, 12);
  writeList(RECENT_KEY, recentPaths.value);
}

/**
 * 是否已收藏路径
 *
 * @param path 目录路径
 * @return 是否收藏
 */
function isFavorite(path: string): boolean {
  return favoritePaths.value.includes(path);
}

/**
 * 切换收藏状态
 *
 * @param path 目录路径
 */
function toggleFavorite(path: string): void {
  const has = isFavorite(path);
  favoritePaths.value = has ? favoritePaths.value.filter((p) => p !== path) : [path, ...favoritePaths.value];
  writeList(FAVORITE_KEY, favoritePaths.value);
  ElMessage.success(has ? "已取消收藏" : "已加入收藏夹");
}

/**
 * 从快捷访问移除（同时清掉收藏与最近记录）
 *
 * @param path 目录路径
 */
function removeQuick(path: string): void {
  favoritePaths.value = favoritePaths.value.filter((p) => p !== path);
  recentPaths.value = recentPaths.value.filter((p) => p !== path);
  writeList(FAVORITE_KEY, favoritePaths.value);
  writeList(RECENT_KEY, recentPaths.value);
}

/** 路径显示名（最后一段） */
function pathLabel(path: string): string {
  return path.split("/").filter(Boolean).pop() || path;
}

/** 从快捷访问进入目录 */
function enterPath(path: string): void {
  nav.value = "all";
  goCrumb(path);
}

/** 加载回收站列表（不存在时按空处理） */
async function loadRecycle(): Promise<void> {
  recycleLoading.value = true;
  try {
    recycleItems.value = await listObjects(bucket.value, RECYCLE_DIR);
  } catch {
    recycleItems.value = [];
  } finally {
    recycleLoading.value = false;
  }
}

/** 确保回收站目录存在（已存在时忽略） */
async function ensureRecycleDir(): Promise<void> {
  try {
    await createDirectory(bucket.value, "", RECYCLE_DIR);
  } catch { /* 已存在忽略 */ }
}

/**
 * 将对象移入回收站（删除语义：先入回收站，可还原/彻底删除）
 *
 * @param targets 待删除对象
 */
async function moveToRecycle(targets: StorageObject[]): Promise<void> {
  if (!targets.length) return;
  await ensureRecycleDir();
  await moveObjects(bucket.value, targets.map((t) => fullKey(t.name)), RECYCLE_DIR);
}

/** 从回收站还原对象 */
async function restoreRecycleItem(item: StorageObject): Promise<void> {
  actionRunning.value = true;
  try {
    await moveObjects(bucket.value, [`${RECYCLE_DIR}/${item.name}`], "");
    ElMessage.success(`已还原「${item.name}」`);
    await Promise.all([loadRecycle(), loadObjects()]);
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "还原失败");
  } finally {
    actionRunning.value = false;
  }
}

/** 彻底删除回收站对象 */
async function purgeRecycleItem(item: StorageObject): Promise<void> {
  try {
    await ElMessageBox.confirm(`彻底删除「${item.name}」？该操作不可恢复`, "彻底删除", { type: "warning" });
  } catch { return; }
  actionRunning.value = true;
  try {
    await deleteObject(bucket.value, `${RECYCLE_DIR}/${item.name}`);
    ElMessage.success("已彻底删除");
    await loadRecycle();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "删除失败");
  } finally {
    actionRunning.value = false;
  }
}

/** 清空回收站 */
async function emptyRecycle(): Promise<void> {
  if (!recycleItems.value.length) {
    ElMessage.warning("回收站为空");
    return;
  }
  try {
    await ElMessageBox.confirm("清空回收站？所有对象将被彻底删除", "清空回收站", { type: "warning" });
  } catch { return; }
  actionRunning.value = true;
  try {
    await deleteObject(bucket.value, RECYCLE_DIR);
    ElMessage.success("回收站已清空");
    await loadRecycle();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "清空失败");
  } finally {
    actionRunning.value = false;
  }
}

/**
 * 切换左侧导航视图
 *
 * @param key 视图 key
 */
function switchNav(key: NavKey): void {
  nav.value = key;
  clearSelect();
  if (key === "all") {
    // 回到"根目录"：回桶根
    currentPath.value = "";
    recordHistory("");
    void loadObjects();
  }
  if (key === "recycle") void loadRecycle();
}

/** 视图下拉切换 */
function setView(mode: ViewMode): void {
  viewMode.value = mode;
}

/**
 * 卡片第二行元信息
 *
 * @param item 对象
 * @return 元信息文案
 */
function cardMeta(item: StorageObject): string {
  const time = item.lastModified ? new Date(item.lastModified).toLocaleString() : "";
  if (item.directory) return time ? `文件夹 · ${time}` : "文件夹";
  return [formatSize(item.size), time].filter(Boolean).join(" · ");
}

/* ================== 目录导航 ================== */

async function loadObjects(): Promise<void> {
  loading.value = true;
  try {
    const list = await listObjects(bucket.value, currentPath.value);
    // 回收站为桶内隐藏目录，常规列表不展示
    objects.value = list.filter((o) => o.name !== RECYCLE_DIR);
    // 同步分栏缓存（当前列）
    colObjects.value = { ...colObjects.value, [currentPath.value]: objects.value };
    setDefaultBucket(bucket.value);
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "加载失败");
    objects.value = [];
  } finally {
    loading.value = false;
  }
}

/**
 * 记录一次目录跳转。
 *
 * <p>历史只在这里维护，**不再由 {@link loadObjects} 顺带入栈**：加载数据与记录导航是两件事，
 * 混在一起有两个问题——入栈发生在 {@code await} 之后，刚进子目录那一刻后退仍不可用；
 * 且同一目录被重复加载时会塞进重复记录，导致"后退"点了没反应。</p>
 *
 * @param path 目标目录路径，空串表示根目录
 */
function recordHistory(path: string): void {
  const target = path || "";
  if (historyIndex.value >= 0 && historyStack.value[historyIndex.value] === target) {
    // 同一目录重复加载不产生新记录
    return;
  }
  historyStack.value = historyStack.value.slice(0, historyIndex.value + 1);
  historyStack.value.push(target);
  historyIndex.value = historyStack.value.length - 1;
}

/** 按当前历史位置应用路径并加载（不记录历史） */
function applyHistory(): void {
  currentPath.value = historyStack.value[historyIndex.value] || "";
  clearSelect();
  lastSelectedIndex = -1;
  void loadObjects();
}

/** 历史后退 */
function goBack(): void {
  if (historyIndex.value <= 0) return;
  historyIndex.value--;
  applyHistory();
}

/** 历史前进 */
function goForward(): void {
  if (historyIndex.value >= historyStack.value.length - 1) return;
  historyIndex.value++;
  applyHistory();
}

/** 历史是否可后退 */
const canGoBack = computed(() => historyIndex.value > 0);
/** 历史是否可前进 */
const canGoForward = computed(() => historyIndex.value < historyStack.value.length - 1);

/** 全选当前目录 */
function selectAll(): void {
  selected.value = new Set(filteredObjects.value.map((i) => i.name));
  lastSelectedIndex = -1;
}

/** 下载选中文件：单文件直链，含目录或多选时打包 ZIP */
function downloadSelected(): void {
  if (selectedCount.value === 0) return;
  void smartDownload(selectedKeys());
}

/** 删除选中对象（含目录） */
async function deleteSelected(): Promise<void> {
  if (selectedCount.value === 0) return;
  const targets = objects.value.filter((o) => selected.value.has(o.name));
  try {
    await ElMessageBox.confirm(`确认将选中的 ${targets.length} 个对象移入回收站？`, "移入回收站", { type: "warning" });
  } catch { return; }
  try {
    await moveToRecycle(targets);
    ElMessage.success(`已移入回收站 ${targets.length} 个对象`);
    clearSelect();
    await Promise.all([loadObjects(), loadRecycle()]);
  } catch (e) { ElMessage.error((e as Error)?.message ?? "删除失败"); }
}

/* ============== 分发到服务器（URL 参数开启，数据经 postMessage 交宿主） ============== */

/**
 * 读取启用标记：优先 location.search，其次 hash 查询串（如 #/files?distribute=1）
 *
 * @param name 参数名
 * @return 参数值（不存在为空串）
 */
function urlFlag(name: string): string {
  const fromSearch = new URLSearchParams(window.location.search).get(name);
  if (fromSearch != null) return fromSearch;
  const hash = window.location.hash || "";
  const qIndex = hash.indexOf("?");
  if (qIndex >= 0) {
    return new URLSearchParams(hash.slice(qIndex + 1)).get(name) ?? "";
  }
  return "";
}

/** 是否开启「分发到服务器」（默认关闭，需地址栏 distribute=1/true/on/yes） */
const DISTRIBUTE_ENABLED = ["1", "true", "on", "yes"].includes(urlFlag("distribute").toLowerCase());

/** 当前可分发对象：恰好选中一个非目录文件 */
const distributableTarget = computed<StorageObject | null>(() => {
  if (selectedCount.value !== 1) return null;
  const t = objects.value.find((o) => selected.value.has(o.name)) ?? null;
  return t && !t.directory ? t : null;
});

/**
 * 触发分发：把所选文件信息经 postMessage 交给宿主页面处理
 *
 * <p>文件资产可能作为独立存储页嵌入宿主（iframe）运行，本页不直接调用业务后端；
 * 由宿主负责选择服务器并调用分发接口。仅当 URL 带 distribute 参数时该入口才出现，
 * 数据通过 postMessage 传递（bucket/key/name/size/lastModified）。</p>
 *
 * @param target 指定文件（右键菜单传入）；缺省取当前选中的唯一文件
 */
function openDistribute(target?: StorageObject | null): void {
  const file = target ?? distributableTarget.value;
  if (!file || file.directory) {
    ElMessage.warning("请选择一个文件进行分发");
    return;
  }
  const payload = {
    source: "file-storage",
    type: "distribute",
    bucket: bucket.value,
    key: fullKey(file.name),
    name: file.name,
    size: file.size,
    lastModified: file.lastModified,
  };
  const host = window.parent && window.parent !== window ? window.parent : window.opener;
  if (host) {
    host.postMessage(payload, "*");
    ElMessage.success(`已发送分发请求：${file.name}`);
  } else {
    ElMessage.warning("当前页面未嵌入宿主，无法分发");
  }
}

/* ============== 新建/重命名/复制/剪切/粘贴/压缩/解压（KodExplorer） ============== */

/** 内部拖拽移动的 DataTransfer 自定义类型 */
const DRAG_MIME = "application/x-fs-keys";

/** 剪贴板：复制/剪切暂存的源对象键（跨目录粘贴） */
const clipboard = ref<{ mode: "copy" | "move"; keys: string[] } | null>(null);

/** 文件管理动作执行中（按钮禁用） */
const actionRunning = ref(false);

/** 拖拽悬停的目标目录键（高亮用） */
const dragOverDir = ref("");

/** 当前选中对象的完整键列表 */
function selectedKeys(): string[] {
  return objects.value.filter((o) => selected.value.has(o.name)).map((o) => fullKey(o.name));
}

/** 名称输入弹窗（取消返回 null） */
async function promptInput(title: string, initial = ""): Promise<string | null> {
  try {
    const { value } = await ElMessageBox.prompt(title, "操作", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      inputValue: initial,
    });
    const v = (value ?? "").trim();
    return v || null;
  } catch {
    return null;
  }
}

/** 动作完成后统一刷新列表、分栏与回收站 */
async function refreshAfterAction(): Promise<void> {
  clearSelect();
  await Promise.all([loadObjects(), loadRecycle()]);
  refreshColumns();
}

/** 新建文件夹 */
async function onCreateDir(): Promise<void> {
  const name = await promptInput("请输入新文件夹名称");
  if (!name) return;
  actionRunning.value = true;
  try {
    await createDirectory(bucket.value, currentPath.value, name);
    ElMessage.success(`文件夹「${name}」已创建`);
    await refreshAfterAction();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "新建文件夹失败");
  } finally {
    actionRunning.value = false;
  }
}

/** 新建空文件 */
async function onCreateFile(): Promise<void> {
  const name = await promptInput("请输入新文件名称");
  if (!name) return;
  actionRunning.value = true;
  try {
    await createFile(bucket.value, currentPath.value, name);
    ElMessage.success(`文件「${name}」已创建`);
    await refreshAfterAction();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "新建文件失败");
  } finally {
    actionRunning.value = false;
  }
}

/** 取当前可操作的单个对象（右键目标优先，否则取唯一选中项） */
function singleTarget(row?: StorageObject | null): StorageObject | null {
  if (row) return row;
  const keys = selectedKeys();
  if (keys.length === 1) {
    const name = keys[0].slice(keys[0].lastIndexOf("/") + 1);
    return objects.value.find((o) => o.name === name) ?? null;
  }
  return null;
}

/** 重命名单个对象 */
async function onRename(row?: StorageObject | null): Promise<void> {
  const target = singleTarget(row);
  if (!target) {
    ElMessage.warning("请选择一个对象进行重命名");
    return;
  }
  const newName = await promptInput(`将「${target.name}」重命名为`, target.name);
  if (!newName || newName === target.name) return;
  actionRunning.value = true;
  try {
    await renameObject(bucket.value, currentPath.value, target.name, newName);
    ElMessage.success("重命名成功");
    await refreshAfterAction();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "重命名失败");
  } finally {
    actionRunning.value = false;
  }
}

/** 复制选中对象到剪贴板 */
function onCopySelected(): void {
  const keys = selectedKeys();
  if (!keys.length) {
    ElMessage.warning("请先选择对象");
    return;
  }
  clipboard.value = { mode: "copy", keys };
  ElMessage.success(`已复制 ${keys.length} 项，进入目标目录后粘贴`);
}

/** 剪切选中对象到剪贴板 */
function onCutSelected(): void {
  const keys = selectedKeys();
  if (!keys.length) {
    ElMessage.warning("请先选择对象");
    return;
  }
  clipboard.value = { mode: "move", keys };
  ElMessage.success(`已剪切 ${keys.length} 项，进入目标目录后粘贴`);
}

/** 粘贴剪贴板对象到当前目录 */
async function onPaste(): Promise<void> {
  const board = clipboard.value;
  if (!board || !board.keys.length) {
    ElMessage.warning("剪贴板为空");
    return;
  }
  actionRunning.value = true;
  try {
    if (board.mode === "copy") {
      await copyObjects(bucket.value, board.keys, currentPath.value);
      ElMessage.success("粘贴成功");
    } else {
      await moveObjects(bucket.value, board.keys, currentPath.value);
      ElMessage.success("移动成功");
      clipboard.value = null;
    }
    await refreshAfterAction();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "粘贴失败");
  } finally {
    actionRunning.value = false;
  }
}

/** 触发浏览器保存 Blob */
function saveBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** 智能下载：单文件走直链；多个对象或含目录时服务端打包 ZIP */
async function smartDownload(keys: string[]): Promise<void> {
  if (!keys.length) {
    ElMessage.warning("请先选择对象");
    return;
  }
  if (keys.length === 1) {
    const only = keys[0];
    const onlyObj = objects.value.find((o) => fullKey(o.name) === only);
    if (onlyObj && !onlyObj.directory) {
      window.open(objectUrl(bucket.value, only, true), "_blank");
      return;
    }
  }
  actionRunning.value = true;
  try {
    const blob = await downloadZip(bucket.value, keys);
    saveBlob(blob, zipArchiveName(keys));
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "打包下载失败");
  } finally {
    actionRunning.value = false;
  }
}

/** 压缩打包选中对象并下载 */
async function onZipSelected(): Promise<void> {
  await smartDownload(selectedKeys());
}

/** 解压压缩包（右键单个压缩文件） */
async function onUnzip(row?: StorageObject | null): Promise<void> {
  const target = singleTarget(row);
  if (!target || !isArchive(target.name)) {
    ElMessage.warning("请选择一个压缩包");
    return;
  }
  actionRunning.value = true;
  try {
    const res = await unzipObject(bucket.value, currentPath.value, target.name, currentPath.value);
    ElMessage.success(`解压完成，共 ${(res.entries as number) ?? 0} 项`);
    await refreshAfterAction();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "解压失败");
  } finally {
    actionRunning.value = false;
  }
}

/* ================== 内部拖拽（移动/复制到目录） ================== */

/** 行开始拖拽：写入内部自定义类型，携带选中键 */
function onRowDragStart(e: DragEvent, item: StorageObject): void {
  if (!e.dataTransfer) return;
  if (!selected.value.has(item.name)) {
    selected.value = new Set([item.name]);
  }
  const keys = selectedKeys();
  e.dataTransfer.setData(DRAG_MIME, "1");
  e.dataTransfer.setData("text/plain", JSON.stringify(keys));
  e.dataTransfer.effectAllowed = "copyMove";
}

/** 目录行拖拽悬停：仅内部拖拽且目标为目录时允许放置 */
function onRowDragOver(e: DragEvent, item: StorageObject): void {
  if (!e.dataTransfer || !item.directory || !e.dataTransfer.types.includes(DRAG_MIME)) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = e.ctrlKey ? "copy" : "move";
  dragOverDir.value = fullKey(item.name);
}

/** 离开目录行取消高亮 */
function onRowDragLeave(item: StorageObject): void {
  if (dragOverDir.value === fullKey(item.name)) {
    dragOverDir.value = "";
  }
}

/** 将一组键移动/复制到目标目录（Ctrl 为复制） */
async function dropKeysTo(targetDir: string, e?: DragEvent): Promise<void> {
  if (actionRunning.value) return;
  const keys = e?.dataTransfer?.getData("text/plain");
  if (!keys) return;
  let moved: string[] = [];
  try {
    moved = JSON.parse(keys) as string[];
  } catch {
    return;
  }
  if (!Array.isArray(moved) || !moved.length) return;
  // 拖入当前目录或自身目录时忽略
  const filtered = moved.filter((k) => k !== targetDir && !k.startsWith(targetDir + "/"));
  if (!filtered.length) return;
  const copy = e?.ctrlKey === true;
  actionRunning.value = true;
  try {
    if (copy) {
      await copyObjects(bucket.value, filtered, targetDir);
      ElMessage.success(`复制 ${filtered.length} 项到「${targetDir || "/"}」`);
    } else {
      await moveObjects(bucket.value, filtered, targetDir);
      ElMessage.success(`移动 ${filtered.length} 项到「${targetDir || "/"}」`);
    }
    await refreshAfterAction();
  } catch (err) {
    ElMessage.error((err as Error)?.message ?? (copy ? "复制失败" : "移动失败"));
  } finally {
    actionRunning.value = false;
    dragOverDir.value = "";
  }
}

/** 放置到文件区的目录行 */
async function onRowDrop(e: DragEvent, item: StorageObject): Promise<void> {
  if (!item.directory || !e.dataTransfer?.types.includes(DRAG_MIME)) return;
  e.preventDefault();
  e.stopPropagation();
  const targetDir = fullKey(item.name);
  await dropKeysTo(targetDir, e);
}

/** 容错地从服务端拉取 bucket 公开配置（失败静默，页面不受影响） */
async function loadBucketConfig(): Promise<void> {
  configLoading.value = true;
  try {
    bucketConfig.value = await getBucketConfig(bucket.value);
  } catch {
    bucketConfig.value = null;
  } finally {
    configLoading.value = false;
  }
}

/** 容错地从服务端拉取 SPI 真实能力（失败静默，下拉回退到内置 CSS 滤镜） */
async function loadCapabilities(): Promise<void> {
  try {
    capabilities.value = await getCapabilities(bucket.value);
  } catch {
    capabilities.value = null;
  }
}

/** localStorage 中管理员令牌的键名 */
const ADMIN_TOKEN_KEY = "filestorage.adminToken";

/** 管理员配置弹窗可见性 */
const adminVisible = ref(false);

/** 管理员配置保存中 */
const adminSaving = ref(false);

/** 管理员令牌（后端每次启动随机生成，持久化本地避免重复输入） */
const adminToken = ref(localStorage.getItem(ADMIN_TOKEN_KEY) || "");

/** 管理员配置表单（FileStorageSetting 可动态修改的字段） */
const adminForm = reactive({
  /** 允许内联预览 */
  openPreview: true,
  /** 允许附件下载 */
  openDownload: true,
  /** 允许分段下载 */
  openRange: true,
  /** 附加水印响应头 */
  openWatermark: false,
  /** 允许 webjars */
  openWebjars: true,
  /** 允许远程文件 */
  openRemoteFile: false,
  /** 目录列表页开关 */
  layout: true,
  /** 布局类型 SIMPLE/SYSTEM */
  layoutType: "SIMPLE",
  /** 水印文字（空表示清除） */
  watermark: "",
  /** 详情视图是否显示"类型"列 */
  showFormat: true,
  /** 详情视图是否显示"大小"列 */
  showSize: true,
  /** 详情视图是否显示"修改时间"列 */
  showTime: true,
  /** 图片滤镜（ImageFilter SPI 扩展名，NONE 表示原图） */
  imageFilter: "NONE",
  /** 是否私有桶（私有桶请求需携带访问令牌，由 OAuthServerFilter 鉴权；保存后实时生效） */
  privateBucket: false,
});

/** 能力接口不可用时的内置兜底选项（纯前端 CSS 滤镜） */
const FALLBACK_FILTER_OPTIONS = [
  { value: "NONE", label: "原图", css: "" },
  { value: "GRAYSCALE", label: "灰度", css: "grayscale(1)" },
  { value: "SEPIA", label: "怀旧", css: "sepia(0.9)" },
  { value: "INVERT", label: "反色", css: "invert(1)" },
  { value: "BLUR", label: "模糊", css: "blur(3px)" },
  { value: "SATURATE", label: "鲜艳", css: "saturate(1.8)" },
] as const;

/** SPI 滤镜名到前端 CSS filter 的映射（仅用于缩略图即时预览，实际效果以后端处理为准） */
const SPI_FILTER_CSS: Record<string, string> = {
  GRAY: "grayscale(1)",
  GRAYSCALE: "grayscale(1)",
  SEPIATONE: "sepia(0.9)",
  OLDFASHION: "sepia(0.6)",
  NEGATIVE: "invert(1)",
  GAUSSIANBLUR: "blur(3px)",
  BLUR: "blur(3px)",
  BSC: "saturate(1.4) contrast(1.05)",
  BRIGHT: "brightness(1.15)",
};

/** 图片滤镜可选项：首项固定"原图"，其余取自后端 ImageFilter SPI 真实实现；能力加载失败时回退内置 CSS 滤镜 */
const imageFilterOptions = computed<{ value: string; label: string }[]>(() => {
  const opts: { value: string; label: string }[] = [{ value: "NONE", label: "原图" }];
  const spiFilters = capabilities.value?.imageFilters;
  if (spiFilters && spiFilters.length > 0) {
    for (const f of spiFilters) {
      opts.push({ value: f.name, label: f.label || f.name });
    }
  } else {
    for (const f of FALLBACK_FILTER_OPTIONS) {
      if (f.value !== "NONE") {
        opts.push({ value: f.value, label: f.label });
      }
    }
  }
  return opts;
});

/** 当前滤镜的 CSS filter 值（应用于图片缩略图与图片预览；SPI 滤镜无 CSS 对应时为空，实际效果以后端处理为准） */
const imageFilterCss = computed(() => {
  const value = bucketConfig.value?.imageFilter ?? "NONE";
  if (value === "NONE") {
    return "";
  }
  const fallbackCss = FALLBACK_FILTER_OPTIONS.find((o) => o.value === value)?.css;
  return SPI_FILTER_CSS[value] ?? fallbackCss ?? "";
});

/** 服务端是否显示"类型"列 */
const showFormatCol = computed(() => bucketConfig.value?.showFormat ?? true);
/** 服务端是否显示"大小"列 */
const showSizeCol = computed(() => bucketConfig.value?.showSize ?? true);
/** 服务端是否显示"修改时间"列 */
const showTimeCol = computed(() => bucketConfig.value?.showTime ?? true);

/**
 * 将服务端配置回填到管理员表单
 *
 * @param cfg 服务端配置（可能尚未加载完成）
 */
function applyConfigToForm(cfg: BucketConfig | null): void {
  if (!cfg) return;
  adminForm.openPreview = cfg.openPreview;
  adminForm.openDownload = cfg.openDownload;
  adminForm.openRange = cfg.openRange;
  adminForm.openWatermark = cfg.openWatermark;
  adminForm.openWebjars = cfg.openWebjars;
  adminForm.openRemoteFile = cfg.openRemoteFile;
  adminForm.layout = cfg.layout;
  adminForm.layoutType = cfg.layoutType || "SIMPLE";
  adminForm.watermark = cfg.watermark ?? "";
  adminForm.showFormat = cfg.showFormat ?? true;
  adminForm.showSize = cfg.showSize ?? true;
  adminForm.showTime = cfg.showTime ?? true;
  adminForm.imageFilter = cfg.imageFilter || "NONE";
  adminForm.privateBucket = cfg.private ?? false;
}

/**
 * 打开管理员配置弹窗（立即展示，配置异步回填，避免等待网络请求导致弹窗迟滞）
 */
function openAdminConfig(): void {
  adminVisible.value = true;
  applyConfigToForm(bucketConfig.value);
  if (!bucketConfig.value) {
    void loadBucketConfig().then(() => applyConfigToForm(bucketConfig.value));
  }
}

/**
 * 保存管理员配置（后端实时生效，并刷新侧栏开关徽标）
 */
async function saveAdminConfig(): Promise<void> {
  const tokenValue = adminToken.value.trim();
  if (!tokenValue) {
    ElMessage.warning("请输入管理员令牌");
    return;
  }
  adminSaving.value = true;
  try {
    const { privateBucket, ...rest } = adminForm;
    await setBucketConfig(bucket.value, tokenValue, {
      ...rest,
      watermark: adminForm.watermark.trim(),
      private: privateBucket,
    });
    localStorage.setItem(ADMIN_TOKEN_KEY, tokenValue);
    adminVisible.value = false;
    ElMessage.success("配置已保存并实时生效");
    await loadBucketConfig();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "配置保存失败");
  } finally {
    adminSaving.value = false;
  }
}

/** 服务端是否允许预览 */
const allowPreview = computed(() => bucketConfig.value?.openPreview ?? true);
/** 服务端是否允许下载 */
const allowDownload = computed(() => bucketConfig.value?.openDownload ?? true);
/** 当前桶是否私有（私有桶请求需登录令牌） */
const bucketPrivate = computed(() => bucketConfig.value?.private ?? false);

function enterDir(row: StorageObject): void {
  currentPath.value = fullKey(row.name);
  recordHistory(currentPath.value);
  recordRecent(currentPath.value);
  clearSelect();
  lastSelectedIndex = -1;
  loadObjects();
}

function goCrumb(path: string): void {
  nav.value = "all";
  currentPath.value = path;
  recordHistory(path);
  if (path) recordRecent(path);
  clearSelect();
  lastSelectedIndex = -1;
  loadObjects();
}

function goUp(): void {
  if (!currentPath.value) return;
  nav.value = "all";
  const i = currentPath.value.lastIndexOf("/");
  currentPath.value = i > 0 ? currentPath.value.slice(0, i) : "";
  recordHistory(currentPath.value);
  clearSelect();
  lastSelectedIndex = -1;
  loadObjects();
}

/* ================== 分栏视图（macOS Finder 风格） ================== */

/** 分栏每列缓存的目录内容（key 为列对应目录路径） */
const colObjects = ref<Record<string, StorageObject[]>>({});
/** 分栏每列加载状态 */
const colLoading = ref<Record<string, boolean>>({});

/** 路径链：["", "a", "a/b", ...]（含当前目录，用于渲染各列） */
const segmentPaths = computed<string[]>(() => {
  const segs = currentPath.value ? currentPath.value.split("/") : [];
  const out: string[] = [""];
  let cur = "";
  for (const s of segs) {
    cur = cur ? `${cur}/${s}` : s;
    out.push(cur);
  }
  return out;
});

/**
 * 确保某一列的目录内容已加载
 *
 * @param path 列目录路径
 */
async function ensureColumn(path: string): Promise<void> {
  if (colObjects.value[path] !== undefined) return;
  colLoading.value = { ...colLoading.value, [path]: true };
  try {
    const list = await listObjects(bucket.value, path);
    colObjects.value = { ...colObjects.value, [path]: list.filter((o) => o.name !== RECYCLE_DIR) };
  } catch {
    colObjects.value = { ...colObjects.value, [path]: [] };
  } finally {
    colLoading.value = { ...colLoading.value, [path]: false };
  }
}

/** 清空并重新加载分栏各列 */
function refreshColumns(): void {
  colObjects.value = {};
  segmentPaths.value.forEach((p) => { void ensureColumn(p); });
}

/**
 * 取某一列当前应当渲染的条目（叠加搜索关键词过滤）
 *
 * <p>分栏视图的列数据来自 {@link colObjects} 这份「每列一份」的缓存，
 * 而不是当前目录的 {@code objects}，所以不能直接套 {@link filteredObjects}——
 * 后者只是当前目录的筛选结果，套到每一列上会把祖先列一起清空。
 * 结果就是搜索框只改状态栏计数、列表却纹丝不动（计数与可见条目长期对不上）。</p>
 *
 * <p>这里只过滤<b>当前目录那一列</b>，祖先列保持完整：否则用户一搜索就看不到
 * 「当前目录是从哪一级进来的」这条路径信息，无法回退。语义与其它三个视图一致，
 * 即搜索框占位符所写的「在当前目录中搜索」。</p>
 *
 * @param colPath 列对应的目录路径（空串表示根目录）
 * @return 该列应当渲染的条目列表；列尚未加载时返回空数组
 */
function columnItems(colPath: string): StorageObject[] {
  const list = colObjects.value[colPath];
  if (list === undefined) {
    return [];
  }
  const kw = keyword.value.trim().toLowerCase();
  if (!kw) {
    return list;
  }
  return list.filter((item) => item.name.toLowerCase().includes(kw));
}

watch(segmentPaths, (paths) => {
  paths.forEach((p) => { void ensureColumn(p); });
});

/**
 * 列内对象键（列路径 + 名称）
 *
 * @param path 列目录路径
 * @param name 对象名
 * @return 桶内相对键
 */
function joinKey(path: string, name: string): string {
  return path ? `${path}/${name}` : name;
}

/**
 * 分栏点击：目录向右侧展开一列；文件执行选中
 *
 * @param e       鼠标事件
 * @param item    对象
 * @param colPath 列目录路径
 * @param index   序号（Ctrl 多选用）
 */
function onColumnClick(e: MouseEvent | KeyboardEvent, item: StorageObject, colPath: string, index: number): void {
  if (item.directory) {
    currentPath.value = joinKey(colPath, item.name);
    recordHistory(currentPath.value);
    recordRecent(currentPath.value);
    clearSelect();
    lastSelectedIndex = -1;
    loadObjects();
    return;
  }
  if (e.ctrlKey || e.metaKey) {
    toggleSelect(item.name);
    lastSelectedIndex = index;
    return;
  }
  selected.value = new Set([item.name]);
  lastSelectedIndex = index;
}

/**
 * 分栏拖拽开始（源键按列路径计算）
 *
 * @param e       拖拽事件
 * @param item    源对象
 * @param colPath 列目录路径
 */
function onColumnDragStart(e: DragEvent, item: StorageObject, colPath: string): void {
  if (!e.dataTransfer) return;
  e.dataTransfer.setData(DRAG_MIME, "1");
  e.dataTransfer.setData("text/plain", JSON.stringify([joinKey(colPath, item.name)]));
  e.dataTransfer.effectAllowed = "copyMove";
}

/**
 * 分栏目录行拖拽悬停
 *
 * @param e       拖拽事件
 * @param colPath 列目录路径
 * @param item    目标对象
 */
function onColumnRowDragOver(e: DragEvent, colPath: string, item: StorageObject): void {
  if (!e.dataTransfer || !item.directory || !e.dataTransfer.types.includes(DRAG_MIME)) return;
  e.preventDefault();
  e.stopPropagation();
  e.dataTransfer.dropEffect = e.ctrlKey ? "copy" : "move";
  dragOverDir.value = joinKey(colPath, item.name);
}

/**
 * 分栏目录行拖拽离开
 *
 * @param colPath 列目录路径
 * @param item    目标对象
 */
function onColumnRowDragLeave(colPath: string, item: StorageObject): void {
  if (dragOverDir.value === joinKey(colPath, item.name)) {
    dragOverDir.value = "";
  }
}

/**
 * 分栏目录行放置（移动到该目录）
 *
 * @param e       拖拽事件
 * @param colPath 列目录路径
 * @param item    目标目录
 */
async function onColumnDrop(e: DragEvent, colPath: string, item: StorageObject): Promise<void> {
  if (!item.directory || !e.dataTransfer?.types.includes(DRAG_MIME)) return;
  e.preventDefault();
  e.stopPropagation();
  await dropKeysTo(joinKey(colPath, item.name), e);
}

/** 分栏空白拖拽悬停 */
function onColumnBlankDragOver(e: DragEvent): void {
  if (e.dataTransfer?.types.includes(DRAG_MIME)) {
    e.preventDefault();
    e.dataTransfer.dropEffect = e.ctrlKey ? "copy" : "move";
  }
}

/**
 * 分栏空白放置（移动到该列目录）
 *
 * @param e       拖拽事件
 * @param colPath 列目录路径
 */
async function onColumnBlankDrop(e: DragEvent, colPath: string): Promise<void> {
  if (!e.dataTransfer?.types.includes(DRAG_MIME)) return;
  e.preventDefault();
  await dropKeysTo(colPath, e);
}

/**
 * 某目录是否为路径链分支（右侧已展开其子列）
 *
 * @param colPath  列目录路径
 * @param item     对象
 * @param colIndex 列下标
 * @return 是否分支
 */
function isTrailDir(colPath: string, item: StorageObject, colIndex: number): boolean {
  const next = segmentPaths.value[colIndex + 1];
  return !!next && next === joinKey(colPath, item.name);
}

/**
 * 分栏最后一列的文件选中态
 *
 * @param colIndex 列下标
 * @param item     对象
 * @return 是否选中
 */
function isColumnSelected(colIndex: number, item: StorageObject): boolean {
  return colIndex === segmentPaths.value.length - 1 && isSelected(item.name);
}

/* ================== 右键菜单 ================== */

function openContextMenu(e: MouseEvent, row: StorageObject): void {
  e.preventDefault();
  e.stopPropagation();
  // KodExplorer 行为：右键即选中该文件（若已多选则保留选择）
  if (!selected.value.has(row.name)) {
    selected.value = new Set([row.name]);
  }
  ctxMenu.value = { visible: true, x: e.clientX, y: e.clientY, row };
}

/** 文件区空白处右键菜单（新建/粘贴/刷新） */
function openBlankContextMenu(e: MouseEvent): void {
  e.preventDefault();
  ctxMenu.value = { visible: true, x: e.clientX, y: e.clientY, row: null };
}

function closeContextMenu(): void {
  ctxMenu.value.visible = false;
  ctxMenu.value.row = null;
}

function ctxAction(action: string) {
  const row = ctxMenu.value.row;
  closeContextMenu();
  switch (action) {
    case "open":
      if (row) {
        row.directory ? enterDir(row) : openPreview(row);
      }
      break;
    case "preview":
      if (row) void openPreview(row);
      break;
    case "download":
      if (row) void smartDownload([fullKey(row.name)]);
      break;
    case "onetime":
      if (row) openOneTime(row);
      break;
    case "distribute":
      if (row && !row.directory) openDistribute(row);
      break;
    case "favorite":
      if (row && row.directory) toggleFavorite(fullKey(row.name));
      break;
    case "rename":
      void onRename(row);
      break;
    case "copy":
      onCopySelected();
      break;
    case "cut":
      onCutSelected();
      break;
    case "paste":
      void onPaste();
      break;
    case "zip":
      if (row) void smartDownload([fullKey(row.name)]);
      break;
    case "unzip":
      void onUnzip(row);
      break;
    case "mkdir":
      void onCreateDir();
      break;
    case "mkfile":
      void onCreateFile();
      break;
    case "refresh":
      void loadObjects();
      break;
    case "upload":
      openUpload();
      break;
    case "selectAll":
      selectAll();
      break;
    case "delete":
      if (row) void handleDelete(row);
      break;
  }
}

document.addEventListener("click", closeContextMenu);

/* ================== 上传（点击 + 拖拽） ================== */

const uploadVisible = ref(false);
const uploading = ref(false);
const uploadInput = ref<HTMLInputElement>();
/** 是否正在拖拽文件到页面（用于高亮遮罩） */
const dragging = ref(false);
/** 拖拽计数器：防止 dragover 反复触发 enter/leave */
let dragDepth = 0;

function openUpload(): void { uploadVisible.value = true; }
function pickFiles(): void { uploadInput.value?.click(); }

/** 执行上传：支持 FileList 与 DataTransferItem 的文件 */
async function doUpload(files: File[]): Promise<void> {
  if (!files.length) return;
  uploading.value = true;
  let success = 0;
  try {
    for (const f of files) {
      await putObject(bucket.value, fullKey(f.name), f);
      success++;
    }
    ElMessage.success(`上传成功 ${success} 个文件`);
    await loadObjects();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "上传失败");
  } finally {
    uploading.value = false;
  }
}

async function handleFileChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  input.value = "";
  await doUpload(files);
  uploadVisible.value = false;
}

/* ================== 拖拽上传 ================== */

function onDragEnter(e: DragEvent): void {
  if (!e.dataTransfer?.types.includes("Files")) return;
  e.preventDefault();
  dragDepth++;
  dragging.value = true;
}

function onDragOver(e: DragEvent): void {
  if (!e.dataTransfer) return;
  // 内部拖拽（文件/目录移动复制）：允许在空白处放置（落到当前目录），不显示上传遮罩
  if (e.dataTransfer.types.includes(DRAG_MIME)) {
    e.preventDefault();
    e.dataTransfer.dropEffect = e.ctrlKey ? "copy" : "move";
    return;
  }
  if (!e.dataTransfer.types.includes("Files")) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = "copy";
  dragging.value = true;
}

function onDragLeave(e: DragEvent): void {
  if (!e.dataTransfer?.types.includes("Files")) return;
  e.preventDefault();
  dragDepth = Math.max(0, dragDepth - 1);
  if (dragDepth === 0) dragging.value = false;
}

async function onDrop(e: DragEvent): Promise<void> {
  e.preventDefault();
  dragDepth = 0;
  dragging.value = false;
  // 内部拖拽：目录行/树节点放置时已 stopPropagation；落到这里表示放置在文件区空白处 → 当前目录
  if (e.dataTransfer?.types.includes(DRAG_MIME)) {
    await dropKeysTo(currentPath.value, e);
    return;
  }
  const files = Array.from(e.dataTransfer?.files ?? []);
  if (!files.length) return;
  if (uploading.value) {
    ElMessage.warning("正在上传，请稍候");
    return;
  }
  await doUpload(files);
}

// 全局拖拽事件（挂载时注册，卸载时移除）
function bindDragEvents(): void {
  document.addEventListener("dragenter", onDragEnter);
  document.addEventListener("dragover", onDragOver);
  document.addEventListener("dragleave", onDragLeave);
  document.addEventListener("drop", onDrop);
}

function unbindDragEvents(): void {
  document.removeEventListener("dragenter", onDragEnter);
  document.removeEventListener("dragover", onDragOver);
  document.removeEventListener("dragleave", onDragLeave);
  document.removeEventListener("drop", onDrop);
}

/* ================== 预览 ================== */

const previewVisible = ref(false);
const previewLoading = ref(false);
const previewName = ref("");
const previewKind = ref<PreviewKind>("unknown");
const previewKey = ref("");
const previewZoom = ref(100);
const previewError = ref(false);
const iframeKey = ref(0);
const previewMeta = ref<{ size?: number; lastModified?: number }>({});
const iframeLoading = ref(false);

async function openPreview(row: StorageObject): Promise<void> {
  const kind = kindOf(row.name);
  previewName.value = row.name;
  previewKind.value = kind;
  previewKey.value = fullKey(row.name);
  previewZoom.value = 100;
  previewError.value = false;
  previewForceServer.value = false;
  officeLoading.value = false;
  iframeLoading.value = true;
  previewLoading.value = false;
  previewMeta.value = { size: row.size, lastModified: row.lastModified };
  previewVisible.value = true;
}

const previewSrc = computed(() => objectUrl(bucket.value, previewKey.value));

/**
 * 当前文件是否走客户端直渲染（Vue3 Office 组件解析，服务端不转换）。
 *
 * 与后端 `ClientPreviewSupport` 清单严格一致；doc / ppt / odt 等
 * 客户端无法解析的格式返回 false，继续走服务端渲染链路。
 */
const previewUsesClient = computed(() => isClientRenderable(previewName.value));

/**
 * 是否已退回服务端渲染。
 *
 * 客户端组件解析失败时置位，iframe 地址追加 render=server，
 * 触发后端 ConvertSupport / SPI 提供者渲染。
 */
const previewForceServer = ref(false);

/** 客户端渲染加载中状态 */
const officeLoading = ref(false);

/** 客户端渲染面板引用 */
const officePanelRef = ref<InstanceType<typeof PreviewOfficePanel>>();

/**
 * 预览 iframe 地址：统一走后端预览通道 {@code ?preview=true}。
 *
 * <p>所有类型（图片/文本/PDF/Office/音视频/压缩包等）一致，由后端按类型内联渲染或直出字节；
 * objectUrl 可能已带令牌查询参数，故分隔符按需取 &/?。
 * 客户端渲染失败退回时追加 {@code render=server}，要求后端走服务端渲染链路。</p>
 */
const previewFrameSrc = computed(() => {
  const base = previewSrc.value;
  const sep = base.includes("?") ? "&" : "?";
  const server = previewForceServer.value ? `&render=${RENDER_SERVER}` : "";
  return `${base}${sep}preview=true${server}${iframeKey.value > 0 ? `&_t=${iframeKey.value}` : ""}`;
});


const iframePanelRef = ref<InstanceType<typeof PreviewIframePanel>>();

function onFrameLoad(): void { previewLoading.value = false; iframeLoading.value = false; previewError.value = false; }
function onFrameError(): void { previewLoading.value = false; iframeLoading.value = false; previewError.value = true; }
function retryPreview(): void { previewError.value = false; previewLoading.value = true; iframeLoading.value = true; iframeKey.value++; }

/** 客户端直渲染完成 */
function onOfficeRendered(): void { officeLoading.value = false; previewLoading.value = false; }

/**
 * 客户端直渲染失败：退回服务端渲染链路。
 *
 * 追加 {@code render=server} 让后端改走 SPI 提供者 / ConvertSupport，
 * 覆盖"客户端组件无法解析该文档"的情况（如个别非标准 OOXML 文件）。
 */
function onOfficeError(): void {
  officeLoading.value = false;
  if (!previewForceServer.value) {
    previewForceServer.value = true;
    return;
  }
  // 已退回服务端仍失败，交给通用错误态
  previewError.value = true;
}

function toggleFullscreen(el?: HTMLElement): void {
  const t = el || officePanelRef.value?.wrapRef || iframePanelRef.value?.wrapRef;
  if (!t) return;
  document.fullscreenElement ? document.exitFullscreen() : t.requestFullscreen();
}

function onPreviewKeydown(e: KeyboardEvent): void {
  const tag = (e.target as HTMLElement)?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
  switch (e.key) {
    case "+": case "=": e.preventDefault(); previewZoom.value = Math.min(previewZoom.value + 25, 300); break;
    case "-": e.preventDefault(); previewZoom.value = Math.max(previewZoom.value - 25, 25); break;
    case "0": case "r": case "R": e.preventDefault(); previewZoom.value = 100; break;
    case "f": case "F": if (!e.ctrlKey && !e.metaKey) { e.preventDefault(); toggleFullscreen(); } break;
    case "?": e.preventDefault(); (officePanelRef.value ?? iframePanelRef.value)?.toggleHelp(); break;
    case "Escape": if (document.fullscreenElement) { e.preventDefault(); e.stopPropagation(); document.exitFullscreen(); } break;
  }
}
watch(previewVisible, (v) => { v ? document.addEventListener("keydown", onPreviewKeydown) : document.removeEventListener("keydown", onPreviewKeydown); });
onUnmounted(() => { document.removeEventListener("keydown", onPreviewKeydown); });

/* ================== 下载 / 检查 / 删除 ================== */

function handleDownload(row: StorageObject): void { window.open(objectUrl(bucket.value, fullKey(row.name), true), "_blank"); }

async function handleExist(row: StorageObject): Promise<void> {
  try {
    const exists = await existObject(bucket.value, fullKey(row.name));
    ElMessage[exists ? "success" : "warning"](exists ? `「${row.name}」存在` : `「${row.name}」不存在`);
  } catch (e) { ElMessage.error((e as Error)?.message ?? "检查失败"); }
}

async function handleDelete(row: StorageObject): Promise<void> {
  // 多选模式：删除选中集中的所有文件（目录保留单独删除）
  const targets = selected.value.size > 1 && selected.value.has(row.name)
    ? [...selected.value].map((name) => ({ name } as StorageObject))
    : [row];
  const label = targets.length > 1 ? `确认将选中的 ${targets.length} 个对象移入回收站？` : `确认将「${row.name}」移入回收站？`;
  try { await ElMessageBox.confirm(label, "移入回收站", { type: "warning" }); } catch { return; }
  try {
    await moveToRecycle(targets);
    ElMessage.success(`已移入回收站 ${targets.length} 个对象`);
    clearSelect();
    await Promise.all([loadObjects(), loadRecycle()]);
  } catch (e) { ElMessage.error((e as Error)?.message ?? "删除失败"); }
}

/* ================== 创建链接（一次性 / 限时） ================== */

const oneTimeVisible = ref(false);
const oneTimeLink = ref("");
const oneTimeType = ref<"once" | "expiry">("once");
/** 过期时间（秒）：expiry 模式必填；once 模式不使用 */
const oneTimeExpiry = ref(600);
const oneTimeExpiryOptions = [
  { label: "10 秒", value: 10 }, { label: "30 秒", value: 30 },
  { label: "1 分钟", value: 60 }, { label: "5 分钟", value: 300 },
  { label: "10 分钟", value: 600 }, { label: "30 分钟", value: 1800 },
  { label: "1 小时", value: 3600 }, { label: "6 小时", value: 21600 },
  { label: "1 天", value: 86400 },
];
const oneTimeGenerating = ref(false);
const oneTimeTarget = ref<{ name: string; key: string }>();

function openOneTime(row: StorageObject): void {
  if (row.directory) { ElMessage.warning("目录不支持生成访问链接"); return; }
  oneTimeTarget.value = { name: row.name, key: fullKey(row.name) };
  oneTimeLink.value = "";
  oneTimeType.value = "once";
  // once 无需过期时间（展示默认值即可）
  oneTimeExpiry.value = 600;
  oneTimeVisible.value = true;
}

async function generateOneTimeLink(): Promise<void> {
  if (!oneTimeTarget.value) return;
  // expiry 模式需合法过期时间（兜底分钟：一次性无此项）
  let expires: number | undefined;
  if (oneTimeType.value === "expiry") {
    expires = Number(oneTimeExpiry.value);
    if (!Number.isFinite(expires) || expires <= 0) {
      ElMessage.warning("请输入有效的过期时间（秒）");
      return;
    }
    expires = Math.floor(expires);
  }
  oneTimeGenerating.value = true;
  try {
    const res = await createOneTimeLink(bucket.value, oneTimeTarget.value.key, expires, oneTimeType.value);
    oneTimeLink.value = `${getServerBase().replace(/\/+$/, "")}${res.url}`;
    ElMessage.success(oneTimeType.value === "once" ? "一次性链接已生成（仅可访问一次）" : "限时链接已生成（有效期内可多次访问）");
  } catch (e) { ElMessage.error((e as Error)?.message ?? "生成失败"); }
  finally { oneTimeGenerating.value = false; }
}

function copyOneTimeLink(): void {
  if (!oneTimeLink.value) return;
  const el = document.createElement("textarea");
  el.value = oneTimeLink.value;
  document.body.appendChild(el);
  el.select();
  try { document.execCommand("copy"); ElMessage.success("已复制到剪贴板"); }
  catch { ElMessage.error("复制失败"); }
  el.remove();
}

onMounted(() => {
  loadBucketConfig();
  loadCapabilities();
  // 播种初始历史：起始目录就是历史栈的第一条，否则后退/前进的索引会整体错位一格
  recordHistory(currentPath.value);
  loadObjects();
  loadRecycle();
  bindDragEvents();
});

onUnmounted(() => {
  unbindDragEvents();
  document.removeEventListener("click", closeContextMenu);
});
</script>

<template>
  <div class="fs-app" :style="imageFilterCss ? { '--fs-image-filter': imageFilterCss } : undefined" @click="closeContextMenu">
    <!-- ===== 顶部地址栏（KodExplorer 风格） ===== -->
    <!-- ===== 主体区域：左侧导航 + 内容 ===== -->
    <div class="fs-body">
      <aside class="fs-nav">
        <div class="fs-nav__section fs-nav__section--quick">
          <div class="fs-nav__title">快捷访问</div>
          <div v-if="!quickPaths.length" class="fs-nav__empty">暂无收藏 / 最近访问</div>
          <button
            v-for="p in quickPaths"
            :key="p"
            type="button"
            class="fs-nav__item fs-nav__item--quick"
            :class="{ 'is-active': nav === 'all' && currentPath === p }"
            :title="p"
            @click="enterPath(p)"
          >
            <el-icon class="fs-nav__icon" :size="15"><Folder /></el-icon>
            <span class="fs-nav__label">{{ pathLabel(p) }}</span>
            <el-icon
              class="fs-nav__del"
              :size="12"
              title="移除"
              @click.stop="removeQuick(p)"
            ><Close /></el-icon>
          </button>
        </div>

        <div class="fs-nav__foot">
          <button
            type="button"
            class="fs-nav__foot-btn"
            :class="{ 'is-active': nav === 'recycle' }"
            @click="switchNav('recycle')"
          >
            <el-icon :size="15"><Delete /></el-icon>
            <span>回收站</span>
            <b v-if="recycleCount > 0" class="fs-nav__badge">{{ recycleCount }}</b>
          </button>
          <button
            v-admin
            type="button"
            class="fs-nav__foot-btn fs-nav__foot-btn--icon"
            title="系统配置"
            aria-label="系统配置"
            @click="openAdminConfig"
          >
            <el-icon :size="16"><Setting /></el-icon>
          </button>
        </div>
      </aside>

      <main class="fs-main">
        <!-- 路径栏：后退 / 刷新 / 面包屑 -->
        <div class="fs-pathbar">
          <button
            type="button"
            class="fs-icon-btn"
            title="后退"
            aria-label="后退"
            :disabled="!canGoBack"
            @click="goBack"
          >
            <el-icon :size="16"><ArrowLeft /></el-icon>
          </button>
          <button
            type="button"
            class="fs-icon-btn"
            title="刷新"
            aria-label="刷新"
            :disabled="loading"
            @click="loadObjects"
          >
            <el-icon :size="16" :class="{ 'is-spin': loading }"><Refresh /></el-icon>
          </button>
          <div class="fs-crumbs">
            <!-- 回收站不是文件路径上的一级，breadcrumbs 只按 currentPath 推导，
                 切到回收站时若照旧渲染会让人以为还在浏览原目录。此处显式改显「回收站」，
                 点击退回文件列表（与其它面包屑可点击一致）。 -->
            <span
              v-if="nav === 'recycle'"
              class="fs-crumbs__item is-current"
              role="button"
              tabindex="0"
              @click="switchNav('all')"
              @keydown.enter="switchNav('all')"
            >回收站</span>
            <template v-else>
              <template v-for="(crumb, i) in breadcrumbs" :key="crumb.path || 'root'">
                <span v-if="i > 0" class="fs-crumbs__sep" aria-hidden="true">&gt;</span>
                <span
                  class="fs-crumbs__item"
                  :class="{ 'is-current': crumb.path === currentPath }"
                  @click="goCrumb(crumb.path)"
                >{{ crumb.name }}</span>
              </template>
            </template>
          </div>
          <span v-if="bucketPrivate" class="fs-main__lock">
            <el-icon :size="12"><Lock /></el-icon>私有
          </span>
          <span v-if="selectedCount > 0" class="fs-main__sel">已选 {{ selectedCount }} 项</span>

          <!-- 存储统计：紧凑胶囊放路径栏右侧，点箭头展开明细；折叠态只显示当前目录占用大小 -->
          <div class="fs-stats">
            <button
              type="button"
              class="fs-stat fs-stat--usage"
              :aria-expanded="usageOpen"
              aria-label="当前目录占用"
              @click="usageOpen = !usageOpen"
            >
              <span class="fs-stat__label">占用</span>
              <b class="fs-stat__size">{{ formatSize(totalSize) }}</b>
              <el-icon class="fs-stat__chev" :class="{ 'is-open': usageOpen }"><ArrowDown /></el-icon>
            </button>
            <div v-if="usageOpen" class="fs-stat__detail">
              <span>当前目录：<b>{{ formatSize(totalSize) }}</b>，共 <b>{{ objects.length }}</b> 项</span>
              <span>存储配额：<b>{{ quotaText }}</b>，已用 <b>{{ usagePercent }}%</b></span>
              <span class="fs-stat__bar"><i :style="{ width: usagePercent + '%' }" /></span>
            </div>
          </div>
        </div>

        <!-- 操作工具栏：搜索 + 上传/下载，其余操作收敛到右键菜单。
             该块曾在工作区被整块删除（openUpload/downloadSelected/keyword 一度成为孤儿），
             导致页面没有上传入口，故此处恢复。 -->
        <div class="fs-toolbar">
          <div class="fs-searchbox">
            <span class="fs-searchbox__icon" aria-hidden="true">
              <el-icon :size="16"><Search /></el-icon>
            </span>
            <input
              v-model="keyword"
              class="fs-searchbox__input"
              type="text"
              placeholder="在当前目录中搜索…"
              @keydown.esc="keyword = ''"
            />
            <button
              v-if="keyword"
              type="button"
              class="fs-searchbox__clear"
              title="清除搜索"
              aria-label="清除搜索"
              @click="keyword = ''"
            ><el-icon :size="12"><Close /></el-icon></button>
          </div>
          <button type="button" class="fs-tb-btn" title="上传" :disabled="nav !== 'all'" @click="openUpload">
            <el-icon :size="15"><Upload /></el-icon>上传
          </button>
          <button
            v-if="selectedCount > 0 && nav === 'all'"
            type="button"
            class="fs-tb-btn"
            title="下载选中"
            @click="downloadSelected"
          >
            <el-icon :size="15"><Download /></el-icon>下载
          </button>
          <span class="fs-toolbar__hint">右键文件或文件夹查看更多操作</span>
        </div>

        <!-- ===== 全部文件视图 ===== -->
        <template v-if="nav === 'all'">
        <!-- 分栏（macOS Finder 风格）：点击目录向右逐级展开 -->
        <div
          v-if="viewMode === 'columns'"
          class="fs-files fs-files--columns"
          v-loading="loading"
          @contextmenu="openBlankContextMenu"
        >
          <div v-for="(colPath, ci) in segmentPaths" :key="colPath || 'root'" class="fs-col">
            <div
              class="fs-col__body"
              @dragover="onColumnBlankDragOver"
              @drop="onColumnBlankDrop($event, colPath)"
              @contextmenu="openBlankContextMenu"
            >
              <div v-if="colObjects[colPath] === undefined" class="fs-col__hint">加载中…</div>
              <div v-else-if="columnItems(colPath).length === 0" class="fs-col__hint">{{ keyword.trim() ? '无匹配项' : '空目录' }}</div>
              <div
                v-for="(item, index) in columnItems(colPath)"
                :key="item.name"
                class="fs-col__row"
                :class="{
                  'is-trail': isTrailDir(colPath, item, ci),
                  'is-selected': isColumnSelected(ci, item),
                  'is-dragover': item.directory && dragOverDir === joinKey(colPath, item.name),
                }"
                role="button"
                tabindex="0"
                :aria-label="item.name"
                draggable="true"
                @click="onColumnClick($event, item, colPath, index)"
                @dblclick="item.directory ? onColumnClick($event, item, colPath, index) : openPreview(item)"
                @keydown.enter="item.directory ? onColumnClick($event, item, colPath, index) : openPreview(item)"
                @contextmenu.stop="openContextMenu($event, item)"
                @dragstart="onColumnDragStart($event, item, colPath)"
                @dragover="onColumnRowDragOver($event, colPath, item)"
                @dragleave="onColumnRowDragLeave(colPath, item)"
                @drop="onColumnDrop($event, colPath, item)"
              >
                <span class="fs-typeicon fs-col__icon" v-html="fileSvg(item.name, item.directory)" aria-hidden="true" />
                <span class="fs-col__name" :class="{ 'fs-name--dir': item.directory }">{{ item.name }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 详细信息（Details）：列显示由服务端配置动态控制（showFormat/showSize/showTime） -->
        <div
          v-else-if="viewMode === 'details'"
          class="fs-files fs-files--details"
          :class="{ 'fs-details--no-format': !showFormatCol, 'fs-details--no-size': !showSizeCol, 'fs-details--no-time': !showTimeCol }"
          v-loading="loading"
          @contextmenu="openBlankContextMenu"
        >
          <div class="fs-details-head">
            <span class="fs-details-head__col fs-details-head__name" @click="toggleSort('name')">
              名称 <span class="fs-sort-arrow">{{ sortArrow('name') }}</span>
            </span>
            <span v-if="showFormatCol" class="fs-details-head__col fs-details-head__type">类型</span>
            <span v-if="showSizeCol" class="fs-details-head__col fs-details-head__size" @click="toggleSort('size')">
              大小 <span class="fs-sort-arrow">{{ sortArrow('size') }}</span>
            </span>
            <span v-if="showTimeCol" class="fs-details-head__col fs-details-head__time" @click="toggleSort('lastModified')">
              修改时间 <span class="fs-sort-arrow">{{ sortArrow('lastModified') }}</span>
            </span>
          </div>
          <div v-if="filteredObjects.length === 0 && !loading" class="fs-files__empty">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            <span>当前目录为空</span>
          </div>
          <div
            v-for="(item, index) in filteredObjects"
            :key="item.name"
            class="fs-details-row"
            :class="{
              'fs-details-row--selected': isSelected(item.name),
              'fs-row--drop': item.directory && dragOverDir === fullKey(item.name),
            }"
            role="button" tabindex="0"
            :aria-label="item.name"
            draggable="true"
            @click="onRowClick($event, item, index)"
            @dblclick="item.directory ? enterDir(item) : openPreview(item)"
            @keydown.enter="item.directory ? enterDir(item) : openPreview(item)"
            @contextmenu.stop="openContextMenu($event, item)"
            @dragstart="onRowDragStart($event, item)"
            @dragover="onRowDragOver($event, item)"
            @dragleave="onRowDragLeave(item)"
            @drop="onRowDrop($event, item)"
          >
            <span class="fs-details-row__name">
              <span
                class="fs-typeicon fs-details-row__icon"
                v-html="fileSvg(item.name, item.directory)"
                aria-hidden="true"
              />
              <span :class="{ 'fs-name--dir': item.directory }">{{ item.name }}</span>
            </span>
            <span v-if="showFormatCol" class="fs-details-row__type">{{ item.directory ? '文件夹' : fileType(item.name) }}</span>
            <span v-if="showSizeCol" class="fs-details-row__size">{{ item.directory ? '-' : formatSize(item.size) }}</span>
            <span v-if="showTimeCol" class="fs-details-row__time">{{ formatTime(item.lastModified) }}</span>
          </div>
        </div>

        <!-- 大图标（Large Icons）- 使用 ?preview 渲染缩略图 -->
        <div v-else-if="viewMode === 'largeIcons'" class="fs-files fs-files--large" v-loading="loading" @contextmenu="openBlankContextMenu">
          <div v-if="filteredObjects.length === 0 && !loading" class="fs-files__empty">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            <span>当前目录为空</span>
          </div>
          <div
            v-for="(item, index) in filteredObjects"
            :key="item.name"
            class="fs-lg-card"
            :class="{
              'fs-lg-card--selected': isSelected(item.name),
              'fs-row--drop': item.directory && dragOverDir === fullKey(item.name),
            }"
            role="button" tabindex="0"
            :aria-label="item.name"
            draggable="true"
            @click="onRowClick($event, item, index)"
            @dblclick="item.directory ? enterDir(item) : openPreview(item)"
            @keydown.enter="item.directory ? enterDir(item) : openPreview(item)"
            @contextmenu.stop="openContextMenu($event, item)"
            @dragstart="onRowDragStart($event, item)"
            @dragover="onRowDragOver($event, item)"
            @dragleave="onRowDragLeave(item)"
            @drop="onRowDrop($event, item)"
          >
            <span v-if="isSelected(item.name)" class="fs-lg-card__x" aria-hidden="true"><el-icon :size="10"><Close /></el-icon></span>
            <div class="fs-lg-card__thumb" :class="item.directory ? 'icon-folder' : fileIconClass(item.name, false)">
              <img
                v-if="!item.directory && kindOf(item.name) === 'image'"
                :src="objectUrl(bucket, fullKey(item.name))"
                class="fs-lg-card__frame"
                :alt="item.name"
                loading="lazy"
              />
              <span
                v-else
                class="fs-typeicon fs-card-icon"
                v-html="fileSvg(item.name, item.directory)"
                aria-hidden="true"
              />
            </div>
            <div class="fs-lg-card__label" :title="item.name">{{ item.name }}</div>
          </div>
        </div>

        <!-- 中图标（Medium Icons） -->
        <div v-else-if="viewMode === 'mediumIcons'" class="fs-files fs-files--medium" v-loading="loading" @contextmenu="openBlankContextMenu">
          <div v-if="filteredObjects.length === 0 && !loading" class="fs-files__empty">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            <span>当前目录为空</span>
          </div>
          <div
            v-for="(item, index) in filteredObjects"
            :key="item.name"
            class="fs-md-card"
            :class="{
              'fs-md-card--selected': isSelected(item.name),
              'fs-row--drop': item.directory && dragOverDir === fullKey(item.name),
            }"
            role="button" tabindex="0"
            :aria-label="item.name"
            draggable="true"
            @click="onRowClick($event, item, index)"
            @dblclick="item.directory ? enterDir(item) : openPreview(item)"
            @keydown.enter="item.directory ? enterDir(item) : openPreview(item)"
            @contextmenu.stop="openContextMenu($event, item)"
            @dragstart="onRowDragStart($event, item)"
            @dragover="onRowDragOver($event, item)"
            @dragleave="onRowDragLeave(item)"
            @drop="onRowDrop($event, item)"
          >
            <span v-if="isSelected(item.name)" class="fs-md-card__x" aria-hidden="true"><el-icon :size="10"><Close /></el-icon></span>
            <div class="fs-md-card__thumb" :class="item.directory ? 'icon-folder' : fileIconClass(item.name, false)">
              <span
                class="fs-typeicon fs-card-icon"
                v-html="fileSvg(item.name, item.directory)"
                aria-hidden="true"
              />
            </div>
            <div class="fs-md-card__label" :title="item.name">{{ item.name }}</div>
          </div>
        </div>

        <!-- 小图标（Small Icons） -->
        <div v-else class="fs-files fs-files--small" v-loading="loading" @contextmenu="openBlankContextMenu">
          <div v-if="filteredObjects.length === 0 && !loading" class="fs-files__empty">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            <span>当前目录为空</span>
          </div>
          <div class="fs-files__small-list">
            <div
              v-for="(item, index) in filteredObjects"
              :key="item.name"
              class="fs-sm-row"
              :class="{
                'fs-sm-row--selected': isSelected(item.name),
                'fs-row--drop': item.directory && dragOverDir === fullKey(item.name),
              }"
              role="button" tabindex="0"
              :aria-label="item.name"
              draggable="true"
              @click="onRowClick($event, item, index)"
              @dblclick="item.directory ? enterDir(item) : openPreview(item)"
              @keydown.enter="item.directory ? enterDir(item) : openPreview(item)"
              @contextmenu.stop="openContextMenu($event, item)"
              @dragstart="onRowDragStart($event, item)"
              @dragover="onRowDragOver($event, item)"
              @dragleave="onRowDragLeave(item)"
              @drop="onRowDrop($event, item)"
            >
              <span
                class="fs-typeicon fs-sm-row__icon"
                v-html="fileSvg(item.name, item.directory)"
                aria-hidden="true"
              />
              <span class="fs-sm-row__name" :class="{ 'fs-name--dir': item.directory }">{{ item.name }}</span>
            </div>
          </div>
        </div>
        </template>

        <!-- ===== 回收站 ===== -->
        <div v-else-if="nav === 'recycle'" class="fs-files fs-files--large" v-loading="recycleLoading">
          <div class="fs-recycle-head">
            <span>{{ recycleCount }} 项 · 删除的对象会先进入回收站</span>
            <button type="button" class="fs-pill-btn fs-pill-btn--danger" :disabled="actionRunning || recycleCount === 0" @click="emptyRecycle">
              <el-icon :size="14"><Delete /></el-icon>清空回收站
            </button>
          </div>
          <div v-if="recycleItems.length === 0 && !recycleLoading" class="fs-files__empty">
            <el-icon :size="42"><DeleteFilled /></el-icon>
            <span>回收站为空</span>
          </div>
          <div v-for="item in recycleItems" :key="item.name" class="fs-lg-card">
            <div class="fs-lg-card__thumb" :class="fileIconClass(item.name, item.directory)">
              <span class="fs-typeicon fs-card-icon" v-html="fileSvg(item.name, item.directory)" aria-hidden="true" />
            </div>
            <div class="fs-lg-card__label" :title="item.name">{{ item.name }}</div>
            <div class="fs-lg-card__meta">{{ cardMeta(item) }}</div>
            <div class="fs-lg-card__ops">
              <button type="button" class="fs-mini-btn" :disabled="actionRunning" @click="restoreRecycleItem(item)">还原</button>
              <button type="button" class="fs-mini-btn fs-mini-btn--danger" :disabled="actionRunning" @click="purgeRecycleItem(item)">彻底删除</button>
            </div>
          </div>
        </div>
        <!-- 状态栏：项数 + 视图切换 -->
        <div class="fs-statusbar">
          <span class="fs-statusbar__info">
            {{ nav === 'recycle' ? recycleCount : filteredObjects.length }} 个项{{ selectedCount > 0 ? `（已选 ${selectedCount} 项）` : '' }}
          </span>
          <div class="fs-statusbar__views" role="group" aria-label="查看方式">
            <button
              type="button"
              class="fs-view-btn"
              :class="{ 'is-active': viewMode === 'columns' }"
              title="分栏"
              aria-label="分栏"
              @click="setView('columns')"
            ><el-icon :size="15"><Operation /></el-icon></button>
            <button
              type="button"
              class="fs-view-btn"
              :class="{ 'is-active': viewMode === 'details' }"
              title="详细信息"
              aria-label="详细信息"
              @click="setView('details')"
            ><el-icon :size="15"><List /></el-icon></button>
            <button
              type="button"
              class="fs-view-btn"
              :class="{ 'is-active': viewMode === 'largeIcons' }"
              title="大图标"
              aria-label="大图标"
              @click="setView('largeIcons')"
            ><el-icon :size="15"><Grid /></el-icon></button>
            <button
              type="button"
              class="fs-view-btn"
              :class="{ 'is-active': viewMode === 'mediumIcons' }"
              title="中图标"
              aria-label="中图标"
              @click="setView('mediumIcons')"
            ><el-icon :size="15"><Menu /></el-icon></button>
            <button
              type="button"
              class="fs-view-btn"
              :class="{ 'is-active': viewMode === 'smallIcons' }"
              title="小图标"
              aria-label="小图标"
              @click="setView('smallIcons')"
            ><el-icon :size="15"><Tickets /></el-icon></button>
          </div>
        </div>
      </main>
    </div>

    <!-- ===== 右键菜单 ===== -->
    <Teleport to="body">
      <div
        v-if="ctxMenu.visible"
        class="fs-ctx"
        :style="{ left: ctxMenu.x + 'px', top: ctxMenu.y + 'px' }"
        role="menu"
        :aria-label="'文件操作'"
        @click.stop
      >
        <template v-if="ctxMenu.row">
          <button
            type="button"
            class="fs-ctx__item"
            role="menuitem"
            @click="ctxAction(ctxMenu.row!.directory ? 'open' : 'preview')"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            {{ ctxMenu.row!.directory ? '打开' : allowPreview ? '预览' : '打开' }}
          </button>
          <button
            v-if="!ctxMenu.row!.directory && allowDownload"
            type="button"
            class="fs-ctx__item"
            role="menuitem"
            @click="ctxAction('download')"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            下载
          </button>
          <button
            v-if="DISTRIBUTE_ENABLED && !ctxMenu.row!.directory"
            type="button"
            class="fs-ctx__item"
            role="menuitem"
            @click="ctxAction('distribute')"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/></svg>
            分发到服务器
          </button>
          <button
            v-if="!ctxMenu.row!.directory"
            type="button"
            class="fs-ctx__item"
            role="menuitem"
            @click="ctxAction('onetime')"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            创建链接
          </button>
          <button
            v-if="ctxMenu.row!.directory"
            type="button"
            class="fs-ctx__item"
            role="menuitem"
            @click="ctxAction('favorite')"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            {{ isFavorite(fullKey(ctxMenu.row!.name)) ? '取消收藏' : '加入收藏夹' }}
          </button>
          <div class="fs-ctx__sep" aria-hidden="true" />
          <button type="button" class="fs-ctx__item" role="menuitem" @click="ctxAction('rename')">
            <el-icon class="fs-ctx__icon" aria-hidden="true"><EditPen /></el-icon>
            重命名
          </button>
          <button type="button" class="fs-ctx__item" role="menuitem" @click="ctxAction('copy')">
            <el-icon class="fs-ctx__icon" aria-hidden="true"><CopyDocument /></el-icon>
            复制
          </button>
          <button type="button" class="fs-ctx__item" role="menuitem" @click="ctxAction('cut')">
            <el-icon class="fs-ctx__icon" aria-hidden="true"><Scissor /></el-icon>
            剪切
          </button>
          <button type="button" class="fs-ctx__item" role="menuitem" @click="ctxAction('zip')">
            <el-icon class="fs-ctx__icon" aria-hidden="true"><Files /></el-icon>
            压缩下载
          </button>
          <button
            v-if="!ctxMenu.row!.directory && isArchive(ctxMenu.row!.name)"
            type="button"
            class="fs-ctx__item"
            role="menuitem"
            @click="ctxAction('unzip')"
          >
            <el-icon class="fs-ctx__icon" aria-hidden="true"><FolderOpened /></el-icon>
            解压到此目录
          </button>
          <div class="fs-ctx__sep" aria-hidden="true" />
          <button
            type="button"
            class="fs-ctx__item fs-ctx__item--danger"
            role="menuitem"
            @click="ctxAction('delete')"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            删除
          </button>
        </template>
        <template v-else>
          <button type="button" class="fs-ctx__item" role="menuitem" @click="ctxAction('mkdir')">
            <el-icon class="fs-ctx__icon" aria-hidden="true"><FolderAdd /></el-icon>
            新建文件夹
          </button>
          <button type="button" class="fs-ctx__item" role="menuitem" @click="ctxAction('mkfile')">
            <el-icon class="fs-ctx__icon" aria-hidden="true"><DocumentAdd /></el-icon>
            新建文件
          </button>
          <button type="button" class="fs-ctx__item" role="menuitem" @click="ctxAction('upload')">
            <el-icon class="fs-ctx__icon" aria-hidden="true"><Upload /></el-icon>
            上传
          </button>
          <button
            v-if="clipboard != null"
            type="button"
            class="fs-ctx__item"
            role="menuitem"
            @click="ctxAction('paste')"
          >
            <el-icon class="fs-ctx__icon" aria-hidden="true"><DocumentCopy /></el-icon>
            粘贴到此处
          </button>
          <div class="fs-ctx__sep" aria-hidden="true" />
          <button type="button" class="fs-ctx__item" role="menuitem" @click="ctxAction('selectAll')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            全选
          </button>
          <button type="button" class="fs-ctx__item" role="menuitem" @click="ctxAction('refresh')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            刷新
          </button>
        </template>
      </div>
    </Teleport>

    <!-- ===== 系统配置对话框（管理员，v-admin 指令控制入口按钮可见性） ===== -->
    <!-- ===== 系统配置对话框（管理员，v-admin 指令控制入口按钮可见性） ===== -->
    <el-dialog
      v-model="adminVisible"
      class="fs-admin-dialog"
      width="680px"
      :append-to-body="true"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <template #header>
        <div class="fs-admin__head">
          <h3 class="fs-admin__title">系统配置</h3>
          <p class="fs-admin__subtitle">管理员设置 · 保存后立即生效</p>
        </div>
      </template>
      <div class="fs-admin">
        <section class="fs-admin__card">
          <div class="fs-admin__group">文件功能</div>
          <div class="fs-admin__grid">
            <div class="fs-admin__row">
              <span class="fs-admin__label">内联预览 <i class="fs-admin__arrow">→</i></span>
              <el-switch v-model="adminForm.openPreview" />
            </div>
            <div class="fs-admin__row">
              <span class="fs-admin__label">附件下载 <i class="fs-admin__arrow">→</i></span>
              <el-switch v-model="adminForm.openDownload" />
            </div>
            <div class="fs-admin__row">
              <span class="fs-admin__label">分段下载 <i class="fs-admin__arrow">→</i></span>
              <el-switch v-model="adminForm.openRange" />
            </div>
            <div class="fs-admin__row">
              <span class="fs-admin__label">水印响应头 <i class="fs-admin__arrow">→</i></span>
              <el-switch v-model="adminForm.openWatermark" />
            </div>
            <div class="fs-admin__row">
              <span class="fs-admin__label">Webjars 资源 <i class="fs-admin__arrow">→</i></span>
              <el-switch v-model="adminForm.openWebjars" />
            </div>
            <div class="fs-admin__row">
              <span class="fs-admin__label">远程文件透传 <i class="fs-admin__arrow">→</i></span>
              <el-switch v-model="adminForm.openRemoteFile" />
            </div>
            <div class="fs-admin__row">
              <span class="fs-admin__label">目录列表页 <i class="fs-admin__arrow">→</i></span>
              <el-switch v-model="adminForm.layout" />
            </div>
          </div>

          <div class="fs-admin__divider" aria-hidden="true" />
          <div class="fs-admin__group">布局显示</div>
          <div class="fs-admin__grid">
            <div class="fs-admin__row">
              <span class="fs-admin__label">布局类型 <i class="fs-admin__arrow">→</i></span>
              <el-radio-group v-model="adminForm.layoutType" class="fs-admin__pills">
                <el-radio-button value="SYSTEM">资源管理器</el-radio-button>
                <el-radio-button value="SIMPLE">简单列表</el-radio-button>
              </el-radio-group>
            </div>
            <div class="fs-admin__row">
              <span class="fs-admin__label">显示"类型"列 <i class="fs-admin__arrow">→</i></span>
              <el-switch v-model="adminForm.showFormat" />
            </div>
            <div class="fs-admin__row">
              <span class="fs-admin__label">显示"大小"列 <i class="fs-admin__arrow">→</i></span>
              <el-switch v-model="adminForm.showSize" />
            </div>
            <div class="fs-admin__row">
              <span class="fs-admin__label">显示"修改时间"列 <i class="fs-admin__arrow">→</i></span>
              <el-switch v-model="adminForm.showTime" />
            </div>
            <div class="fs-admin__row">
              <span class="fs-admin__label">图片滤镜 <i class="fs-admin__arrow">→</i></span>
              <el-select v-model="adminForm.imageFilter"  class="fs-admin__select">
                <el-option v-for="opt in imageFilterOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
              </el-select>
            </div>
            <div class="fs-admin__row">
              <span class="fs-admin__label">访问权限 <i class="fs-admin__arrow">→</i></span>
              <el-radio-group v-model="adminForm.privateBucket" class="fs-admin__pills">
                <el-radio-button :value="false">公共</el-radio-button>
                <el-radio-button :value="true">私有</el-radio-button>
              </el-radio-group>
            </div>
          </div>
        </section>

        <div class="fs-admin__section-title">水印与安全</div>
        <el-input v-model="adminForm.watermark" placeholder="如：内部资料" clearable />

        <div class="fs-admin__section-title">管理员令牌</div>
        <el-input
          v-model="adminToken"
          type="password"
          show-password
          placeholder="后端启动日志 getToken() 或 /config 页获取"
        />
        <p class="fs-admin__tip">保存后立即对后续请求生效，无需重启服务</p>
      </div>
      <template #footer>
        <el-button @click="adminVisible = false">取消</el-button>
        <el-button type="primary" :loading="adminSaving" @click="saveAdminConfig">保存并生效</el-button>
      </template>
    </el-dialog>

    <!-- ===== 上传对话框 ===== -->
    <el-dialog v-model="uploadVisible" title="上传文件" width="440px" :append-to-body="true" destroy-on-close>
      <el-alert v-if="currentPath" :title="`上传至 ${bucket}/${currentPath}/`" type="info" :closable="false" class="mb-3" />
      <el-button type="primary" :icon="Upload" :loading="uploading" @click="pickFiles">选择文件（可多选）</el-button>
      <input ref="uploadInput" type="file" multiple hidden @change="handleFileChange" />
    </el-dialog>

    <!-- ===== 创建链接对话框 ===== -->
    <el-dialog v-model="oneTimeVisible" :title="`创建访问链接 — ${oneTimeTarget?.name ?? ''}`" width="440px" :append-to-body="true" destroy-on-close>
      <el-form label-width="80px">
        <el-form-item label="类型">
          <el-radio-group v-model="oneTimeType">
            <el-radio value="once">一次性（访问即销毁）</el-radio>
            <el-radio value="expiry">限时（有效期内可多次访问）</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="oneTimeType === 'expiry'" label="过期时间">
          <div style="display:flex;gap:8px;align-items:center;width:100%">
            <el-input-number v-model="oneTimeExpiry" :min="10" :step="10" :controls="false" style="width:120px" />
            <span class="fs-expiry-unit">秒</span>
            <el-select v-model="oneTimeExpiry" placeholder="快捷选择" style="flex:1">
              <el-option v-for="opt in oneTimeExpiryOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </div>
        </el-form-item>
        <el-form-item label="链接">
          <el-input v-model="oneTimeLink" placeholder="点击下方按钮生成" readonly :disabled="!oneTimeLink" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button v-if="oneTimeLink" :icon="Document" @click="copyOneTimeLink">复制链接</el-button>
        <el-button v-else type="primary" :loading="oneTimeGenerating" :icon="Document" @click="generateOneTimeLink">生成</el-button>
        <el-button @click="oneTimeVisible = false">关闭</el-button>
      </template>
      <el-alert v-if="oneTimeLink" :type="oneTimeType === 'once' ? 'warning' : 'success'" :closable="false" :title="oneTimeType === 'once' ? '该链接只能访问一次，访问后立即销毁' : '该链接在有效期内可多次访问，到期自动失效'" class="mt-3" />
    </el-dialog>

    <!-- ===== 预览对话框 ===== -->
    <el-dialog v-model="previewVisible" :title="previewName" width="720px" :append-to-body="true" destroy-on-close @closed="retryPreview">
      <div v-if="previewMeta.size != null && !previewLoading && !previewError" class="fs-preview__meta">
        <span><el-tag  type="info">{{ previewKind }}</el-tag></span>
        <span>{{ formatSize(previewMeta.size) }}</span>
        <span v-if="previewMeta.lastModified">{{ formatTime(previewMeta.lastModified) }}</span>
      </div>
      <div class="fs-preview">
        <div v-if="previewLoading" class="fs-preview__skeleton">
          <div class="sk sk--w40 sk--h24" /><div class="sk sk--full sk--h200" /><div class="sk sk--w60 sk--h120" />
          <span class="fs-preview__loading-text">加载中…</span>
        </div>
        <div v-else-if="previewError" class="fs-preview__error">
          <el-empty description="预览加载失败">
            <el-button type="primary" :icon="Refresh" @click="retryPreview">重试</el-button>
            <el-button :icon="Download" @click="handleDownload({ name: previewName } as StorageObject)">下载文件</el-button>
          </el-empty>
        </div>
        <PreviewOfficePanel
          v-if="!previewError && previewUsesClient && !previewForceServer"
          ref="officePanelRef"
          v-model:zoom="previewZoom"
          v-model:loading="officeLoading"
          :src="previewFrameSrc"
          :file-name="previewName"
          @fullscreen="toggleFullscreen()"
          @rendered="onOfficeRendered"
          @error="onOfficeError"
        />
        <PreviewIframePanel
          v-else-if="!previewError"
          ref="iframePanelRef"
          v-model:zoom="previewZoom"
          :src="previewFrameSrc"
          :loading="iframeLoading"
          :frame-key="iframeKey"
          @fullscreen="toggleFullscreen()"
          @load="onFrameLoad"
          @error="onFrameError"
        />
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
/* ========================================================
   FileStorage · 云盘风格（koi / Element Plus 变量体系）
   页面底 --el-bg-color-page；白色圆角面板；主色渐变按钮
   ======================================================== */
.fs-app {
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: 100%;
  min-height: 0;
  padding: 12px;
  background: var(--el-bg-color-page, var(--el-fill-color-light));
  color: var(--el-text-color-primary);
  overflow: hidden;
}

/* ===== 顶栏：搜索 + 上传 ===== */
.fs-top {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.fs-searchbox {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.fs-searchbox__icon {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-bg-color, #fff);
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: color var(--el-transition-duration, 0.2s), border-color var(--el-transition-duration, 0.2s);
}

.fs-searchbox__icon:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-5);
}

.fs-searchbox__input {
  flex: 1;
  min-width: 0;
  height: 44px;
  padding: 0 20px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-bg-color, #fff);
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-family: inherit;
  outline: none;
  transition: border-color var(--el-transition-duration, 0.2s), box-shadow var(--el-transition-duration, 0.2s);
}

.fs-searchbox__input::placeholder {
  color: var(--el-text-color-placeholder);
}

.fs-searchbox__input:focus {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.fs-searchbox__clear {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  margin-left: -40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
  cursor: pointer;
}

.fs-searchbox__clear:hover {
  color: var(--el-color-primary);
}

.fs-top__right {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.fs-ghost-btn {
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-bg-color, #fff);
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: color var(--el-transition-duration, 0.2s), border-color var(--el-transition-duration, 0.2s);
}

.fs-ghost-btn:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-5);
}

.fs-upload-btn {
  height: 44px;
  padding: 0 26px;
  border: none;
  border-radius: var(--el-radius-full, 9999px);
  /* 白字走令牌：EP 的 --el-color-white 会跟随主题/暗色，不会出现暗色下的白字白底 */
  color: var(--el-color-white);
  font-size: 15px;
  font-weight: 600;
  font-family: inherit;
  letter-spacing: 0.02em;
  cursor: pointer;
  background: linear-gradient(135deg,
    var(--el-color-primary),
    color-mix(in srgb, var(--el-color-primary) 55%, var(--el-color-info)));
  box-shadow: 0 6px 16px color-mix(in srgb, var(--el-color-primary) 30%, transparent);
  transition: transform var(--el-transition-duration, 0.2s), box-shadow var(--el-transition-duration, 0.2s);
}

.fs-upload-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px color-mix(in srgb, var(--el-color-primary) 38%, transparent);
}

.fs-upload-btn:active {
  transform: translateY(0);
}

/* ===== 统计卡 ===== */
/* 存储用量：位于路径栏右侧的紧凑外壳（折叠态只有一枚小胶囊） */
.fs-stats {
  position: relative;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
}

.fs-stat {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  background: var(--el-bg-color, #fff);
  min-width: 0;
  text-align: left;
  font-family: inherit;
}

button.fs-stat {
  cursor: pointer;
  transition: border-color var(--el-transition-duration, 0.2s), box-shadow var(--el-transition-duration, 0.2s);
}

button.fs-stat:hover {
  border-color: var(--el-color-primary-light-5);
  box-shadow: 0 4px 14px rgb(0 0 0 / 5%);
}

/* 路径栏右侧的紧凑用量胶囊：折叠态只显示占用大小，点箭头展开明细 */
.fs-stat--usage {
  gap: 6px;
  height: 26px;
  padding: 0 10px;
  border-radius: var(--el-radius-full, 9999px);
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.fs-stat--usage:hover {
  border-color: var(--el-color-primary-light-5);
  color: var(--el-color-primary);
  /* 小胶囊不适合大面积投影，压掉基类的 hover 阴影 */
  box-shadow: none;
}

.fs-stat--usage .fs-stat__size {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
}

.fs-stat__avatar {
  flex-shrink: 0;
  width: 46px;
  height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--el-radius-full, 9999px);
  color: var(--el-color-white);
}

.fs-stat__avatar--primary {
  background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
  box-shadow: 0 6px 14px color-mix(in srgb, var(--el-color-primary) 28%, transparent);
}

.fs-stat__avatar--blue {
  background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
  box-shadow: 0 6px 14px color-mix(in srgb, var(--el-color-primary) 28%, transparent);
}

.fs-stat__avatar--green {
  background: linear-gradient(135deg, var(--el-color-success), var(--el-color-success-light-3));
  box-shadow: 0 6px 14px color-mix(in srgb, var(--el-color-success) 28%, transparent);
}

.fs-stat__body {
  flex: 1;
  min-width: 0;
}

.fs-stat__label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.fs-stat__value {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  font-variant-numeric: tabular-nums;
}

.fs-stat__value b {
  font-size: 17px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.fs-stat__sep {
  color: var(--el-text-color-placeholder);
}

.fs-stat__bar {
  margin-top: 8px;
  height: 6px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-fill-color);
  overflow: hidden;
}

.fs-stat__bar i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg,
    var(--el-color-primary),
    color-mix(in srgb, var(--el-color-primary) 55%, var(--el-color-info)));
  transition: width var(--el-transition-duration, 0.2s);
}

.fs-stat__side {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 4px 6px 14px;
  border: none;
  border-left: 1px solid var(--el-border-color-extra-light, var(--el-border-color-lighter));
  background: transparent;
  font-family: inherit;
  cursor: pointer;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.fs-stat__side b {
  font-size: 20px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
}

.fs-stat__chev {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  transition: transform var(--el-transition-duration, 0.2s);
}

.fs-stat__chev.is-open {
  transform: rotate(180deg);
}

.fs-stat__detail {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 40;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 220px;
  padding: 12px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-bg-color-overlay, #fff);
  box-shadow: 0 10px 30px rgb(0 0 0 / 10%);
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.fs-stat__detail b {
  color: var(--el-text-color-primary);
  word-break: break-all;
}

.fs-stat__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.fs-stat__num {
  margin-left: auto;
  font-size: 24px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
}

.fs-stat__badge {
  margin-left: auto;
  min-width: 30px;
  height: 30px;
  padding: 0 9px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-color-warning);
  color: var(--el-color-white);
  font-size: 14px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

/* ===== 主体：左导航 + 内容 ===== */
.fs-body {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 14px;
}

.fs-nav {
  flex-shrink: 0;
  width: 208px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  background: var(--el-bg-color, #fff);
  overflow-y: auto;
}

.fs-nav__item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  height: 42px;
  padding: 0 12px;
  border: none;
  border-radius: var(--el-radius-lg, 12px);
  background: transparent;
  color: var(--el-text-color-regular);
  font-size: 14px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: background var(--el-transition-duration, 0.2s), color var(--el-transition-duration, 0.2s);
}

.fs-nav__item:hover {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}

.fs-nav__item.is-active {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: 600;
}

.fs-nav__label {
  flex: 1;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fs-nav__chev {
  color: var(--el-text-color-placeholder);
}

.fs-nav__item.is-active .fs-nav__chev {
  color: var(--el-color-primary);
}

.fs-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 14px 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  background: var(--el-bg-color, #fff);
  overflow: hidden;
}

/* 内容头 */
.fs-main__head {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;
}

.fs-crumbs {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  overflow: hidden;
  white-space: nowrap;
  font-size: 17px;
  font-weight: 600;
}

.fs-crumbs__sep {
  color: var(--el-text-color-placeholder);
  font-weight: 400;
}

.fs-crumbs__item {
  color: var(--el-text-color-secondary);
  font-weight: 500;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: var(--el-radius-sm, 6px);
  transition: color var(--el-transition-duration, 0.2s);
}

.fs-crumbs__item:hover {
  color: var(--el-color-primary);
}

.fs-crumbs__item.is-current {
  color: var(--el-text-color-primary);
  font-weight: 700;
  cursor: default;
}

.fs-main__actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.fs-main__sel {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-color-primary);
  white-space: nowrap;
}

/* 胶囊按钮 */
.fs-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 14px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-bg-color, #fff);
  color: var(--el-text-color-regular);
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  transition: color var(--el-transition-duration, 0.2s), border-color var(--el-transition-duration, 0.2s), background var(--el-transition-duration, 0.2s);
}

.fs-pill-btn:hover:not(:disabled) {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
}

.fs-pill-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.fs-pill-btn--icon {
  width: 34px;
  padding: 0;
  justify-content: center;
}

.fs-pill-btn--danger {
  color: var(--el-color-danger);
  border-color: color-mix(in srgb, var(--el-color-danger) 35%, transparent);
}

.fs-pill-btn--danger:hover:not(:disabled) {
  color: var(--el-color-danger);
  border-color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
}

.fs-pill-btn__chev {
  margin-left: 2px;
  color: var(--el-text-color-placeholder);
}

.fs-mini-btn {
  height: 26px;
  padding: 0 12px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-bg-color, #fff);
  color: var(--el-text-color-regular);
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  transition: color var(--el-transition-duration, 0.2s), border-color var(--el-transition-duration, 0.2s);
}

.fs-mini-btn:hover:not(:disabled) {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-5);
}

.fs-mini-btn--danger {
  color: var(--el-color-danger);
  border-color: color-mix(in srgb, var(--el-color-danger) 35%, transparent);
}

.fs-mini-btn--danger:hover:not(:disabled) {
  border-color: var(--el-color-danger);
}

/* ===== 文件列表区域 ===== */
.fs-files {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 2px 2px 16px;
}

/* 空状态 */
.fs-files__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 56px 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.fs-files__empty small {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

/* 详细信息 */
.fs-details-head,
.fs-details-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 110px 90px 160px;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  font-size: 13px;
}

.fs-details-head {
  position: sticky;
  top: 0;
  z-index: 5;
  padding-top: 8px;
  padding-bottom: 8px;
  background: var(--el-bg-color, #fff);
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
}

.fs-details-head__col {
  cursor: pointer;
  user-select: none;
  border-radius: var(--el-radius-sm, 6px);
}

.fs-details-head__size {
  text-align: right;
}

.fs-sort-arrow {
  color: var(--el-color-primary);
  font-weight: 700;
}

.fs-details-row {
  height: 40px;
  border-radius: var(--el-radius-md, 8px);
  cursor: pointer;
  border: 1px solid transparent;
  transition: background var(--el-transition-duration, 0.2s);
}

.fs-details-row:hover {
  background: var(--el-fill-color-light);
}

.fs-details-row--selected {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-7);
}

.fs-details-row__name {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  overflow: hidden;
}

.fs-details-row__name span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fs-details-row__icon {
  width: 20px;
  height: 20px;
  font-size: 20px;
  flex-shrink: 0;
}

.fs-name--dir {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.fs-details-row__type,
.fs-details-row__size,
.fs-details-row__time {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.fs-details-row__size {
  text-align: right;
}

/* 管理员配置控制详情列显隐（showFormat/showSize/showTime），网格随可见列收缩 */
.fs-files--details.fs-details--no-format .fs-details-head, .fs-files--details.fs-details--no-format .fs-details-row { grid-template-columns: minmax(0, 1fr) 90px 160px; }
.fs-files--details.fs-details--no-size .fs-details-head, .fs-files--details.fs-details--no-size .fs-details-row { grid-template-columns: minmax(0, 1fr) 110px 160px; }
.fs-files--details.fs-details--no-time .fs-details-head, .fs-files--details.fs-details--no-time .fs-details-row { grid-template-columns: minmax(0, 1fr) 110px 160px; }
.fs-files--details.fs-details--no-size.fs-details--no-time .fs-details-head, .fs-files--details.fs-details--no-size.fs-details--no-time .fs-details-row { grid-template-columns: minmax(0, 1fr) 110px; }
.fs-files--details.fs-details--no-format.fs-details--no-size .fs-details-head, .fs-files--details.fs-details--no-format.fs-details--no-size .fs-details-row { grid-template-columns: minmax(0, 1fr) 160px; }
.fs-files--details.fs-details--no-format.fs-details--no-time .fs-details-head, .fs-files--details.fs-details--no-format.fs-details--no-time .fs-details-row { grid-template-columns: minmax(0, 1fr) 90px; }
.fs-files--details.fs-details--no-format.fs-details--no-size.fs-details--no-time .fs-details-head, .fs-files--details.fs-details--no-format.fs-details--no-size.fs-details--no-time .fs-details-row { grid-template-columns: minmax(0, 1fr); }

/* 大图标（云盘卡片） */
.fs-files--large {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(158px, 1fr));
  gap: 14px;
  align-content: start;
}

.fs-lg-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 20px 12px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-bg-color, #fff);
  cursor: pointer;
  user-select: none;
  transition: border-color var(--el-transition-duration, 0.2s), box-shadow var(--el-transition-duration, 0.2s), transform var(--el-transition-duration, 0.2s);
}

.fs-lg-card:hover {
  border-color: var(--el-color-primary-light-5);
  box-shadow: 0 6px 18px rgb(0 0 0 / 6%);
  transform: translateY(-2px);
}

.fs-lg-card--selected {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 1px var(--el-color-primary), 0 8px 20px color-mix(in srgb, var(--el-color-primary) 18%, transparent);
}

.fs-lg-card__thumb {
  width: 86px;
  height: 86px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.fs-lg-card__thumb svg {
  width: 76px;
  height: 76px;
}

.fs-lg-card__thumb .fs-card-icon {
  font-size: 76px;
}

/* 目录图标：默认灰阶，悬停/选中恢复黄色（对齐设计稿） */
.fs-lg-card__thumb.icon-folder .fs-card-icon {
  filter: grayscale(1);
  opacity: 0.55;
  transition: filter var(--el-transition-duration, 0.2s), opacity var(--el-transition-duration, 0.2s);
}

.fs-lg-card:hover .fs-lg-card__thumb.icon-folder .fs-card-icon,
.fs-lg-card--selected .fs-lg-card__thumb.icon-folder .fs-card-icon {
  filter: none;
  opacity: 1;
}

.fs-lg-card__frame {
  width: 100%;
  height: 100%;
  border: none;
  border-radius: var(--el-radius-md, 8px);
  object-fit: cover;
  pointer-events: none;
  filter: var(--fs-image-filter, none);
}

.fs-lg-card__label {
  width: 100%;
  margin-top: 10px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fs-lg-card__meta {
  width: 100%;
  text-align: center;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fs-lg-card__ops {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

/* 选中态右上角 X 徽标 */
.fs-lg-card__x,
.fs-md-card__x {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-color-primary);
  color: var(--el-color-white);
  box-shadow: 0 2px 8px color-mix(in srgb, var(--el-color-primary) 40%, transparent);
}

/* 中图标 */
.fs-files--medium {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
  gap: 8px;
  align-content: start;
}

.fs-md-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 6px 10px;
  border: 1px solid transparent;
  border-radius: var(--el-radius-lg, 12px);
  cursor: pointer;
  user-select: none;
  transition: background var(--el-transition-duration, 0.2s), border-color var(--el-transition-duration, 0.2s);
}

.fs-md-card:hover {
  background: var(--el-fill-color-light);
}

.fs-md-card--selected {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-7);
}

.fs-md-card__thumb {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fs-md-card__thumb svg {
  width: 38px;
  height: 38px;
}

.fs-md-card__thumb .fs-card-icon {
  font-size: 38px;
}

.fs-md-card__label {
  width: 100%;
  text-align: center;
  font-size: 12px;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 小图标 */
.fs-files__small-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 2px;
}

.fs-sm-row {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid transparent;
  border-radius: var(--el-radius-sm, 6px);
  cursor: pointer;
  font-size: 12.5px;
  overflow: hidden;
  transition: background var(--el-transition-duration, 0.2s);
}

.fs-sm-row:hover {
  background: var(--el-fill-color-light);
}

.fs-sm-row--selected {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-7);
}

.fs-sm-row__icon {
  width: 16px;
  height: 16px;
  font-size: 16px;
  flex-shrink: 0;
}

.fs-sm-row__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ===== 最近访问 / 收藏夹 ===== */
.fs-files--paths {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 12px;
  align-content: start;
}

.fs-path-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 18px 12px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  cursor: pointer;
  transition: border-color var(--el-transition-duration, 0.2s), box-shadow var(--el-transition-duration, 0.2s);
}

.fs-path-card:hover {
  border-color: var(--el-color-primary-light-5);
  box-shadow: 0 6px 18px rgb(0 0 0 / 6%);
}

.fs-path-card__icon {
  width: 64px;
  height: 64px;
  display: inline-flex;
}

.fs-path-card__icon svg {
  width: 100%;
  height: 100%;
}

.fs-path-card__name {
  margin-top: 8px;
  max-width: 100%;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fs-path-card__path {
  max-width: 100%;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fs-path-card__del {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
  cursor: pointer;
  opacity: 0;
  transition: opacity var(--el-transition-duration, 0.2s), color var(--el-transition-duration, 0.2s);
}

.fs-path-card:hover .fs-path-card__del {
  opacity: 1;
}

.fs-path-card__del:hover {
  color: var(--el-color-danger);
}

/* ===== 共享文件 ===== */
.fs-files--shared {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.fs-link-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-bg-color, #fff);
}

.fs-link-row__icon {
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  display: inline-flex;
}

.fs-link-row__icon svg {
  width: 100%;
  height: 100%;
}

.fs-link-row__body {
  flex: 1;
  min-width: 0;
}

.fs-link-row__name {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fs-link-row__url {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fs-link-row__type {
  flex-shrink: 0;
  padding: 2px 10px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-size: 11px;
  font-weight: 600;
}

/* ===== 回收站 ===== */
.fs-recycle-head {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* ===== 拖拽放置目标高亮（四种视图通用） ===== */
.fs-row--drop {
  outline: 2px dashed var(--el-color-primary);
  outline-offset: -2px;
  background: var(--el-color-primary-light-9) !important;
}

/* ===== 右键菜单 ===== */
.fs-ctx {
  position: fixed;
  z-index: 100000;
  min-width: 168px;
  padding: 6px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-bg-color-overlay, #fff);
  box-shadow: 0 12px 32px rgb(0 0 0 / 12%);
  font-size: 13px;
}

.fs-ctx__item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 10px;
  border: none;
  border-radius: var(--el-radius-md, 8px);
  background: transparent;
  cursor: pointer;
  text-align: left;
  color: var(--el-text-color-regular);
  font-size: 13px;
  font-family: inherit;
  transition: background var(--el-transition-duration, 0.2s), color var(--el-transition-duration, 0.2s);
}

.fs-ctx__item:hover {
  background: var(--el-fill-color-light);
  color: var(--el-color-primary);
}

.fs-ctx__item svg,
.fs-ctx__item .el-icon {
  flex-shrink: 0;
  color: var(--el-text-color-secondary);
}

.fs-ctx__item--danger {
  color: var(--el-color-danger);
}

.fs-ctx__item--danger:hover {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}

.fs-ctx__sep {
  height: 1px;
  margin: 5px 8px;
  background: var(--el-border-color-extra-light, var(--el-border-color-lighter));
}

/* ===== 预览 ===== */
.fs-preview {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.fs-preview__meta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 6px 0;
  margin-bottom: 8px;
  width: 100%;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.fs-preview__media {
  max-width: 100%;
  border-radius: var(--el-radius-md, 8px);
}

.fs-preview__img-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
}

.fs-preview__img {
  max-width: 100%;
  max-height: 64vh;
  border-radius: var(--el-radius-md, 8px);
  box-shadow: 0 1px 6px rgb(0 0 0 / 15%);
  filter: var(--fs-image-filter, none);
}

.fs-preview__code {
  width: 100%;
  max-height: 60vh;
  margin: 0;
  padding: 12px;
  overflow: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  font-family: ui-monospace, Menlo, Consolas, monospace;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}

.fs-preview__error {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fs-preview__skeleton {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 16px 0;
}

.fs-preview__loading-text {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.sk {
  border-radius: var(--el-radius-sm, 6px);
  background: linear-gradient(90deg, var(--el-fill-color-light) 25%, var(--el-fill-color) 50%, var(--el-fill-color-light) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

.sk--w40 { width: 40%; height: 22px; }
.sk--w60 { width: 60%; height: 110px; }
.sk--full { width: 100%; height: 180px; }

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ===== Element Plus 弹窗对齐 koi 圆角 ===== */
.fs-app :deep(.el-dialog) {
  border-radius: var(--el-radius-xl, 16px);
  overflow: hidden;
}

.fs-app :deep(.el-dialog__header) {
  padding: 14px 18px;
  margin-right: 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.fs-app :deep(.el-dialog__title) {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.fs-app :deep(.el-dialog__body) {
  padding: 16px 18px;
}

.fs-app :deep(.el-dialog__footer) {
  padding: 10px 18px 14px;
  border-top: 1px solid var(--el-border-color-extra-light, var(--el-border-color-lighter));
}

/* ===== 管理员系统配置弹窗 ===== */
.fs-admin__head {
  min-width: 0;
}

.fs-admin__title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.25;
  color: var(--el-text-color-primary);
}

.fs-admin__subtitle {
  margin: 5px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.fs-admin {
  display: flex;
  flex-direction: column;
}

.fs-admin__card {
  padding: 18px 20px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  background: var(--el-bg-color, #fff);
}

.fs-admin__group {
  margin-bottom: 6px;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.fs-admin__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 32px;
}

.fs-admin__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 46px;
  min-width: 0;
}

.fs-admin__label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--el-text-color-primary);
  white-space: nowrap;
}

.fs-admin__arrow {
  font-style: normal;
  color: var(--el-text-color-placeholder);
}

.fs-admin__divider {
  height: 1px;
  margin: 14px 0 16px;
  background: var(--el-border-color-lighter);
}

.fs-admin__section-title {
  margin: 18px 0 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.fs-admin__tip {
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.fs-admin__select {
  width: 148px;
  flex-shrink: 0;
}

.fs-admin__pills {
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .fs-admin__grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

/* 响应式 */
@media (max-width: 992px) {
  /* 窄屏：用量胶囊只留数字，避免与面包屑争宽 */
  .fs-stat--usage .fs-stat__label {
    display: none;
  }
  .fs-nav {
    width: 168px;
  }
}

@media (max-width: 768px) {
  .fs-app {
    padding: 8px;
  }
  .fs-top {
    flex-wrap: wrap;
  }
  .fs-upload-btn {
    padding: 0 16px;
  }
  .fs-body {
    flex-direction: column;
  }
  .fs-nav {
    width: 100%;
    flex-direction: row;
    overflow-x: auto;
  }
  .fs-nav__item {
    width: auto;
    flex-shrink: 0;
  }
  .fs-nav__chev {
    display: none;
  }
  .fs-files--large {
    grid-template-columns: repeat(auto-fill, minmax(118px, 1fr));
  }
  .fs-files--medium {
    grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
  }
  .fs-details-head,
  .fs-details-row {
    grid-template-columns: minmax(0, 1fr) 70px 56px;
  }
  .fs-details-head__type,
  .fs-details-row__type {
    display: none;
  }
}

/* ========================================================
   目录树导航 / 路径栏 / 工具栏 / 状态栏（对齐资源管理器布局）
   ======================================================== */
.fs-app {
  gap: 0;
}

.fs-nav {
  width: 232px;
  gap: 0;
  padding: 8px;
  overflow: hidden;
}

.fs-nav__section {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.fs-nav__section--quick {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.fs-nav__title {
  padding: 6px 10px 4px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-placeholder);
}

.fs-nav__empty {
  padding: 6px 10px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.fs-nav__item {
  height: 36px;
  padding: 0 10px;
  border-radius: var(--el-radius-md, 8px);
  font-size: 13px;
}

.fs-nav__item--quick .fs-nav__del {
  margin-left: auto;
  color: var(--el-text-color-placeholder);
  opacity: 0;
}

.fs-nav__item--quick:hover .fs-nav__del {
  opacity: 1;
}

.fs-nav__item--quick .fs-nav__del:hover {
  color: var(--el-color-danger);
}

.fs-nav__foot {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--el-border-color-extra-light, var(--el-border-color-lighter));
}

.fs-nav__foot-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 10px;
  border: none;
  border-radius: var(--el-radius-md, 8px);
  background: transparent;
  color: var(--el-text-color-regular);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: background var(--el-transition-duration, 0.2s), color var(--el-transition-duration, 0.2s);
}

.fs-nav__foot-btn:hover {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}

.fs-nav__foot-btn.is-active {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: 600;
}

.fs-nav__foot-btn--icon {
  margin-left: auto;
  width: 36px;
  padding: 0;
  justify-content: center;
}

.fs-nav__badge {
  min-width: 18px;
  height: 18px;
  padding: 0 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-color-warning);
  color: var(--el-color-white);
  font-size: 11px;
  font-weight: 700;
}

/* 目录树（复用 FsTreeNode 渲染组件，样式走 :deep 穿透） */
.fs-tree {
  display: flex;
  flex-direction: column;
  gap: 1px;
  overflow-y: auto;
  max-height: 40%;
}

.fs-tree :deep(.fs-tree-node__row) {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding-right: 8px;
  border-radius: var(--el-radius-md, 8px);
  cursor: pointer;
  font-size: 13px;
  color: var(--el-text-color-regular);
  white-space: nowrap;
  overflow: hidden;
  transition: background var(--el-transition-duration, 0.2s);
}

.fs-tree :deep(.fs-tree-node__row:hover) {
  background: var(--el-fill-color-light);
}

.fs-tree :deep(.fs-tree-node__row--active) {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: 600;
}

.fs-tree :deep(.fs-tree-node__row--drop) {
  outline: 1px dashed var(--el-color-primary);
  outline-offset: -1px;
}

.fs-tree :deep(.fs-tree-node__arrow) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--el-text-color-placeholder);
  transition: transform var(--el-transition-duration, 0.2s);
}

.fs-tree :deep(.fs-tree-node__arrow--open) {
  transform: rotate(90deg);
}

.fs-tree :deep(.fs-tree-node__label) {
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 路径栏 */
.fs-pathbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--el-border-color-extra-light, var(--el-border-color-lighter));
}

.fs-icon-btn {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--el-radius-md, 8px);
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: background var(--el-transition-duration, 0.2s), color var(--el-transition-duration, 0.2s);
}

.fs-icon-btn:hover:not(:disabled) {
  background: var(--el-fill-color-light);
  color: var(--el-color-primary);
}

.fs-icon-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.fs-icon-btn .is-spin {
  animation: fs-spin 1s linear infinite;
}

@keyframes fs-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.fs-crumbs {
  font-size: 14px;
  font-weight: 500;
}

.fs-crumbs__sep {
  margin: 0 2px;
}

.fs-crumbs__item {
  font-weight: 500;
}

.fs-crumbs__item.is-current {
  font-weight: 700;
}

.fs-main__sel {
  margin-left: auto;
  padding: 2px 10px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-color-primary-light-9);
}

.fs-main__lock {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  padding: 2px 10px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning);
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.fs-main__lock + .fs-main__sel {
  margin-left: 0;
}

/* 操作工具栏 */
.fs-toolbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 8px 0;
  border-bottom: 1px solid var(--el-border-color-extra-light, var(--el-border-color-lighter));
  overflow-x: auto;
}

.fs-tb-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 10px;
  border: none;
  border-radius: var(--el-radius-md, 8px);
  background: transparent;
  color: var(--el-text-color-regular);
  font-size: 13px;
  font-family: inherit;
  white-space: nowrap;
  cursor: pointer;
  transition: background var(--el-transition-duration, 0.2s), color var(--el-transition-duration, 0.2s);
}

.fs-tb-btn:hover:not(:disabled) {
  background: var(--el-fill-color-light);
  color: var(--el-color-primary);
}

.fs-tb-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.fs-tb-btn--danger {
  color: var(--el-color-danger);
}

.fs-tb-btn--danger:hover:not(:disabled) {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}

.fs-toolbar__hint {
  margin-left: 10px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fs-toolbar__sep {
  width: 1px;
  height: 18px;
  margin: 0 6px;
  background: var(--el-border-color-lighter);
}

/* ===== 分栏视图（macOS Finder 风格） ===== */
.fs-files--columns {
  display: flex;
  align-items: stretch;
  gap: 0;
  padding: 8px 0 0;
  overflow-x: auto;
  overflow-y: hidden;
}

.fs-col {
  flex: 0 0 232px;
  min-width: 232px;
  max-width: 232px;
  border-right: 1px solid var(--el-border-color-extra-light, var(--el-border-color-lighter));
  overflow: hidden;
}

.fs-col:last-child {
  flex: 1 1 auto;
  border-right: none;
}

.fs-col__body {
  height: 100%;
  overflow-y: auto;
  padding: 2px 6px;
}

.fs-col__hint {
  padding: 12px 10px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.fs-col__row {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 34px;
  padding: 0 8px;
  border-radius: var(--el-radius-sm, 6px);
  cursor: pointer;
  font-size: 13px;
  color: var(--el-text-color-regular);
  white-space: nowrap;
  overflow: hidden;
  outline: none;
  transition: background var(--el-transition-duration, 0.2s), color var(--el-transition-duration, 0.2s);
}

/* 面包屑/文件行是可点的非按钮元素：全局 reset 掉默认焦点环后必须自己补，
   否则键盘用户 Tab 过来完全看不到焦点落在哪个文件上 */
.fs-col__row:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.fs-col__row:hover {
  background: var(--el-fill-color-light);
}

.fs-col__row.is-trail {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: 600;
}

.fs-col__row.is-selected {
  background: var(--el-color-primary);
  color: var(--el-color-white);
}

.fs-col__row.is-selected .fs-col__name {
  color: var(--el-color-white);
}

.fs-col__row.is-dragover {
  outline: 1px dashed var(--el-color-primary);
  outline-offset: -1px;
}

.fs-col__icon {
  width: 18px;
  height: 18px;
  font-size: 18px;
  flex-shrink: 0;
}

.fs-col__name {
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 状态栏 */
.fs-statusbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 8px;
  border-top: 1px solid var(--el-border-color-extra-light, var(--el-border-color-lighter));
}

.fs-statusbar__info {
  flex: 1;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.fs-statusbar__views {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.fs-view-btn {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--el-radius-sm, 6px);
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: background var(--el-transition-duration, 0.2s), color var(--el-transition-duration, 0.2s);
}

.fs-view-btn:hover {
  background: var(--el-fill-color-light);
  color: var(--el-color-primary);
}

.fs-view-btn.is-active {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

/* 空状态：在内容区居中 */
.fs-files {
  position: relative;
}

.fs-files__empty {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0;
  pointer-events: none;
}

.fs-files__empty > * {
  pointer-events: auto;
}

/* 卡片：更紧凑的网格（对齐设计稿） */
.fs-files--large {
  grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
  gap: 8px;
  padding-top: 12px;
}

.fs-lg-card {
  gap: 0;
  padding: 14px 8px 10px;
  border-color: transparent;
  border-radius: var(--el-radius-md, 8px);
  box-shadow: none;
}

.fs-lg-card:hover {
  border-color: transparent;
  background: var(--el-fill-color-light);
  box-shadow: none;
  transform: none;
}

.fs-lg-card--selected {
  border-color: var(--el-color-primary-light-7);
  background: var(--el-color-primary-light-9);
  box-shadow: none;
}

.fs-lg-card__thumb {
  width: 62px;
  height: 62px;
}

.fs-lg-card__thumb svg {
  width: 56px;
  height: 56px;
}

.fs-lg-card__thumb .fs-card-icon {
  font-size: 56px;
}

.fs-lg-card__label {
  margin-top: 8px;
  font-size: 12px;
  font-weight: 400;
  text-align: center;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.fs-lg-card__frame {
  border-radius: var(--el-radius-sm, 6px);
}
</style>

<style>
/* ── 全局：统一圆角令牌（对齐 vue 体系 koi 主题 radius.scss；standalone 未加载主题包） ── */
:root {
  --el-radius-xs: 4px;
  --el-radius-sm: 6px;
  --el-radius-md: 8px;
  --el-radius-lg: 12px;
  --el-radius-xl: 16px;
  --el-radius-full: 9999px;
  --el-border-radius-small: var(--el-radius-xs);
  --el-border-radius-base: var(--el-radius-sm);
  --el-border-radius-round: var(--el-radius-full);
  --el-border-radius-circle: 50%;
}

/* Element 在 .el-dialog 元素上本地定义 --el-dialog-border-radius（屏蔽 :root 令牌），
 * 与框架一致用双类加权写组件类上；message-box 单独给 lg 圆角（KodExplorer 弹窗观感） */
.el-dialog.el-dialog {
  --el-dialog-border-radius: var(--el-radius-xl, 16px);
}
.el-message-box {
  border-radius: var(--el-radius-lg, 12px);
}

/* ── 全局：Windows 风格类型图标 ──
 * v-html 注入的 svg 不携带 scoped 属性 id，尺寸规则必须放在非 scoped 块；
 * 外层 font-size 控制图标大小（svg 按 1em 缩放），由视图自身的 __icon 类决定 */
.fs-typeicon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
  flex-shrink: 0;
}
.fs-typeicon svg {
  width: 1em;
  height: 1em;
  display: block;
}

/* ── 系统配置弹窗外壳（append-to-body 需非 scoped）：标题/分栏单选/按钮对齐 koi ── */
.fs-admin-dialog.el-dialog {
  border-radius: var(--el-radius-xl, 16px);
}

.fs-admin-dialog .el-dialog__header {
  padding: 22px 26px 4px;
  margin-right: 0;
}

.fs-admin-dialog .el-dialog__headerbtn {
  top: 20px;
  right: 20px;
  width: 34px;
  height: 34px;
}

.fs-admin-dialog .el-dialog__headerbtn .el-dialog__close {
  font-size: 20px;
  color: var(--el-text-color-secondary);
}

.fs-admin-dialog .el-dialog__body {
  padding: 8px 26px 0;
}

.fs-admin-dialog .el-dialog__footer {
  padding: 10px 26px 22px;
}

.fs-admin-dialog .el-dialog__footer .el-button {
  height: 40px;
  padding: 0 24px;
  border-radius: var(--el-radius-full, 9999px);
}

.fs-admin-dialog .el-dialog__footer .el-button--primary {
  border: none;
  background: linear-gradient(135deg,
    var(--el-color-primary),
    color-mix(in srgb, var(--el-color-primary) 55%, var(--el-color-info)));
  box-shadow: 0 6px 16px color-mix(in srgb, var(--el-color-primary) 30%, transparent);
}

.fs-admin-dialog .el-dialog__footer .el-button--primary:hover {
  background: linear-gradient(135deg, var(--el-color-primary-light-3), var(--el-color-primary));
}

.fs-admin-dialog .el-radio-button__inner {
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-radius-md, 8px) !important;
  box-shadow: none !important;
  padding: 7px 16px;
  background: var(--el-bg-color, #fff);
  color: var(--el-text-color-regular);
  font-size: 13px;
}

.fs-admin-dialog .el-radio-button:first-child .el-radio-button__inner {
  margin-right: 8px;
}

.fs-admin-dialog .el-radio-button.is-active .el-radio-button__inner,
.fs-admin-dialog .el-radio-button__original-radio:checked + .el-radio-button__inner {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-5);
  color: var(--el-color-primary);
  font-weight: 600;
}

.fs-admin-dialog .el-input__wrapper,
.fs-admin-dialog .el-select__wrapper {
  border-radius: var(--el-radius-md, 8px);
}

/* 下载时效单位（原来是写死的内联色，暗色模式下不跟随主题） */
.fs-expiry-unit {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* 尊重系统「减少动态效果」偏好 */
@media (prefers-reduced-motion: reduce) {
  .fs-upload-btn,
  .fs-stat__avatar,
  .fs-col__row,
  .fs-col__row.is-selected {
    transition: none;
    animation: none;
  }
}</style>
