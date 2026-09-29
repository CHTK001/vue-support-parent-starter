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
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  ArrowDown,
  ArrowLeft,
  CircleCheck,
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
  Setting,
  Tickets,
  Upload,
  UploadFilled,
  VideoPause,
  VideoPlay,
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
  getBucketTree,
  getServerBase,
  isUploadAborted,
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
import PreviewOfficePanel from "../components/PreviewOfficePanel.vue";
import ArchivePreviewPanel from "../components/ArchivePreviewPanel.vue";
import { isClientRenderable, RENDER_SERVER } from "../utils/officeRenderer";
import { fileSvg, fileTypeText, kindOf } from "../utils/fileKind";

/** 排序字段：name 名称 / size 大小 / lastModified 修改时间 */
type SortKey = "name" | "size" | "lastModified";
/** 排序方向：asc 升序 / desc 降序 */
type SortOrder = "asc" | "desc";

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
/** 当前目录加载失败的原因（空串表示无错误）；列表区据此显示真实原因而不是「当前目录为空」 */
const loadError = ref("");
/** 视图模式：columns=分栏（默认，macOS Finder 风格）/ largeIcons / mediumIcons / smallIcons / details */
const viewMode = ref<ViewMode>("columns");
/** 排序字段 */
const sortKey = ref<SortKey>("name");
/** 排序方向：asc 升序 / desc 降序 */
const sortOrder = ref<SortOrder>("asc");
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

/**
 * 当前目录的展示列表（只排序，不过滤）
 *
 * <p>搜索框整行移除后关键词过滤随之删除，这里只剩两条规则：目录排在文件前面、
 * 再按排序字段排。刻意先复制一份数组再 {@code sort}，否则就地排序会改动
 * {@link objects} 本身，而 {@code objects} 还要拿去做统计与分栏缓存同步。</p>
 *
 * @return 排好序的当前目录条目
 */
const sortedObjects = computed(() => {
  return [...objects.value].sort((a, b) => {
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
      const it = sortedObjects.value[i];
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
/** localStorage：界面状态键前缀，后面拼桶名——按桶分别记忆 */
const UI_STATE_PREFIX = "filestorage.ui.";
/** 合法的视图模式白名单（用于校验持久化值，防止旧版本残留的非法值） */
const VIEW_MODES: ViewMode[] = ["columns", "details", "largeIcons", "mediumIcons", "smallIcons"];
/** 合法的排序字段白名单 */
const SORT_KEYS: SortKey[] = ["name", "size", "lastModified"];
/** 合法的排序方向 */
const SORT_ORDERS: SortOrder[] = ["asc", "desc"];

/** 单个桶的界面状态 */
interface BucketUiState {
  /** 视图模式 */
  viewMode?: ViewMode;
  /** 所在目录 */
  currentPath?: string;
  /** 排序字段 */
  sortKey?: SortKey;
  /** 排序方向 */
  sortOrder?: SortOrder;
}

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

/**
 * 取某个桶的界面状态存储键
 *
 * @param bucketName 桶名
 * @return localStorage 键
 */
function uiStateKey(bucketName: string): string {
  return `${UI_STATE_PREFIX}${bucketName || "default"}`;
}

/**
 * 读取某个桶的界面状态
 *
 * @param bucketName 桶名
 * @return 界面状态；未记录过或数据损坏时返回空对象
 */
function readUiState(bucketName: string): BucketUiState {
  try {
    const raw = localStorage.getItem(uiStateKey(bucketName));
    return raw ? (JSON.parse(raw) as BucketUiState) : {};
  } catch {
    return {};
  }
}

/**
 * 把当前界面状态写入某个桶
 *
 * @param bucketName 桶名
 */
function writeUiState(bucketName: string): void {
  try {
    localStorage.setItem(uiStateKey(bucketName), JSON.stringify({
      viewMode: viewMode.value,
      currentPath: currentPath.value,
      sortKey: sortKey.value,
      sortOrder: sortOrder.value,
    } satisfies BucketUiState));
  } catch { /* ignore */ }
}

/**
 * 把某个桶记录的界面状态套用到当前页面
 *
 * <p>逐项按白名单校验后回落默认值，而不是整体信任持久化数据：
 * 字段类型/取值对不上时不能把页面带进一个非法状态（旧版本遗留、被人手改过的
 * localStorage 都会出现这种情况）。</p>
 *
 * @param bucketName 桶名
 */
function applyUiState(bucketName: string): void {
  const saved = readUiState(bucketName);
  viewMode.value = VIEW_MODES.includes(saved.viewMode as ViewMode) ? (saved.viewMode as ViewMode) : "columns";
  currentPath.value = typeof saved.currentPath === "string" ? saved.currentPath : "";
  sortKey.value = SORT_KEYS.includes(saved.sortKey as SortKey) ? (saved.sortKey as SortKey) : "name";
  sortOrder.value = SORT_ORDERS.includes(saved.sortOrder as SortOrder) ? (saved.sortOrder as SortOrder) : "asc";
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

/**
 * 快捷访问的父级部分（可能为空）
 *
 * <p>与 {@link quickLeaf} 配套：侧栏只有 232px，完整路径放不下会被尾部省略号截掉，
 * 而尾部末段恰恰是用来区分 `1` 与 `1/1` 的那段。所以父级走「可收缩 + 变暗 + 省略号」，
 * 末段固定不收缩，保证任何宽度下都能看清「自己是谁」。</p>
 *
 * @param path 目录路径
 * @return 父级路径（含尾部 `/`）；只有一级时返回空串
 */
function quickParent(path: string): string {
  const i = path.lastIndexOf("/");
  return i < 0 ? "" : `${path.slice(0, i)}/`;
}

/**
 * 快捷访问的末段（永不省略）
 *
 * @param path 目录路径
 * @return 路径最后一段；空串（根目录）返回「根目录」
 */
function quickLeaf(path: string): string {
  return path.slice(path.lastIndexOf("/") + 1) || "根目录";
}

/**
 * 从最近访问中剔除一个已失效的路径
 *
 * <p>导航是「先 {@link recordRecent} 落盘、再发列表请求」，所以请求失败时那条
 * 记录已经写进 localStorage 了。历史上分栏视图右键祖先列会用错路径导航，
 * 留下 {@code 1/1} 这种根本不存在的路径，侧边栏就多出一个与 {@code 1} 撞名的
 * 「1」。这里在加载失败时顺手清掉，让脏数据自愈而不是一直挂着。</p>
 *
 * @param path 目录路径
 */
function forgetRecent(path: string): void {
  if (!path || !recentPaths.value.includes(path)) {
    return;
  }
  recentPaths.value = recentPaths.value.filter((p) => p !== path);
  writeList(RECENT_KEY, recentPaths.value);
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
    loadError.value = "";
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "加载失败");
    objects.value = [];
    // 分栏渲染的是 colObjects 这份「每列一份」的缓存：成功分支会写它，失败分支不写的话
    // colObjects[currentPath] 会一直是 undefined，列头就永远停在「加载中…」——
    // 而此时 loading 已为 false、状态栏已显示 0 项，两处状态自相矛盾。
    // 这里与 ensureColumn 的失败分支保持同一口径：写空数组 + 错误文案。
    colObjects.value = { ...colObjects.value, [currentPath.value]: [] };
    colError.value = { ...colError.value, [currentPath.value]: (e as Error)?.message ?? "目录加载失败" };
    loadError.value = (e as Error)?.message ?? "目录加载失败";
    // 目录不存在（服务端 404）时顺手清掉最近访问里的这条脏记录，见 forgetRecent 的说明
    forgetRecent(currentPath.value);
    // 当前位置已失效：回落到根目录。这一步同时修掉「按桶记忆」的持久化残留——
    // 不回落的话，写进 localStorage 的 currentPath 仍是那个不存在的目录，
    // 每次刷新都会重新落进同一个 404 里，而 watch 会把回落后的值同步写回，
    // 于是坏记忆自动被覆盖成根目录。
    if (currentPath.value) {
      currentPath.value = "";
      recordHistory("");
    }
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
  selected.value = new Set(sortedObjects.value.map((i) => i.name));
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
/** 分栏每列的加载失败原因（key 为列路径，空串表示无错） */
const colError = ref<Record<string, string>>({});

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
    colError.value = { ...colError.value, [path]: "" };
  } catch (e) {
    // 加载失败不能一律当成空目录：服务端对不存在的目录返回 404（Directory Not Found），
    // 一旦吞掉就会把"路径拼错"伪装成"空文件夹"，界面上完全看不出发生过请求失败。
    colObjects.value = { ...colObjects.value, [path]: [] };
    colError.value = { ...colError.value, [path]: (e as Error)?.message ?? "目录加载失败" };
  } finally {
    colLoading.value = { ...colLoading.value, [path]: false };
  }
}

/** 清空并重新加载分栏各列 */
function refreshColumns(): void {
  colObjects.value = {};
  colError.value = {};
  segmentPaths.value.forEach((p) => { void ensureColumn(p); });
}

/**
 * 取某一列应当渲染的条目
 *
 * <p>分栏视图的列数据来自 {@link colObjects} 这份「每列一份」的缓存，
 * 而当前目录的列表是 {@link sortedObjects}，两者来源不同，必须分开取：
 * 拿当前目录那份套到每一列上，会把祖先列一起清空。</p>
 *
 * <p>这里<b>不做</b>任何过滤（搜索框已整行移除）。列的条目由
 * {@link ensureColumn} 负责按列路径加载，失败原因见 {@link colError}。</p>
 *
 * @param colPath 列对应的目录路径（空串表示根目录）
 * @return 该列应当渲染的条目列表；列尚未加载时返回空数组
 */
function columnItems(colPath: string): StorageObject[] {
  return colObjects.value[colPath] ?? [];
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

/**
 * 分栏视图右键：先把该列切成当前目录，再打开菜单
 *
 * <p>分栏视图与其它三个视图的根本差别在于：其它视图的行全部来自
 * {@code sortedObjects}（当前目录），而分栏视图把**祖先列**也一并渲染出来。
 * 菜单里的每个动作（打开/重命名/删除/复制/下载/解压/建链接）都以
 * {@code currentPath} 为基准计算对象键，若在祖先列上直接开菜单，
 * 基准目录比行的父目录更深，拼出的键就是错的——最轻的症状是「打开」拼出
 * 不存在的路径被服务端 404 吞成「空目录」，最重的症状是重命名/删除作用到
 * 另一个目录下的同名对象。</p>
 *
 * <p>因此这里不做"跨目录操作"，而是先对齐基准目录：{@code currentPath} 一变，
 * {@code segmentPaths} 随之重算，更深的列自动收起，界面与菜单的作用域一致。
 * 代价是右键祖先列会收起右侧列，但换来的是不会出现作用到错误目录的删除。</p>
 *
 * @param e       鼠标事件
 * @param row     对象
 * @param colPath 该行所属列的目录路径（空串表示根目录）
 */
function openColumnContextMenu(e: MouseEvent, row: StorageObject, colPath: string): void {
  e.stopPropagation();
  if (colPath !== currentPath.value) {
    currentPath.value = colPath;
    recordRecent(colPath);
    clearSelect();
    lastSelectedIndex = -1;
    void loadObjects();
  }
  openContextMenu(e, row);
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

/** 单个文件的允许上限：500MB（与上传框文案一致，选文件时就拦下） */
const UPLOAD_MAX_BYTES = 500 * 1024 * 1024;

/** 同时上传的并发数 */
const UPLOAD_CONCURRENCY = 3;

/** 上传项状态 */
type UploadStatus = "pending" | "uploading" | "done" | "error" | "paused";

/** 上传队列中的一项 */
interface UploadItem {
  /** 稳定唯一 id：同名文件允许重复添加，用递增序号区分 */
  id: string;
  /** 文件名 */
  name: string;
  /** 字节数 */
  size: number;
  /** 原始 File */
  file: File;
  /** 状态 */
  status: UploadStatus;
  /** 进度 0-100 */
  percent: number;
  /** 失败原因（status=error 时有值） */
  error: string;
  /** 中断句柄：暂停时 abort */
  controller: AbortController | null;
}

const uploadVisible = ref(false);
const uploadInput = ref<HTMLInputElement>();
/** 上传目标目录（可在弹框内「更换目录」，与 currentPath 解耦） */
const uploadTargetPath = ref("");
/** 上传队列 */
const uploadItems = ref<UploadItem[]>([]);
/** 是否正在上传（弹框底部按钮态） */
const uploading = ref(false);
/** 是否正在拖拽文件到页面（用于高亮遮罩） */
const dragging = ref(false);
/** 上传弹框内是否正在被拖放悬停 */
const uploadDropActive = ref(false);
/** 拖拽计数器：防止 dragover 反复触发 enter/leave */
let dragDepth = 0;
/** 队列自增序号，用于生成 id */
let uploadSeq = 0;
/** 当前并发中的上传数 */
let uploadRunning = 0;

/** 已完成数量 */
const uploadDoneCount = computed(() => uploadItems.value.filter((i) => i.status === "done").length);

/** 待传数量（未开始 + 已暂停） */
const uploadPendingCount = computed(
  () => uploadItems.value.filter((i) => i.status === "pending" || i.status === "paused").length
);

/** 是否还有可上传的项 */
const uploadHasPending = computed(() => uploadPendingCount.value > 0);

/** 上传目标目录展示文本（桶 / 路径） */
const uploadTargetText = computed(() => {
  const seg = uploadTargetPath.value ? uploadTargetPath.value.split("/") : [];
  return [bucket.value, ...seg].filter(Boolean).join(" / ");
});

/** 上传目标是否为桶根（根目录没有上一级，禁用「上一级」） */
const uploadTargetIsRoot = computed(() => uploadTargetPath.value === "");

/** 目录选择弹框 */
const uploadDirVisible = ref(false);
/** 目录选择树的根节点 */
const uploadTree = ref<TreeItem[]>([]);
/** 目录选择树加载中 */
const uploadTreeLoading = ref(false);
/** 目录选择中当前高亮的路径 */
const uploadDirCursor = ref("");

function openUpload(): void {
  uploadTargetPath.value = currentPath.value;
  uploadVisible.value = true;
}

function pickFiles(): void {
  uploadInput.value?.click();
}

/** 关闭上传弹框：还有没传完的项时先确认，避免白等 */
async function closeUpload(): Promise<void> {
  if (uploadItems.value.some((i) => i.status === "uploading" || i.status === "pending" || i.status === "paused")) {
    try {
      await ElMessageBox.confirm("还有文件未上传完成，确定关闭吗？未上传的文件将被丢弃。", "关闭上传", {
        type: "warning",
        confirmButtonText: "关闭",
        cancelButtonText: "继续上传",
      });
    } catch {
      return;
    }
    abortAllUploads();
  }
  uploadItems.value = [];
  uploadVisible.value = false;
  uploadDropActive.value = false;
  await loadObjects();
}

/** 中断全部进行中的上传（关闭弹框前调用） */
function abortAllUploads(): void {
  uploadItems.value.forEach((it) => {
    it.controller?.abort();
    it.controller = null;
  });
  uploadRunning = 0;
  uploading.value = false;
}

/**
 * 把选中的文件加入队列
 *
 * <p>只入队不立即上传，由「开始上传 / 全部开始」触发；超限文件当场拦下并提示，
 * 不进队列。</p>
 *
 * @param files 选中的文件
 */
function addUploadFiles(files: File[]): void {
  const tooLarge: string[] = [];
  const accepted: File[] = [];
  for (const f of files) {
    if (f.size > UPLOAD_MAX_BYTES) {
      tooLarge.push(f.name);
    } else {
      accepted.push(f);
    }
  }
  if (tooLarge.length) {
    ElMessage.error(`超过 500MB 上限：${tooLarge.join("、")}`);
  }
  if (!accepted.length) {
    return;
  }
  uploadItems.value = [
    ...uploadItems.value,
    ...accepted.map((f) => ({
      id: `u${(uploadSeq += 1)}`,
      name: f.name,
      size: f.size,
      file: f,
      status: "pending" as UploadStatus,
      percent: 0,
      error: "",
      controller: null,
    })),
  ];
}

/** 从队列移除一项（上传中的先中断） */
function removeUploadItem(item: UploadItem): void {
  item.controller?.abort();
  uploadItems.value = uploadItems.value.filter((i) => i.id !== item.id);
}

/** 找出队列中指定项的当前引用（数组整体替换后旧引用会失效） */
function findUploadItem(id: string): UploadItem | undefined {
  return uploadItems.value.find((i) => i.id === id);
}

/** 上传队列调度：并发不超过 {@link UPLOAD_CONCURRENCY}，有空闲就取下一个待传项 */
function pumpUploads(): void {
  uploading.value = uploadItems.value.some((i) => i.status === "uploading");
  while (uploadRunning < UPLOAD_CONCURRENCY) {
    const next = uploadItems.value.find((i) => i.status === "pending");
    if (!next) {
      break;
    }
    uploadRunning += 1;
    void runUpload(next.id);
  }
}

/**
 * 上传单个文件
 *
 * @param id 上传项 id
 */
async function runUpload(id: string): Promise<void> {
  const item = findUploadItem(id);
  if (!item) {
    uploadRunning = Math.max(0, uploadRunning - 1);
    return;
  }
  const controller = new AbortController();
  item.controller = controller;
  item.status = "uploading";
  item.error = "";
  item.percent = 0;
  try {
    await putObject(bucket.value, joinKey(uploadTargetPath.value, item.name), item.file, {
      signal: controller.signal,
      onProgress: (percent) => {
        const cur = findUploadItem(id);
        if (cur) {
          cur.percent = percent;
        }
      },
    });
    const cur = findUploadItem(id);
    if (cur) {
      cur.status = "done";
      cur.percent = 100;
    }
  } catch (e) {
    const cur = findUploadItem(id);
    if (cur) {
      if (isUploadAborted(e)) {
        // 暂停与关闭都会走这里：暂停保留进度供继续，关闭时整条队列已被丢弃
        cur.status = "paused";
        cur.controller = null;
      } else {
        cur.status = "error";
        cur.error = (e as Error)?.message ?? "上传失败";
        cur.controller = null;
      }
    }
  } finally {
    item.controller = null;
    uploadRunning = Math.max(0, uploadRunning - 1);
    pumpUploads();
    await loadObjects();
  }
}

/** 开始 / 继续全部待传项 */
function startAllUploads(): void {
  uploadItems.value.forEach((i) => {
    if (i.status === "paused") {
      i.status = "pending";
      i.percent = 0;
    }
  });
  pumpUploads();
}

/** 开始 / 继续单项 */
function startUploadItem(item: UploadItem): void {
  const cur = findUploadItem(item.id);
  if (!cur) {
    return;
  }
  cur.status = "pending";
  cur.percent = 0;
  cur.error = "";
  pumpUploads();
}

/**
 * 暂停一项
 *
 * <p>暂停即中断当前请求。后端不支持断点续传，所以「继续」是从头重传，
 * 进度会归零——这一点在按钮 title 里写明，不假装能续传。</p>
 *
 * @param item 上传项
 */
function pauseUploadItem(item: UploadItem): void {
  const cur = findUploadItem(item.id);
  if (!cur || cur.status !== "uploading") {
    return;
  }
  cur.controller?.abort();
}

/** 重试一项（失败后） */
function retryUploadItem(item: UploadItem): void {
  startUploadItem(item);
}

/* ---------- 上传目标目录选择 ---------- */

/** 打开目录选择弹框 */
async function openUploadDirPicker(): Promise<void> {
  uploadDirVisible.value = true;
  uploadDirCursor.value = uploadTargetPath.value;
  if (uploadTree.value.length) {
    return;
  }
  uploadTreeLoading.value = true;
  try {
    uploadTree.value = await getBucketTree(bucket.value);
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "目录树获取失败");
  } finally {
    uploadTreeLoading.value = false;
  }
}

/** 确认目录选择 */
function confirmUploadDir(): void {
  uploadTargetPath.value = uploadDirCursor.value;
  uploadDirVisible.value = false;
}

/** 目录树里逐级下钻（该路径有子节点才展开按钮） */
function uploadTreeChildren(path: string): TreeItem[] {
  if (!path) {
    return uploadTree.value;
  }
  const segs = path.split("/");
  let level = uploadTree.value;
  for (const s of segs) {
    const hit = level.find((n) => n.name === s);
    if (!hit) {
      return [];
    }
    level = hit.children ?? [];
  }
  return level;
}

/** 上传弹框内拖放悬停 */
function onUploadDragOver(e: DragEvent): void {
  if (!e.dataTransfer?.types.includes("Files")) {
    return;
  }
  e.preventDefault();
  e.dataTransfer.dropEffect = "copy";
  uploadDropActive.value = true;
}

function onUploadDragLeave(): void {
  uploadDropActive.value = false;
}

/** 拖放到上传弹框：加入队列而不是立刻上传 */
function onUploadDrop(e: DragEvent): void {
  if (!e.dataTransfer?.types.includes("Files")) {
    return;
  }
  e.preventDefault();
  uploadDropActive.value = false;
  addUploadFiles(Array.from(e.dataTransfer.files ?? []));
}

/** 选中文件后只入队，不自动开传 */
function handleFileChange(event: Event): void {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  input.value = "";
  addUploadFiles(files);
}

/** 执行上传：支持 FileList 与 DataTransferItem 的文件（页面级拖放，直接开传） */
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
const previewKey = ref("");
const previewZoom = ref(100);
const previewError = ref(false);
const iframeKey = ref(0);
const iframeLoading = ref(false);
/** 预览弹层外壳（关闭按钮 + 内容），兼作拖拽手柄 */
const previewShellRef = ref<HTMLElement | null>(null);
/** 拖拽中：只驱动光标样式，不参与位置计算 */
const previewDragging = ref(false);
/**
 * 预览弹层位移（px）
 *
 * <p>刻意用普通对象而不是 ref：位置直接写进弹层元素的 {@code transform}，
 * 走响应式反而多一次无用的渲染。语义与 Element Plus {@code useDraggable} 内部
 * 的 transform 一致。</p>
 */
const previewDragOffset = { x: 0, y: 0 };

/**
 * 取预览弹层根元素
 *
 * <p>{@code el-dialog} 的根节点由组件内部渲染，模板里拿不到 ref；
 * 关闭按钮与内容都包在 {@code .fs-preview-shell} 里，从它向上找最近的
 * {@code .el-dialog} 即可，不依赖弹层是第几个、也不受 append-to-body 影响。</p>
 *
 * @return 弹层根元素；弹层未渲染时返回 null
 */
function previewDialogEl(): HTMLElement | null {
  return previewShellRef.value?.closest(".el-dialog") ?? null;
}

/** 把当前位移写到弹层元素上 */
function applyPreviewDrag(): void {
  const el = previewDialogEl();
  if (el) {
    el.style.transform = `translate(${previewDragOffset.x}px, ${previewDragOffset.y}px)`;
  }
}

/**
 * 按下预览弹层即开始拖拽
 *
 * <p>不能用 {@code el-dialog} 自带的 {@code draggable}：它的手柄写死在
 * {@code <header>} 上（{@code hooks/use-draggable} 里 {@code dragRef.addEventListener("mousedown", ...)}），
 * 而本弹层为了无头已经把 header 置为 {@code display:none}，那个元素永远命中不到，
 * 开了 {@code draggable} 也是哑炮。所以这里自己接管，手柄换成内容外壳。</p>
 *
 * <p>iframe 内部（Excel / Word 的服务端渲染）的事件属于 iframe 自己的文档，
 * 不会冒泡到父文档，因此从预览内容正中按下拖不动——只能从内容边缘、
 * 图片区域或关闭按钮那一角拖。这是浏览器的同源限制，绕不开。</p>
 *
 * @param e 鼠标按下事件
 */
function startPreviewDrag(e: MouseEvent): void {
  // 只认主键；右键是留给文件/文件夹右键菜单的
  if (e.button !== 0) {
    return;
  }
  const el = previewDialogEl();
  if (!el) {
    return;
  }
  // 弹层内是 iframe / Office 组件，没有可选中的文本与图片，
  // 这里掐掉默认行为只是兜底，防止将来塞进 <img> 时拖出半透明幽灵图
  e.preventDefault();
  // Element 的按钮（重试 / 下载文件）自己不参与拖拽：它们按下即点，拖动语义靠鼠标点击。
  // 右上角那个自定义关闭按钮不在此列——它同时是边角抓手，拖动时 click 会因
  // mouseup 目标改变而自然取消，不会误关弹层。
  if ((e.target as HTMLElement | null)?.closest(".el-button")) {
    return;
  }
  previewDragging.value = true;
  const startX = e.clientX;
  const startY = e.clientY;
  const baseX = previewDragOffset.x;
  const baseY = previewDragOffset.y;

  const onMove = (ev: MouseEvent): void => {
    // rect 是**已应用当前 transform** 后的位置，所以边界要按基准位移换算：
    // 新位移 x 对应的屏幕左边 = r.left + (x - baseX)，据此反解上下限。
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const minX = baseX - r.left;
    const maxX = Math.max(minX, baseX + vw - r.right);
    // 弹层比视口还高时不能按「整层留在视口内」算边界（会得到 min>max 而瞬跳），
    // 与 Element Plus useDraggable 一致：只保证上边缘能被拖回视口内。
    const minY = baseY - r.top;
    const maxY = Math.max(minY, baseY + (r.height < vh ? vh - r.bottom : vh - r.top));
    previewDragOffset.x = Math.min(Math.max(baseX + ev.clientX - startX, minX), maxX);
    previewDragOffset.y = Math.min(Math.max(baseY + ev.clientY - startY, minY), maxY);
    applyPreviewDrag();
  };

  const onUp = (): void => {
    previewDragging.value = false;
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
  };

  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onUp);
}

// 每次打开都回到居中：上一次的位移不该带到这一次
watch(previewVisible, (open) => {
  if (!open) {
    return;
  }
  previewDragOffset.x = 0;
  previewDragOffset.y = 0;
  void nextTick(() => {
    const el = previewDialogEl();
    if (el) {
      el.style.transform = "";
    }
  });
});

async function openPreview(row: StorageObject): Promise<void> {
  previewName.value = row.name;
  previewKey.value = fullKey(row.name);
  previewZoom.value = 100;
  previewError.value = false;
  previewForceServer.value = false;
  previewInnerPath.value = "";
  officeLoading.value = false;
  iframeLoading.value = true;
  previewLoading.value = false;
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
 * 当前文件是否走压缩包面板（{@link ArchivePreviewPanel}）。
 *
 * 压缩包不进 iframe：那条通道渲染出的是一张独立 HTML 页面，读不到主应用的
 * Element Plus / koi 主题变量，跟不上暗色模式与品牌色。改为在主应用文档内
 * 渲染面板，结构数据走 {@code ?format=archive} 取。
 */
const previewIsArchive = computed(() => kindOf(previewName.value) === "archive");

/**
 * 压缩包内正在预览的条目路径（空串表示只看包结构）。
 *
 * 非空时从面板切到 iframe，用 {@code ?preview&inner=包内路径} 让后端
 * 提取该条目并按其类型渲染——压缩包只负责「结构」这一层，
 * 文件内容渲染仍复用既有通道，避免为每种格式再写一套。
 */
const previewInnerPath = ref("");

/** 是否展示压缩包面板（选中压缩包且未下钻到包内文件） */
const showArchivePanel = computed(
  () => previewIsArchive.value && previewInnerPath.value === "",
);

/** 预览包内条目：切到 iframe 通道渲染该文件 */
function openArchiveEntry(path: string): void {
  previewInnerPath.value = path;
  iframeLoading.value = true;
  iframeKey.value++;
}

/** 从包内文件返回压缩包结构面板 */
function backToArchive(): void {
  previewInnerPath.value = "";
  iframeLoading.value = true;
  iframeKey.value++;
}

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
 *
 * <p>预览压缩包内条目时追加 {@code inner=包内路径}，后端据此提取条目并按
 * 条目自身类型渲染（见 {@link openArchiveEntry}）。</p>
 */
const previewFrameSrc = computed(() => {
  const base = previewSrc.value;
  const sep = base.includes("?") ? "&" : "?";
  const server = previewForceServer.value ? `&render=${RENDER_SERVER}` : "";
  const inner = previewInnerPath.value ? `&inner=${encodeURIComponent(previewInnerPath.value)}` : "";
  return `${base}${sep}preview=true${server}${inner}${iframeKey.value > 0 ? `&_t=${iframeKey.value}` : ""}`;
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
  // 必须排在最前：视图/目录/排序都从这里恢复，后面所有播种都基于恢复后的值
  applyUiState(bucket.value);
  loadBucketConfig();
  loadCapabilities();
  // 播种初始历史：起始目录就是历史栈的第一条，否则后退/前进的索引会整体错位一格
  recordHistory(currentPath.value);
  loadObjects();
  loadRecycle();
  bindDragEvents();
});

// 界面状态变化即按当前桶落盘（切桶时由下面的 watch 负责先给旧桶补一次）
watch([viewMode, currentPath, sortKey, sortOrder], () => {
  writeUiState(bucket.value);
});

/**
 * 切换存储桶：旧桶落盘 → 套用新桶的界面状态 → 重新加载
 *
 * <p>分栏缓存 {@link colObjects} 必须一起清掉：它是按目录路径做 key 的，
 * 换桶后同名路径（如 `1`）指向的完全是另一个存储，不清就会显示旧桶的内容。</p>
 *
 * <p>当前版本还没有桶切换入口（{@code bucket} 只在初始化时从 URL / 默认桶赋值），
 * 所以这个 watch 暂时不会触发；带 {@code ?bucket=} 换桶走的是整页加载，
 * 由 {@link onMounted} 里的 {@link applyUiState} 负责恢复。这里先把切桶路径铺好，
 * 以后加切换器时「各自独立记忆」才不用重写。</p>
 */
watch(bucket, (now, prev) => {
  if (prev) {
    writeUiState(prev);
  }
  applyUiState(now);
  recordHistory(currentPath.value);
  refreshColumns();
  loadObjects();
  loadBucketConfig();
  loadCapabilities();
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
            <span class="fs-nav__label">
              <span v-if="quickParent(p)" class="fs-nav__label-parent">{{ quickParent(p) }}</span>
              <span class="fs-nav__label-leaf">{{ quickLeaf(p) }}</span>
            </span>
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

          <!-- 上传/下载：原在搜索工具栏那一行，该行按需求整行删除后并入路径栏尾部，
               保证上传入口不丢（那一整块曾被误删过一次，openUpload 一度成为孤儿） -->
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

        <!-- 搜索工具栏整行删除：搜索框已按需求移除，上传/下载并入上方路径栏尾部，
             其余操作仍在右键菜单里。这一行原本是页面唯一的搜索入口，
             删除后腾出的垂直空间全部让给文件列表（各视图行高同步调大）。 -->

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
              <div v-else-if="colError[colPath]" class="fs-col__hint fs-col__hint--error">{{ colError[colPath] }}</div>
              <div v-else-if="columnItems(colPath).length === 0" class="fs-col__hint">空目录</div>
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
                @contextmenu.stop="openColumnContextMenu($event, item, colPath)"
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
          <div v-if="sortedObjects.length === 0 && !loading" class="fs-files__empty">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            <span>{{ loadError || "当前目录为空" }}</span>
          </div>
          <div
            v-for="(item, index) in sortedObjects"
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
            <span v-if="showFormatCol" class="fs-details-row__type">{{ item.directory ? '文件夹' : fileTypeText(item.name) }}</span>
            <span v-if="showSizeCol" class="fs-details-row__size">{{ item.directory ? '-' : formatSize(item.size) }}</span>
            <span v-if="showTimeCol" class="fs-details-row__time">{{ formatTime(item.lastModified) }}</span>
          </div>
        </div>

        <!-- 大图标（Large Icons）- 使用 ?preview 渲染缩略图 -->
        <div v-else-if="viewMode === 'largeIcons'" class="fs-files fs-files--large" v-loading="loading" @contextmenu="openBlankContextMenu">
          <div v-if="sortedObjects.length === 0 && !loading" class="fs-files__empty">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            <span>{{ loadError || "当前目录为空" }}</span>
          </div>
          <div
            v-for="(item, index) in sortedObjects"
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
          <div v-if="sortedObjects.length === 0 && !loading" class="fs-files__empty">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            <span>{{ loadError || "当前目录为空" }}</span>
          </div>
          <div
            v-for="(item, index) in sortedObjects"
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
          <div v-if="sortedObjects.length === 0 && !loading" class="fs-files__empty">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            <span>{{ loadError || "当前目录为空" }}</span>
          </div>
          <div class="fs-files__small-list">
            <div
              v-for="(item, index) in sortedObjects"
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
            {{ nav === 'recycle' ? recycleCount : sortedObjects.length }} 个项{{ selectedCount > 0 ? `（已选 ${selectedCount} 项）` : '' }}
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

    <!-- ===== 上传对话框 =====
         队列式上传：选文件只入队，由「开始上传 / 全部开始」触发；
         关闭时若还有未完成项先确认，确认后中断全部请求。 -->
    <el-dialog
      v-model="uploadVisible"
      class="fs-up-dlg"
      width="720px"
      :append-to-body="true"
      destroy-on-close
      @closed="abortAllUploads"
    >
      <template #header>
        <div class="fs-up__head">
          <el-icon class="fs-up__head-icon" :size="18"><Upload /></el-icon>
          <span class="fs-up__head-title">上传文件</span>
        </div>
      </template>

      <div class="fs-up">
        <div class="fs-up__bar">
          <span class="fs-up__bar-label">上传至</span>
          <span class="fs-up__chip" :title="uploadTargetText">
            <el-icon :size="15"><Folder /></el-icon>
            <b>{{ bucket }}</b>
            <template v-if="uploadTargetPath">
              <span class="fs-up__chip-sep">/</span>
              <span class="fs-up__chip-path">{{ uploadTargetPath }}</span>
            </template>
          </span>
          <button type="button" class="fs-up__pick" @click="openUploadDirPicker">
            <el-icon :size="15"><FolderOpened /></el-icon>更换目录
          </button>
        </div>

        <div
          class="fs-up__drop"
          :class="{ 'is-active': uploadDropActive }"
          role="button"
          tabindex="0"
          @click="pickFiles"
          @keydown.enter="pickFiles"
          @dragover="onUploadDragOver"
          @dragleave="onUploadDragLeave"
          @drop="onUploadDrop"
        >
          <el-icon class="fs-up__drop-icon" :size="52"><UploadFilled /></el-icon>
          <p class="fs-up__drop-title">点击选择文件，或拖拽文件到此处</p>
          <p class="fs-up__drop-sub">支持多文件同时上传，单个文件不超过 500MB</p>
          <p class="fs-up__drop-hint">支持 JPG、PNG、PDF、DOCX、ZIP 等格式</p>
        </div>
        <input ref="uploadInput" type="file" multiple hidden @change="handleFileChange" />

        <div v-if="uploadItems.length" class="fs-up__queue">
          <div class="fs-up__queue-head">
            <span>待上传文件（{{ uploadItems.length }}）</span>
            <button type="button" class="fs-up__link" :disabled="!uploadHasPending" @click="startAllUploads">全部开始</button>
          </div>
          <ul class="fs-up__list">
            <li v-for="item in uploadItems" :key="item.id" class="fs-up__row" :class="`is-${item.status}`">
              <span class="fs-typeicon fs-up__row-icon" v-html="fileSvg(item.name, false)" aria-hidden="true" />
              <span class="fs-up__row-name" :title="item.name">{{ item.name }}</span>
              <span class="fs-up__row-size">{{ formatSize(item.size) }}</span>
              <span class="fs-up__row-tail">
                <template v-if="item.status === 'uploading'">
                  <span class="fs-up__track"><i class="fs-up__fill" :style="{ width: item.percent + '%' }" /></span>
                  <b class="fs-up__pct">{{ item.percent }}%</b>
                  <button type="button" class="fs-up__row-btn" title="暂停" @click="pauseUploadItem(item)">
                    <el-icon :size="15"><VideoPause /></el-icon>
                  </button>
                </template>
                <template v-else-if="item.status === 'done'">
                  <span class="fs-up__done"><el-icon :size="15"><CircleCheck /></el-icon>已完成</span>
                </template>
                <template v-else-if="item.status === 'error'">
                  <span class="fs-up__err" :title="item.error">上传失败</span>
                  <button type="button" class="fs-up__row-btn" title="重试" @click="retryUploadItem(item)">
                    <el-icon :size="15"><Refresh /></el-icon>
                  </button>
                </template>
                <template v-else-if="item.status === 'paused'">
                  <span class="fs-up__paused" title="后端不支持断点续传，继续会从头上传">已暂停</span>
                  <button type="button" class="fs-up__row-btn" title="继续（从头上传）" @click="startUploadItem(item)">
                    <el-icon :size="15"><VideoPlay /></el-icon>
                  </button>
                </template>
                <template v-else>
                  <span class="fs-up__wait">等待中</span>
                </template>
                <button type="button" class="fs-up__row-btn is-danger" title="移除" @click="removeUploadItem(item)">
                  <el-icon :size="15"><Delete /></el-icon>
                </button>
              </span>
            </li>
          </ul>
        </div>
      </div>

      <template #footer>
        <span class="fs-up__stat">已完成 {{ uploadDoneCount }}/{{ uploadItems.length }}</span>
        <el-button @click="closeUpload">取消</el-button>
        <el-button type="primary" :icon="Upload" :loading="uploading" :disabled="!uploadHasPending" @click="startAllUploads">
          开始上传
        </el-button>
      </template>
    </el-dialog>

    <!-- ===== 上传目标目录选择 ===== -->
    <el-dialog
      v-model="uploadDirVisible"
      class="fs-updir-dlg"
      width="420px"
      :append-to-body="true"
    >
      <template #header>
        <div class="fs-up__head">
          <el-icon class="fs-up__head-icon" :size="18"><FolderOpened /></el-icon>
          <span class="fs-up__head-title">更换上传目录</span>
        </div>
      </template>
      <div class="fs-updir">
        <div class="fs-updir__cur">
          <el-icon :size="15"><Folder /></el-icon>
          <span :title="uploadDirCursor || '根目录'">{{ uploadDirCursor || "根目录" }}</span>
        </div>
        <div class="fs-updir__list" v-loading="uploadTreeLoading">
          <button
            v-if="uploadDirCursor"
            type="button"
            class="fs-updir__item is-up"
            @click="uploadDirCursor = uploadDirCursor.split('/').slice(0, -1).join('/')"
          >
            <el-icon :size="15"><ArrowLeft /></el-icon>上一级
          </button>
          <div v-if="!uploadTreeLoading && !uploadTreeChildren(uploadDirCursor).length" class="fs-updir__empty">
            此目录下没有子目录，可直接上传到当前目录
          </div>
          <button
            v-for="d in uploadTreeChildren(uploadDirCursor)"
            :key="d.path"
            type="button"
            class="fs-updir__item"
            @click="uploadDirCursor = d.path"
          >
            <el-icon :size="15"><Folder /></el-icon>{{ d.name }}
          </button>
        </div>
      </div>
      <template #footer>
        <el-button @click="uploadDirVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmUploadDir">确定</el-button>
      </template>
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

    <!-- ===== 预览弹层（无头弹框）=====
         不传 title、不给 header 插槽、show-close=false，文件名/类型/大小/修改时间一并不显示：
         预览是为内容服务的，腾出的空间全给内容。
         注意 element-plus 2.14.3 的 <header> 是无条件渲染的，光不给 title 压不掉那圈内边距，
         真正让它消失的是非 scoped 块里的 `.fs-preview-dlg .el-dialog__header { display: none }`；
         关闭按钮浮在右上角（.fs-preview__close）。 -->
    <el-dialog
      v-model="previewVisible"
      class="fs-preview-dlg"
      width="min(1200px, 92vw)"
      :show-close="false"
      :append-to-body="true"
      :close-on-click-modal="true"
      destroy-on-close
      @closed="retryPreview"
    >
      <!-- 拖拽外壳：内容区几乎全被 iframe 占满，而 iframe 内的鼠标事件不会冒泡到父文档，
           顶部留出的 14px 空条是唯一处处可抓的位置；右上角关闭按钮那一角同样可抓。 -->
      <div
        ref="previewShellRef"
        class="fs-preview-shell"
        :class="{ 'is-dragging': previewDragging }"
        @mousedown="startPreviewDrag"
      >
        <!-- 压缩包面板自带头部（含关闭按钮），故此处的浮动关闭按钮在压缩包模式下隐藏，
             否则同一位置会出现两个 ✕ 叠在一起。 -->
        <button
          v-if="!showArchivePanel"
          type="button"
          class="fs-preview__close"
          title="关闭"
          aria-label="关闭预览"
          @click="previewVisible = false"
        ><el-icon :size="18"><Close /></el-icon></button>
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
          <!-- 下钻到压缩包内文件后的返回条：包结构由面板渲染，文件内容走 iframe，
               这里补一条回到面板的路径，否则用户只能关掉弹层重开。 -->
          <div
            v-if="!previewError && previewIsArchive && previewInnerPath"
            class="fs-preview__inner-bar"
          >
            <el-button :icon="ArrowLeft" text @click="backToArchive">返回压缩包</el-button>
            <span class="fs-preview__inner-path" :title="previewInnerPath">{{ previewInnerPath }}</span>
          </div>
          <ArchivePreviewPanel
            v-if="!previewError && showArchivePanel"
            :bucket="bucket"
            :object-key="previewKey"
            :file-name="previewName"
            @open-entry="openArchiveEntry"
            @close="previewVisible = false"
          />
          <PreviewOfficePanel
            v-else-if="!previewError && previewUsesClient && !previewForceServer"
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

/* 注：本块（.fs-top / .fs-searchbox / .fs-ghost-btn / .fs-upload-btn）原本服务于
   已被移出模板的旧顶栏，搜索框删除后整体不再有引用，属于改动前就存在的死样式。 */
.fs-top {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 12px;
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
  min-width: 0;
  display: flex;
  align-items: baseline;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
}

/* 父级：空间不够时从这里省略号截断，末段始终保留 */
.fs-nav__label-parent {
  flex-shrink: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--el-text-color-placeholder);
}

.fs-nav__label-leaf {
  flex-shrink: 0;
  color: inherit;
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
  height: 48px;
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
  width: 54px;
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fs-md-card__thumb svg {
  width: 48px;
  height: 48px;
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
  height: 40px;
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
/* 拖拽外壳：顶部 14px 空条是保证可抓的位置（内容被 iframe 占满，抓不到）。
   cursor 跟随拖拽态变化，让「这里能拖」这件事在按下之前就看得出来。 */
.fs-preview-shell {
  padding-top: 14px;
  cursor: move;
}

.fs-preview-shell.is-dragging {
  cursor: grabbing;
}

/* 关闭按钮：浮在弹层右上角。.el-dialog 自带 position: relative，
   这里的 absolute 锚点是弹层本身（外壳是 static，不参与定位），
   所以按钮仍贴着弹层边框，不随外壳的 14px 内边距缩进。
   位置对应 .fs-preview-dlg.el-dialog 被去掉的 16px padding，尽量不压住内容。 */
.fs-preview__close {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 6;
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: color var(--el-transition-duration, 0.2s), background var(--el-transition-duration, 0.2s);
}

.fs-preview__close:hover {
  background: var(--el-fill-color-dark);
  color: var(--el-color-primary);
}

.fs-preview__close:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}

.fs-preview {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

/* 压缩包面板撑满可用宽度：.fs-preview 是 align-items:center 的列 flex，
   子元素默认按内容宽度收缩，面板必须显式拉满（stretch）。 */
.fs-preview > :deep(.arc) {
  align-self: stretch;
}

/* 下钻包内文件后的返回条：与面板同一套 koi 变量，不引入新的色值或圆角档位 */
.fs-preview__inner-bar {
  align-self: stretch;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 6px 4px 4px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-bg-color);
}

.fs-preview__inner-path {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

/* 上传/下载按钮：原先挂在搜索工具栏上，该行删除后并入路径栏尾部，样式沿用 */
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

/* 目录加载失败（如路径不存在被服务端 404）：必须与「空目录」视觉可区分 */
.fs-col__hint--error {
  color: var(--el-color-danger);
  word-break: break-all;
}

.fs-col__row {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
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

/* 缩略图：搜索工具栏整行删除后腾出垂直空间，这里把大图标整体放大一档 */
.fs-lg-card__thumb {
  width: 74px;
  height: 74px;
}

.fs-lg-card__thumb svg {
  width: 68px;
  height: 68px;
}

.fs-lg-card__thumb .fs-card-icon {
  font-size: 68px;
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

/* ── 预览弹层外壳（无头弹框，append-to-body 需非 scoped）──
 * 模板里不传 title、不给 header 插槽、show-close=false。但 element-plus 2.14.3 的
 * dialog-content 是**无条件**渲染 <header class="el-dialog__header"> 的
 * （没有 shouldShowHeader 判定，slot 没内容时只是渲染一个空的 title span），
 * 而该 header 自带 padding-bottom: var(--el-dialog-padding-primary)（16px），
 * 叠加 .el-dialog 自身的 16px padding，框顶会空出 32px——正是要去掉的那个「头」。
 * 所以这里显式 display:none，而不是指望不给 title 就等于没有 header。
 * 关闭按钮由 .fs-preview__close 浮在右上角。 */
.fs-preview-dlg.el-dialog {
  border-radius: var(--el-radius-lg, 12px);
  overflow: hidden;
  /* 自己的 16px padding 去掉：既然无头，就不该在内容外面再套一圈留白，
     关闭按钮正好落进这块被去掉的留白里，不额外遮挡内容 */
  padding: 0;
}

.fs-preview-dlg .el-dialog__header {
  display: none;
}

.fs-preview-dlg .el-dialog__body {
  padding: 12px 14px 14px;
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
