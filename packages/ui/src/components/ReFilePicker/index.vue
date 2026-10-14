<template>
  <ReDialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="min(1080px, 96vw)"
    :close-on-click-modal="false"
    append-to-body
    destroy-on-close
    class="re-file-picker"
  >
    <div class="rfp">
      <div class="rfp__toolbar re-file-picker__toolbar">
        <div class="rfp__nav-btns">
          <button
            type="button"
            class="rfp-icon-btn"
            title="后退"
            aria-label="后退"
            :disabled="!history.length"
            @click="goBack"
          >
            <el-icon :size="15"><ArrowLeft /></el-icon>
          </button>
          <button
            type="button"
            class="rfp-icon-btn"
            title="刷新"
            aria-label="刷新"
            :disabled="loading"
            @click="() => loadItems()"
          >
            <el-icon :size="15" :class="{ 'is-spin': loading }"><Refresh /></el-icon>
          </button>
        </div>

        <div class="re-file-picker__bread rfp__crumbs">
          <span
            v-for="(seg, i) in breadcrumb"
            :key="seg.path || 'root'"
            class="re-file-picker__bread-item rfp__crumb"
            :class="{ 'is-active': i === breadcrumb.length - 1 }"
            role="button"
            tabindex="0"
            :title="seg.path"
            @click="handleBreadcrumbClick(seg.path)"
            @keydown.enter="handleBreadcrumbClick(seg.path)"
          >
            {{ seg.name }}
            <span v-if="i < breadcrumb.length - 1" class="rfp__crumb-sep" aria-hidden="true">
              {{ pathSeparator }}
            </span>
          </span>
        </div>

        <div class="rfp__search">
          <el-input
            v-model="searchText"
            size="small"
            placeholder="搜索文件或目录"
            clearable
            aria-label="搜索文件或目录"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
      </div>

      <div class="rfp__body">
        <aside class="rfp-nav">
          <div class="rfp-nav__title">位置</div>
          <button
            v-for="node in treeNodes"
            :key="node.key"
            type="button"
            class="rfp-nav__item"
            :class="{ 'is-active': isCurrentPath(node.key) }"
            :style="{ '--rfp-tree-depth': node.depth }"
            :title="node.key"
            @click="navigateTo(node.key)"
          >
            <el-icon :size="15" class="rfp-nav__icon"><Folder /></el-icon>
            <span class="rfp-nav__label">{{ node.name }}</span>
          </button>

          <template v-if="treeDirs.length">
            <div class="rfp-nav__title rfp-nav__title--sub">当前目录</div>
            <button
              v-for="dir in treeDirs"
              :key="dir.key"
              type="button"
              class="rfp-nav__item rfp-nav__item--child"
              :class="{ 'is-active': isCurrentPath(dir.key) }"
              :title="dir.key"
              @click="navigateTo(dir.key)"
            >
              <span class="rfp-nav__blank" aria-hidden="true" />
              <el-icon :size="15" class="rfp-nav__icon"><FolderOpened /></el-icon>
              <span class="rfp-nav__label">{{ dir.name }}</span>
            </button>
          </template>
        </aside>

        <main class="rfp-main">
          <div v-if="loading" class="rfp-main__state">
            <el-icon class="is-spin"><Loading /></el-icon>
            <span>加载中…</span>
          </div>

          <div v-else-if="loadError" class="rfp-main__state rfp-main__state--error">
            <el-icon><WarningFilled /></el-icon>
            <div>
              <b>目录加载失败</b>
              <span>{{ loadError }}</span>
            </div>
          </div>

          <div v-else-if="rows.length === 0" class="rfp-main__state">
            <slot name="empty">
              <span>当前目录为空</span>
            </slot>
          </div>

          <template v-else>
            <div class="rfp-details__head">
              <span
                class="rfp-details__head-cell"
                :class="{ 'is-sorted': sortKey === 'name' }"
                role="button"
                tabindex="0"
                aria-label="排序：名称"
                :aria-sort="sortKey === 'name' ? (sortAsc ? 'ascending' : 'descending') : 'none'"
                @click="toggleSort('name')"
                @keydown.enter.prevent="toggleSort('name')"
                @keydown.space.prevent="toggleSort('name')"
              >
                名称 <span class="rfp-sort-arrow">{{ sortArrow('name') }}</span>
              </span>
              <span
                class="rfp-details__head-cell"
                :class="{ 'is-sorted': sortKey === 'type' }"
                role="button"
                tabindex="0"
                aria-label="排序：类型"
                :aria-sort="sortKey === 'type' ? (sortAsc ? 'ascending' : 'descending') : 'none'"
                @click="toggleSort('type')"
                @keydown.enter.prevent="toggleSort('type')"
                @keydown.space.prevent="toggleSort('type')"
              >
                类型 <span class="rfp-sort-arrow">{{ sortArrow('type') }}</span>
              </span>
              <span
                class="rfp-details__head-cell rfp-details__size"
                :class="{ 'is-sorted': sortKey === 'size' }"
                role="button"
                tabindex="0"
                aria-label="排序：大小"
                :aria-sort="sortKey === 'size' ? (sortAsc ? 'ascending' : 'descending') : 'none'"
                @click="toggleSort('size')"
                @keydown.enter.prevent="toggleSort('size')"
                @keydown.space.prevent="toggleSort('size')"
              >
                大小 <span class="rfp-sort-arrow">{{ sortArrow('size') }}</span>
              </span>
              <span
                class="rfp-details__head-cell"
                :class="{ 'is-sorted': sortKey === 'updatedAt' }"
                role="button"
                tabindex="0"
                aria-label="排序：修改时间"
                :aria-sort="sortKey === 'updatedAt' ? (sortAsc ? 'ascending' : 'descending') : 'none'"
                @click="toggleSort('updatedAt')"
                @keydown.enter.prevent="toggleSort('updatedAt')"
                @keydown.space.prevent="toggleSort('updatedAt')"
              >
                修改时间 <span class="rfp-sort-arrow">{{ sortArrow('updatedAt') }}</span>
              </span>
            </div>

            <div class="rfp-details">
              <button
                v-if="parentEntry && !isRootPath(currentPath)"
                type="button"
                class="rfp-details__row rfp-details__row--parent rfp-parent"
                title="返回上级目录"
                @click="navigateTo(parentEntry.key)"
              >
                <span class="rfp-details__name">
                  <el-icon :size="16" class="rfp-file-icon"><FolderOpened /></el-icon>
                  <span>..</span>
                </span>
                <span class="rfp-details__type">上级目录</span>
                <span class="rfp-details__size">-</span>
                <span class="rfp-details__time">-</span>
              </button>

              <button
                v-for="item in rows"
                :key="item.key"
                type="button"
                class="rfp-details__row re-file-picker__item"
                :class="{
                  'is-selected': isSelected(item),
                  'is-dir': item.isDir,
                  'is-active-dir': isCurrentPath(item.key),
                }"
                :title="item.key"
                :aria-label="item.name"
                @click="handleItemClick(item)"
                @dblclick="handleItemDblClick(item)"
              >
                <span class="rfp-details__name">
                  <img
                    v-if="!item.isDir && item.thumbnail"
                    :src="item.thumbnail"
                    class="rfp-details__thumb"
                    alt=""
                  />
                  <el-icon v-else-if="item.isDir" :size="16" class="rfp-file-icon"><Folder /></el-icon>
                  <el-icon v-else-if="isImage(item)" :size="16" class="rfp-file-icon"><Picture /></el-icon>
                  <el-icon v-else-if="isVideo(item)" :size="16" class="rfp-file-icon"><VideoPlay /></el-icon>
                  <el-icon v-else-if="isAudio(item)" :size="16" class="rfp-file-icon"><Headset /></el-icon>
                  <el-icon v-else-if="isPdf(item)" :size="16" class="rfp-file-icon"><Document /></el-icon>
                  <el-icon v-else :size="16" class="rfp-file-icon"><Files /></el-icon>
                  <span class="rfp-details__name-text" :class="{ 'is-dir': item.isDir }">{{ item.name }}</span>
                </span>
                <span class="rfp-details__type">{{ item.isDir ? "文件夹" : fileTypeText(item.name) }}</span>
                <span class="rfp-details__size">{{ item.isDir ? "-" : formatSize(item.size || 0) }}</span>
                <span class="rfp-details__time">{{ formatTime(item.updatedAt) }}</span>
              </button>
            </div>
          </template>
        </main>
      </div>

      <div class="rfp__selected">
        <span class="rfp__selected-label">当前选择</span>
        <span class="rfp__selected-value" :title="selectedSummary">{{ selectedSummary }}</span>
        <el-button
          v-if="selectedItems.length"
          size="small"
          text
          type="primary"
          @click="selectedItems = []"
        >
          清除
        </el-button>
      </div>
    </div>

    <template #footer>
      <div class="rfp__footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!canConfirm" @click="handleConfirm">
          {{ isDirectoryMode ? "选择该目录" : "确认选择" }}
        </el-button>
      </div>
    </template>
  </ReDialog>
</template>

<script setup lang="ts">
/**
 * ReFilePicker —— 文件 / 目录选择器
 *
 * 完全走 filesystem 主页面同款的「路径栏 + 左树 + 右表明细」布局。
 * 数据来源二选一：
 *  - `loader`：必须由宿主配置，返回远端接口（filesystem-starter / 宿主后端）的 FilePickerItem[]
 *  - `data`：本地 JSON 结构，支持 FilePickerItem[] 或 { current, items }，不再内置 mock 兜底
 */
import { computed, ref, watch } from "vue";
import {
  ArrowLeft,
  Document,
  Files,
  Folder,
  FolderOpened,
  Headset,
  Loading,
  Picture,
  Refresh,
  Search,
  VideoPlay,
  WarningFilled,
} from "@element-plus/icons-vue";
import {
  type FilePickerData,
  type FilePickerItem,
  type FilePickerListResult,
  type FilePickerLoader,
} from "./types";
import ReDialog from "../ReDialog";

interface Props {
  /** 是否显示弹窗 */
  modelValue: boolean;
  /** 弹窗标题 */
  title?: string;
  /** 远端 loader：路径 → 文件/目录列表；filesystem-starter 的目录条目也需由宿主 map 成该形状 */
  loader?: FilePickerLoader;
  /** 本地 JSON 数据：FilePickerItem[] 或 { current, parent, items } */
  data?: FilePickerData;
  /** 多选 */
  multiple?: boolean;
  /** 文件类型过滤（如 'image/*'、'.png,.jpg'） */
  accept?: string;
  /** 起始目录 */
  initialPath?: string;
  /** 目录选择模式：点击目录即选中该目录（无需进入），选择结果返回目录路径 */
  directoryMode?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: "选择文件",
  multiple: false,
  accept: "",
  initialPath: "/",
  directoryMode: false,
});

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "select", items: FilePickerItem[]): void;
  (e: "cancel"): void;
}>();

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => {
    if (!val) emit("cancel");
    emit("update:modelValue", val);
  },
});

const dialogTitle = computed(() => props.title);
const isDirectoryMode = computed(() => props.directoryMode);

const currentPath = ref(props.initialPath);
const items = ref<FilePickerItem[]>([]);
const loading = ref(false);
const loadError = ref("");
const searchText = ref("");
const selectedItems = ref<FilePickerItem[]>([]);
const history = ref<string[]>([]);
const sortKey = ref<"name" | "type" | "size" | "updatedAt">("name");
const sortAsc = ref(true);
let loadSeq = 0;

/* ---------- 路径工具 ---------- */

const normalizePath = (value: string): string => {
  const text = String(value || "");
  if (!text || text === "/" || text === "\\") return text === "" ? "" : "/";
  const trimmed = text.replace(/[\\/]+$/, "");
  return trimmed || "/";
};

const samePath = (a: string, b: string): boolean => {
  const na = normalizePath(a);
  const nb = normalizePath(b);
  return na === nb || (na === "" && nb === "/") || (na === "/" && nb === "");
};

const pathSeparator = computed(() => (currentPath.value.includes("\\") ? "\\" : "/"));

const isRootPath = (path: string): boolean => {
  const p = normalizePath(path);
  return p === "" || p === "/" || /^[A-Za-z]:$/.test(p);
};

const joinPath = (base: string, name: string): string => {
  const root = normalizePath(base);
  const sep = base.includes("\\") ? "\\" : "/";
  if (!root || root === "/" || /^[A-Za-z]:$/.test(root)) {
    return root === "/" ? `/${name}` : name ? `${root}${sep}${name}` : `/${name}`;
  }
  return `${root}${sep}${name}`;
};

const parentPathOf = (path: string): string => {
  const current = normalizePath(path);
  if (!current || current === "/" || /^[A-Za-z]:$/.test(current)) return "/";
  const sep = current.includes("\\") ? "\\" : "/";
  const idx = Math.max(current.lastIndexOf("/"), current.lastIndexOf("\\"));
  if (idx <= 0) return "/";
  const parent = current.slice(0, idx);
  return parent || "/";
};

const pathSegments = (path: string): string[] => normalizePath(path).split(/[\\/]+/).filter(Boolean);

const breadcrumb = computed<Array<{ name: string; path: string }>>(() => {
  const p = normalizePath(currentPath.value);
  if (!p || p === "/") return [{ name: "根目录", path: "/" }];
  const segs = pathSegments(p);
  const crumbs: Array<{ name: string; path: string }> = [];
  let current = "";
  const firstDrive = /^[A-Za-z]:$/.test(segs[0] || "");
  if (firstDrive) {
    current = segs[0];
    crumbs.push({ name: current, path: current });
  } else {
    crumbs.push({ name: "根目录", path: "/" });
  }
  const offset = firstDrive ? 1 : 0;
  for (const seg of segs.slice(offset)) {
    current = joinPath(current || (firstDrive ? segs[0] : ""), seg);
    crumbs.push({ name: seg, path: current });
  }
  return crumbs;
});

/* ---------- 数据解析 ---------- */

const dataArray = computed(() => {
  const raw = props.data;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  return raw.items ?? [];
});

const dataCurrent = computed(() => (!Array.isArray(props.data) ? props.data?.current ?? "" : ""));

const hasStaticData = computed(() => props.data !== undefined && props.data !== null);

const staticChildren = (all: FilePickerItem[], path: string): FilePickerItem[] => {
  const baseSegs = pathSegments(path);
  const seen = new Map<string, FilePickerItem>();
  const result: FilePickerItem[] = [];
  for (const origin of all) {
    const key = String(origin.key || origin.name);
    if (samePath(key, path) || isRootPath(key) && isRootPath(path)) continue;
    const keySegs = pathSegments(key);
    if (keySegs.length <= baseSegs.length) continue;
    const rest = keySegs.slice(baseSegs.length);
    if (rest.length === 1) {
      if (!seen.has(key)) {
        seen.set(key, origin);
        result.push(origin);
      }
      continue;
    }
    const first = rest[0];
    const dirKey = joinPath(path, first);
    if (!seen.has(dirKey)) {
      const child: FilePickerItem = { key: dirKey, name: first, isDir: true };
      seen.set(dirKey, child);
      result.push(child);
    }
  }
  return result;
};

const resolveStaticData = (path: string): FilePickerItem[] => {
  if (dataCurrent.value && samePath(dataCurrent.value, path)) return [...dataArray.value];
  return staticChildren(dataArray.value, path);
};

const normalizeLoadedResult = (result: unknown): FilePickerItem[] => {
  if (Array.isArray(result)) return result;
  if (result && typeof result === "object") {
    const list = (result as FilePickerListResult | { items?: unknown }).items;
    if (Array.isArray(list)) return list;
  }
  return [];
};

const loadItems = async (path = currentPath.value) => {
  const seq = ++loadSeq;
  loading.value = true;
  loadError.value = "";
  try {
    let next: FilePickerItem[] = [];
    if (hasStaticData.value) {
      next = resolveStaticData(path);
    } else if (props.loader) {
      next = normalizeLoadedResult(await props.loader(path));
    } else {
      throw new Error("ReFilePicker 必须配置 loader（filesystem-starter/宿主远端接口）或 data（本地 JSON）");
    }
    if (seq !== loadSeq) return;
    items.value = next;
  } catch (err) {
    if (seq !== loadSeq) return;
    items.value = [];
    loadError.value = err instanceof Error ? err.message : String(err);
  } finally {
    if (seq === loadSeq) loading.value = false;
  }
};

/* ---------- 展示与排序 ---------- */

interface TreeNode {
  key: string;
  name: string;
  depth: number;
}

const treeNodes = computed<TreeNode[]>(() => {
  const nodes: TreeNode[] = [{ key: "/", name: "根目录", depth: 0 }];
  breadcrumb.value.slice(1).forEach((crumb, i) => {
    nodes.push({ key: crumb.path, name: crumb.name, depth: i + 1 });
  });
  return nodes;
});

const treeDirs = computed(() =>
  items.value
    .filter((item) => item.isDir && item.name !== ".." && !samePath(item.key, parentPathOf(currentPath.value)))
    .slice(0, 30),
);

const isCurrentPath = (path: string): boolean => samePath(path, currentPath.value);

const parentEntry = computed<FilePickerItem | null>(() => {
  if (isRootPath(currentPath.value)) return null;
  const remoteParent = items.value.find((item) => item.name === ".." && item.isDir);
  return remoteParent ?? { key: parentPathOf(currentPath.value), name: "..", isDir: true };
});

const matchesAccept = (item: FilePickerItem, token: string): boolean => {
  if (token === "*/*") return true;
  if (token.startsWith("image/")) return !!item.mimeType?.startsWith("image/") || /\.(jpe?g|png|gif|webp|svg|avif|bmp)$/i.test(item.name);
  if (token.startsWith("video/")) return !!item.mimeType?.startsWith("video/") || /\.(mp4|webm|ogg|mov|avi)$/i.test(item.name);
  if (token.startsWith("audio/")) return !!item.mimeType?.startsWith("audio/") || /\.(mp3|wav|ogg|flac|m4a)$/i.test(item.name);
  if (token.startsWith("text/")) return !!item.mimeType?.startsWith("text/") || /\.(txt|md|json|xml|csv|log)$/i.test(item.name);
  if (token.startsWith(".")) return item.name.toLowerCase().endsWith(token.toLowerCase());
  return true;
};

const filteredItems = computed(() => {
  let list = items.value.filter((item) => item.name !== ".." && !samePath(item.key, parentPathOf(currentPath.value)));
  if (props.accept) {
    const accepted = props.accept.split(",").map((token) => token.trim().toLowerCase()).filter(Boolean);
    list = list.filter((item) => {
      if (item.isDir) return true;
      return accepted.some((token) => matchesAccept(item, token));
    });
  }
  const q = searchText.value.trim().toLowerCase();
  if (q) list = list.filter((item) => item.name.toLowerCase().includes(q));
  return list;
});

const rows = computed(() => [...filteredItems.value].sort((a, b) => {
  const dirOrder = Number(b.isDir) - Number(a.isDir);
  if (dirOrder !== 0) return dirOrder;
  let left: string | number = "";
  let right: string | number = "";
  if (sortKey.value === "name") {
    left = a.name.toLowerCase();
    right = b.name.toLowerCase();
  } else if (sortKey.value === "type") {
    left = (a.isDir ? "文件夹" : fileTypeText(a.name)).toLowerCase();
    right = (b.isDir ? "文件夹" : fileTypeText(b.name)).toLowerCase();
  } else if (sortKey.value === "size") {
    left = a.isDir ? -1 : a.size ?? 0;
    right = b.isDir ? -1 : b.size ?? 0;
  } else {
    left = a.updatedAt ?? 0;
    right = b.updatedAt ?? 0;
  }
  const cmp = left < right ? -1 : left > right ? 1 : 0;
  return sortAsc.value ? cmp : -cmp;
}));

const toggleSort = (key: "name" | "type" | "size" | "updatedAt") => {
  if (sortKey.value === key) {
    sortAsc.value = !sortAsc.value;
  } else {
    sortKey.value = key;
    sortAsc.value = true;
  }
};

const sortArrow = (key: "name" | "type" | "size" | "updatedAt") =>
  sortKey.value === key ? (sortAsc.value ? "↑" : "↓") : "";

const isSelected = (item: FilePickerItem): boolean =>
  selectedItems.value.some((selected) => selected.key === item.key);

const canConfirm = computed(() => {
  if (props.multiple) return selectedItems.value.length > 0;
  return selectedItems.value.length === 1;
});

const selectedSummary = computed(() => {
  if (!selectedItems.value.length) return "尚未选择";
  if (props.multiple) {
    const first = selectedItems.value[0]?.key ?? "";
    return selectedItems.value.length > 1
      ? `${selectedItems.value.length} 项 · ${first}`
      : first;
  }
  return selectedItems.value[0]?.key || selectedItems.value[0]?.name || "";
});

/* ---------- 交互 ---------- */

const navigateTo = (path: string) => {
  if (samePath(path, currentPath.value)) return;
  history.value.push(currentPath.value);
  currentPath.value = path;
  selectedItems.value = [];
  void loadItems(path);
};

const goBack = () => {
  const previous = history.value.pop();
  if (previous === undefined) return;
  currentPath.value = previous;
  selectedItems.value = [];
  void loadItems(previous);
};

const handleBreadcrumbClick = (path: string) => navigateTo(path);

const handleItemClick = (item: FilePickerItem) => {
  if (item.name === ".." || samePath(item.key, parentPathOf(currentPath.value))) {
    navigateTo(item.key);
    return;
  }
  if (item.isDir) {
    if (!props.directoryMode) return;
    if (props.multiple) {
      const idx = selectedItems.value.findIndex((selected) => selected.key === item.key);
      if (idx >= 0) {
        selectedItems.value.splice(idx, 1);
      } else {
        selectedItems.value.push(item);
      }
    } else {
      selectedItems.value = [item];
    }
    return;
  }
  if (props.multiple) {
    const idx = selectedItems.value.findIndex((selected) => selected.key === item.key);
    if (idx >= 0) {
      selectedItems.value.splice(idx, 1);
    } else {
      selectedItems.value.push(item);
    }
  } else {
    selectedItems.value = [item];
  }
};

const handleItemDblClick = (item: FilePickerItem) => {
  if (item.name === ".." || samePath(item.key, parentPathOf(currentPath.value))) {
    navigateTo(item.key);
    return;
  }
  if (item.isDir) {
    navigateTo(item.key);
    return;
  }
  if (!props.multiple) {
    selectedItems.value = [item];
    handleConfirm();
  }
};

const handleConfirm = () => {
  if (!canConfirm.value) return;
  emit("select", [...selectedItems.value]);
  selectedItems.value = [];
  emit("update:modelValue", false);
};

/* ---------- 展示工具 ---------- */

const fileTypeText = (name: string): string => {
  const ext = name.includes(".") ? name.split(".").pop()?.toLowerCase() || "" : "";
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

const isImage = (item: FilePickerItem): boolean =>
  !!item.mimeType?.startsWith("image/") || /\.(jpe?g|png|gif|webp|svg|avif|bmp)$/i.test(item.name);

const isVideo = (item: FilePickerItem): boolean =>
  !!item.mimeType?.startsWith("video/") || /\.(mp4|webm|ogg|mov|avi)$/i.test(item.name);

const isAudio = (item: FilePickerItem): boolean =>
  !!item.mimeType?.startsWith("audio/") || /\.(mp3|wav|ogg|flac|m4a)$/i.test(item.name);

const isPdf = (item: FilePickerItem): boolean =>
  item.mimeType === "application/pdf" || /\.pdf$/i.test(item.name);

const formatSize = (bytes: number): string => {
  if (!bytes || bytes <= 0) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
};

const formatTime = (value?: number): string => {
  if (!value || Number.isNaN(value)) return "-";
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

watch(
  () => props.modelValue,
  (visible) => {
    if (!visible) return;
    currentPath.value = props.initialPath;
    selectedItems.value = [];
    history.value = [];
    searchText.value = "";
    sortKey.value = "name";
    sortAsc.value = true;
    void loadItems(props.initialPath);
  },
);

watch(
  () => props.data,
  () => {
    if (props.modelValue) void loadItems();
  },
  { deep: true },
);

watch(
  () => props.initialPath,
  () => {
    if (props.modelValue) {
      currentPath.value = props.initialPath;
      selectedItems.value = [];
      history.value = [];
      void loadItems(props.initialPath);
    }
  },
);
</script>

<style scoped>
.rfp {
  min-height: 520px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rfp__toolbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-bg-color, #fff);
}

.rfp__nav-btns {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

.rfp-icon-btn {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-regular);
  font-family: inherit;
  cursor: pointer;
  transition: color var(--el-transition-duration, 0.2s), border-color var(--el-transition-duration, 0.2s), background var(--el-transition-duration, 0.2s);
}

.rfp-icon-btn:hover:not(:disabled) {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
}

.rfp-icon-btn:disabled {
  color: var(--el-text-color-placeholder);
  cursor: not-allowed;
}

.rfp__crumbs {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 2px;
  overflow: hidden;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.rfp__crumb {
  flex-shrink: 0;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--el-text-color-secondary);
  font-weight: 500;
  cursor: pointer;
  padding: 3px 6px;
  border-radius: 6px;
  transition: color var(--el-transition-duration, 0.2s), background var(--el-transition-duration, 0.2s);
}

.rfp__crumb:hover:not(.is-active) {
  color: var(--el-color-primary);
  background: var(--el-fill-color-light);
}

.rfp__crumb.is-active {
  color: var(--el-text-color-primary);
  font-weight: 700;
  cursor: default;
}

.rfp__crumb-sep {
  margin: 0 3px;
  color: var(--el-text-color-placeholder);
  font-weight: 400;
}

.rfp__search {
  flex-shrink: 0;
  width: 220px;
}

.rfp__body {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 12px;
}

.rfp-nav {
  flex-shrink: 0;
  width: 208px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-bg-color, #fff);
  overflow-y: auto;
  max-height: 440px;
}

.rfp-nav__title {
  padding: 6px 8px 4px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0;
}

.rfp-nav__title--sub {
  margin-top: 8px;
  padding-top: 10px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.rfp-nav__item {
  --rfp-tree-depth: 0;
  display: flex;
  align-items: center;
  gap: 7px;
  width: 100%;
  max-width: 100%;
  min-height: 34px;
  padding: 0 8px;
  padding-left: calc(8px + var(--rfp-tree-depth) * 14px);
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-regular);
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: background var(--el-transition-duration, 0.2s), color var(--el-transition-duration, 0.2s);
}

.rfp-nav__item:hover {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}

.rfp-nav__item.is-active {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: 600;
}

.rfp-nav__icon {
  flex-shrink: 0;
  color: var(--el-text-color-secondary);
}

.rfp-nav__item.is-active .rfp-nav__icon {
  color: var(--el-color-primary);
}

.rfp-nav__label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rfp-nav__blank {
  flex-shrink: 0;
  width: 14px;
}

.rfp-main {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-bg-color, #fff);
  overflow: hidden;
}

.rfp-main__state {
  flex: 1;
  min-height: 360px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.rfp-main__state.is-spin,
.rfp-main__state .is-spin {
  animation: rfp-spin 0.8s linear infinite;
}

.rfp-main__state--error {
  flex-direction: column;
  color: var(--el-color-danger);
  text-align: center;
  padding: 24px;
}

.rfp-main__state--error div {
  max-width: 440px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rfp-main__state--error span {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  word-break: break-all;
}

@keyframes rfp-spin {
  to { transform: rotate(360deg); }
}

.rfp-details__head,
.rfp-details__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 110px 88px 150px;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  font-size: 13px;
}

.rfp-details__head {
  flex-shrink: 0;
  height: 38px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
}

.rfp-details__head-cell {
  cursor: pointer;
  user-select: none;
  padding: 2px 4px;
  border-radius: 4px;
}

.rfp-details__head-cell:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 1px;
}

.rfp-details__head-cell:hover,
.rfp-details__head-cell.is-sorted {
  color: var(--el-color-primary);
}

.rfp-sort-arrow {
  color: var(--el-color-primary);
  font-weight: 700;
}

.rfp-details {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 4px 0 6px;
}

.rfp-details__row {
  width: 100%;
  min-height: 44px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-regular);
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color var(--el-transition-duration, 0.2s), background var(--el-transition-duration, 0.2s);
}

.rfp-details__row:hover {
  background: var(--el-fill-color-light);
}

.rfp-details__row.is-selected {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.rfp-details__row--parent {
  color: var(--el-text-color-secondary);
}

.rfp-details__name {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.rfp-file-icon {
  flex-shrink: 0;
  color: var(--el-text-color-secondary);
}

.rfp-details__row.is-selected .rfp-file-icon,
.rfp-details__row.is-dir:hover .rfp-file-icon {
  color: var(--el-color-primary);
}

.rfp-details__name-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rfp-details__name-text.is-dir {
  color: var(--el-text-color-primary);
  font-weight: 600;
}

.rfp-details__thumb {
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  object-fit: cover;
  border-radius: 4px;
  background: var(--el-fill-color-light);
}

.rfp-details__type,
.rfp-details__time {
  color: var(--el-text-color-secondary);
}

.rfp-details__size {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.rfp-details__time {
  font-variant-numeric: tabular-nums;
}

.rfp__selected {
  flex-shrink: 0;
  min-height: 34px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  font-size: 12px;
}

.rfp__selected-label {
  flex-shrink: 0;
  font-weight: 600;
  color: var(--el-text-color-secondary);
}

.rfp__selected-value {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--el-color-primary);
  font-weight: 600;
}

.rfp__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

@media (prefers-reduced-motion: reduce) {
  .rfp-icon-btn,
  .rfp-nav__item,
  .rfp-details__row {
    transition: none;
  }
}
</style>