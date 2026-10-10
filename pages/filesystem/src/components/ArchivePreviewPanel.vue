<script setup lang="ts">
/**
 * 压缩包预览面板组件
 *
 * 以「弹窗内独立浏览器」的形态呈现压缩包内容：统计条 + 面包屑工具条 +
 * 左侧目录树 + 右侧条目表 + 底部状态栏。
 *
 * <p><b>为什么不用服务端渲染的 {@code ?preview=true} 页面</b>：
 * 那条通道把整张 HTML 页面交给 iframe 渲染，iframe 是<b>独立文档</b>，
 * 既读不到主应用的 Element Plus / koi 主题变量，也无法跟随系统暗色模式
 * 与品牌色切换。本组件走 {@code ?format=archive} 纯 JSON 通道，
 * 在主应用文档内渲染，因此能完整使用 koi 变量体系。</p>
 *
 * <p>点击包内文件时通过 {@code open-entry} 交回父组件，由父组件切到
 * iframe 通道（{@code ?preview&inner=包内路径}）渲染该文件——
 * 本组件只负责「包结构」这一层，不重复实现文件渲染器。</p>
 *
 * @author Buffy
 * @since 2026/09/29
 */
import { message } from "@repo/core";
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { ElMessageBox } from "element-plus";
import {
  ArrowDown,
  ArrowLeft,
  Box,
  Close,
  Document,
  Download,
  Folder,
  Grid,
  Histogram,
  List,
  Refresh,
  Search,
  TakeawayBox,
} from "@element-plus/icons-vue";
import { getArchiveEntriesWithWasm, resolveObjectUrl, unzipObject } from "../api/filestorageApi";
import type { ArchiveEntry, ArchiveScanResponse } from "../api/filestorageApi";
import { fileSvg, fileTypeText } from "../utils/fileKind";

const props = defineProps<{
  /** 存储桶名 */
  bucket: string;
  /** 压缩包对象 Key（含目录前缀） */
  objectKey: string;
  /** 压缩包文件名（不含目录） */
  fileName: string;
}>();

const emit = defineEmits<{
  /** 请求预览包内条目（参数为包内完整路径） */
  "open-entry": [path: string];
}>();

/** 压缩包结构数据 */
const scan = ref<ArchiveScanResponse | null>(null);
/** 加载中 */
const loading = ref(true);
/** 错误信息（空串表示无错） */
const errorMessage = ref("");
/** 当前所在目录的包内路径（空串表示压缩包根） */
const currentPath = ref("");
/** 名称过滤关键词 */
const keyword = ref("");
/** 视图模式：list=明细表 / grid=图标网格 */
const viewMode = ref<"list" | "grid">("list");
/** 解压中 */
const extracting = ref(false);
/**
 * 搜索框是否展开。
 *
 * <p>图里工具条上只有一个放大镜图标，没有常驻输入框——常驻输入框会把整条
 * 工具条撑宽、挤掉视图切换与操作按钮。故默认收起，点击图标才展开，
 * 失焦且无关键词时自动收起。</p>
 */
const searchOpen = ref(false);
/** 搜索输入框引用（展开后自动聚焦） */
const searchInputRef = ref<{ focus: () => void }>();
/** 已展开的目录路径集合（根节点恒展开） */
const expandedDirs = ref<Set<string>>(new Set([""]));

/** 目录树节点 */
interface DirNode {
  /** 包内完整路径（空串为根） */
  path: string;
  /** 显示名 */
  name: string;
  /** 直接子项数（目录 + 文件），用于树上的数字徽标 */
  itemCount: number;
  /** 子目录列表 */
  children: DirNode[];
}

/** 目录树中参与渲染的一行（扁平化后带上缩进层级） */
interface DirRow extends DirNode {
  /** 缩进层级，根为 0 */
  depth: number;
  /** 是否含子目录（决定是否显示展开箭头） */
  expandable: boolean;
}

/**
 * 把扁平的 {@link ArchiveEntry} 清单构造成目录树。
 *
 * 后端已补全隐式目录（只写文件条目、不写目录条目的压缩包也能成树），
 * 这里只负责按父路径归组并统计直接子项数量。
 *
 * @param entries 扁平条目清单
 * @param name    压缩包文件名（根节点显示名）
 * @returns 根节点数组
 */
function buildDirTree(entries: ArchiveEntry[], name: string): DirNode[] {
  const roots: DirNode[] = [];
  const index = new Map<string, DirNode>();

  /** 由路径末段推出显示名：`a/b/c` → `c`。隐式目录没有条目可取名，只能这样兜。 */
  const nameFromPath = (path: string): string => {
    const slash = path.lastIndexOf("/");
    return slash >= 0 ? path.slice(slash + 1) : path;
  };

  const ensure = (path: string, displayName: string): DirNode => {
    const existing = index.get(path);
    if (existing) {
      // 隐式目录先于自己的目录条目出现（后端把文件排在目录前），此时节点是用
      // 空名建的；目录条目到达后必须回填，否则树里那一行是空白的。
      if (!existing.name) {
        existing.name = displayName || nameFromPath(path);
      }
      return existing;
    }
    const node: DirNode = {
      path,
      name: displayName || (path ? nameFromPath(path) : ""),
      itemCount: 0,
      children: [],
    };
    index.set(path, node);
    if (path) {
      const slash = path.lastIndexOf("/");
      ensure(slash > 0 ? path.slice(0, slash) : "", "").children.push(node);
    } else {
      roots.push(node);
    }
    return node;
  };

  const root = ensure("", name);
  // 防御：entries 非数组时（后端未更新、响应被兜底通道换成了压缩包原始字节）
  // 这里不能直接 for...of，否则渲染期抛 TypeError 把整个弹窗打成白屏
  for (const entry of Array.isArray(entries) ? entries : []) {
    const slash = entry.path.lastIndexOf("/");
    const parent = ensure(slash > 0 ? entry.path.slice(0, slash) : "", "");
    parent.itemCount++;
    if (entry.directory) {
      ensure(entry.path, entry.name);
    }
  }
  // 目录按名排序（中文按拼音），让树形顺序稳定可预期
  for (const node of index.values()) {
    node.children.sort((a, b) => a.name.localeCompare(b.name, "zh-Hans-CN"));
  }
  return roots;
}

/**
 * 校验后端响应是否真的是压缩包条目结构。
 *
 * <p>{@code ?format=archive} 未被服务端识别时，请求会落到 inline/download
 * 兜底通道并把压缩包原始字节回给前端——形状对不上却在渲染期才炸，
 * 定位成本很高。故在入口显式校验一次，把「响应不对」转成可读错误态。</p>
 *
 * @param value 待校验值
 * @returns true 表示结构合法
 */
function isScanResponse(value: unknown): value is ArchiveScanResponse {
  return (
    !!value
    && typeof value === "object"
    && Array.isArray((value as ArchiveScanResponse).entries)
  );
}

/** 目录树 */
const dirTree = computed<DirNode[]>(() =>
  scan.value ? buildDirTree(scan.value.entries, props.fileName) : [],
);

/**
 * 按当前展开状态把目录树摊平成可渲染的行列表。
 *
 * 摊平而非递归子组件：目录层级不可预知，递归组件要多一个 SFC 与一份
 * 样式作用域；摊平后模板是一层 v-for，缩进靠 depth 数值即可。
 *
 * @param nodes   节点数组
 * @param depth   当前层级
 * @param out     输出缓冲
 */
function flattenTree(nodes: DirNode[], depth: number, out: DirRow[]): void {
  for (const node of nodes) {
    const expandable = node.children.length > 0;
    out.push({ ...node, depth, expandable });
    if (expandable && expandedDirs.value.has(node.path)) {
      flattenTree(node.children, depth + 1, out);
    }
  }
}

/** 目录树渲染行（已按展开状态摊平） */
const dirRows = computed<DirRow[]>(() => {
  const out: DirRow[] = [];
  flattenTree(dirTree.value, 0, out);
  return out;
});

/** 当前目录的直接子项（未过滤） */
const currentEntries = computed<ArchiveEntry[]>(() => {
  const all = scan.value?.entries ?? [];
  return all.filter((entry) => {
    const slash = entry.path.lastIndexOf("/");
    const parent = slash > 0 ? entry.path.slice(0, slash) : "";
    return parent === currentPath.value;
  });
});

/** 名称过滤后的当前目录子项（目录恒保留，否则会丢失导航入口） */
const visibleEntries = computed<ArchiveEntry[]>(() => {
  const q = keyword.value.trim().toLowerCase();
  if (!q) {
    return currentEntries.value;
  }
  return currentEntries.value.filter(
    (entry) => entry.directory || entry.name.toLowerCase().includes(q),
  );
});

/** 面包屑（首项为压缩包自身） */
const breadcrumbs = computed(() => {
  const crumbs = [{ name: props.fileName, path: "" }];
  const segments = currentPath.value ? currentPath.value.split("/") : [];
  segments.forEach((name, index) => {
    crumbs.push({ name, path: segments.slice(0, index + 1).join("/") });
  });
  return crumbs;
});

/** 面包屑文字：图里展示的是完整层级链（`包名 / 子目录 / 子目录`），不是只有末级 */
const breadcrumbText = computed(() => breadcrumbs.value.map((c) => c.name).join(" / "));

/** 是否存在上一级（决定返回按钮是否可用） */
const canGoBack = computed(() => currentPath.value !== "");

/** 全部目录（面包屑下拉里的「跳转到…」） */
const allDirs = computed<DirNode[]>(() => {
  const out: DirNode[] = [];
  const walk = (nodes: DirNode[]): void => {
    for (const node of nodes) {
      if (node.path) out.push(node);
      walk(node.children);
    }
  };
  walk(dirTree.value);
  return out;
});

/**
 * 目录路径 → 其直接子项数量。
 *
 * 表格里的目录行要显示「N 项」徽标，而 {@link ArchiveEntry} 本身是扁平的
 * 条目、没有子项概念，故在此按父路径统计一次；树节点自带 itemCount，
 * 不需要这张表。
 */
const childCountMap = computed<Map<string, number>>(() => {
  const map = new Map<string, number>();
  for (const entry of scan.value?.entries ?? []) {
    const slash = entry.path.lastIndexOf("/");
    const parent = slash > 0 ? entry.path.slice(0, slash) : "";
    map.set(parent, (map.get(parent) ?? 0) + 1);
  }
  return map;
});

/** 目录条目的直接子项数 */
function childCountOf(entry: ArchiveEntry): number {
  return childCountMap.value.get(entry.path) ?? 0;
}

/** 统计条：文件数 */
const fileCount = computed(() => scan.value?.fileCount ?? 0);
/** 统计条：目录数 */
const dirCount = computed(() => scan.value?.dirCount ?? 0);
/** 统计条：解压后总大小 */
const totalSize = computed(() => scan.value?.totalSize ?? 0);
/** 统计条：压缩率（%，空包为 0） */
const compressRate = computed(() => scan.value?.compressRate ?? 0);

/** 字节数的可读化展示 */
function formatSize(bytes: number): string {
  if (!bytes || bytes < 0) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

/** 时间戳展示（无时间戳时显示 "-"） */
function formatTime(ts: number): string {
  if (!ts) return "-";
  const d = new Date(ts);
  const pad = (n: number): string => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} `
    + `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 条目类型图标（复用主列表的 Windows 风格 SVG） */
function entrySvg(entry: ArchiveEntry): string {
  return fileSvg(entry.name, entry.directory);
}

/** 条目类型文案（目录固定为「文件夹」） */
function entryTypeText(entry: ArchiveEntry): string {
  if (entry.directory) return "文件夹";
  if (entry.size > 0 && entry.compressedSize > 0) {
    // 包内二次压缩的条目（如 zip 里的 zip）额外标出压缩后体积
    return `${fileTypeText(entry.name)} · ${formatSize(entry.compressedSize)}`;
  }
  return fileTypeText(entry.name);
}

/** 当前目录的展示行：目录在前、文件按名排序 */
const listRows = computed<ArchiveEntry[]>(() =>
  [...visibleEntries.value].sort((a, b) => {
    if (a.directory !== b.directory) return a.directory ? -1 : 1;
    return a.name.localeCompare(b.name, "zh-Hans-CN");
  }),
);

/** 加载压缩包结构 */
async function load(): Promise<void> {
  loading.value = true;
  errorMessage.value = "";
  try {
    // Use WASM-based scanning (with backend fallback)
    const res = await getArchiveEntriesWithWasm(props.bucket, props.objectKey, props.fileName);
    if (!isScanResponse(res)) {
      scan.value = null;
      errorMessage.value =
        "服务端未返回压缩包条目结构（?format=archive 未生效）。"
        + "请确认文件服务器已更新到支持该接口的版本后重试。";
      return;
    }
    scan.value = res;
    currentPath.value = "";
    expandedDirs.value = new Set([""]);
  } catch (e) {
    scan.value = null;
    errorMessage.value = (e as Error)?.message ?? "压缩包解析失败";
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch(() => [props.bucket, props.objectKey], load);

/** 进入目录（同时展开） */
function enterDir(path: string): void {
  currentPath.value = path;
  if (expandedDirs.value.has(path)) return;
  const next = new Set(expandedDirs.value);
  next.add(path);
  expandedDirs.value = next;
}

/** 返回上一级 */
function goBack(): void {
  const slash = currentPath.value.lastIndexOf("/");
  currentPath.value = slash > 0 ? currentPath.value.slice(0, slash) : "";
}

/** 切换目录展开状态 */
function toggleDir(path: string): void {
  const next = new Set(expandedDirs.value);
  if (next.has(path)) {
    next.delete(path);
  } else {
    next.add(path);
  }
  expandedDirs.value = next;
}

/** 展开搜索框并聚焦 */
async function openSearch(): Promise<void> {
  searchOpen.value = true;
  await nextTick();
  searchInputRef.value?.focus();
}

/** 失焦时若没有关键词则收回到图标形态，避免留下一个空输入框 */
function onSearchBlur(): void {
  if (!keyword.value.trim()) {
    searchOpen.value = false;
  }
}

/** 点击条目：目录进入，文件交父组件预览 */function onEntryClick(entry: ArchiveEntry): void {
  if (entry.directory) {
    enterDir(entry.path);
    return;
  }
  emit("open-entry", entry.path);
}

/** 下载压缩包本体 */
async function downloadSelf(): Promise<void> {
  // window.open 无法带请求头，只能靠 URL 直达 —— 用短时一次性票据而不是访问令牌，
  // 免得令牌落进浏览器历史与网关访问日志。
  const url = await resolveObjectUrl(props.bucket, props.objectKey, {
    params: { download: "true" },
  });
  window.open(url, "_blank");
}

/** 解压到目标目录（留空 = 与压缩包同级） */
async function extractTo(): Promise<void> {
  if (!scan.value) return;
  const slash = props.objectKey.lastIndexOf("/");
  const archivePath = slash > 0 ? props.objectKey.slice(0, slash) : "";
  const archiveName = slash > 0 ? props.objectKey.slice(slash + 1) : props.objectKey;
  try {
    const { value } = await ElMessageBox.prompt(
      `将「${props.fileName}」的全部内容解压到哪个目录？`,
      "解压到…",
      {
        confirmButtonText: "解压",
        cancelButtonText: "取消",
        inputValue: archivePath,
        inputPlaceholder: "留空 = 与压缩包同级",
        inputValidator: (v: string) => {
          if (v.includes("..")) return "目标目录不允许包含 ..";
          if (v.startsWith("/")) return "请填写相对目录，不要以 / 开头";
          return true;
        },
      },
    );
    extracting.value = true;
    const result = await unzipObject(props.bucket, archivePath, archiveName, (value ?? "").trim());
    const count = (result as { count?: number }).count;
    message.success(count != null ? `已解压 ${count} 个条目` : "解压完成");
  } catch (e) {
    // 用户取消是正常路径，不当作错误提示
    if (e === "cancel" || e === "close") return;
    message.error((e as Error)?.message ?? "解压失败");
  } finally {
    extracting.value = false;
  }
}
</script>

<template>
  <section class="arc" aria-label="压缩包内容预览">
  

    <!-- ===== 统计条 ===== -->
    <div class="arc__stats">
      <div class="arc__stat">
        <el-icon class="arc__stat-icon"><Document /></el-icon>
        <span class="arc__stat-label">文件</span>
        <b class="arc__stat-value">{{ fileCount }} 个</b>
      </div>
      <div class="arc__stat">
        <el-icon class="arc__stat-icon"><Folder /></el-icon>
        <span class="arc__stat-label">目录</span>
        <b class="arc__stat-value">{{ dirCount }} 个</b>
      </div>
      <div class="arc__stat">
        <el-icon class="arc__stat-icon"><Box /></el-icon>
        <span class="arc__stat-label">总大小</span>
        <b class="arc__stat-value">{{ formatSize(totalSize) }}</b>
      </div>
      <div class="arc__stat">
        <el-icon class="arc__stat-icon"><Histogram /></el-icon>
        <span class="arc__stat-label">压缩率</span>
        <b class="arc__stat-value arc__stat-value--accent">{{ compressRate }}%</b>
      </div>
    </div>

    <!-- ===== 工具条：返回 / 面包屑 / 搜索 / 视图 / 刷新 / 下载 / 解压 ===== -->
    <div class="arc__toolbar">
  
      <div class="arc__toolbar-spacer" />

      <el-input
        v-if="searchOpen"
        ref="searchInputRef"
        v-model="keyword"
        class="arc__search"
        placeholder="在当前目录内搜索"
        clearable
        :prefix-icon="Search"
        aria-label="搜索包内条目"
        @blur="onSearchBlur"
      />
      <el-button
        v-else
        :icon="Search"
        title="搜索"
        aria-label="搜索包内条目"
        @click="openSearch"
      />
      <el-button-group>
        <el-button
          :icon="List"
          :type="viewMode === 'list' ? 'primary' : undefined"
          title="明细视图"
          aria-label="明细视图"
          @click="viewMode = 'list'"
        />
        <el-button
          :icon="Grid"
          :type="viewMode === 'grid' ? 'primary' : undefined"
          title="图标视图"
          aria-label="图标视图"
          @click="viewMode = 'grid'"
        />
      </el-button-group>
      <el-button :icon="Refresh" :loading="loading" title="刷新" aria-label="刷新" @click="load" />
      <el-button :icon="Download" title="下载压缩包" @click="downloadSelf"></el-button>

    </div>

    <!-- ===== 主体：左树 + 右表 ===== -->
    <div v-if="loading && !scan" class="arc__placeholder">
      <el-skeleton :rows="6" animated />
    </div>
    <el-empty v-else-if="errorMessage" class="arc__placeholder" :description="errorMessage">
      <el-button type="primary" :icon="Refresh" @click="load">重试</el-button>
      <el-button :icon="Download" @click="downloadSelf">下载文件</el-button>
    </el-empty>
    <div v-else class="arc__body">
      <aside class="arc__tree" aria-label="压缩包目录树">
        <ul class="arc__tree-list">
          <li v-for="row in dirRows" :key="row.path">
            <div
              class="arc__tree-row"
              :class="{ 'is-active': currentPath === row.path }"
              :style="{ paddingLeft: `${8 + row.depth * 14}px` }"
              role="treeitem"
              :aria-expanded="row.expandable ? expandedDirs.has(row.path) : undefined"
              :aria-selected="currentPath === row.path"
              tabindex="0"
              @click="enterDir(row.path)"
              @keydown.enter="enterDir(row.path)"
            >
              <el-icon
                v-if="row.expandable"
                class="arc__tree-caret"
                :class="{ 'is-open': expandedDirs.has(row.path) }"
                @click.stop="toggleDir(row.path)"
              ><ArrowDown /></el-icon>
              <span v-else class="arc__tree-caret arc__tree-caret--leaf" />
              <span class="arc__tree-icon" v-html="fileSvg(row.name, true)" />
              <span class="arc__tree-name">{{ row.name }}</span>
              <span v-if="row.itemCount" class="arc__tree-count">{{ row.itemCount }}</span>
            </div>
          </li>
        </ul>
      </aside>

      <div class="arc__content">
        <!-- 明细表 -->
        <table v-if="viewMode === 'list'" class="arc__table">
          <thead>
            <tr>
              <th class="arc__col-name">名称</th>
              <th class="arc__col-size">大小</th>
              <th class="arc__col-type">类型</th>
              <th class="arc__col-time">修改时间</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="entry in listRows"
              :key="entry.path"
              class="arc__tr"
              :class="{ 'is-dir': entry.directory }"
              tabindex="0"
              @click="onEntryClick(entry)"
              @keydown.enter="onEntryClick(entry)"
            >
              <td class="arc__col-name">
                <span class="arc__cell-icon" v-html="entrySvg(entry)" />
                <span class="arc__cell-name">{{ entry.name }}</span>
                <span v-if="entry.directory" class="arc__cell-badge">
                  {{ childCountOf(entry) }} 项
                </span>
              </td>
              <td class="arc__col-size">{{ entry.directory ? "-" : formatSize(entry.size) }}</td>
              <td class="arc__col-type">{{ entryTypeText(entry) }}</td>
              <td class="arc__col-time">{{ formatTime(entry.modified) }}</td>
            </tr>
            <tr v-if="!listRows.length">
              <td colspan="4" class="arc__empty">当前目录没有条目</td>
            </tr>
          </tbody>
        </table>

        <!-- 图标网格 -->
        <div v-else class="arc__grid">
          <button
            v-for="entry in listRows"
            :key="entry.path"
            type="button"
            class="arc__grid-cell"
            @click="onEntryClick(entry)"
          >
            <span class="arc__grid-icon" v-html="entrySvg(entry)" />
            <span class="arc__grid-name">{{ entry.name }}</span>
            <span class="arc__grid-meta">
              {{ entry.directory ? "文件夹" : formatSize(entry.size) }}
            </span>
          </button>
          <el-empty v-if="!listRows.length" description="当前目录没有条目" :image-size="72" />
        </div>
      </div>
    </div>

    <!-- ===== 底部状态栏 ===== -->
    <footer class="arc__footer">
      <span>
        {{ fileCount + dirCount }} 个项目 · {{ dirCount }} 个目录 · {{ formatSize(totalSize) }}
      </span>
      <span>编码 UTF-8</span>
    </footer>
  </section>
</template>

<style scoped>
/* ========================================================
   压缩包预览面板（koi / Element Plus 变量体系）

   规约要点：
   - 颜色一律走 --el-* 令牌，暗色模式自动跟随，不写死浅色底
   - 面板不用投影承载层级，改用 1px 边框（koi 规约：容器不加装饰投影）
   - 圆角取令牌档位：控件 6、面板 8
   ======================================================== */
.arc {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 8px);
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  overflow: hidden;
}

/* ---- 头部样式已随 header 一并移除：标题与关闭按钮由外层 el-dialog 承担 ---- */

/* ---- 统计条 ---- */
.arc__stats {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background: var(--el-fill-color-lighter);
  border-bottom: 1px solid var(--el-border-color-lighter);
  overflow-x: auto;
}

.arc__stat {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 16px;
  white-space: nowrap;
}

.arc__stat:first-child {
  padding-left: 0;
}

.arc__stat + .arc__stat {
  border-left: 1px solid var(--el-border-color-lighter);
}

.arc__stat-icon {
  color: var(--el-text-color-placeholder);
}

.arc__stat-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.arc__stat-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.arc__stat-value--accent {
  color: var(--el-color-primary);
}

/* ---- 工具条 ---- */
.arc__toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  flex-wrap: wrap;
}

.arc__toolbar-spacer {
  flex: 1;
  min-width: 0;
}

/* 面包屑显示完整层级链（包名 / 子目录 / …），需要比单级目录更宽；
   撑开右侧空间的职责留给 .arc__toolbar-spacer，这里只给上限。
   （el-dropdown 会包一层 div，flex 加在按钮上够不到工具条的 flex 容器） */
.arc__crumb {
  max-width: 420px;
}

.arc__crumb-current {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.arc__search {
  width: 180px;
}

/* ---- 主体：左树 + 右表 ---- */
.arc__body {
  flex: 1;
  display: flex;
  min-height: 0;
}

.arc__tree {
  width: 240px;
  flex-shrink: 0;
  overflow-y: auto;
  padding: 8px 6px;
  border-right: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color-page);
}

.arc__tree-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.arc__tree-row {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding-right: 8px;
  border-radius: var(--el-radius-sm, 6px);
  cursor: pointer;
  color: var(--el-text-color-regular);
  transition: background-color var(--el-transition-duration-fast, 0.2s) ease;
}

.arc__tree-row:hover {
  background: var(--el-fill-color-light);
}

.arc__tree-row.is-active {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: 500;
}

.arc__tree-caret {
  width: 14px;
  flex-shrink: 0;
  color: var(--el-text-color-placeholder);
  transition: transform var(--el-transition-duration-fast, 0.2s) ease;
}

/* 未展开时向右，展开后向下 */
.arc__tree-caret:not(.is-open) {
  transform: rotate(-90deg);
}

.arc__tree-caret--leaf {
  transform: none;
  visibility: hidden;
}

.arc__tree-icon {
  display: flex;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.arc__tree-icon :deep(svg) {
  width: 100%;
  height: 100%;
}

.arc__tree-name {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.arc__tree-count {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.arc__content {
  flex: 1;
  min-width: 0;
  overflow: auto;
  background: var(--el-bg-color);
}

/* ---- 明细表 ---- */
.arc__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.arc__table thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 8px 12px;
  text-align: left;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
  white-space: nowrap;
}

.arc__col-size {
  width: 110px;
}

.arc__col-type {
  width: 180px;
}

.arc__col-time {
  width: 160px;
}

.arc__tr {
  cursor: pointer;
  border-bottom: 1px solid var(--el-border-color-lighter);
  transition: background-color var(--el-transition-duration-fast, 0.2s) ease;
}

.arc__tr:hover {
  background: var(--el-color-primary-light-9);
}

.arc__tr.is-dir .arc__cell-name {
  font-weight: 600;
}

.arc__tr td {
  padding: 8px 12px;
  color: var(--el-text-color-regular);
  vertical-align: middle;
}

.arc__col-size,
.arc__col-time {
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.arc__cell-icon {
  display: inline-flex;
  width: 18px;
  height: 18px;
  margin-right: 8px;
  vertical-align: -4px;
}

.arc__cell-icon :deep(svg) {
  width: 100%;
  height: 100%;
}

.arc__cell-name {
  color: var(--el-text-color-primary);
}

.arc__cell-badge {
  margin-left: 8px;
  padding: 1px 6px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.arc__empty {
  padding: 32px 0;
  text-align: center;
  color: var(--el-text-color-placeholder);
}

/* ---- 图标网格 ---- */
.arc__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
  gap: 8px;
  padding: 16px;
}

.arc__grid-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 8px;
  border: 1px solid transparent;
  border-radius: var(--el-radius-md, 8px);
  background: transparent;
  cursor: pointer;
  transition: background-color var(--el-transition-duration-fast, 0.2s) ease,
    border-color var(--el-transition-duration-fast, 0.2s) ease;
}

.arc__grid-cell:hover {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-7);
}

.arc__grid-cell:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.arc__grid-icon {
  display: flex;
  width: 40px;
  height: 40px;
}

.arc__grid-icon :deep(svg) {
  width: 100%;
  height: 100%;
}

.arc__grid-name {
  font-size: 12px;
  line-height: 1.35;
  color: var(--el-text-color-primary);
  text-align: center;
  /* 两行截断，超出省略 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-all;
}

.arc__grid-meta {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

/* ---- 底部状态栏 ---- */
.arc__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.arc__placeholder {
  flex: 1;
  padding: 20px;
}

/* ---- 滚动条 ---- */
.arc__tree::-webkit-scrollbar,
.arc__content::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.arc__tree::-webkit-scrollbar-thumb,
.arc__content::-webkit-scrollbar-thumb {
  border-radius: var(--el-radius-sm, 6px);
  background: var(--el-border-color-dark);
}

.arc__tree::-webkit-scrollbar-thumb:hover,
.arc__content::-webkit-scrollbar-thumb:hover {
  background: var(--el-text-color-placeholder);
}

/* ---- 无障碍：尊重「减少动态效果」偏好 ---- */
@media (prefers-reduced-motion: reduce) {
  .arc__tree-row,
  .arc__tr,
  .arc__grid-cell,
  .arc__tree-caret {
    transition: none;
  }
}
</style>
