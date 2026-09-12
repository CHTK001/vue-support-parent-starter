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
import { computed, defineComponent, h, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { ElIcon, ElMessage, ElMessageBox } from "element-plus";
import {
  ArrowRight,
  CopyDocument,
  DocumentAdd,
  DocumentCopy,
  Download,
  EditPen,
  Files,
  FolderAdd,
  FolderOpened,
  InfoFilled,
  Refresh,
  Scissor,
  Search,
  Setting,
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
  fetchObjectText,
  getBucketConfig,
  getBucketTree,
  getCapabilities,
  getDefaultBucket,
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
import type { BucketConfig, CapabilitiesResponse, StorageObject, TreeItem } from "../api/filestorageApi";
import PreviewIframePanel from "../components/PreviewIframePanel.vue";
import PreviewImagePanel from "../components/PreviewImagePanel.vue";

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
      if (["xlsx", "xls", "csv", "ods"].includes(ext)) {
        return FS_TYPE_SVG.excel;
      }
      if (["pptx", "ppt", "odp", "pps"].includes(ext)) {
        return FS_TYPE_SVG.ppt;
      }
      return FS_TYPE_SVG.word;
    case "text":
      // json / 代码 / markdown 细分，其余普通文本
      if (ext === "json") {
        return FS_TYPE_SVG.json;
      }
      if (["js", "mjs", "cjs", "ts", "jsx", "tsx", "html", "htm", "css", "scss", "less", "xml", "vue", "yaml", "yml"].includes(ext)) {
        return FS_TYPE_SVG.code;
      }
      if (["md", "markdown"].includes(ext)) {
        return FS_TYPE_SVG.md;
      }
      return FS_TYPE_SVG.txt;
    default:
      return FS_TYPE_SVG.file;
  }
}

/**
 * 递归目录树节点组件（KodExplorer 式左侧文件树）。
 *
 * <p>通过 props.node 渲染当前目录，若有 children 递归展开为子节点；
 * 点击节点通过 {@code select} 事件通知父组件切换当前目录。</p>
 */
const FsTreeNode = defineComponent({
  name: "FsTreeNode",
  props: {
    node: { type: Object as () => TreeItem, required: true },
    depth: { type: Number, default: 0 },
    activePath: { type: String, default: "" },
  },
  emits: ["select", "drop"],
  setup(props, { emit }) {
    const open = ref(false);
    /** 拖拽悬停（内部移动/复制放置目标高亮） */
    const dropHover = ref(false);
    const hasChildren = computed(() =>
      Array.isArray(props.node.children) && props.node.children.length > 0);
    const isActive = computed(() => props.activePath === props.node.path);
    function toggle(): void { if (hasChildren.value) open.value = !open.value; }
    function go(): void { emit("select", props.node.path, props.node.name); }
    /** 内部拖拽悬停在目录节点上 */
    function onDragOver(e: DragEvent): void {
      if (!e.dataTransfer || !e.dataTransfer.types.includes("application/x-fs-keys")) return;
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = e.ctrlKey ? "copy" : "move";
      dropHover.value = true;
    }
    function onDragLeave(): void { dropHover.value = false; }
    function onDrop(e: DragEvent): void {
      if (!e.dataTransfer || !e.dataTransfer.types.includes("application/x-fs-keys")) return;
      e.preventDefault();
      e.stopPropagation();
      dropHover.value = false;
      emit("drop", e, props.node.path);
    }
    return { open, hasChildren, isActive, toggle, go, dropHover, onDragOver, onDragLeave, onDrop };
  },
  render() {
    const props = this.$props as { node: TreeItem; depth: number; activePath: string };
    const ind = (8 + (props.depth || 0) * 14) + "px";
    const row = h("div", {
      class: [
        "fs-tree-node__row",
        this.isActive ? "fs-tree-node__row--active" : "",
        this.dropHover ? "fs-tree-node__row--drop" : "",
      ],
      style: { paddingLeft: ind },
      onClick: this.go,
      onDragover: this.onDragOver,
      onDragleave: this.onDragLeave,
      onDrop: this.onDrop,
    }, [
      h(ElIcon, {
        class: ["fs-tree-node__arrow", this.open ? "fs-tree-node__arrow--open" : ""],
        // 显式尺寸：render 函数生成的内部节点不受父组件 scoped 样式控制
        style: { fontSize: "12px", width: "12px", height: "12px", visibility: this.hasChildren ? "visible" : "hidden" },
        onClick: (e: MouseEvent) => { e.stopPropagation(); this.toggle(); },
      }, () => h(ArrowRight)),
      h("span", {
        class: "fs-typeicon",
        style: { fontSize: "16px", margin: "0 5px 0 2px", flexShrink: "0" },
        innerHTML: FS_TYPE_SVG.folder,
        "aria-hidden": "true",
      }),
      h("span", { class: "fs-tree-node__label", title: props.node.name }, props.node.name),
    ]);
    const children = this.open && this.hasChildren
      ? h("div", {}, (props.node.children || []).map((child) =>
          h(FsTreeNode, {
            key: child.path,
            node: child,
            depth: (props.depth || 0) + 1,
            activePath: props.activePath,
            onSelect: (p: string, n: string) => this.$emit("select", p, n),
            onDrop: (e: DragEvent, p: string) => this.$emit("drop", e, p),
          })))
      : null;
    return h("div", {}, [row, children]);
  },
});

/** 预览类型 */
type PreviewKind = "image" | "text" | "pdf" | "office" | "video" | "audio" | "font" | "archive" | "unknown";

/** 视图模式（Windows 资源管理器风格） */
type ViewMode = "details" | "largeIcons" | "mediumIcons" | "smallIcons";

/* ================== 连接 & 状态 ================== */

/**
 * 从当前页面 URL 解析存储桶。
 *
 * 服务返回的 Vue 壳页面 URL 即 {@code /{bucket}}，第一段路径即 bucket；
 * query 参数 bucket 优先级最高，便于测试覆盖。
 */
function resolveBucket(): string {
  try {
    const qs = new URLSearchParams(window.location.search);
    const qb = (qs.get("bucket") || "").trim();
    if (qb) return qb;
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
/** 视图模式：details=详细信息 / largeIcons=大图标 / mediumIcons=中图标 / smallIcons=小图标 */
const viewMode = ref<ViewMode>("details");
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
/** 目录树数据 */
const tree = ref<TreeItem[]>([]);
/** 目录树加载状态 */
const treeLoading = ref(false);
/** 历史栈（KodExplorer 地址栏前进/后退） */
const historyStack = ref<string[]>([]);
/** 当前历史索引 */
const historyIndex = ref(-1);
/** 是否阻止历史记录（如前进后退导航本身） */
let suppressHistory = false;

const breadcrumbs = computed(() => {
  const segments = currentPath.value ? currentPath.value.split("/") : [];
  return [{ name: "全部文件", path: "" }, ...segments.map((name, index) => ({
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
  if (["png", "jpg", "jpeg", "gif", "svg", "webp", "bmp", "ico"].includes(ext)) return "image";
  if (["txt", "log", "json", "xml", "html", "css", "js", "ts", "md", "yaml", "yml", "csv"].includes(ext)) return "text";
  if (ext === "pdf") return "pdf";
  if (["xlsx", "xls", "docx", "doc", "pptx", "ppt", "odt", "ods", "odp", "vsd", "dwg", "dgn", "rtf", "epub", "xmind"].includes(ext)) return "office";
  if (["mp4", "webm", "ogg", "mov", "avi", "mkv", "flv", "wmv", "m4v", "3gp"].includes(ext)) return "video";
  if (["mp3", "wav", "flac", "m4a"].includes(ext)) return "audio";
  if (["ttf", "otf", "woff", "woff2", "eot"].includes(ext)) return "font";
  if (["zip", "tar", "gz", "tgz", "bz2", "tbz2", "xz", "txz", "7z", "rar"].includes(ext)) return "archive";
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
    case "text": return "icon-text";
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
    case "pdf": return "PDF 文档";
    case "office": return "Office 文档";
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

/* ================== 目录导航 ================== */

async function loadObjects(): Promise<void> {
  loading.value = true;
  try {
    objects.value = await listObjects(bucket.value, currentPath.value);
    setDefaultBucket(bucket.value);
    // 记录历史（前进/后退导航时 suppressHistory=true 跳过）
    if (!suppressHistory) {
      historyStack.value = historyStack.value.slice(0, historyIndex.value + 1);
      historyStack.value.push(currentPath.value);
      historyIndex.value = historyStack.value.length - 1;
    }
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "加载失败");
    objects.value = [];
  } finally {
    loading.value = false;
  }
}

/** 历史后退 */
function goBack(): void {
  if (historyIndex.value <= 0) return;
  historyIndex.value--;
  suppressHistory = true;
  currentPath.value = historyStack.value[historyIndex.value];
  clearSelect();
  loadObjects();
  suppressHistory = false;
}

/** 历史前进 */
function goForward(): void {
  if (historyIndex.value >= historyStack.value.length - 1) return;
  historyIndex.value++;
  suppressHistory = true;
  currentPath.value = historyStack.value[historyIndex.value];
  clearSelect();
  loadObjects();
  suppressHistory = false;
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
    await ElMessageBox.confirm(`确认删除选中的 ${targets.length} 个对象？`, "删除确认", { type: "warning" });
  } catch { return; }
  try {
    for (const t of targets) {
      await deleteObject(bucket.value, fullKey(t.name));
    }
    ElMessage.success(`已删除 ${targets.length} 个对象`);
    clearSelect();
    await loadObjects();
    await loadTree();
  } catch (e) { ElMessage.error((e as Error)?.message ?? "删除失败"); }
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

/** 动作完成后统一刷新列表与目录树 */
async function refreshAfterAction(): Promise<void> {
  clearSelect();
  await Promise.all([loadObjects(), loadTree()]);
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

/** 放置到左侧目录树节点 */
async function onTreeDrop(e: DragEvent, targetDir: string): Promise<void> {
  if (!e.dataTransfer?.types.includes(DRAG_MIME)) return;
  e.preventDefault();
  e.stopPropagation();
  await dropKeysTo(targetDir, e);
}

/** 加载左侧目录树（失败静默） */
async function loadTree(): Promise<void> {
  treeLoading.value = true;
  try {
    tree.value = await getBucketTree(bucket.value);
  } catch {
    tree.value = [];
  } finally {
    treeLoading.value = false;
  }
}

/** 目录树点击：进入该目录 */
function onTreeSelect(path: string, name: string): void {
  currentPath.value = path;
  clearSelect();
  loadObjects();
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
    await setBucketConfig(bucket.value, tokenValue, { ...adminForm, watermark: adminForm.watermark.trim() });
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
/** 存储类型显示名 */
const storageType = computed(() => bucketConfig.value?.storage ?? "--");

function enterDir(row: StorageObject): void {
  currentPath.value = fullKey(row.name);
  loadObjects();
}

function goCrumb(path: string): void {
  currentPath.value = path;
  loadObjects();
}

function goUp(): void {
  if (!currentPath.value) return;
  const i = currentPath.value.lastIndexOf("/");
  currentPath.value = i > 0 ? currentPath.value.slice(0, i) : "";
  loadObjects();
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
const previewText = ref("");
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
  previewText.value = "";
  previewKey.value = fullKey(row.name);
  previewZoom.value = 100;
  previewError.value = false;
  iframeLoading.value = ["pdf", "office", "font"].includes(kind);
  previewMeta.value = { size: row.size, lastModified: row.lastModified };
  previewVisible.value = true;
  if (kind === "text") {
    // 文本：骨架屏加载后填入内容
    previewLoading.value = true;
    try { previewText.value = await fetchObjectText(bucket.value, fullKey(row.name)); }
    catch (e) { ElMessage.error((e as Error)?.message ?? "读取失败"); previewVisible.value = false; }
    finally { previewLoading.value = false; }
  } else {
    // 图片/PDF/Office/视频等：原生渲染，无需骨架屏阻塞
    previewLoading.value = false;
  }
}

const previewSrc = computed(() => objectUrl(bucket.value, previewKey.value));
const iframePanelRef = ref<InstanceType<typeof PreviewIframePanel>>();
const imagePanelRef = ref<InstanceType<typeof PreviewImagePanel>>();

function onFrameLoad(): void { previewLoading.value = false; iframeLoading.value = false; previewError.value = false; }
function onFrameError(): void { previewLoading.value = false; iframeLoading.value = false; previewError.value = true; }
function retryPreview(): void { previewError.value = false; previewLoading.value = true; iframeLoading.value = ["pdf", "office", "font"].includes(previewKind.value); iframeKey.value++; }
function toggleFullscreen(el?: HTMLElement): void {
  const t = el || iframePanelRef.value?.wrapRef || imagePanelRef.value?.wrapRef;
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
    case "?": e.preventDefault(); previewKind.value === "image" ? imagePanelRef.value?.toggleHelp() : iframePanelRef.value?.toggleHelp(); break;
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
  const label = targets.length > 1 ? `确认删除选中的 ${targets.length} 个对象？` : `确认删除「${row.name}」？`;
  try { await ElMessageBox.confirm(label, "删除确认", { type: "warning" }); } catch { return; }
  try {
    for (const t of targets) {
      await deleteObject(bucket.value, fullKey(t.name));
    }
    ElMessage.success(`已删除 ${targets.length} 个对象`);
    clearSelect();
    await loadObjects();
    await loadTree();
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
  loadObjects();
  loadTree();
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
    <header class="fs-header">
      <div class="fs-brand">
        <svg class="fs-logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" fill="currentColor" stroke="none" opacity="0.12"/>
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        <span>FileStorage</span>
        <span class="fs-bucket-badge" :title="`存储桶：${bucket}`">{{ bucket }}</span>
      </div>

      <!-- 历史前进/后退 -->
      <div class="fs-addr-nav">
        <button type="button" class="fs-icon-btn" :disabled="!canGoBack" title="后退" aria-label="后退" @click="goBack">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <button type="button" class="fs-icon-btn" :disabled="!canGoForward" title="前进" aria-label="前进" @click="goForward">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        <button type="button" class="fs-icon-btn" title="根目录" aria-label="根目录" @click="goCrumb('')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </button>
        <button type="button" class="fs-icon-btn" :disabled="!currentPath" title="上级目录" aria-label="上级目录" @click="goUp">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="18 15 12 9 6 15"/></svg>
        </button>
      </div>

      <!-- 面包屑地址栏 -->
      <div class="fs-addr">
        <span class="fs-pathbar__crumbs">
          <template v-for="(crumb, i) in breadcrumbs" :key="crumb.path || 'root'">
            <span v-if="i > 0" class="fs-pathbar__sep" aria-hidden="true">/</span>
            <span
              class="fs-pathbar__item"
              :class="{ 'fs-pathbar__item--active': crumb.path === currentPath }"
              @click="goCrumb(crumb.path)"
            ><span
                v-if="crumb.path === ''"
                class="fs-typeicon fs-pathbar__icon"
                v-html="FS_TYPE_SVG.folder"
                aria-hidden="true"
              />{{ crumb.name }}</span>
          </template>
        </span>
      </div>

      <div class="fs-header__right">
        <button
          v-admin
          type="button"
          class="fs-icon-btn"
          title="系统配置（管理员）"
          aria-label="系统配置"
          @click="openAdminConfig"
        >
          <el-icon aria-hidden="true"><Setting /></el-icon>
        </button>
        <el-input
          v-model="keyword"
          placeholder="搜索文件..."
          clearable
          size="default"
          class="fs-search"
          :prefix-icon="Search"
          :aria-label="'搜索文件'"
        />
      </div>
    </header>

    <!-- ===== 主体区域 ===== -->
    <div class="fs-body">
      <!-- 左侧边栏 -->
      <aside class="fs-sidebar">
        <div class="fs-sidebar__section">
          <div class="fs-sidebar__title">文件树</div>
          <div class="fs-tree" v-loading="treeLoading">
            <div
              v-if="tree.length === 0 && !treeLoading"
              class="fs-tree__empty"
            >暂无目录</div>
            <div
              v-for="node in tree"
              :key="node.path"
              class="fs-tree-node"
              :class="{ 'fs-tree-node--active': currentPath === node.path }"
            >
              <FsTreeNode
                :node="node"
                :depth="0"
                :active-path="currentPath"
                @select="onTreeSelect"
                @drop="onTreeDrop"
              />
            </div>
          </div>
        </div>
        <div class="fs-sidebar__section">
          <div class="fs-sidebar__title">统计</div>
          <div class="fs-sidebar__stat"><span>存储类型</span><b>{{ storageType }}</b></div>
          <div class="fs-sidebar__stat"><span>文件</span><b>{{ fileCount }}</b></div>
          <div class="fs-sidebar__stat"><span>目录</span><b>{{ dirCount }}</b></div>
          <div class="fs-sidebar__stat"><span>总大小</span><b>{{ formatSize(totalSize) }}</b></div>
        </div>
        <div class="fs-sidebar__section">
          <div class="fs-sidebar__title">功能开关</div>
          <div class="fs-sidebar__stat"><span>预览</span><b class="fs-stat-badge" :class="allowPreview ? 'on' : 'off'">{{ bucketConfig == null ? '…' : (allowPreview ? '开' : '关') }}</b></div>
          <div class="fs-sidebar__stat"><span>下载</span><b class="fs-stat-badge" :class="allowDownload ? 'on' : 'off'">{{ bucketConfig == null ? '…' : (allowDownload ? '开' : '关') }}</b></div>
        </div>
        <div class="fs-sidebar__section">
          <div class="fs-sidebar__title">当前路径</div>
          <div class="fs-sidebar__path">{{ currentPath || '/' }}</div>
        </div>
      </aside>

      <!-- 主内容区 -->
      <main class="fs-content">
        <!-- KodExplorer 工具栏 -->
        <div class="fs-toolbar">
          <div class="fs-toolbar__left">
            <button type="button" class="fs-tb-btn" title="全选" aria-label="全选" @click="selectAll">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
              <span>全选</span>
            </button>
            <button type="button" class="fs-tb-btn" title="新建文件夹" aria-label="新建文件夹" :disabled="actionRunning" @click="onCreateDir">
              <el-icon aria-hidden="true"><FolderAdd /></el-icon>
              <span>新建文件夹</span>
            </button>
            <button type="button" class="fs-tb-btn" title="新建文件" aria-label="新建文件" :disabled="actionRunning" @click="onCreateFile">
              <el-icon aria-hidden="true"><DocumentAdd /></el-icon>
              <span>新建文件</span>
            </button>
            <button v-if="selectedCount === 1" type="button" class="fs-tb-btn" title="重命名" aria-label="重命名" :disabled="actionRunning" @click="onRename()">
              <el-icon aria-hidden="true"><EditPen /></el-icon>
              <span>重命名</span>
            </button>
            <button v-if="selectedCount > 0" type="button" class="fs-tb-btn" title="复制" aria-label="复制" @click="onCopySelected">
              <el-icon aria-hidden="true"><CopyDocument /></el-icon>
              <span>复制</span>
            </button>
            <button v-if="selectedCount > 0" type="button" class="fs-tb-btn" title="剪切" aria-label="剪切" @click="onCutSelected">
              <el-icon aria-hidden="true"><Scissor /></el-icon>
              <span>剪切</span>
            </button>
            <button v-if="clipboard != null" type="button" class="fs-tb-btn" title="粘贴到当前目录" aria-label="粘贴" :disabled="actionRunning" @click="onPaste">
              <el-icon aria-hidden="true"><DocumentCopy /></el-icon>
              <span>粘贴</span>
            </button>
            <button v-if="selectedCount > 0" type="button" class="fs-tb-btn" title="压缩下载" aria-label="压缩下载" :disabled="actionRunning" @click="onZipSelected">
              <el-icon aria-hidden="true"><Files /></el-icon>
              <span>压缩</span>
            </button>
            <button v-if="canUnzip" type="button" class="fs-tb-btn" title="解压到当前目录" aria-label="解压" :disabled="actionRunning" @click="onUnzip()">
              <el-icon aria-hidden="true"><FolderOpened /></el-icon>
              <span>解压</span>
            </button>
            <button type="button" class="fs-tb-btn" title="上传" aria-label="上传" @click="openUpload">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <span>上传</span>
            </button>
            <button v-if="selectedCount > 0" type="button" class="fs-tb-btn" title="下载选中" aria-label="下载选中" @click="downloadSelected">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span>下载</span>
            </button>
            <button v-if="selectedCount > 0" type="button" class="fs-tb-btn fs-tb-btn--danger" title="删除选中" aria-label="删除选中" @click="deleteSelected">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              <span>删除</span>
            </button>
            <button type="button" class="fs-tb-btn" title="刷新" aria-label="刷新" :disabled="loading" @click="loadObjects">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><polyline points="21 3 21 9 15 9"/></svg>
              <span>刷新</span>
            </button>
          </div>
          <span v-if="selectedCount > 0" class="fs-toolbar__sel">已选 {{ selectedCount }} 项</span>
          <div class="fs-toolbar__right">
            <span class="fs-pathbar__count">{{ filteredObjects.length }} 项</span>
            <div class="fs-view-toggle" role="group" aria-label="查看方式">
              <button type="button" class="fs-view-btn" :class="{ 'fs-view-btn--active': viewMode === 'details' }" title="详细信息" aria-label="详细信息" aria-pressed="viewMode === 'details'" @click="viewMode = 'details'">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/><circle cx="2.5" cy="6" r="0.5" fill="currentColor"/><circle cx="2.5" cy="12" r="0.5" fill="currentColor"/><circle cx="2.5" cy="18" r="0.5" fill="currentColor"/></svg>
              </button>
              <button type="button" class="fs-view-btn" :class="{ 'fs-view-btn--active': viewMode === 'largeIcons' }" title="大图标" aria-label="大图标" aria-pressed="viewMode === 'largeIcons'" @click="viewMode = 'largeIcons'">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="2" y="2" width="9" height="9" rx="1.5"/><rect x="13" y="2" width="9" height="9" rx="1.5"/><rect x="2" y="13" width="9" height="9" rx="1.5"/><rect x="13" y="13" width="9" height="9" rx="1.5"/></svg>
              </button>
              <button type="button" class="fs-view-btn" :class="{ 'fs-view-btn--active': viewMode === 'mediumIcons' }" title="中图标" aria-label="中图标" aria-pressed="viewMode === 'mediumIcons'" @click="viewMode = 'mediumIcons'">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="2" y="2" width="6" height="6" rx="1.2"/><rect x="10" y="2" width="6" height="6" rx="1.2"/><rect x="18" y="2" width="4" height="6" rx="1.2"/><rect x="2" y="10" width="6" height="6" rx="1.2"/><rect x="10" y="10" width="6" height="6" rx="1.2"/><rect x="18" y="10" width="4" height="6" rx="1.2"/><rect x="2" y="18" width="6" height="4" rx="1.2"/><rect x="10" y="18" width="6" height="4" rx="1.2"/><rect x="18" y="18" width="4" height="4" rx="1.2"/></svg>
              </button>
              <button type="button" class="fs-view-btn" :class="{ 'fs-view-btn--active': viewMode === 'smallIcons' }" title="小图标" aria-label="小图标" aria-pressed="viewMode === 'smallIcons'" @click="viewMode = 'smallIcons'">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="4" cy="6" r="1.2" fill="currentColor"/><line x1="8" y1="6" x2="20" y2="6"/><circle cx="4" cy="12" r="1.2" fill="currentColor"/><line x1="8" y1="12" x2="20" y2="12"/><circle cx="4" cy="18" r="1.2" fill="currentColor"/><line x1="8" y1="18" x2="20" y2="18"/></svg>
              </button>
            </div>
          </div>
        </div>

        <!-- 详细信息（Details）：列显示由服务端配置动态控制（showFormat/showSize/showTime） -->
        <div
          v-if="viewMode === 'details'"
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
            <div class="fs-lg-card__thumb" :class="item.directory ? 'icon-folder' : fileIconClass(item.name, false)">
              <iframe
                v-if="!item.directory && objectThumbUrl(item.name)"
                :src="objectThumbUrl(item.name)"
                class="fs-lg-card__frame"
                loading="lazy"
                title=""
                scrolling="no"
                sandbox="allow-same-origin"
              />
              <template v-else>
                <span
                  class="fs-typeicon fs-card-icon"
                  v-html="fileSvg(item.name, item.directory)"
                  aria-hidden="true"
                />
              </template>
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

        <!-- 状态栏（KodExplorer 风格：当前目录/选中/统计） -->
        <div class="fs-statusbar">
          <span class="fs-statusbar__item">
            {{ currentPath || '/' }} · {{ filteredObjects.length }} 项
          </span>
          <span v-if="selectedCount > 0" class="fs-statusbar__item fs-statusbar__item--selected">
            已选 {{ selectedCount }} 项{{ selectedSize > 0 ? `（${formatSize(selectedSize)}）` : '' }}
          </span>
          <span class="fs-statusbar__spacer" />
          <span class="fs-statusbar__item">文件 {{ fileCount }}</span>
          <span class="fs-statusbar__item">目录 {{ dirCount }}</span>
          <span class="fs-statusbar__item">共 {{ formatSize(totalSize) }}</span>
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
            v-if="!ctxMenu.row!.directory"
            type="button"
            class="fs-ctx__item"
            role="menuitem"
            @click="ctxAction('onetime')"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            创建链接
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
          <button type="button" class="fs-ctx__item" role="menuitem" @click="ctxAction('refresh')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            刷新
          </button>
        </template>
      </div>
    </Teleport>

    <!-- ===== 系统配置对话框（管理员，v-admin 指令控制入口按钮可见性） ===== -->
    <el-dialog v-model="adminVisible" title="系统配置（管理员）" width="500px" :append-to-body="true" :close-on-click-modal="false" destroy-on-close>
      <div class="fs-admin">
        <div class="fs-admin__row">
          <span class="fs-admin__label">
            内联预览
            <el-tooltip content="开启后浏览器可直接在线预览文本、图片、音视频等（关闭后仅能下载）" placement="top">
              <el-icon class="fs-admin__info"><InfoFilled /></el-icon>
            </el-tooltip>
          </span>
          <el-switch v-model="adminForm.openPreview" />
        </div>
        <div class="fs-admin__row">
          <span class="fs-admin__label">
            附件下载
            <el-tooltip content="开启后支持 ?download=true 强制以附件形式下载文件" placement="top">
              <el-icon class="fs-admin__info"><InfoFilled /></el-icon>
            </el-tooltip>
          </span>
          <el-switch v-model="adminForm.openDownload" />
        </div>
        <div class="fs-admin__row">
          <span class="fs-admin__label">
            分段下载
            <el-tooltip content="开启后支持 HTTP Range 请求，大文件可断点续传/分段加载" placement="top">
              <el-icon class="fs-admin__info"><InfoFilled /></el-icon>
            </el-tooltip>
          </span>
          <el-switch v-model="adminForm.openRange" />
        </div>
        <div class="fs-admin__row">
          <span class="fs-admin__label">
            水印响应头
            <el-tooltip content="开启后文件响应附带 X-Watermark 头（内容为下方水印文字，非 ASCII 字符按 URL 编码输出）" placement="top">
              <el-icon class="fs-admin__info"><InfoFilled /></el-icon>
            </el-tooltip>
          </span>
          <el-switch v-model="adminForm.openWatermark" />
        </div>
        <div class="fs-admin__row">
          <span class="fs-admin__label">
            Webjars 资源
            <el-tooltip content="开启后允许通过 /webjars/ 路径访问内置前端静态资源" placement="top">
              <el-icon class="fs-admin__info"><InfoFilled /></el-icon>
            </el-tooltip>
          </span>
          <el-switch v-model="adminForm.openWebjars" />
        </div>
        <div class="fs-admin__row">
          <span class="fs-admin__label">
            远程文件透传
            <el-tooltip content="开启后允许以 http(s) 地址作为 Key 访问，服务器代理拉取远程文件" placement="top">
              <el-icon class="fs-admin__info"><InfoFilled /></el-icon>
            </el-tooltip>
          </span>
          <el-switch v-model="adminForm.openRemoteFile" />
        </div>
        <div class="fs-admin__row">
          <span class="fs-admin__label">
            目录列表页
            <el-tooltip content="关闭后直接访问目录地址返回 404，仅保留对象读写接口" placement="top">
              <el-icon class="fs-admin__info"><InfoFilled /></el-icon>
            </el-tooltip>
          </span>
          <el-switch v-model="adminForm.layout" />
        </div>
        <div class="fs-admin__row">
          <span class="fs-admin__label">
            布局类型
            <el-tooltip content="浏览器直接访问目录时的页面：资源管理器（Vue 独立 UI）或简单列表" placement="top">
              <el-icon class="fs-admin__info"><InfoFilled /></el-icon>
            </el-tooltip>
          </span>
          <el-radio-group v-model="adminForm.layoutType" size="small">
            <el-radio-button value="SYSTEM">资源管理器</el-radio-button>
            <el-radio-button value="SIMPLE">简单列表</el-radio-button>
          </el-radio-group>
        </div>
        <el-divider class="fs-admin__divider" />
        <div class="fs-admin__row">
          <span class="fs-admin__label">
            显示"类型"列
            <el-tooltip content="详细信息视图中的文件类型列（如 JPG 文件、文件夹）" placement="top">
              <el-icon class="fs-admin__info"><InfoFilled /></el-icon>
            </el-tooltip>
          </span>
          <el-switch v-model="adminForm.showFormat" />
        </div>
        <div class="fs-admin__row">
          <span class="fs-admin__label">
            显示"大小"列
            <el-tooltip content="详细信息视图中的文件大小列（目录不显示）" placement="top">
              <el-icon class="fs-admin__info"><InfoFilled /></el-icon>
            </el-tooltip>
          </span>
          <el-switch v-model="adminForm.showSize" />
        </div>
        <div class="fs-admin__row">
          <span class="fs-admin__label">
            显示"修改时间"列
            <el-tooltip content="详细信息视图中的最后修改时间列" placement="top">
              <el-icon class="fs-admin__info"><InfoFilled /></el-icon>
            </el-tooltip>
          </span>
          <el-switch v-model="adminForm.showTime" />
        </div>
        <div class="fs-admin__row">
          <span class="fs-admin__label">
            图片滤镜
            <el-tooltip content="图片滤镜，选项来自后端 ImageFilter SPI 真实实现，应用于图片缩略图与预览" placement="top">
              <el-icon class="fs-admin__info"><InfoFilled /></el-icon>
            </el-tooltip>
          </span>
          <el-select v-model="adminForm.imageFilter" style="width: 140px" size="small">
            <el-option v-for="opt in imageFilterOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
          </el-select>
        </div>
        <el-divider class="fs-admin__divider" />
        <div class="fs-admin__row fs-admin__row--col">
          <span class="fs-admin__label">
            水印文字（留空清除）
            <el-tooltip content="作为 X-Watermark 响应头内容下发，供下游水印组件使用" placement="top">
              <el-icon class="fs-admin__info"><InfoFilled /></el-icon>
            </el-tooltip>
          </span>
          <el-input v-model="adminForm.watermark" placeholder="如：内部资料" clearable />
        </div>
        <div class="fs-admin__row fs-admin__row--col">
          <span class="fs-admin__label">
            管理员令牌
            <el-tooltip content="后端每次启动随机生成：见启动日志或 /config?token= 页面，本机持久化后无需重复输入" placement="top">
              <el-icon class="fs-admin__info"><InfoFilled /></el-icon>
            </el-tooltip>
          </span>
          <el-input
            v-model="adminToken"
            type="password"
            show-password
            placeholder="后端启动日志 getToken() 或 /config 页获取"
          />
        </div>
        <p class="fs-admin__tip">保存后立即对后续请求生效，无需重启服务。</p>
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
            <span style="font-size:12px;color:#64748b">秒</span>
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
        <span><el-tag size="small" type="info">{{ previewKind }}</el-tag></span>
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
        <template v-else-if="previewKind === 'image'">
          <div class="fs-preview__img-wrap">
            <img
              :src="previewSrc + (iframeKey > 0 ? '?_t=' + iframeKey : '')"
              :alt="previewName"
              class="fs-preview__img"
              @load="previewLoading = false"
              @error="previewError = true"
            />
          </div>
        </template>
        <template v-else-if="previewKind === 'pdf'">
          <PreviewIframePanel ref="iframePanelRef" v-model:zoom="previewZoom" :src="previewSrc + '#toolbar=0&zoom=page-width'" :loading="iframeLoading" :frame-key="iframeKey" @fullscreen="toggleFullscreen()" @load="onFrameLoad" @error="onFrameError" />
        </template>
        <template v-else-if="previewKind === 'office'">
          <PreviewIframePanel ref="iframePanelRef" v-model:zoom="previewZoom" :src="previewSrc + '?preview=true'" :loading="iframeLoading" :frame-key="iframeKey" @fullscreen="toggleFullscreen()" @load="onFrameLoad" @error="onFrameError" />
        </template>
        <video v-else-if="previewKind === 'video'" :src="previewSrc + (iframeKey > 0 ? '?_t=' + iframeKey : '')" controls class="fs-preview__media" @loadeddata="previewLoading = false" @error="previewError = true" />
        <audio v-else-if="previewKind === 'audio'" :src="previewSrc + (iframeKey > 0 ? '?_t=' + iframeKey : '')" controls class="fs-preview__media" @loadeddata="previewLoading = false" @error="previewError = true" />
        <template v-else-if="previewKind === 'font'">
          <PreviewIframePanel ref="iframePanelRef" v-model:zoom="previewZoom" :src="previewSrc + '?preview=true'" :loading="iframeLoading" :frame-key="iframeKey" @fullscreen="toggleFullscreen()" @load="onFrameLoad" @error="onFrameError" />
        </template>
        <pre v-else-if="previewKind === 'text'" class="fs-preview__code">{{ previewText }}</pre>
        <el-empty v-else description="该类型不支持在线预览">
          <el-button type="primary" :icon="Download" @click="handleDownload({ name: previewName } as StorageObject)">下载文件</el-button>
        </el-empty>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
/* ========================================================
   FileStorage · KodExplorer 风格
   深蓝导航条 #4267b2 / 白底文件树 / 蓝灰按钮 / #cce8ff 选中
   ======================================================== */
.fs-app {
  --kd-blue: #4267b2;
  --kd-blue-hover: #5074be;
  --kd-select: #cce8ff;
  --kd-hover: #e5f3ff;
  --kd-border: #ddd;
  --kd-text: #333;
  --kd-text-2: #666;

  display: flex;
  flex-direction: column;
  height: 100vh;
  font-family: "Helvetica Neue", Helvetica, Arial, "Microsoft YaHei", sans-serif;
  background: #fff;
  color: var(--kd-text);
  overflow: hidden;
}

/* ===== 顶部导航条（KodExplorer 深蓝 topbar） ===== */
.fs-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  height: 40px;
  padding: 0 14px;
  background: var(--kd-blue);
  color: #fff;
  z-index: 30;
}
.fs-brand { display: flex; align-items: center; gap: 8px; white-space: nowrap; color: #fff; font-size: 15px; font-weight: 600; }
.fs-logo { width: 20px; height: 20px; color: #fff; }
.fs-bucket-badge {
  font-size: 12px; font-weight: 400; color: #e8f0ff;
  border: 1px solid rgba(255,255,255,0.35);
  border-radius: 3px; padding: 1px 8px;
  max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

/* 地址导航按钮 */
.fs-addr-nav { display: flex; align-items: center; gap: 2px; }
.fs-icon-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border: none; background: transparent;
  color: #fff; border-radius: 3px; cursor: pointer; transition: background 0.15s;
}
.fs-icon-btn svg { width: 16px; height: 16px; }
.fs-icon-btn:hover:not(:disabled) { background: var(--kd-blue-hover); }
.fs-icon-btn:disabled { opacity: 0.45; cursor: not-allowed; }

/* 地址栏（面包屑） */
.fs-addr {
  flex: 1; min-width: 0; display: flex; align-items: center;
  background: #fff; border: 1px solid rgba(0,0,0,0.2);
  border-radius: 3px; padding: 0 8px; height: 28px; overflow: hidden; margin: 0 6px;
}
.fs-addr .fs-pathbar__crumbs { flex: 1; display: flex; flex-wrap: nowrap; gap: 2px; align-items: center; overflow: hidden; }
.fs-addr .fs-pathbar__sep { color: #999; margin: 0 1px; }
.fs-addr .fs-pathbar__item {
  cursor: pointer; color: #333; padding: 1px 5px; border-radius: 2px; white-space: nowrap;
  font-size: 13px; transition: background 0.15s;
}
.fs-addr .fs-pathbar__item:hover { background: var(--kd-hover); color: #333; }
.fs-addr .fs-pathbar__item--active { font-weight: 600; cursor: default; }

/* 搜索 */
.fs-header__right { display: flex; align-items: center; }
.fs-search { width: 160px; }
.fs-search :deep(.el-input__wrapper) {
  background: #fff; border-radius: 3px; border: 1px solid rgba(0,0,0,0.2); box-shadow: none; height: 28px;
}
.fs-search :deep(.el-input__inner) { font-size: 12px; }

/* ===== 主体 ===== */
.fs-body { flex: 1; display: flex; overflow: hidden; }

/* 左侧文件树 */
.fs-sidebar {
  width: 220px; flex-shrink: 0; display: flex; flex-direction: column;
  background: #fff; border-right: 1px solid #eee; overflow: hidden;
}
.fs-sidebar__section { padding: 8px 6px; }
.fs-sidebar__title {
  font-size: 12px; font-weight: 600; color: var(--kd-text-2);
  padding: 0 6px; margin-bottom: 4px;
}
.fs-tree { flex: 1; overflow-y: auto; }
.fs-tree__empty { padding: 8px; font-size: 12px; color: var(--kd-text-2); text-align: center; }

/* 树节点（render 递归组件内部节点无 scopeId，统一通过 .fs-tree :deep 穿透） */
.fs-tree :deep(.fs-tree-node) { width: 100%; }
.fs-tree :deep(.fs-tree-node__row) {
  display: flex; align-items: center; gap: 4px;
  padding: 3px 6px; border-radius: 0; cursor: pointer;
  font-size: 13px; color: #333; border: 1px solid transparent;
  transition: background 0.15s;
  white-space: nowrap; overflow: hidden;
}
.fs-tree :deep(.fs-tree-node__row:hover) { background: var(--kd-hover); border-color: transparent; }
.fs-tree :deep(.fs-tree-node__row--active) { background: var(--kd-select); border-color: #99d1ff; color: #335; font-weight: 600; }
.fs-tree :deep(.fs-tree-node__row--drop) { background: #d9ecff; outline: 1px dashed #409eff; outline-offset: -1px; }
/* 树节点（render 函数生成的内部节点需用 :deep 穿透作用域） */
.fs-tree :deep(.fs-tree-node__arrow) {
  display: inline-flex; align-items: center; justify-content: center;
  flex-shrink: 0; color: #888; transition: transform 0.15s;
}
.fs-tree :deep(.fs-tree-node__arrow--open) { transform: rotate(90deg); }
.fs-tree :deep(.fs-tree-node__label) { overflow: hidden; text-overflow: ellipsis; }

/* 侧边栏底部统计 */
.fs-sidebar__stat { display: flex; justify-content: space-between; padding: 3px 8px; font-size: 12px; }
.fs-sidebar__stat span { color: var(--kd-text-2); }
.fs-stat-badge { display: inline-flex; padding: 0 7px; border-radius: 2px; font-size: 11px; font-weight: 600; }
.fs-stat-badge.on { color: #2e7d32; background: #e8f5e9; }
.fs-stat-badge.off { color: #666; background: #f1f1f1; }
.fs-sidebar__path { padding: 6px 8px; font-size: 12px; color: var(--kd-text-2); background: #f8f8f8; word-break: break-all; line-height: 1.5; }

/* ===== 右侧 ===== */
.fs-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: #fff; }

/* 工具栏 */
.fs-toolbar {
  display: flex; align-items: center; gap: 4px;
  padding: 6px 10px;
  background: #fff; border-bottom: 1px solid #eee; flex-shrink: 0;
}
.fs-toolbar__left { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; row-gap: 4px; }
.fs-toolbar__right { margin-left: auto; display: flex; align-items: center; gap: 8px; }
.fs-toolbar__sel { font-size: 12px; color: #1a73e8; font-weight: 600; margin-left: 8px; }
.fs-pathbar__count { color: var(--kd-text-2); font-size: 12px; white-space: nowrap; }

.fs-tb-btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 10px; font-size: 12px;
  background: #fff; border: 1px solid var(--kd-border);
  border-radius: 2px; color: var(--kd-text); cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.fs-tb-btn svg { width: 14px; height: 14px; }
.fs-tb-btn .el-icon { font-size: 14px; }
.fs-tb-btn:hover { background: #e4f8ff; border-color: #aedaff; }
.fs-tb-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.fs-tb-btn--danger { color: #d32f2f; border-color: rgba(211,47,47,0.3); }
.fs-tb-btn--danger:hover { background: #ffe9e9; border-color: #f2a0a0; }

/* 视图切换 */
.fs-view-toggle { display: inline-flex; background: #fff; border: 1px solid var(--kd-border); border-radius: 2px; padding: 1px; }
.fs-view-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 26px; height: 24px; border: none; background: transparent; cursor: pointer; color: #888;
  transition: background 0.15s, color 0.15s;
}
.fs-view-btn svg { width: 15px; height: 15px; }
.fs-view-btn:hover { background: #e4f8ff; color: #1a73e8; }
.fs-view-btn--active { background: #cce8ff; color: #1a73e8; }

/* ===== 文件列表区域 ===== */
.fs-files { flex: 1; overflow-y: auto; padding: 10px 14px 20px; background: #fff; }

/* 详细信息 */
.fs-details-head, .fs-details-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 110px 90px 160px;
  align-items: center; gap: 8px; padding: 0 8px; font-size: 13px;
}
.fs-details-head {
  position: sticky; top: 0; background: #f8f8f8; z-index: 5;
  padding-top: 8px; padding-bottom: 6px; border-bottom: 1px solid #ddd;
  font-size: 12px; font-weight: 600; color: #666;
}
.fs-details-head__col { cursor: pointer; user-select: none; }
.fs-details-head__col:hover { background: var(--kd-hover); }
.fs-details-head__size { text-align: right; }
.fs-sort-arrow { color: #1a73e8; font-weight: 700; }
.fs-details-row { padding-top: 5px; padding-bottom: 5px; cursor: pointer; border: 1px solid transparent; }
.fs-details-row:hover { background: var(--kd-hover); border-color: transparent; }
.fs-details-row--selected { background: var(--kd-select); border-color: #99d1ff; }
.fs-details-row__name { display: flex; align-items: center; gap: 8px; min-width: 0; overflow: hidden; }
.fs-details-row__name span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fs-details-row__icon { width: 18px; height: 18px; font-size: 18px; flex-shrink: 0; color: #e2a03f; }
.fs-details-row__icon.icon-image { color: #34a853; }
.fs-details-row__icon.icon-video { color: #9333ea; }
.fs-details-row__icon.icon-audio { color: #d97706; }
.fs-details-row__icon.icon-pdf { color: #d93025; }
.fs-details-row__icon.icon-office { color: #1a73e8; }
.fs-details-row__icon.icon-archive { color: #6b7280; }
.fs-details-row__icon.icon-text,
.fs-details-row__icon.icon-file { color: #4b5563; }
.fs-name--dir { font-weight: 600; color: #333; }
.fs-details-row__type { color: var(--kd-text-2); font-size: 12px; }
.fs-details-row__size { color: var(--kd-text-2); font-size: 12px; text-align: right; }
.fs-details-row__time { color: var(--kd-text-2); font-size: 12px; }
/* 管理员配置控制详情列显隐（showFormat/showSize/showTime），网格随可见列收缩 */
.fs-files--details.fs-details--no-format .fs-details-head, .fs-files--details.fs-details--no-format .fs-details-row { grid-template-columns: minmax(0, 1fr) 90px 160px; }
.fs-files--details.fs-details--no-size .fs-details-head, .fs-files--details.fs-details--no-size .fs-details-row { grid-template-columns: minmax(0, 1fr) 110px 160px; }
.fs-files--details.fs-details--no-time .fs-details-head, .fs-files--details.fs-details--no-time .fs-details-row { grid-template-columns: minmax(0, 1fr) 110px 160px; }
.fs-files--details.fs-details--no-size.fs-details--no-time .fs-details-head, .fs-files--details.fs-details--no-size.fs-details--no-time .fs-details-row { grid-template-columns: minmax(0, 1fr) 110px; }
.fs-files--details.fs-details--no-format.fs-details--no-size .fs-details-head, .fs-files--details.fs-details--no-format.fs-details--no-size .fs-details-row { grid-template-columns: minmax(0, 1fr) 160px; }
.fs-files--details.fs-details--no-format.fs-details--no-time .fs-details-head, .fs-files--details.fs-details--no-format.fs-details--no-time .fs-details-row { grid-template-columns: minmax(0, 1fr) 90px; }
.fs-files--details.fs-details--no-format.fs-details--no-size.fs-details--no-time .fs-details-head, .fs-files--details.fs-details--no-format.fs-details--no-size.fs-details--no-time .fs-details-row { grid-template-columns: minmax(0, 1fr); }

/* 大图标 */
.fs-files--large { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 6px; align-content: start; }
.fs-lg-card {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 10px 6px; border: 1px solid transparent; cursor: pointer;
  transition: background 0.15s; user-select: none;
}
.fs-lg-card:hover { background: var(--kd-hover); }
.fs-lg-card--selected { background: var(--kd-select); border-color: #99d1ff; }
.fs-lg-card__thumb { width: 72px; height: 72px; display: flex; align-items: center; justify-content: center; border-radius: 4px; overflow: hidden; background: #fafafa; }
.fs-lg-card__thumb svg { width: 56px; height: 56px; }
.fs-lg-card__thumb .fs-card-icon { font-size: 56px; }
.fs-lg-card__thumb.icon-folder { color: #e2a03f; background: #fff8e8; }
.fs-lg-card__thumb.icon-image { color: #34a853; background: #e6f4ea; }
.fs-lg-card__thumb.icon-video { color: #9333ea; background: #f3e8ff; }
.fs-lg-card__thumb.icon-audio { color: #d97706; background: #fef3c7; }
.fs-lg-card__thumb.icon-pdf { color: #d93025; background: #fce8e6; }
.fs-lg-card__thumb.icon-office { color: #1a73e8; background: #e8f0fe; }
.fs-lg-card__thumb.icon-archive { color: #6b7280; background: #f3f4f6; }
.fs-lg-card__thumb.icon-text { color: #4b5563; background: #f3f4f6; }
.fs-lg-card__thumb.icon-file { color: #4b5563; background: #f3f4f6; }
.fs-lg-card__frame { width: 100%; height: 100%; border: none; pointer-events: none; filter: var(--fs-image-filter, none); }
.fs-lg-card__label {
  width: 100%; text-align: center; font-size: 12px; font-weight: 400; color: #333;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

/* 中图标 */
.fs-files--medium { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 4px; align-content: start; }
.fs-md-card {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 8px 4px; border: 1px solid transparent; cursor: pointer; transition: background 0.15s; user-select: none;
}
.fs-md-card:hover { background: var(--kd-hover); }
.fs-md-card--selected { background: var(--kd-select); border-color: #99d1ff; }
.fs-md-card__thumb { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; }
.fs-md-card__thumb svg { width: 30px; height: 30px; }
.fs-md-card__thumb .fs-card-icon { font-size: 30px; }
.fs-md-card__thumb.icon-folder { color: #e2a03f; }
.fs-md-card__thumb.icon-image { color: #34a853; }
.fs-md-card__thumb.icon-video { color: #9333ea; }
.fs-md-card__thumb.icon-audio { color: #d97706; }
.fs-md-card__thumb.icon-pdf { color: #d93025; }
.fs-md-card__thumb.icon-office { color: #1a73e8; }
.fs-md-card__thumb.icon-archive { color: #6b7280; }
.fs-md-card__thumb.icon-text { color: #4b5563; }
.fs-md-card__thumb.icon-file { color: #4b5563; }
.fs-md-card__label { width: 100%; text-align: center; font-size: 12px; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* 小图标 */
.fs-files--small { padding: 0 10px 16px; }
.fs-files__small-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 2px; }
.fs-sm-row {
  display: flex; align-items: center; gap: 6px; padding: 3px 8px; cursor: pointer;
  border: 1px solid transparent; font-size: 12.5px; overflow: hidden; transition: background 0.15s;
}
.fs-sm-row:hover { background: var(--kd-hover); }
.fs-sm-row--selected { background: var(--kd-select); border-color: #99d1ff; }
.fs-sm-row__icon { width: 16px; height: 16px; font-size: 16px; flex-shrink: 0; color: #e2a03f; }
.fs-sm-row__icon.icon-image { color: #34a853; }
.fs-sm-row__icon.icon-video { color: #9333ea; }
.fs-sm-row__icon.icon-audio { color: #d97706; }
.fs-sm-row__icon.icon-pdf { color: #d93025; }
.fs-sm-row__icon.icon-office { color: #1a73e8; }
.fs-sm-row__icon.icon-archive { color: #6b7280; }
.fs-sm-row__icon.icon-text,
.fs-sm-row__icon.icon-file { color: #4b5563; }
.fs-sm-row__name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* 空状态 */
.fs-files__empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 40px 0; color: var(--kd-text-2); font-size: 13px; }
.fs-files__empty small { font-size: 12px; }

/* ===== 状态栏 ===== */
.fs-statusbar {
  flex-shrink: 0; display: flex; align-items: center; gap: 16px;
  padding: 5px 14px; background: #f1f1f1; border-top: 1px solid #ddd;
  font-size: 12px; color: #555; user-select: none;
}
.fs-statusbar__item { white-space: nowrap; }
.fs-statusbar__item--selected { color: #1a73e8; font-weight: 600; }
.fs-statusbar__spacer { flex: 1; }

/* ===== 右键菜单 ===== */
.fs-ctx {
  position: fixed; z-index: 100000; min-width: 160px;
  background: #fff; border: 1px solid rgba(0,0,0,0.2);
  border-radius: 2px; padding: 4px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.2); font-size: 13px;
}
.fs-ctx__item {
  display: flex; align-items: center; gap: 8px; width: 100%;
  padding: 5px 10px; border: none; background: transparent; border-radius: 0;
  cursor: pointer; text-align: left; color: #333; font-size: 13px; font-family: inherit; transition: background 0.12s;
}
.fs-ctx__item:hover { background: var(--kd-hover); }
.fs-ctx__item svg { flex-shrink: 0; color: #888; }
.fs-ctx__item .el-icon { font-size: 14px; flex-shrink: 0; color: #888; }
.fs-ctx__item--danger { color: #d32f2f; }
.fs-ctx__item--danger:hover { background: #ffe9e9; }
.fs-ctx__sep { height: 1px; background: #eee; margin: 4px 6px; }

/* 拖拽放置目标高亮（四种视图通用） */
.fs-row--drop { outline: 2px solid #409eff; outline-offset: -2px; background: #ecf5ff !important; }

/* ===== 预览 ===== */
.fs-preview { min-height: 200px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; }
.fs-preview__meta { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 6px 0; font-size: 12px; color: var(--kd-text-2); border-bottom: 1px solid #eee; margin-bottom: 8px; width: 100%; }
.fs-preview__media { max-width: 100%; border-radius: 4px; }
.fs-preview__img-wrap { display: flex; align-items: center; justify-content: center; padding: 6px; }
.fs-preview__img { max-width: 100%; max-height: 64vh; border-radius: 4px; box-shadow: 0 1px 6px rgba(0,0,0,0.15); filter: var(--fs-image-filter, none); }
.fs-preview__code { width: 100%; max-height: 60vh; margin: 0; padding: 12px; overflow: auto; border-radius: 4px; background: #f8f8f8; border: 1px solid #eee; color: #333; font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 13px; line-height: 1.6; white-space: pre-wrap; word-break: break-all; }
.fs-preview__error { width: 100%; display: flex; align-items: center; justify-content: center; }
.fs-preview__skeleton { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 16px 0; }
.fs-preview__loading-text { font-size: 13px; color: var(--kd-text-2); }
.sk { border-radius: 4px; background: linear-gradient(90deg, #eee 25%, #ddd 50%, #eee 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
.sk--w40 { width: 40%; height: 22px; }
.sk--w60 { width: 60%; height: 110px; }
.sk--full { width: 100%; height: 180px; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* ===== Element Plus 弹窗圆角 ===== */
.fs-app :deep(.el-dialog) { border-radius: 6px; overflow: hidden; }
.fs-app :deep(.el-dialog__header) { padding: 12px 16px; margin-right: 0; border-bottom: 1px solid #eee; background: #f8f8f8; }
.fs-app :deep(.el-dialog__title) { font-size: 14px; font-weight: 600; color: #333; }
.fs-app :deep(.el-dialog__headerbtn) { top: 10px; right: 10px; }
.fs-app :deep(.el-dialog__body) { padding: 16px; }
.fs-app :deep(.el-dialog__footer) { padding: 10px 16px 14px; border-top: 1px solid #f1f1f1; }

/* 响应式 */
@media (max-width: 768px) {
  .fs-sidebar { display: none; }
  .fs-search { width: 110px; }
  .fs-header { padding: 0 8px; }
  .fs-addr { margin: 0 4px; }
  .fs-files--large { grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); }
  .fs-files--medium { grid-template-columns: repeat(auto-fill, minmax(84px, 1fr)); }
  .fs-details-head, .fs-details-row { grid-template-columns: minmax(0, 1fr) 70px 56px; }
  .fs-details-head__type, .fs-details-row__type { display: none; }
}

/* ===== 管理员系统配置弹窗 ===== */
.fs-admin { display: flex; flex-direction: column; gap: 12px; }
.fs-admin__row { display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 13px; color: var(--kd-text); }
.fs-admin__row--col { flex-direction: column; align-items: stretch; }
.fs-admin__row--col > .fs-admin__label { font-weight: 600; }
.fs-admin__label { display: inline-flex; align-items: center; gap: 4px; }
.fs-admin__info { font-size: 14px; color: var(--kd-text-2, #999); cursor: help; }
.fs-admin__divider { margin: 2px 0; }
.fs-admin__tip { margin: 2px 0 0; font-size: 12px; color: var(--kd-text-2); }

/* 面包屑最左侧文件夹图标 */
.fs-pathbar__icon { font-size: 14px; margin-right: 4px; }

/* header 管理员配置按钮内的 EP 图标尺寸 */
.fs-icon-btn .el-icon { font-size: 16px; }
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
</style>
