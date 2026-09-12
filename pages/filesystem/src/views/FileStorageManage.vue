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
import { computed, defineComponent, h, onMounted, onUnmounted, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Document,
  Download,
  Refresh,
  Search,
  Upload,
} from "@element-plus/icons-vue";
import {
  DEFAULT_BUCKET,
  DEFAULT_SERVER,
  createOneTimeLink,
  deleteObject,
  existObject,
  fetchObjectText,
  getBucketConfig,
  getBucketTree,
  getDefaultBucket,
  getServerBase,
  listObjects,
  objectUrl,
  putObject,
  setDefaultBucket,
} from "../api/filestorageApi";
import type { BucketConfig, StorageObject, TreeItem } from "../api/filestorageApi";
import PreviewIframePanel from "../components/PreviewIframePanel.vue";
import PreviewImagePanel from "../components/PreviewImagePanel.vue";

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
  emits: ["select"],
  setup(props, { emit }) {
    const open = ref(false);
    const hasChildren = computed(() =>
      Array.isArray(props.node.children) && props.node.children.length > 0);
    const isActive = computed(() => props.activePath === props.node.path);
    function toggle(): void { if (hasChildren.value) open.value = !open.value; }
    function go(): void { emit("select", props.node.path, props.node.name); }
    return { open, hasChildren, isActive, toggle, go };
  },
  render() {
    const props = this.$props as { node: TreeItem; depth: number; activePath: string };
    const ind = (8 + (props.depth || 0) * 14) + "px";
    const row = h("div", {
      class: ["fs-tree-node__row", this.isActive ? "fs-tree-node__row--active" : ""],
      style: { paddingLeft: ind },
      onClick: this.go,
    }, [
      h("span", {
        class: ["fs-tree-node__arrow", this.open ? "fs-tree-node__arrow--open" : ""],
        onClick: (e: MouseEvent) => { e.stopPropagation(); this.toggle(); },
      }, this.hasChildren
        ? h("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" },
            h("polyline", { points: "9 18 15 12 9 6" }))
        : null),
      h("svg", { class: "fs-tree-node__icon", viewBox: "0 0 24 24", fill: "currentColor" },
        h("path", { d: "M20 6h-8l-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zm0 12H4V8h16z" })),
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

/** 下载选中文件 */
function downloadSelected(): void {
  if (selectedCount.value === 0) return;
  const files = objects.value.filter((o) => selected.value.has(o.name) && !o.directory);
  for (const f of files) {
    window.open(objectUrl(bucket.value, fullKey(f.name), true), "_blank");
  }
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
  // KodExplorer 行为：右键即选中该文件（若已多选则保留选择）
  if (!selected.value.has(row.name)) {
    selected.value = new Set([row.name]);
  }
  ctxMenu.value = { visible: true, x: e.clientX, y: e.clientY, row };
}

function closeContextMenu(): void {
  ctxMenu.value.visible = false;
  ctxMenu.value.row = null;
}

function ctxAction(action: string) {
  const row = ctxMenu.value.row;
  closeContextMenu();
  if (!row) return;
  switch (action) {
    case "open":
      row.directory ? enterDir(row) : openPreview(row);
      break;
    case "preview":
      openPreview(row);
      break;
    case "download":
      handleDownload(row);
      break;
    case "onetime":
      openOneTime(row);
      break;
    case "delete":
      handleDelete(row);
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
  if (!e.dataTransfer?.types.includes("Files")) return;
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
  previewLoading.value = true;
  iframeLoading.value = ["pdf", "office", "font"].includes(kind);
  previewMeta.value = { size: row.size, lastModified: row.lastModified };
  previewVisible.value = true;
  if (kind === "text") {
    try { previewText.value = await fetchObjectText(bucket.value, fullKey(row.name)); }
    catch (e) { ElMessage.error((e as Error)?.message ?? "读取失败"); previewVisible.value = false; }
    finally { previewLoading.value = false; }
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
  <div class="fs-app" @click="closeContextMenu">
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
            >{{ crumb.name }}</span>
          </template>
        </span>
      </div>

      <div class="fs-header__right">
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

        <!-- 详细信息（Details） -->
        <div v-if="viewMode === 'details'" class="fs-files fs-files--details" v-loading="loading">
          <div class="fs-details-head">
            <span class="fs-details-head__col fs-details-head__name" @click="toggleSort('name')">
              名称 <span class="fs-sort-arrow">{{ sortArrow('name') }}</span>
            </span>
            <span class="fs-details-head__col fs-details-head__type">类型</span>
            <span class="fs-details-head__col fs-details-head__size" @click="toggleSort('size')">
              大小 <span class="fs-sort-arrow">{{ sortArrow('size') }}</span>
            </span>
            <span class="fs-details-head__col fs-details-head__time" @click="toggleSort('lastModified')">
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
            :class="{ 'fs-details-row--selected': isSelected(item.name) }"
            role="button" tabindex="0"
            :aria-label="item.name"
            @click="onRowClick($event, item, index)"
            @dblclick="item.directory ? enterDir(item) : openPreview(item)"
            @keydown.enter="item.directory ? enterDir(item) : openPreview(item)"
            @contextmenu="openContextMenu($event, item)"
          >
            <span class="fs-details-row__name">
              <svg v-if="item.directory" class="fs-details-row__icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20 6h-8l-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zm0 12H4V8h16z"/></svg>
              <svg v-else class="fs-details-row__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <span :class="{ 'fs-name--dir': item.directory }">{{ item.name }}</span>
            </span>
            <span class="fs-details-row__type">{{ item.directory ? '文件夹' : fileType(item.name) }}</span>
            <span class="fs-details-row__size">{{ item.directory ? '-' : formatSize(item.size) }}</span>
            <span class="fs-details-row__time">{{ formatTime(item.lastModified) }}</span>
          </div>
        </div>

        <!-- 大图标（Large Icons）- 使用 ?preview 渲染缩略图 -->
        <div v-else-if="viewMode === 'largeIcons'" class="fs-files fs-files--large" v-loading="loading">
          <div v-if="filteredObjects.length === 0 && !loading" class="fs-files__empty">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            <span>当前目录为空</span>
          </div>
          <div
            v-for="(item, index) in filteredObjects"
            :key="item.name"
            class="fs-lg-card"
            :class="{ 'fs-lg-card--selected': isSelected(item.name) }"
            role="button" tabindex="0"
            :aria-label="item.name"
            @click="onRowClick($event, item, index)"
            @dblclick="item.directory ? enterDir(item) : openPreview(item)"
            @keydown.enter="item.directory ? enterDir(item) : openPreview(item)"
            @contextmenu="openContextMenu($event, item)"
          >
            <div class="fs-lg-card__thumb" :class="item.directory ? 'icon-folder' : fileIconClass(item.name, false)">
              <iframe
                v-if="!item.directory && objectThumbUrl(item.name)"
                :src="objectThumbUrl(item.name)"
                class="fs-lg-card__frame"
                loading="lazy"
                title=""
                scrolling="no"
              />
              <template v-else>
                <svg v-if="item.directory" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20 6h-8l-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zm0 12H4V8h16z"/></svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </template>
            </div>
            <div class="fs-lg-card__label" :title="item.name">{{ item.name }}</div>
          </div>
        </div>

        <!-- 中图标（Medium Icons） -->
        <div v-else-if="viewMode === 'mediumIcons'" class="fs-files fs-files--medium" v-loading="loading">
          <div v-if="filteredObjects.length === 0 && !loading" class="fs-files__empty">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            <span>当前目录为空</span>
          </div>
          <div
            v-for="(item, index) in filteredObjects"
            :key="item.name"
            class="fs-md-card"
            :class="{ 'fs-md-card--selected': isSelected(item.name) }"
            role="button" tabindex="0"
            :aria-label="item.name"
            @click="onRowClick($event, item, index)"
            @dblclick="item.directory ? enterDir(item) : openPreview(item)"
            @keydown.enter="item.directory ? enterDir(item) : openPreview(item)"
            @contextmenu="openContextMenu($event, item)"
          >
            <div class="fs-md-card__thumb" :class="item.directory ? 'icon-folder' : fileIconClass(item.name, false)">
              <svg v-if="item.directory" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20 6h-8l-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zm0 12H4V8h16z"/></svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <div class="fs-md-card__label" :title="item.name">{{ item.name }}</div>
          </div>
        </div>

        <!-- 小图标（Small Icons） -->
        <div v-else class="fs-files fs-files--small" v-loading="loading">
          <div v-if="filteredObjects.length === 0 && !loading" class="fs-files__empty">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            <span>当前目录为空</span>
          </div>
          <div class="fs-files__small-list">
            <div
              v-for="(item, index) in filteredObjects"
              :key="item.name"
              class="fs-sm-row"
              :class="{ 'fs-sm-row--selected': isSelected(item.name) }"
              role="button" tabindex="0"
              :aria-label="item.name"
              @click="onRowClick($event, item, index)"
              @dblclick="item.directory ? enterDir(item) : openPreview(item)"
              @keydown.enter="item.directory ? enterDir(item) : openPreview(item)"
              @contextmenu="openContextMenu($event, item)"
            >
              <svg v-if="item.directory" class="fs-sm-row__icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20 6h-8l-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zm0 12H4V8h16z"/></svg>
              <svg v-else class="fs-sm-row__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
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
          <button
            v-if="!ctxMenu.row!.directory"
            type="button"
            class="fs-ctx__item fs-ctx__item--danger"
            role="menuitem"
            @click="ctxAction('delete')"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            删除
          </button>
        </template>
      </div>
    </Teleport>

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
          <PreviewIframePanel ref="iframePanelRef" v-model:zoom="previewZoom" :src="previewSrc + '?preview=true'" :loading="iframeLoading" :frame-key="iframeKey" @fullscreen="toggleFullscreen()" @load="onFrameLoad" @error="onFrameError" />
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
   FileStorage · 现代云盘界面
   设计系统：Slate 中性色阶 + 蓝色主色（Accessible 4.5:1）
   ======================================================== */
.fs-app {
  --fs-bg: #f4f6f8;
  --fs-surface: #ffffff;
  --fs-border: #e2e8f0;
  --fs-text: #0f172a;
  --fs-text-2: #475569;
  --fs-text-3: #64748b;
  --fs-primary: #2563eb;
  --fs-primary-hover: #1d4ed8;
  --fs-primary-soft: #eff6ff;
  --fs-danger: #dc2626;
  --fs-success: #16a34a;
  --fs-radius: 12px;
  --fs-shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.04);

  display: flex;
  flex-direction: column;
  height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
  background: var(--fs-bg);
  color: var(--fs-text);
  overflow: hidden;
}

/* ---- 顶部工具栏 ---- */
.fs-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 20px;
  height: 56px;
  background: var(--fs-surface);
  border-bottom: 1px solid var(--fs-border);
  z-index: 30;
}

.fs-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 600;
  color: var(--fs-text);
  white-space: nowrap;
}

.fs-logo {
  width: 24px;
  height: 24px;
  color: var(--fs-primary);
}

.fs-bucket-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  font-size: 11px;
  font-weight: 600;
  color: var(--fs-primary);
  background: var(--fs-primary-soft);
  border: 1px solid rgba(37, 99, 235, 0.2);
  border-radius: 999px;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fs-header__right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 10px;
}

/* KodExplorer 地址导航栏 */
.fs-addr-nav {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-left: 8px;
}

/* KodExplorer 地址/面包屑 */
.fs-addr {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  background: #ffffff;
  border: 1px solid var(--fs-border);
  border-radius: 8px;
  padding: 0 10px;
  height: 32px;
  overflow: hidden;
  margin: 0 10px;
}

.fs-addr .fs-pathbar__crumbs { flex: 1; display: flex; flex-wrap: nowrap; gap: 2px; align-items: center; overflow: hidden; }
.fs-addr .fs-pathbar__sep { color: var(--fs-text-3); margin: 0 1px; }
.fs-addr .fs-pathbar__item {
  cursor: pointer;
  color: var(--fs-primary);
  padding: 2px 6px;
  border-radius: 5px;
  white-space: nowrap;
  transition: background 0.15s;
}
.fs-addr .fs-pathbar__item:hover { background: var(--fs-primary-soft); }
.fs-addr .fs-pathbar__item--active { color: var(--fs-text); font-weight: 600; cursor: default; }

/* KodExplorer 工具栏 */
.fs-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  background: var(--fs-surface);
  border-bottom: 1px solid var(--fs-border);
  flex-shrink: 0;
}
.fs-toolbar__left {
  display: flex;
  align-items: center;
  gap: 4px;
}
.fs-toolbar__right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 12px;
}
.fs-toolbar__sel {
  font-size: 12px;
  color: var(--fs-primary);
  font-weight: 600;
  margin-left: 8px;
}
.fs-tb-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid var(--fs-border);
  border-radius: 6px;
  background: #ffffff;
  color: var(--fs-text-2);
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.fs-tb-btn svg { width: 15px; height: 15px; }
.fs-tb-btn:hover { background: #f8fafc; border-color: #cbd5e1; color: var(--fs-text); }
.fs-tb-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.fs-tb-btn--danger { color: var(--fs-danger); border-color: rgba(220,38,38,0.2); }
.fs-tb-btn--danger:hover { background: rgba(220,38,38,0.06); }

.fs-search { width: 200px; }
.fs-search :deep(.el-input__wrapper) {
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid var(--fs-border);
  box-shadow: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.fs-search :deep(.el-input__wrapper:hover) { border-color: #cbd5e1; }
.fs-search :deep(.el-input__wrapper.is-focus) {
  border-color: var(--fs-primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
  background: #ffffff;
}

.fs-toolbar-sep { width: 1px; height: 20px; background: var(--fs-border); }

/* ---- 视图切换 ---- */
.fs-view-toggle {
  display: inline-flex;
  background: #f1f5f9;
  border-radius: 8px;
  padding: 2px;
  gap: 2px;
}

.fs-view-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 6px;
  color: var(--fs-text-3);
  cursor: pointer;
  transition: color 0.18s, background 0.18s, box-shadow 0.18s;
}
.fs-view-btn svg { width: 16px; height: 16px; }
.fs-view-btn:hover { color: var(--fs-text); }
.fs-view-btn--active {
  background: #ffffff;
  color: var(--fs-primary);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
}

/* ---- 按钮 ---- */
.fs-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 8px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: background 0.18s, border-color 0.18s, color 0.18s, opacity 0.18s;
}
.fs-btn svg { width: 15px; height: 15px; }
.fs-btn:focus-visible {
  outline: 2px solid var(--fs-primary);
  outline-offset: 2px;
}

.fs-btn--ghost {
  background: #ffffff;
  border-color: var(--fs-border);
  color: var(--fs-text-2);
}
.fs-btn--ghost:hover { background: #f8fafc; border-color: #cbd5e1; }
.fs-btn--ghost:disabled { opacity: 0.6; cursor: not-allowed; }

.fs-btn--primary {
  background: var(--fs-primary);
  color: #ffffff;
}
.fs-btn--primary:hover { background: var(--fs-primary-hover); }

.fs-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  background: transparent;
  border-radius: 8px;
  color: var(--fs-text-2);
  cursor: pointer;
  transition: background 0.18s, color 0.18s;
}
.fs-icon-btn svg { width: 18px; height: 18px; }
.fs-icon-btn:hover:not(:disabled) { background: #f1f5f9; color: var(--fs-text); }
.fs-icon-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.fs-icon-btn:focus-visible { outline: 2px solid var(--fs-primary); outline-offset: 1px; }

/* ---- 主体 ---- */
.fs-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* ---- 侧边栏 ---- */
.fs-sidebar {
  width: 208px;
  flex-shrink: 0;
  padding: 16px 10px;
  background: var(--fs-surface);
  border-right: 1px solid var(--fs-border);
  overflow-y: auto;
}

.fs-sidebar__section { margin-bottom: 22px; }

.fs-sidebar__title {
  font-size: 11px;
  font-weight: 600;
  color: var(--fs-text-3);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0 8px;
  margin-bottom: 8px;
}

.fs-sidebar__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 8px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  color: var(--fs-text);
  transition: background 0.18s;
}
.fs-sidebar__item:hover { background: #f8fafc; }
.fs-sidebar__item.active { background: var(--fs-primary-soft); color: var(--fs-primary); }
.fs-sidebar__item svg { flex-shrink: 0; color: inherit; }

.fs-sidebar__stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 8px;
  font-size: 12px;
  color: var(--fs-text);
}
.fs-sidebar__stat span { color: var(--fs-text-3); }
.fs-sidebar__stat b { font-weight: 600; color: var(--fs-text); }

.fs-stat-badge {
  display: inline-flex;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}
.fs-stat-badge.on { color: var(--fs-success); background: rgba(22, 163, 74, 0.1); }
.fs-stat-badge.off { color: var(--fs-text-3); background: #f1f5f9; }

.fs-sidebar__path {
  padding: 8px;
  font-size: 12px;
  color: var(--fs-text-3);
  background: #f8fafc;
  border-radius: 8px;
  word-break: break-all;
  line-height: 1.5;
}

/* ---- 目录树（KodExplorer 风格） ---- */
.fs-tree { display: flex; flex-direction: column; gap: 1px; }
.fs-tree__empty { padding: 8px; font-size: 12px; color: var(--fs-text-3); text-align: center; }
.fs-tree-node { width: 100%; }
.fs-tree-node__row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  border-radius: 7px;
  cursor: pointer;
  font-size: 13px;
  color: var(--fs-text);
  transition: background 0.15s;
  white-space: nowrap;
  overflow: hidden;
}
.fs-tree-node__row:hover { background: #f1f5f9; }
.fs-tree-node__row--active { background: var(--fs-primary-soft); color: var(--fs-primary); font-weight: 600; }
.fs-tree-node__arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  color: var(--fs-text-3);
  transition: transform 0.18s;
}
.fs-tree-node__arrow svg { width: 12px; height: 12px; }
.fs-tree-node__arrow--open { transform: rotate(90deg); }
.fs-tree-node__icon { width: 16px; height: 16px; flex-shrink: 0; color: #f59e0b; }
.fs-tree-node__row--active .fs-tree-node__icon { color: var(--fs-primary); }
.fs-tree-node__label { overflow: hidden; text-overflow: ellipsis; }

/* ---- 状态栏（KodExplorer 风格） ---- */
.fs-statusbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 7px 20px;
  background: var(--fs-surface);
  border-top: 1px solid var(--fs-border);
  font-size: 12px;
  color: var(--fs-text-3);
  user-select: none;
}
.fs-statusbar__item { white-space: nowrap; }
.fs-statusbar__item--selected { color: var(--fs-primary); font-weight: 600; }
.fs-statusbar__spacer { flex: 1; }

/* ---- 主内容区 ---- */
.fs-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ---- 路径栏 ---- */
.fs-pathbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: var(--fs-bg);
  border-bottom: 1px solid var(--fs-border);
  font-size: 13px;
}
.fs-pathbar__crumbs {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  align-items: center;
  overflow: hidden;
}
.fs-pathbar__sep { color: #cbd5e1; margin: 0 2px; }
.fs-pathbar__item {
  cursor: pointer;
  color: var(--fs-primary);
  padding: 3px 8px;
  border-radius: 6px;
  transition: background 0.18s;
}
.fs-pathbar__item:hover { background: var(--fs-primary-soft); }
.fs-pathbar__item--active { color: var(--fs-text); font-weight: 600; cursor: default; }
.fs-pathbar__item--active:hover { background: transparent; }
.fs-pathbar__count { color: var(--fs-text-3); font-size: 12px; white-space: nowrap; }

/* ---- 文件区域 ---- */
.fs-files {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px 32px;
}

/* ---- 详细信息视图 ---- */
.fs-details-head,
.fs-details-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 130px 100px 176px;
  align-items: center;
  gap: 12px;
  padding: 0 20px;
  font-size: 13px;
}
.fs-details-head {
  position: sticky;
  top: 0;
  background: var(--fs-bg);
  z-index: 5;
  padding-top: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--fs-border);
  font-size: 11px;
  font-weight: 600;
  color: var(--fs-text-3);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.fs-details-head__col { cursor: pointer; user-select: none; transition: color 0.15s; }
.fs-details-head__col:hover { color: var(--fs-primary); }
.fs-details-head__size { text-align: right; }
.fs-sort-arrow { color: var(--fs-primary); font-weight: 700; }
.fs-details-row {
  padding-top: 10px;
  padding-bottom: 10px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.18s;
}
.fs-details-row:hover { background: #f8fafc; }
.fs-details-row:focus-visible { outline: 2px solid var(--fs-primary); outline-offset: -2px; }
.fs-details-row--selected { background: var(--fs-primary-soft); }

.fs-details-row__name { display: flex; align-items: center; gap: 10px; min-width: 0; overflow: hidden; }
.fs-details-row__name span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fs-details-row__icon { width: 18px; height: 18px; flex-shrink: 0; color: var(--fs-text-3); }
.fs-details-row__icon:first-child { color: var(--fs-primary); }
.fs-name--dir { font-weight: 600; color: var(--fs-primary); }
.fs-details-row__type { color: var(--fs-text-2); font-size: 12px; }
.fs-details-row__size { color: var(--fs-text-3); font-size: 12px; text-align: right; }
.fs-details-row__time { color: var(--fs-text-3); font-size: 12px; }

/* ---- 大图标视图 ---- */
.fs-files--large {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(146px, 1fr));
  gap: 14px;
  align-content: start;
}
.fs-lg-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 10px 14px;
  background: var(--fs-surface);
  border-radius: var(--fs-radius);
  border: 1px solid var(--fs-border);
  cursor: pointer;
  transition: box-shadow 0.2s, border-color 0.2s, transform 0.2s;
  user-select: none;
  overflow: hidden;
}
.fs-lg-card:hover {
  border-color: #cbd5e1;
  box-shadow: var(--fs-shadow);
  transform: translateY(-1px);
}
.fs-lg-card:focus-visible { outline: 2px solid var(--fs-primary); outline-offset: 1px; }
.fs-lg-card--selected { border-color: var(--fs-primary); background: var(--fs-primary-soft); }

.fs-lg-card__thumb {
  width: 100%;
  height: 104px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  overflow: hidden;
  background: #f8fafc;
}
.fs-lg-card__thumb svg { width: 48px; height: 48px; }
.fs-lg-card__thumb.icon-folder { color: #2563eb; background: var(--fs-primary-soft); }
.fs-lg-card__thumb.icon-image { color: #16a34a; background: rgba(22, 163, 74, 0.1); }
.fs-lg-card__thumb.icon-video { color: #9333ea; background: rgba(147, 51, 234, 0.1); }
.fs-lg-card__thumb.icon-audio { color: #d97706; background: rgba(217, 119, 6, 0.1); }
.fs-lg-card__thumb.icon-pdf { color: #dc2626; background: rgba(220, 38, 38, 0.1); }
.fs-lg-card__thumb.icon-office { color: #2563eb; background: var(--fs-primary-soft); }
.fs-lg-card__thumb.icon-archive { color: #64748b; background: #f1f5f9; }
.fs-lg-card__thumb.icon-text { color: #475569; background: #f1f5f9; }
.fs-lg-card__thumb.icon-file { color: #475569; background: #f1f5f9; }

.fs-lg-card__frame {
  width: 100%;
  height: 100%;
  border: none;
  background: #ffffff;
  pointer-events: none;
  opacity: 0.95;
}

.fs-lg-card__label {
  width: 100%;
  text-align: center;
  font-size: 12px;
  font-weight: 500;
  color: var(--fs-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ---- 中图标视图 ---- */
.fs-files--medium {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(118px, 1fr));
  gap: 10px;
  align-content: start;
}
.fs-md-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  padding: 14px 8px 12px;
  background: var(--fs-surface);
  border-radius: var(--fs-radius);
  border: 1px solid var(--fs-border);
  cursor: pointer;
  transition: box-shadow 0.2s, border-color 0.2s, transform 0.2s;
  user-select: none;
}
.fs-md-card:hover { border-color: #cbd5e1; box-shadow: var(--fs-shadow); transform: translateY(-1px); }
.fs-md-card:focus-visible { outline: 2px solid var(--fs-primary); outline-offset: 1px; }
.fs-md-card--selected { border-color: var(--fs-primary); background: var(--fs-primary-soft); }

.fs-md-card__thumb {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
}
.fs-md-card__thumb svg { width: 30px; height: 30px; }
.fs-md-card__thumb.icon-folder { color: #2563eb; background: var(--fs-primary-soft); }
.fs-md-card__thumb.icon-image { color: #16a34a; background: rgba(22, 163, 74, 0.1); }
.fs-md-card__thumb.icon-video { color: #9333ea; background: rgba(147, 51, 234, 0.1); }
.fs-md-card__thumb.icon-audio { color: #d97706; background: rgba(217, 119, 6, 0.1); }
.fs-md-card__thumb.icon-pdf { color: #dc2626; background: rgba(220, 38, 38, 0.1); }
.fs-md-card__thumb.icon-office { color: #2563eb; background: var(--fs-primary-soft); }
.fs-md-card__thumb.icon-archive { color: #64748b; background: #f1f5f9; }
.fs-md-card__thumb.icon-text { color: #475569; background: #f1f5f9; }
.fs-md-card__thumb.icon-file { color: #475569; background: #f1f5f9; }

.fs-md-card__label {
  width: 100%;
  text-align: center;
  font-size: 12px;
  font-weight: 500;
  color: var(--fs-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ---- 小图标视图 ---- */
.fs-files--small { padding: 0 12px 24px; }
.fs-files__small-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 4px;
}
.fs-sm-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
  font-size: 12.5px;
  overflow: hidden;
}
.fs-sm-row:hover { background: #f8fafc; }
.fs-sm-row--selected { background: var(--fs-primary-soft); }
.fs-sm-row:focus-visible { outline: 2px solid var(--fs-primary); outline-offset: -2px; }
.fs-sm-row__icon { width: 16px; height: 16px; flex-shrink: 0; color: var(--fs-text-3); }
.fs-sm-row__icon:first-child { color: var(--fs-primary); }
.fs-sm-row__name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* 空状态 */
.fs-files__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 64px 0;
  color: var(--fs-text-3);
  font-size: 14px;
}
.fs-files__empty small { color: var(--fs-text-3); opacity: 0.8; font-size: 12px; }

/* ---- 右键菜单 ---- */
.fs-ctx {
  position: fixed;
  z-index: 100000;
  min-width: 168px;
  background: #ffffff;
  border: 1px solid var(--fs-border);
  border-radius: 12px;
  padding: 5px;
  box-shadow: 0 12px 40px rgba(15, 23, 42, 0.2);
  font-size: 13px;
}
.fs-ctx__item {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 7px 10px;
  border: none;
  background: transparent;
  border-radius: 7px;
  cursor: pointer;
  text-align: left;
  color: var(--fs-text);
  font-size: 13px;
  font-family: inherit;
  transition: background 0.15s;
}
.fs-ctx__item:hover { background: var(--fs-primary-soft); }
.fs-ctx__item svg { flex-shrink: 0; color: var(--fs-text-3); }
.fs-ctx__item--danger { color: var(--fs-danger); }
.fs-ctx__item--danger:hover { background: rgba(220, 38, 38, 0.08); }
.fs-ctx__sep { height: 1px; background: var(--fs-border); margin: 4px 6px; }

/* ---- 预览 ---- */
.fs-preview { min-height: 200px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; }
.fs-preview__meta { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 8px 0 2px; font-size: 12px; color: var(--fs-text-3); border-bottom: 1px solid var(--fs-border); margin-bottom: 8px; width: 100%; }
.fs-preview__media { max-width: 100%; border-radius: 10px; }
.fs-preview__code { width: 100%; max-height: 60vh; margin: 0; padding: 14px 16px; overflow: auto; border-radius: 10px; background: #f8fafc; border: 1px solid var(--fs-border); color: var(--fs-text); font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 13px; line-height: 1.7; white-space: pre-wrap; word-break: break-all; }
.fs-preview__error { width: 100%; display: flex; align-items: center; justify-content: center; }
.fs-preview__skeleton { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 20px 0; }
.fs-preview__loading-text { font-size: 13px; color: var(--fs-text-3); }

.sk { border-radius: 10px; background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
.sk--w40 { width: 40%; height: 24px; }
.sk--w60 { width: 60%; height: 120px; }
.sk--full { width: 100%; height: 200px; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* ---- 响应式 ---- */
@media (max-width: 768px) {
  .fs-sidebar { display: none; }
  .fs-search { width: 120px; }
  .fs-header { padding: 0 12px; }
  .fs-files--large { grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); }
  .fs-files--medium { grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); }
  .fs-details-head, .fs-details-row { grid-template-columns: minmax(0, 1fr) 84px 60px; }
  .fs-details-head__type, .fs-details-row__type { display: none; }
}

/* ---- Element Plus 弹窗圆角（深度选择器穿透 scoped） ---- */
.fs-app :deep(.el-dialog) {
  border-radius: 16px;
  overflow: hidden;
  padding: 0;
}
.fs-app :deep(.el-dialog__header) {
  padding: 16px 20px 12px;
  margin-right: 0;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}
.fs-app :deep(.el-dialog__title) {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
}
.fs-app :deep(.el-dialog__headerbtn) {
  top: 14px;
  right: 14px;
  width: 28px;
  height: 28px;
  border-radius: 8px;
}
.fs-app :deep(.el-dialog__headerbtn:hover) {
  background: #f1f5f9;
}
.fs-app :deep(.el-dialog__body) {
  padding: 18px 20px;
}
.fs-app :deep(.el-dialog__footer) {
  padding: 12px 20px 16px;
  border-top: 1px solid #f1f5f9;
}
</style>
