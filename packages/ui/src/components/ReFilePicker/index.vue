<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="720px"
    :close-on-click-modal="false"
    append-to-body
    destroy-on-close
    class="re-file-picker"
  >
    <div class="re-file-picker__toolbar">
      <div class="re-file-picker__bread">
        <span
          v-for="(seg, i) in breadcrumb"
          :key="i"
          class="re-file-picker__bread-item"
          :class="{ 'is-active': i === breadcrumb.length - 1 }"
          @click="handleBreadcrumbClick(i)"
        >
          {{ seg.name }}
          <span v-if="i < breadcrumb.length - 1" class="re-file-picker__bread-sep">/</span>
        </span>
      </div>
      <div class="re-file-picker__search">
        <el-input
          v-model="searchText"
          placeholder="搜索文件名"
          size="small"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
    </div>

    <div class="re-file-picker__body">
      <div v-if="loading" class="re-file-picker__loading">
        <el-icon class="re-file-picker__spinner"><Loading /></el-icon>
      </div>
      <div v-else-if="filteredItems.length === 0" class="re-file-picker__empty">
        <slot name="empty">暂无文件</slot>
      </div>
      <div v-else class="re-file-picker__grid">
        <div
          v-for="item in filteredItems"
          :key="item.key"
          class="re-file-picker__item"
          :class="{ 'is-selected': isSelected(item) }"
          @click="handleItemClick(item)"
          @dblclick="handleItemDblClick(item)"
        >
          <div class="re-file-picker__item-icon">
            <el-icon v-if="item.isDir"><Folder /></el-icon>
            <el-icon v-else-if="isImage(item)"><Picture /></el-icon>
            <el-icon v-else-if="isVideo(item)"><VideoPlay /></el-icon>
            <el-icon v-else-if="isAudio(item)"><Headset /></el-icon>
            <el-icon v-else-if="isPdf(item)"><Document /></el-icon>
            <el-icon v-else><Files /></el-icon>
          </div>
          <div class="re-file-picker__item-name" :title="item.name">{{ item.name }}</div>
          <div v-if="!item.isDir && item.size" class="re-file-picker__item-meta">
            {{ formatSize(item.size) }}
          </div>
        </div>
      </div>
    </div>

    <div v-if="multiple && selectedItems.length > 0" class="re-file-picker__selected">
      已选 {{ selectedItems.length }} 个文件
    </div>

    <template #footer>
      <div class="re-file-picker__footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!canConfirm" @click="handleConfirm">
          {{ isDirectoryMode ? "选择该目录" : "确认选择" }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
/**
 * ReFilePicker —— 文件选择器
 *
 * 支持树形浏览、搜索、多选、文件类型过滤
 * 适配后端文件存储服务（可通过 listUrl 接入）
 *
 *   <ReFilePicker
 *     v-model="showPicker"
 *     list-url="/api/filesystem/list"
 *     @select="files => handleSelect(files)"
 *   />
 */
import { http } from "@repo/core";
import { ref, computed, watch } from "vue";
import {
  ElDialog,
  ElInput,
  ElButton,
  ElIcon,
} from "element-plus";
import {
  Folder,
  Picture,
  VideoPlay,
  Headset,
  Document,
  Files,
  Search,
  Loading,
} from "@element-plus/icons-vue";
import { DEFAULT_MOCK_TREE, type FilePickerItem, type FilePickerListResult } from "./types";

interface Props {
  /** 是否显示弹窗 */
  modelValue: boolean;
  /** 弹窗标题 */
  title?: string;
  /** 文件列表接口（GET），返回 { items, current, parent } */
  listUrl?: string;
  /** 自定义加载函数（优先于 listUrl），参数为当前路径，返回文件/目录列表 */
  loader?: (path: string) => Promise<FilePickerItem[]>;
  /** 文件列表静态数据（mock） */
  listData?: FilePickerItem[];
  /** 请求头 */
  headers?: Record<string, string>;
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
  set: (val) => emit("update:modelValue", val),
});

const dialogTitle = computed(() => props.title);

const isDirectoryMode = computed(() => props.directoryMode);

const currentPath = ref(props.initialPath);
const items = ref<FilePickerItem[]>([]);
const loading = ref(false);
const searchText = ref("");
const selectedItems = ref<FilePickerItem[]>([]);

const breadcrumb = computed<Array<{ name: string; path: string }>>(() => {
  const segments = currentPath.value.split("/").filter(Boolean);
  const crumbs: Array<{ name: string; path: string }> = [];
  let current = "";
  for (const seg of segments) {
    current += "/" + seg;
    crumbs.push({ name: seg, path: current });
  }
  return [{ name: "根目录", path: "/" }, ...crumbs];
});

const filteredItems = computed(() => {
  let list = items.value;
  if (props.accept) {
    const accepted = props.accept.split(",").map((s) => s.trim().toLowerCase());
    list = list.filter((item) => {
      if (item.isDir) return true;
      if (accepted.includes("*/*") || accepted.includes("image/*") && isImage(item)) {
        return true;
      }
      const ext = "." + (item.name.split(".").pop() ?? "").toLowerCase();
      return accepted.some((a) => a.startsWith(".") ? a === ext : false);
    });
  }
  if (searchText.value) {
    const q = searchText.value.toLowerCase();
    list = list.filter((item) => item.name.toLowerCase().includes(q));
  }
  return list;
});

const canConfirm = computed(() => {
  if (props.multiple) return selectedItems.value.length > 0;
  return selectedItems.value.length === 1;
});

const isImage = (item: FilePickerItem): boolean => {
  return !!item.mimeType?.startsWith("image/") || /\.(jpe?g|png|gif|webp|svg|avif|bmp)$/i.test(item.name);
};

const isVideo = (item: FilePickerItem): boolean => {
  return !!item.mimeType?.startsWith("video/") || /\.(mp4|webm|ogg|mov|avi)$/i.test(item.name);
};

const isAudio = (item: FilePickerItem): boolean => {
  return !!item.mimeType?.startsWith("audio/") || /\.(mp3|wav|ogg|flac|m4a)$/i.test(item.name);
};

const isPdf = (item: FilePickerItem): boolean => {
  return item.mimeType === "application/pdf" || /\.pdf$/i.test(item.name);
};

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
};

const isSelected = (item: FilePickerItem): boolean => {
  return selectedItems.value.some((s) => s.key === item.key);
};

const handleBreadcrumbClick = (i: number) => {
  const seg = breadcrumb.value[i];
  if (seg) {
    currentPath.value = seg.path;
    void loadItems();
  }
};

const handleItemClick = (item: FilePickerItem) => {
  // 目录选择模式：点击目录项直接选中（作为目标目录）
  if (props.directoryMode && item.isDir) {
    selectedItems.value = [item];
    return;
  }
  if (item.isDir) return;
  if (props.multiple) {
    const idx = selectedItems.value.findIndex((s) => s.key === item.key);
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
  if (props.directoryMode && item.isDir) {
    navigateTo(item.key);
    return;
  }
  if (item.isDir) {
    navigateTo(item.key);
  } else {
    handleItemClick(item);
    handleConfirm();
  }
};

const navigateTo = (path: string) => {
  currentPath.value = path;
  void loadItems();
};

const loadItems = async () => {
  loading.value = true;
  try {
    if (props.loader) {
      items.value = await props.loader(currentPath.value);
    } else if (props.listUrl) {
      const url = `${props.listUrl}?prefix=${encodeURIComponent(currentPath.value)}`;
      const { data: result } = await http().get(url).headers(props.headers ?? {});
      const data = "data" in result ? result.data : result;
      items.value = data.items ?? [];
    } else {
      // 使用 mock 数据
      const prefix = currentPath.value === "/" ? "" : currentPath.value + "/";
      items.value = DEFAULT_MOCK_TREE.filter((item) => {
        if (currentPath.value === "/") {
          // 根目录：显示第一级
          const path = item.key;
          const parts = path.split("/").filter(Boolean);
          return parts.length === 1 || (parts.length === 2 && !item.isDir);
        }
        return item.key.startsWith(prefix) && item.key !== currentPath.value;
      }).filter((item, idx, arr) => {
        // 去重：同一目录下只显示一次
        const path = item.key.substring(prefix.length);
        const firstSlash = path.indexOf("/");
        if (firstSlash === -1) return true;
        const name = path.substring(0, firstSlash);
        const dirKey = prefix + name;
        return item.key === dirKey || item.key.substring(prefix.length).indexOf("/") === path.indexOf("/");
      });
      // 简化：只展示当前直接子项
      const directChildren: FilePickerItem[] = [];
      for (const item of DEFAULT_MOCK_TREE) {
        if (item.key === currentPath.value) continue;
        if (currentPath.value === "/") {
          const segments = item.key.split("/").filter(Boolean);
          if (segments.length === 1 || (segments.length === 2 && !item.isDir)) {
            const key = item.isDir || segments.length === 1 ? item.key : "/" + segments[0];
            if (!directChildren.find((d) => d.key === key)) {
              directChildren.push(item);
            }
          }
        } else if (item.key.startsWith(currentPath.value + "/")) {
          const rest = item.key.substring(currentPath.value.length + 1);
          if (!rest.includes("/")) {
            directChildren.push(item);
          } else {
            const dirName = rest.split("/")[0];
            const dirKey = currentPath.value + "/" + dirName;
            if (!directChildren.find((d) => d.key === dirKey)) {
              directChildren.push({ key: dirKey, name: dirName, isDir: true });
            }
          }
        }
      }
      items.value = directChildren;
    }
  } catch (err) {
    console.error("ReFilePicker load failed", err);
    items.value = [];
  } finally {
    loading.value = false;
  }
};

const handleConfirm = () => {
  if (!canConfirm.value) return;
  emit("select", [...selectedItems.value]);
  selectedItems.value = [];
  dialogVisible.value = false;
};

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      currentPath.value = props.initialPath;
      selectedItems.value = [];
      void loadItems();
    }
  },
);
</script>

<style scoped>
.re-file-picker__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.re-file-picker__bread {
  flex: 1;
  display: flex;
  align-items: center;
  font-size: 13px;
  color: var(--el-text-color-regular);
  overflow: hidden;
  flex-wrap: wrap;
}

.re-file-picker__bread-item {
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  transition: background 0.2s, color 0.2s;
}

.re-file-picker__bread-item:hover {
  background: var(--el-fill-color-light);
  color: var(--el-color-primary);
}

.re-file-picker__bread-item.is-active {
  color: var(--el-text-color-primary);
  font-weight: 500;
  cursor: default;
}

.re-file-picker__bread-sep {
  margin: 0 4px;
  color: var(--el-text-color-placeholder);
}

.re-file-picker__search {
  width: 200px;
  flex-shrink: 0;
}

.re-file-picker__body {
  min-height: 360px;
  max-height: 480px;
  overflow-y: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
  padding: 12px;
  background: var(--el-bg-color);
}

.re-file-picker__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 360px;
}

.re-file-picker__spinner {
  font-size: 24px;
  color: var(--el-color-primary);
  animation: re-fp-spin 0.8s linear infinite;
}

@keyframes re-fp-spin {
  to { transform: rotate(360deg); }
}

.re-file-picker__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 360px;
  color: var(--el-text-color-secondary);
}

.re-file-picker__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 12px;
}

.re-file-picker__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  border: 1px solid transparent;
  border-radius: var(--el-border-radius-base);
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}

.re-file-picker__item:hover {
  background: var(--el-fill-color-light);
}

.re-file-picker__item.is-selected {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.re-file-picker__item-icon {
  font-size: 36px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
}

.re-file-picker__item-name {
  font-size: 12px;
  color: var(--el-text-color-primary);
  text-align: center;
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.re-file-picker__item-meta {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}

.re-file-picker__selected {
  margin-top: 12px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.re-file-picker__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
