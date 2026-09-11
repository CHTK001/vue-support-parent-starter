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
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Back,
  Delete,
  Document,
  Download,
  Folder,
  FolderOpened,
  Link,
  Refresh,
  Search,
  Upload,
  Grid,
  List,
  Setting,
} from "@element-plus/icons-vue";
import {
  DEFAULT_BUCKET,
  DEFAULT_SERVER,
  createOneTimeLink,
  deleteObject,
  existObject,
  fetchObjectText,
  getBucketConfig,
  getDefaultBucket,
  getServerBase,
  listObjects,
  objectUrl,
  putObject,
  setDefaultBucket,
} from "../api/filestorageApi";
import type { BucketConfig, StorageObject } from "../api/filestorageApi";
import PreviewIframePanel from "../components/PreviewIframePanel.vue";
import PreviewImagePanel from "../components/PreviewImagePanel.vue";

/** 预览类型 */
type PreviewKind = "image" | "text" | "pdf" | "office" | "video" | "audio" | "font" | "unknown";

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
/** 视图模式：grid=网格卡片 / list=紧凑列表 */
const viewMode = ref<"grid" | "list">("grid");
/** 当前右键菜单 */
const ctxMenu = ref<{ visible: boolean; x: number; y: number; row: StorageObject | null }>({ visible: false, x: 0, y: 0, row: null });
/** 存储桶公开配置（?format=config） */
const bucketConfig = ref<BucketConfig | null>(null);
/** 存储桶配置加载状态 */
const configLoading = ref(false);

const breadcrumbs = computed(() => {
  const segments = currentPath.value ? currentPath.value.split("/") : [];
  return [{ name: "全部文件", path: "" }, ...segments.map((name, index) => ({
    name,
    path: segments.slice(0, index + 1).join("/"),
  }))];
});

const filteredObjects = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  if (!kw) return objects.value;
  return objects.value.filter((item) => item.name.toLowerCase().includes(kw));
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
  return "unknown";
}

/** 根据扩展名返回 SVG 图标类名（用于网格模式大图标） */
function fileIconClass(name: string, isDir: boolean): string {
  if (isDir) return "icon-folder";
  const ext = name.slice(name.lastIndexOf(".") + 1).toLowerCase();
  if (["png", "jpg", "jpeg", "gif", "svg", "webp", "bmp"].includes(ext)) return "icon-image";
  if (["mp4", "webm", "mov", "avi", "mkv"].includes(ext)) return "icon-video";
  if (["mp3", "wav", "flac", "m4a"].includes(ext)) return "icon-audio";
  if (ext === "pdf") return "icon-pdf";
  if (["xlsx", "xls", "docx", "doc", "pptx", "ppt"].includes(ext)) return "icon-office";
  if (["zip", "tar", "gz", "rar", "7z"].includes(ext)) return "icon-archive";
  return "icon-file";
}

function fullKey(name: string): string {
  return currentPath.value ? `${currentPath.value}/${name}` : name;
}

/* ================== 目录导航 ================== */

async function loadObjects(): Promise<void> {
  loading.value = true;
  try {
    objects.value = await listObjects(bucket.value, currentPath.value);
    setDefaultBucket(bucket.value);
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "加载失败");
    objects.value = [];
  } finally {
    loading.value = false;
  }
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

/* ================== 上传 ================== */

const uploadVisible = ref(false);
const uploading = ref(false);
const uploadInput = ref<HTMLInputElement>();

function openUpload(): void { uploadVisible.value = true; }
function pickFiles(): void { uploadInput.value?.click(); }

async function handleFileChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  input.value = "";
  if (!files.length) return;
  uploading.value = true;
  let success = 0;
  try {
    for (const f of files) {
      await putObject(bucket.value, fullKey(f.name), f);
      success++;
    }
    ElMessage.success(`上传成功 ${success} 个文件`);
    uploadVisible.value = false;
    await loadObjects();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "上传失败");
  } finally {
    uploading.value = false;
  }
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
  try { await ElMessageBox.confirm(`确认删除「${row.name}」？`, "删除确认", { type: "warning" }); } catch { return; }
  try { await deleteObject(bucket.value, fullKey(row.name)); ElMessage.success("删除成功"); await loadObjects(); }
  catch (e) { ElMessage.error((e as Error)?.message ?? "删除失败"); }
}

/* ================== 一次性链接 ================== */

const oneTimeVisible = ref(false);
const oneTimeLink = ref("");
const oneTimeExpiry = ref(600);
const oneTimeExpiryOptions = [
  { label: "1 分钟", value: 60 }, { label: "10 分钟", value: 600 },
  { label: "30 分钟", value: 1800 }, { label: "1 小时", value: 3600 },
  { label: "6 小时", value: 21600 }, { label: "1 天", value: 86400 },
];
const oneTimeGenerating = ref(false);
const oneTimeTarget = ref<{ name: string; key: string }>();

function openOneTime(row: StorageObject): void {
  if (row.directory) { ElMessage.warning("目录不支持生成一次性链接"); return; }
  oneTimeTarget.value = { name: row.name, key: fullKey(row.name) };
  oneTimeLink.value = "";
  oneTimeExpiry.value = 600;
  oneTimeVisible.value = true;
}

async function generateOneTimeLink(): Promise<void> {
  if (!oneTimeTarget.value) return;
  oneTimeGenerating.value = true;
  try {
    const res = await createOneTimeLink(bucket.value, oneTimeTarget.value.key, oneTimeExpiry.value);
    oneTimeLink.value = `${getServerBase().replace(/\/+$/, "")}${res.url}`;
    ElMessage.success("一次性链接已生成（仅可访问一次）");
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
});
</script>

<template>
  <div class="fs-app" @click="closeContextMenu">
    <!-- ===== 顶部工具栏 ===== -->
    <header class="fs-header">
      <div class="fs-brand">
        <svg class="fs-logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" fill="currentColor" stroke="none" opacity="0.12"/>
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        <span>FileStorage</span>
        <span class="fs-bucket-badge" :title="`存储桶：${bucket}`">{{ bucket }}</span>
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
        <div class="fs-toolbar-sep" aria-hidden="true" />
        <div class="fs-view-toggle" role="group" aria-label="视图切换">
          <button
            type="button"
            class="fs-view-btn"
            :class="{ 'fs-view-btn--active': viewMode === 'grid' }"
            title="网格视图"
            :aria-label="'网格视图'"
            :aria-pressed="viewMode === 'grid'"
            @click="viewMode = 'grid'"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7" rx="1.5"/>
              <rect x="14" y="3" width="7" height="7" rx="1.5"/>
              <rect x="3" y="14" width="7" height="7" rx="1.5"/>
              <rect x="14" y="14" width="7" height="7" rx="1.5"/>
            </svg>
          </button>
          <button
            type="button"
            class="fs-view-btn"
            :class="{ 'fs-view-btn--active': viewMode === 'list' }"
            title="列表视图"
            :aria-label="'列表视图'"
            :aria-pressed="viewMode === 'list'"
            @click="viewMode = 'list'"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <line x1="8" y1="6" x2="21" y2="6"/>
              <line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/>
              <line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          </button>
        </div>
        <button type="button" class="fs-btn fs-btn--ghost" :class="{ 'fs-btn--loading': loading }" :disabled="loading" @click="loadObjects">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><polyline points="21 3 21 9 15 9"/></svg>
          刷新
        </button>
        <button type="button" class="fs-btn fs-btn--primary" @click="openUpload">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          上传
        </button>
      </div>
    </header>

    <!-- ===== 主体区域 ===== -->
    <div class="fs-body">
      <!-- 左侧边栏 -->
      <aside class="fs-sidebar">
        <div class="fs-sidebar__section">
          <div class="fs-sidebar__title">存储桶</div>
          <div class="fs-sidebar__item active">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            <span>{{ bucket }}</span>
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
        <!-- 路径栏 -->
        <div class="fs-pathbar">
          <button type="button" class="fs-icon-btn" :disabled="!currentPath" title="返回上一级" :aria-label="'返回上一级'" @click="goUp">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
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
          <span class="fs-pathbar__count">{{ filteredObjects.length }} 项</span>
        </div>

        <!-- 网格视图 -->
        <div v-if="viewMode === 'grid'" class="fs-files fs-files--grid" v-loading="loading">
          <div
            v-for="item in filteredObjects"
            :key="item.name"
            class="fs-card"
            :class="{ 'fs-card--selected': ctxMenu.visible && ctxMenu.row?.name === item.name }"
            role="button"
            tabindex="0"
            :aria-label="item.directory ? `打开目录 ${item.name}` : `文件 ${item.name}`"
            @click="item.directory ? enterDir(item) : null"
            @dblclick="item.directory ? enterDir(item) : openPreview(item)"
            @keydown.enter="item.directory ? enterDir(item) : openPreview(item)"
            @contextmenu="openContextMenu($event, item)"
          >
            <div class="fs-card__icon" :class="fileIconClass(item.name, item.directory)">
              <!-- 目录 SVG -->
              <svg v-if="item.directory" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M20 6h-8l-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zm0 12H4V8h16z"/>
              </svg>
              <!-- 文件 SVG -->
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <div class="fs-card__name" :title="item.name">{{ item.name }}</div>
            <div class="fs-card__meta">
              <span v-if="!item.directory">{{ formatSize(item.size) }}</span>
              <span v-if="item.lastModified" class="fs-card__date">{{ formatTime(item.lastModified) }}</span>
            </div>
          </div>
          <div v-if="!loading && filteredObjects.length === 0" class="fs-files__empty">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            <span>当前目录为空</span>
            <small>点击右上角「上传」添加文件</small>
          </div>
        </div>

        <!-- 列表视图 -->
        <div v-else class="fs-files fs-files--list" v-loading="loading">
          <div class="fs-table-head">
            <span class="fs-table-head__name">名称</span>
            <span class="fs-table-head__size">大小</span>
            <span class="fs-table-head__time">修改时间</span>
            <span class="fs-table-head__actions">操作</span>
          </div>
          <div
            v-for="item in filteredObjects"
            :key="item.name"
            class="fs-table-row"
            :class="{ 'fs-table-row--selected': ctxMenu.visible && ctxMenu.row?.name === item.name }"
            role="button"
            tabindex="0"
            :aria-label="item.name"
            @click="item.directory ? enterDir(item) : null"
            @dblclick="item.directory ? enterDir(item) : openPreview(item)"
            @keydown.enter="item.directory ? enterDir(item) : openPreview(item)"
            @contextmenu="openContextMenu($event, item)"
          >
            <span class="fs-table-row__name">
              <svg v-if="item.directory" class="fs-table-row__icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M20 6h-8l-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zm0 12H4V8h16z"/>
              </svg>
              <svg v-else class="fs-table-row__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <span :class="{ 'fs-name--dir': item.directory }">{{ item.name }}</span>
            </span>
            <span class="fs-table-row__size">{{ item.directory ? '-' : formatSize(item.size) }}</span>
            <span class="fs-table-row__time">{{ formatTime(item.lastModified) }}</span>
            <span class="fs-table-row__actions">
              <button v-if="item.directory" type="button" class="fs-link-btn" @click.stop="enterDir(item)">打开</button>
              <template v-else>
                <button v-if="allowPreview" type="button" class="fs-link-btn" @click.stop="openPreview(item)">预览</button>
                <button v-if="allowDownload" type="button" class="fs-link-btn" @click.stop="handleDownload(item)">下载</button>
                <button type="button" class="fs-link-btn" @click.stop="openOneTime(item)">一次性链接</button>
              </template>
              <button type="button" class="fs-link-btn fs-link-btn--danger" @click.stop="handleDelete(item)">删除</button>
            </span>
          </div>
          <div v-if="!loading && filteredObjects.length === 0" class="fs-files__empty">当前目录为空</div>
        </div>
      </main>
    </div>

    <!-- ===== 右键菜单 ===== -->
    <Teleport to="body">
      <div
        v-if="ctxMenu.visible"
        class="fs-ctx"
        :style="{ left: ctxMenu.x + 'px', top: ctxMenu.y + 'px' }"
        @click.stop
      >
        <template v-if="ctxMenu.row">
          <div class="fs-ctx__item" @click="ctxAction(ctxMenu.row!.directory ? 'open' : 'preview')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            {{ ctxMenu.row!.directory ? '打开' : allowPreview ? '预览' : '打开' }}
          </div>
          <div v-if="!ctxMenu.row!.directory && allowDownload" class="fs-ctx__item" @click="ctxAction('download')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            下载
          </div>
          <div v-if="!ctxMenu.row!.directory" class="fs-ctx__item" @click="ctxAction('onetime')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            一次性链接
          </div>
          <div v-if="!ctxMenu.row!.directory" class="fs-ctx__item" @click="ctxAction('delete')" style="color:var(--el-color-danger)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            删除
          </div>
        </template>
      </div>
    </Teleport>

    <!-- ===== 上传对话框 ===== -->
    <el-dialog v-model="uploadVisible" title="上传文件" width="440px" :append-to-body="true" destroy-on-close>
      <el-alert v-if="currentPath" :title="`上传至 ${bucket}/${currentPath}/`" type="info" :closable="false" class="mb-3" />
      <el-button type="primary" :icon="Upload" :loading="uploading" @click="pickFiles">选择文件（可多选）</el-button>
      <input ref="uploadInput" type="file" multiple hidden @change="handleFileChange" />
    </el-dialog>

    <!-- ===== 一次性链接对话框 ===== -->
    <el-dialog v-model="oneTimeVisible" :title="`生成一次性链接 — ${oneTimeTarget?.name ?? ''}`" width="440px" :append-to-body="true" destroy-on-close>
      <el-form label-width="80px">
        <el-form-item label="过期时间">
          <el-select v-model="oneTimeExpiry" placeholder="选择过期时间" style="width:100%">
            <el-option v-for="opt in oneTimeExpiryOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
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
      <el-alert v-if="oneTimeLink" type="warning" :closable="false" title="该链接只能访问一次，访问后立即销毁，过期自动失效" class="mt-3" />
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
          <PreviewImagePanel ref="imagePanelRef" v-model:zoom="previewZoom" :src="previewSrc + (iframeKey > 0 ? '?_t=' + iframeKey : '')" :alt="previewName" @fullscreen="toggleFullscreen()" @load="previewLoading = false" @error="previewError = true" />
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
/* ===== 全局布局 ===== */
.fs-app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif;
  background: #f5f5f7;
  color: #1d1d1f;
  overflow: hidden;
}

/* ===== 顶部工具栏 ===== */
.fs-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 20px;
  height: 52px;
  background: rgba(250, 250, 252, 0.72);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.fs-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #1d1d1f;
  white-space: nowrap;
}

.fs-logo {
  width: 22px;
  height: 22px;
  color: #0a84ff;
}

.fs-header__right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
}

.fs-search { width: 180px; }
.fs-search :deep(.el-input__wrapper) {
  background: rgba(120, 120, 128, 0.08);
  border-radius: 8px;
  border: 1px solid transparent;
  box-shadow: none;
}
.fs-search :deep(.el-input__wrapper:hover) { background: rgba(120, 120, 128, 0.12); }
.fs-search :deep(.el-input__wrapper.is-focus) {
  border-color: #0a84ff;
  box-shadow: 0 0 0 3px rgba(10, 132, 255, 0.18);
}

.fs-view-toggle :deep(.el-button) { padding: 5px 10px; }

/* ===== 侧边栏 ===== */
.fs-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.fs-sidebar {
  width: 200px;
  flex-shrink: 0;
  padding: 16px 12px;
  background: rgba(255, 255, 255, 0.5);
  border-right: 1px solid rgba(0, 0, 0, 0.06);
  overflow-y: auto;
}

.fs-sidebar__section { margin-bottom: 20px; }

.fs-sidebar__title {
  font-size: 11px;
  font-weight: 600;
  color: #86868b;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  padding: 0 8px;
  margin-bottom: 8px;
}

.fs-sidebar__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  color: #1d1d1f;
  transition: background 0.15s;
}
.fs-sidebar__item:hover { background: rgba(0, 0, 0, 0.05); }
.fs-sidebar__item.active { background: rgba(10, 132, 255, 0.12); color: #0a84ff; font-weight: 500; }
.fs-sidebar__item svg { flex-shrink: 0; color: inherit; }

.fs-sidebar__stat {
  display: flex;
  justify-content: space-between;
  padding: 5px 8px;
  font-size: 12px;
  color: #1d1d1f;
}
.fs-sidebar__stat span { color: #86868b; }

.fs-sidebar__path {
  padding: 8px;
  font-size: 12px;
  color: #86868b;
  word-break: break-all;
  line-height: 1.5;
}

/* ===== 主内容区 ===== */
.fs-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ===== 面包屑路径栏 ===== */
.fs-pathbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  background: rgba(250, 250, 252, 0.6);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  font-size: 13px;
}
.fs-pathbar__crumbs { flex: 1; display: flex; flex-wrap: wrap; gap: 4px; align-items: center; overflow: hidden; }
.fs-pathbar__sep { color: #c7c7cc; }
.fs-pathbar__item { cursor: pointer; color: #0a84ff; padding: 2px 6px; border-radius: 6px; transition: background 0.15s; }
.fs-pathbar__item:hover { background: rgba(10, 132, 255, 0.1); }
.fs-pathbar__item--active { color: #1d1d1f; font-weight: 600; cursor: default; }
.fs-pathbar__item--active:hover { background: transparent; }
.fs-pathbar__count { color: #86868b; font-size: 12px; white-space: nowrap; }

/* ===== 文件区域 ===== */
.fs-files {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px 32px;
}

/* —— 网格视图 —— */
.fs-files--grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 12px;
  align-content: start;
}

.fs-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 10px 12px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.18s ease;
  user-select: none;
}
.fs-card:hover { box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06); transform: translateY(-1px); }
.fs-card--selected { outline: 2px solid #0a84ff; background: rgba(10, 132, 255, 0.04); }

.fs-card__icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}
.fs-card__icon svg { width: 36px; height: 36px; }

.fs-card__icon.icon-folder { color: #0a84ff; background: rgba(10, 132, 255, 0.1); }
.fs-card__icon.icon-image { color: #34c759; background: rgba(52, 199, 89, 0.1); }
.fs-card__icon.icon-video { color: #af52de; background: rgba(175, 82, 222, 0.1); }
.fs-card__icon.icon-audio { color: #ff9f0a; background: rgba(255, 159, 10, 0.1); }
.fs-card__icon.icon-pdf { color: #ff3b30; background: rgba(255, 59, 48, 0.1); }
.fs-card__icon.icon-office { color: #007aff; background: rgba(0, 122, 255, 0.1); }
.fs-card__icon.icon-archive { color: #8e8e93; background: rgba(142, 142, 147, 0.1); }
.fs-card__icon.icon-file { color: #636366; background: rgba(99, 99, 102, 0.08); }

.fs-card__name {
  width: 100%;
  text-align: center;
  font-size: 12px;
  font-weight: 500;
  color: #1d1d1f;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fs-card__meta {
  display: flex;
  gap: 6px;
  font-size: 11px;
  color: #86868b;
}

/* —— 列表视图 —— */
.fs-files--list { padding: 0 0 20px; }
.fs-table-head,
.fs-table-row {
  display: grid;
  grid-template-columns: 1fr 100px 160px 220px;
  align-items: center;
  gap: 12px;
  padding: 0 20px;
}
.fs-table-head {
  position: sticky;
  top: 0;
  background: #f5f5f7;
  z-index: 5;
  font-size: 11px;
  font-weight: 600;
  color: #86868b;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  padding-top: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}
.fs-table-row {
  padding-top: 10px;
  padding-bottom: 10px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s;
  font-size: 13px;
}
.fs-table-row:hover { background: rgba(0, 0, 0, 0.035); }
.fs-table-row--selected { background: rgba(10, 132, 255, 0.08); }

.fs-table-row__name {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  overflow: hidden;
}
.fs-table-row__name span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.fs-table-row__icon { width: 18px; height: 18px; flex-shrink: 0; color: #636366; }
.fs-table-row__icon:first-child { color: #0a84ff; }
.fs-name--dir { font-weight: 500; color: #0a84ff; }
.fs-table-row__size { color: #86868b; font-size: 12px; text-align: right; }
.fs-table-row__time { color: #86868b; font-size: 12px; }
.fs-table-row__actions { display: flex; gap: 2px; justify-content: flex-end; }

/* —— 空状态 —— */
.fs-files__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 0;
  color: #86868b;
  font-size: 14px;
}

/* ===== 右键菜单 ===== */
.fs-ctx {
  position: fixed;
  z-index: 9999;
  min-width: 160px;
  background: rgba(250, 250, 252, 0.92);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  padding: 5px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.18);
  font-size: 13px;
}
.fs-ctx__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 7px;
  cursor: pointer;
  transition: background 0.12s;
}
.fs-ctx__item:hover { background: rgba(10, 132, 255, 0.1); }
.fs-ctx__item svg { flex-shrink: 0; color: #636366; }

/* ===== 预览 ===== */
.fs-preview { min-height: 200px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; }
.fs-preview__meta { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 8px 0 2px; font-size: 12px; color: #86868b; border-bottom: 1px solid rgba(0,0,0,0.06); margin-bottom: 8px; width: 100%; }
.fs-preview__media { max-width: 100%; border-radius: 10px; }
.fs-preview__code { width: 100%; max-height: 60vh; margin: 0; padding: 14px 16px; overflow: auto; border-radius: 10px; background: #f5f5f7; color: #1d1d1f; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 13px; line-height: 1.7; white-space: pre-wrap; word-break: break-all; }
.fs-preview__error { width: 100%; display: flex; align-items: center; justify-content: center; }
.fs-preview__skeleton { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 20px 0; }
.fs-preview__loading-text { font-size: 13px; color: #86868b; }

.sk { border-radius: 10px; background: linear-gradient(90deg, #f5f5f7 25%, #ebebeb 50%, #f5f5f7 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
.sk--w40 { width: 40%; height: 24px; }
.sk--w60 { width: 60%; height: 120px; }
.sk--full { width: 100%; height: 200px; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
</style>
