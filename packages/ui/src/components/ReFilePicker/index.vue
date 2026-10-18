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
    <div
      ref="rootRef"
      class="rfp"
      tabindex="-1"
      @keydown="onKeydown"
      @contextmenu="onContextMenu"
    >
      <FilePickerToolbar
        v-model="searchText"
        :breadcrumb="breadcrumb"
        :loading="loading"
        :can-back="history.length > 0"
        @back="goBack"
        @refresh="refresh"
        @navigate="navigateTo"
      />

      <div class="rfp__body">
        <FilePickerSidebar
          :nodes="treeNodes"
          :dirs="treeDirs"
          :current-path="currentPath"
          @navigate="navigateTo"
        />

        <FilePickerList
          :rows="rows"
          :columns="columns"
          :parent-entry="parentEntry"
          :loading="loading"
          :load-error="loadError"
          :searching="searching"
          :sort-key="sortKey"
          :sort-asc="sortAsc"
          :active-index="activeIndex"
          :is-selected="isSelected"
          @sort="toggleSort"
          @activate="onActivate"
          @open="onOpen"
          @navigate="navigateTo"
        >
          <template v-if="$slots.empty" #empty>
            <slot name="empty" />
          </template>
        </FilePickerList>
      </div>

      <div class="rfp__selected">
        <span class="rfp__status-count">{{ rows.length }} 个项目</span>
        <span class="rfp__selected-label">当前选择</span>
        <span class="rfp__selected-value" :title="selectedSummary">{{ selectedSummary }}</span>
        <span v-if="limit > 0" class="rfp__status-limit" :class="{ 'is-full': isLimitReached }">
          {{ selectedCount }} / {{ limit }}
        </span>
        <span v-if="limitHint" class="rfp__status-hint" role="status">{{ limitHint }}</span>
        <el-button
          v-if="selectedItems.length"
          size="small"
          text
          type="primary"
          @click="clearSelection"
        >
          清除
        </el-button>
      </div>
    </div>

    <!-- 右键菜单 / 属性 / 预览：都只在使用时进 DOM，关着时页面上没有多余可点元素 -->
    <FilePickerContextMenu
      v-model:visible="menuVisible"
      :items="menuItems"
      :x="menuX"
      :y="menuY"
      @select="onMenuSelect"
    />

    <FilePickerPropertiesDialog v-model="propsVisible" :item="menuItem" :path="currentPath" />

    <FilePickerPreviewDialog
      v-model="previewVisible"
      :item="previewItem"
      :src="previewSrc"
      :loading="previewLoading"
      :error="previewError"
    >
      <template v-if="$slots.preview" #default="previewSlotProps">
        <slot name="preview" v-bind="previewSlotProps" />
      </template>
    </FilePickerPreviewDialog>

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
 * ReFilePicker —— 文件 / 目录选择器。
 *
 * <p>交互与外观对齐 Windows 资源管理器的文件对话框：顶栏（后退 / 刷新 /
 * 地址栏 / 搜索）、左侧导航窗格、右侧「详细信息」列表（名称 / 修改时间 /
 * 类型 / 大小，可点表头排序）、底部状态栏，以及键盘上下选行 + 回车打开。</p>
 *
 * <p>数据来源二选一：`loader`（宿主远端接口，返回 FilePickerItem[]）或
 * `data`（本地 JSON）。逻辑在 {@link useFilePicker}，纯函数在 utils.ts，
 * 视图拆成 toolbar / sidebar / list 三个子组件。</p>
 */
import { computed, nextTick, ref, useSlots, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Delete,
  Download,
  EditPen,
  FolderAdd,
  InfoFilled,
  Refresh,
  Upload as UploadIcon,
  View,
} from "@element-plus/icons-vue";
import type {
  FilePickerContextMenuAction,
  FilePickerContextMenuItem,
  FilePickerContextMenuOptions,
  FilePickerItem,
  FilePickerLoader,
} from "./types";
import { FILE_PICKER_COLUMNS, toNativeAccept } from "./utils";
import { useFilePicker } from "./composables/useFilePicker";
import FilePickerToolbar from "./components/FilePickerToolbar.vue";
import FilePickerSidebar from "./components/FilePickerSidebar.vue";
import FilePickerList from "./components/FilePickerList.vue";
import FilePickerContextMenu from "./components/FilePickerContextMenu.vue";
import FilePickerPropertiesDialog from "./components/FilePickerPropertiesDialog.vue";
import FilePickerPreviewDialog from "./components/FilePickerPreviewDialog.vue";
import ReDialog from "../ReDialog";

interface Props {
  /** 是否显示弹窗 */
  modelValue: boolean;
  /** 弹窗标题 */
  title?: string;
  /** 远端 loader：路径 → 文件/目录列表；filesystem-starter 的目录条目也需由宿主 map 成该形状 */
  loader?: FilePickerLoader;
  /** 本地 JSON 数据：FilePickerItem[] 或 { current, parent, items } */
  data?: import("./types").FilePickerData;
  /** 多选 */
  multiple?: boolean;
  /** 最多可选数量（0 = 不限）；为 1 时按单选语义「改选」 */
  limit?: number;
  /** 文件类型过滤（如 'image/*'、'.png,.jpg'、'dir,.zip'；含 `dir` 表示目录也可选） */
  accept?: string;
  /** 起始目录 */
  initialPath?: string;
  /** 目录选择模式：点击目录即选中该目录（无需进入），选择结果返回目录路径 */
  directoryMode?: boolean;
  /**
   * 右键菜单：`true`（默认）= 用默认开关（刷新 / 属性 / 预览开，其余关），
   * `false` = 关闭，对象 = 逐项开关。
   */
  contextMenu?: boolean | FilePickerContextMenuOptions;
  /** 预览地址（如 FileStorageServerFilter 的 `?preview=true` 票据通道）；给了才有「预览」 */
  previewUrl?: (item: FilePickerItem) => string | Promise<string>;
  /** 新建文件夹（宿主负责落盘；给了才有该菜单项） */
  createDir?: (dir: string, name: string) => unknown | Promise<unknown>;
  /** 重命名（宿主负责落盘；给了才有该菜单项） */
  renameItem?: (item: FilePickerItem, newName: string) => unknown | Promise<unknown>;
  /** 删除（多选时为批量；给了才有该菜单项） */
  removeItems?: (items: FilePickerItem[]) => unknown | Promise<unknown>;
  /** 上传文件到当前目录（给了才有该菜单项） */
  uploadFiles?: (dir: string, files: File[]) => unknown | Promise<unknown>;
  /** 下载（给了才有该菜单项） */
  downloadItems?: (items: FilePickerItem[]) => unknown | Promise<unknown>;
}

const props = withDefaults(defineProps<Props>(), {
  title: "选择文件",
  multiple: false,
  limit: 0,
  accept: "",
  initialPath: "/",
  directoryMode: false,
  contextMenu: true,
  previewUrl: undefined,
  createDir: undefined,
  renameItem: undefined,
  removeItems: undefined,
  uploadFiles: undefined,
  downloadItems: undefined,
});

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "select", items: FilePickerItem[]): void;
  (e: "cancel"): void;
  /** 请求预览某条目（宿主也可只用 previewUrl 或 #preview 插槽） */
  (e: "preview", item: FilePickerItem): void;
}>();

const slots = useSlots();

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => {
    if (!val) emit("cancel");
    emit("update:modelValue", val);
  },
});

const dialogTitle = computed(() => props.title);
const isDirectoryMode = computed(() => props.directoryMode);
const columns = FILE_PICKER_COLUMNS;

const rootRef = ref<HTMLElement | null>(null);

const {
  currentPath,
  loading,
  loadError,
  searchText,
  selectedItems,
  history,
  sortKey,
  sortAsc,
  activeIndex,
  breadcrumb,
  treeNodes,
  treeDirs,
  parentEntry,
  rows,
  searching,
  canConfirm,
  selectedSummary,
  selectedCount,
  limit,
  limitHint,
  isLimitReached,
  load,
  refresh,
  reset,
  navigateTo,
  goBack,
  selectItem,
  selectOnly,
  openItem,
  clearSelection,
  toggleSort,
  isSelected,
  isParentEntry,
  moveActive,
  activateActive,
  takeSelection,
} = useFilePicker({
  loader: () => props.loader,
  data: () => props.data,
  accept: () => props.accept,
  initialPath: () => props.initialPath,
  directoryMode: () => props.directoryMode,
  multiple: () => props.multiple,
  limit: () => props.limit,
});

/* ---------- 交互 ---------- */

/** 行单击：记录键盘高亮位，再按模式选中 */
const onActivate = (item: FilePickerItem, index: number): void => {
  activeIndex.value = index;
  selectItem(item);
};

/** 行双击 / 回车：目录进入；单选文件即确认；多选文件且有预览通道时打开预览 */
const onOpen = (item: FilePickerItem): void => {
  if (openItem(item)) {
    handleConfirm();
    return;
  }
  if (!item.isDir && hasPreview.value) void openPreview(item);
};

const handleConfirm = (): void => {
  if (!canConfirm.value) return;
  emit("select", takeSelection());
  emit("update:modelValue", false);
};

/* ---------- 右键菜单 ---------- */

/**
 * 菜单项默认开关。
 *
 * <p>默认只开「刷新 / 属性」（不动真实文件）；新建文件夹、重命名、删除、上传、
 * 下载要落盘，默认关，由宿主显式打开并且必须同时给对应回调。</p>
 */
const DEFAULT_MENU_ACTIONS: Record<FilePickerContextMenuAction, boolean> = {
  refresh: true,
  properties: true,
  preview: true,
  newFolder: false,
  rename: false,
  remove: false,
  upload: false,
  download: false,
};

const menuVisible = ref(false);
const menuX = ref(0);
const menuY = ref(0);
/** 右键目标条目；null = 当前目录空白处（作用于当前目录） */
const menuItem = ref<FilePickerItem | null>(null);

const propsVisible = ref(false);
const previewVisible = ref(false);
const previewItem = ref<FilePickerItem | null>(null);
const previewSrc = ref("");
const previewLoading = ref(false);
const previewError = ref("");

const menuEnabled = computed(() => props.contextMenu !== false);

/** 开关：默认值 + 宿主覆盖（非布尔值忽略） */
const menuActions = computed<Record<FilePickerContextMenuAction, boolean>>(() => {
  const raw = props.contextMenu;
  const overrides = raw && typeof raw === "object" ? raw : {};
  const next = { ...DEFAULT_MENU_ACTIONS };
  (Object.keys(overrides) as FilePickerContextMenuAction[]).forEach((key) => {
    const value = overrides[key];
    if (typeof value === "boolean") next[key] = value;
  });
  return next;
});

/** 预览通道：地址构造器或 `#preview` 插槽任一存在即可用 */
const hasPreview = computed(() => !!props.previewUrl || !!slots.preview);

/**
 * 按目标拼菜单项：开关打开 <b>且</b> 宿主给了对应回调（或组件自带实现）才出现，
 * 免得菜单里挂一堆点了没反应的项。
 */
const buildMenuItems = (target: FilePickerItem | null): FilePickerContextMenuItem[] => {
  const actions = menuActions.value;
  const dirTarget = !target || target.isDir;
  const list: FilePickerContextMenuItem[] = [];
  let lastGroup = -1;
  const push = (group: number, entry: FilePickerContextMenuItem): void => {
    list.push({ ...entry, divided: group > lastGroup && lastGroup >= 0 });
    lastGroup = group;
  };

  if (actions.refresh) push(0, { key: "refresh", label: "刷新", icon: Refresh });
  if (actions.preview && target && !target.isDir && hasPreview.value) {
    push(0, { key: "preview", label: "预览", icon: View });
  }
  if (actions.properties) push(0, { key: "properties", label: "属性", icon: InfoFilled });

  if (actions.newFolder && dirTarget && props.createDir) {
    push(1, { key: "newFolder", label: "新建文件夹", icon: FolderAdd });
  }
  if (actions.upload && dirTarget && props.uploadFiles) {
    push(1, { key: "upload", label: "上传文件", icon: UploadIcon });
  }

  if (actions.rename && target && props.renameItem) {
    push(2, { key: "rename", label: "重命名", icon: EditPen });
  }
  if (actions.remove && target && props.removeItems) {
    push(2, { key: "remove", label: "删除", icon: Delete });
  }
  if (actions.download && target && !target.isDir && props.downloadItems) {
    push(2, { key: "download", label: "下载", icon: Download });
  }
  return list;
};

const menuItems = computed(() => buildMenuItems(menuItem.value));

/**
 * 右键：只在菜单确实有项时才接管原生菜单。
 *
 * <p>落在条目行上时同时改选该行（资源管理器语义）；多选下右键已选中项保留整批选择，
 * 于是删除/下载天然作用于整批。空白处右键 = 以当前目录为对象。</p>
 */
const onContextMenu = (event: MouseEvent): void => {
  if (!menuEnabled.value) return;
  const rowEl = (event.target as HTMLElement | null)?.closest<HTMLElement>(".re-file-picker__item");
  const index = rowEl ? Number(rowEl.dataset.rowIndex ?? -1) : -1;
  const hovered = index >= 0 ? rows.value[index] ?? null : null;
  const target = hovered && !isParentEntry(hovered) ? hovered : null;
  if (!buildMenuItems(target).length) return;

  event.preventDefault();
  if (target) {
    activeIndex.value = index;
    if (!isSelected(target)) selectOnly(target);
  }
  menuItem.value = target;
  menuX.value = event.clientX;
  menuY.value = event.clientY;
  menuVisible.value = true;
};

/** 宿主文件操作：失败提示原文，成功后刷新当前目录 */
const runFileTask = async (task: () => unknown | Promise<unknown>, reload = true): Promise<void> => {
  try {
    await task();
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : String(err));
    return;
  }
  if (reload) await refresh();
};

/** 非法文件名字符（Windows 口径，与后端落盘规则一致） */
const NAME_PATTERN = /^(?!\s*$)[^\\/:*?"<>|]+$/;
const NAME_MESSAGE = '名称不能为空，且不能包含 \\ / : * ? " < > |';

/** ElMessageBox 输入框：取消返回 null（不把取消当异常抛给调用方） */
const askText = async (
  title: string,
  message: string,
  value = "",
): Promise<string | null> => {
  try {
    const result = await ElMessageBox.prompt(message, title, {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      inputValue: value,
      inputPattern: NAME_PATTERN,
      inputErrorMessage: NAME_MESSAGE,
      autofocus: true,
    });
    return String((result as { value?: string } | undefined)?.value ?? "").trim();
  } catch {
    return null;
  }
};

/** 操作对象：右键项已在多选里就作用整批，否则只作用它自己 */
const targetsOf = (item: FilePickerItem): FilePickerItem[] =>
  isSelected(item) && selectedItems.value.length > 1 ? [...selectedItems.value] : [item];

/** 目录级操作的落点：右键目录 = 那个目录，其余 = 当前目录 */
const dirTargetOf = (): string => (menuItem.value?.isDir ? menuItem.value.key : currentPath.value);

const onNewFolder = async (): Promise<void> => {
  const create = props.createDir;
  if (!create) return;
  const name = await askText("新建文件夹", "请输入文件夹名称");
  if (!name) return;
  const dir = dirTargetOf();
  await runFileTask(() => create(dir, name));
};

const onRename = async (item: FilePickerItem): Promise<void> => {
  const rename = props.renameItem;
  if (!rename) return;
  const name = await askText("重命名", "请输入新名称", item.name);
  if (!name || name === item.name) return;
  await runFileTask(() => rename(item, name));
};

const onRemove = async (item: FilePickerItem): Promise<void> => {
  const remove = props.removeItems;
  if (!remove) return;
  const targets = targetsOf(item);
  try {
    await ElMessageBox.confirm(
      targets.length > 1 ? `确定删除选中的 ${targets.length} 个条目？` : `确定删除「${item.name}」？`,
      "删除确认",
      {
        type: "warning",
        confirmButtonText: "删除",
        cancelButtonText: "取消",
        confirmButtonClass: "el-button--danger",
      },
    );
  } catch {
    return;
  }
  await runFileTask(() => remove(targets));
};

/**
 * 上传：临时建一个 input[type=file]（原生选择框无法用页面元素替代）。
 *
 * <p>只在点了菜单项的那一刻出现、选完/取消即移除 —— 页面上不留常驻可点元素，
 * 也不会被界面普查（clickable census）当成未分类控件。</p>
 */
const onUpload = (): void => {
  const upload = props.uploadFiles;
  if (!upload) return;
  const dir = dirTargetOf();
  const input = document.createElement("input");
  input.type = "file";
  input.multiple = true;
  const native = toNativeAccept(props.accept);
  if (native) input.accept = native;
  input.style.display = "none";
  input.onchange = () => {
    const files = Array.from(input.files ?? []);
    input.remove();
    if (files.length) void runFileTask(() => upload(dir, files));
  };
  input.oncancel = () => input.remove();
  document.body.appendChild(input);
  input.click();
};

/** 预览：地址来自宿主（如 FileStorageServerFilter 的 ?preview=true 票据通道） */
const openPreview = async (item: FilePickerItem): Promise<void> => {
  previewItem.value = item;
  previewSrc.value = "";
  previewError.value = "";
  previewLoading.value = !!props.previewUrl;
  previewVisible.value = true;
  emit("preview", item);

  const buildUrl = props.previewUrl;
  if (!buildUrl) return; // 只有 #preview 插槽：地址交给宿主自己解析
  try {
    const url = await buildUrl(item);
    previewSrc.value = typeof url === "string" ? url : "";
    if (!previewSrc.value && !slots.preview) previewError.value = "没有可用的预览地址";
  } catch (err) {
    previewError.value = err instanceof Error ? err.message : String(err);
  } finally {
    previewLoading.value = false;
  }
};

const onMenuSelect = (key: FilePickerContextMenuAction): void => {
  const item = menuItem.value;
  switch (key) {
    case "refresh":
      void refresh();
      return;
    case "properties":
      propsVisible.value = true;
      return;
    case "preview":
      if (item) void openPreview(item);
      return;
    case "newFolder":
      void onNewFolder();
      return;
    case "upload":
      onUpload();
      return;
    case "rename":
      if (item) void onRename(item);
      return;
    case "remove":
      if (item) void onRemove(item);
      return;
    case "download": {
      const download = props.downloadItems;
      if (item && download) void runFileTask(() => download(targetsOf(item)), false);
      return;
    }
  }
};

/**
 * 键盘：↑/↓ 移动高亮行（列表会随之聚焦该行），回车打开、退格返回上一级。
 *
 * <p>回车必须在这里统一处理：行按钮上的原生回车会触发 click，而单击目录在
 * FILE 模式下「不进入」是刻意约定，键盘用户就永远进不去目录。所以对行按钮
 * 先 preventDefault 掐掉原生 click，再按「回车 = 双击」重建语义：目录进入、
 * 文件选中（单选直接确认）。</p>
 */
const onKeydown = (event: KeyboardEvent): void => {
  const target = event.target as HTMLElement | null;
  const inField = !!target?.closest("input, textarea, [contenteditable='true']");

  if (event.key === "ArrowDown") {
    event.preventDefault();
    moveActive(1);
    return;
  }
  if (event.key === "ArrowUp") {
    event.preventDefault();
    moveActive(-1);
    return;
  }
  if (inField) return;
  if (event.key === "Enter") {
    const rowEl = target?.closest<HTMLElement>(".re-file-picker__item");
    if (rowEl) {
      event.preventDefault();
      const index = Number(rowEl.dataset.rowIndex ?? -1);
      const item = rows.value[index];
      if (!item) return;
      if (item.isDir) {
        onOpen(item);
      } else {
        onActivate(item, index);
        if (!props.multiple) handleConfirm();
      }
      return;
    }
    // 焦点在别的按钮/链接上时由原生 click 负责；只有焦点在根/导航/列表空白处才手动激活
    if (target?.closest("button, a")) return;
    event.preventDefault();
    if (activateActive()) handleConfirm();
    return;
  }
  if (event.key === "Backspace") {
    event.preventDefault();
    goBack();
  }
};

/* ---------- 生命周期 ---------- */

watch(
  () => props.modelValue,
  async (visible) => {
    if (!visible) return;
    await reset(props.initialPath);
    activeIndex.value = -1;
    await nextTick();
    rootRef.value?.focus();
  },
  // immediate：宿主若以 modelValue=true 挂载（不受控/预置弹窗），首帧也要加载，
  // 否则列表永远停在空态（原实现只在 false→true 变化时才加载）。
  { immediate: true },
);

watch(
  () => props.data,
  () => {
    if (props.modelValue) void load();
  },
  { deep: true },
);

watch(
  () => props.initialPath,
  (path) => {
    if (props.modelValue) void reset(path);
  },
);
</script>

<style scoped>
/**
 * Windows 资源管理器风格皮肤。
 *
 * <p>颜色仍走 Element Plus 令牌（换主题自动跟随），只在结构上模拟资源管理器：
 * 窗口底色 / 白色内容区 / 小圆角 / 浅蓝选中。整套 --rfp-* 令牌定义在这里，
 * 子组件通过自定义属性继承，避免各写一份颜色。</p>
 */
.rfp {
  --rfp-radius: 4px;
  --rfp-chrome: var(--el-fill-color-lighter, #f5f5f5);
  --rfp-surface: var(--el-bg-color, #fff);
  --rfp-head: var(--el-fill-color-light, #f5f7fa);
  --rfp-border: var(--el-border-color-lighter, #e4e4e4);
  --rfp-text: var(--el-text-color-regular, #303133);
  --rfp-text-weak: var(--el-text-color-secondary, #606266);
  --rfp-accent: var(--el-color-primary);
  --rfp-hover: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
  --rfp-select-bg: color-mix(in srgb, var(--el-color-primary) 16%, transparent);
  --rfp-select-border: color-mix(in srgb, var(--el-color-primary) 45%, transparent);
  --rfp-folder: #f7b500;

  display: flex;
  flex-direction: column;
  height: clamp(360px, 62vh, 560px);
  border: 1px solid var(--rfp-border);
  border-radius: 6px;
  background: var(--rfp-surface);
  overflow: hidden;
  outline: none;
}

.rfp:focus-visible {
  border-color: var(--rfp-accent);
  box-shadow: 0 0 0 2px var(--rfp-select-bg);
}

.rfp__body {
  flex: 1;
  min-height: 0;
  display: flex;
}

/* 状态栏：左侧项目数，右侧当前选择（对齐资源管理器底部状态栏） */
.rfp__selected {
  flex-shrink: 0;
  min-height: 34px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-top: 1px solid var(--rfp-border);
  background: var(--rfp-chrome);
  color: var(--rfp-text-weak);
  font-size: 12px;
}

.rfp__status-count {
  flex-shrink: 0;
}

.rfp__selected-label {
  flex-shrink: 0;
  margin-left: 8px;
  padding-left: 10px;
  border-left: 1px solid var(--rfp-border);
  color: var(--rfp-text-weak);
}

.rfp__selected-value {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--rfp-accent);
  font-weight: 600;
}

/* 数量上限：常态灰字，到达上限变警示色 */
.rfp__status-limit {
  flex-shrink: 0;
  color: var(--rfp-text-weak);
  font-variant-numeric: tabular-nums;
}

.rfp__status-limit.is-full {
  color: var(--el-color-warning);
  font-weight: 600;
}

/* 到上限的瞬时提示（2.4s 自动消失） */
.rfp__status-hint {
  flex-shrink: 0;
  color: var(--el-color-warning);
}

.rfp__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
