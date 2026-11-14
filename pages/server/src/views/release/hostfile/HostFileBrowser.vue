<script setup lang="ts">
/**
 * 主机文件浏览区 —— ReTable 版（列表）+ 图标视图。
 *
 * <p>列表视图统一走 ReTable：真表头排序、勾选列、右键菜单都是组件内建行为，
 * 这里只做字段映射与插槽渲染；数据拉取与写操作仍在页面壳，浏览器组件只发意图。</p>
 *
 * <p>选中态由 ReTable 内部维护（勾选列），通过 {@code selection-change} 上报行对象；
 * 外部清空选择走 {@code expose().clearSelection()}（翻页 / 换目录 / 重新检索时由父级调用）。</p>
 *
 * @author CH
 * @since 4.0.0.62
 */
import { computed, ref } from "vue";
import ReTable from "@repo/ui/components/ReTable/ReTable.vue";
import ReButton from "@repo/ui/re-button";
import type { ReTableColumn, ReTableContextMenuItem } from "@repo/ui/re-table";
import type { ReleaseHostFileItem, ReleaseHostFileOrder, ReleaseHostFileSort } from "../../../api/releaseHostFile";
import { badgeOf, formatSize, kindLabel, kindTone, relativeTime, sizePercent } from "../../../utils/hostFileUi";

interface Props {
  /** 当前目录条目 */
  items: ReleaseHostFileItem[];
  /** 排序字段 */
  sort: ReleaseHostFileSort;
  /** 排序方向 */
  order: ReleaseHostFileOrder;
  /** 加载态 */
  loading?: boolean;
  /** 错误文案 */
  error?: string;
  /** 是否因目录过大只扫了一部分 */
  truncated?: boolean;
  /** 视图：列表 / 图标 */
  view?: "list" | "grid";
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: "",
  truncated: false,
  view: "list",
});

const emit = defineEmits<{
  /** ReTable 排序变化（prop: name/size/lastModified · order: ascending/descending/null） */
  (e: "sort", field: ReleaseHostFileSort, order: ReleaseHostFileOrder): void;
  /** 勾选变化：整页选中的行对象 */
  (e: "selection-change", rows: ReleaseHostFileItem[]): void;
  /** 点击菜单项 */
  (e: "menu-select", command: string, item: ReleaseHostFileItem): void;
  /** 单击行（无勾选列交互时）：目录进入、文件详情 */
  (e: "open", item: ReleaseHostFileItem): void;
  /** 拖入文件到当前目录 */
  (e: "drop-files", files: File[]): void;
}>();

/** 表组件实例（ReTable 暴露 clearSelection） */
const tableRef = ref<InstanceType<typeof ReTable> | null>(null);

/** 目录内最大文件尺寸：占用条按它归一，不按 100% */
const maxSize = computed(() => {
  let max = 0;
  for (const item of props.items) {
    if (!item.directory && item.size > max) {
      max = item.size;
    }
  }
  return max;
});

/** 列定义：排序只对名称 / 大小 / 修改时间开放，全部走 custom 由父级取数后重排 */
const columns = computed<ReTableColumn[]>(() => [
  { prop: "name", label: "名称", minWidth: 280, sortable: "custom", slot: "name" },
  { prop: "kind", label: "类型", width: 86, slot: "kind" },
  { prop: "size", label: "大小", width: 108, sortable: "custom", align: "right", formatter: (_r, _c, v) => formatSize(v as number) },
  { prop: "lastModified", label: "修改时间", width: 152, sortable: "custom", align: "right", formatter: (_r, _c, v) => relativeTime(v as number) },
  { prop: "md5", label: "MD5", width: 150, slot: "md5" },
  { prop: "actions", label: "操作", width: 132, align: "right", slot: "actions", fixed: "right" as const },
]);

/** 类型中文名（行内用） */
const kindName = (item: ReleaseHostFileItem) => kindLabel(item.kind);

/** 右键菜单：目录与文件给出不同入口；MD5 仅对文件开放 */
const isDir = (ctx: { row: Record<string, unknown> }) =>
  Boolean((ctx.row as unknown as ReleaseHostFileItem).directory);

const contextMenu = (): ReTableContextMenuItem[] => [
  { key: "open", label: "打开", icon: "FolderOpened", divided: false },
  { key: "download", label: "下载", icon: "Download", disabled: isDir },
  { key: "push", label: "上传项目", icon: "Promotion", disabled: isDir },
  { key: "md5", label: "计算 MD5", icon: "Key", disabled: isDir },
  { key: "separator-1", label: "", divided: true, disabled: true },
  { key: "rename", label: "重命名", icon: "EditPen" },
  { key: "copy-name", label: "复制名称", icon: "DocumentCopy" },
  { key: "copy-key", label: "复制存储路径", icon: "DocumentCopy" },
  { key: "delete", label: "删除", icon: "Delete", danger: true, divided: true },
];

/**
 * ReTable 排序回调 → 父级排序字段与方向。
 *
 * @param payload ReTable 排序载荷
 */
function onSortChange(payload: { prop: string; order: "ascending" | "descending" | null }): void {
  if (!payload.order) {
    return;
  }
  let field: ReleaseHostFileSort = "name";
  if (payload.prop === "size") {
    field = "size";
  } else if (payload.prop === "lastModified") {
    field = "time";
  }
  emit("sort", field, payload.order === "ascending" ? "asc" : "desc");
}

/** 勾选变化直接上报行对象 */
function onSelectionChange(rows: Array<Record<string, unknown>>): void {
  emit("selection-change", rows as unknown as ReleaseHostFileItem[]);
}

/** 单击行：目录进入，文件看详情 */
function onRowClick(row: Record<string, unknown>): void {
  emit("open", row as unknown as ReleaseHostFileItem);
}

/** 菜单项点击 */
function onMenuSelect(item: ReTableContextMenuItem, ctx: { row: Record<string, unknown> }): void {
  if (item.disabled === true) {
    return;
  }
  emit("menu-select", item.key, ctx.row as unknown as ReleaseHostFileItem);
}

/** 外部清空选择（翻页 / 换目录 / 重新检索时由父级调用） */
function clearSelection(): void {
  // ReTable 的实例方法名是 clearSelection（element 引擎） / clearCheckboxRow（vxe 引擎）
  const table = tableRef.value as unknown as {
    clearSelection?: () => void;
    clearCheckboxRow?: () => void;
  } | null;
  table?.clearSelection?.();
  table?.clearCheckboxRow?.();
}

/** 暴露给父级 */
defineExpose({ clearSelection });

/** 页面级拖拽上传（整容器接收） */
const dragging = ref(false);
let dragDepth = 0;

/**
 * 拖拽进入容器：只要不是内部行拖拽（已随 ReTable 化移除），一律亮上传遮罩。
 */
function onDragEnter(): void {
  dragDepth += 1;
  dragging.value = true;
}

/**
 * 拖拽离开容器：计数归零才熄灯。
 */
function onDragLeave(): void {
  dragDepth = Math.max(0, dragDepth - 1);
  if (dragDepth === 0) {
    dragging.value = false;
  }
}

/**
 * 松手：收集文件交给父级上传。
 *
 * @param event 拖拽事件
 */
function onDrop(event: DragEvent): void {
  dragDepth = 0;
  dragging.value = false;
  const files = Array.from(event.dataTransfer?.files ?? []);
  if (files.length) {
    emit("drop-files", files);
  }
}
</script>

<template>
  <div
    class="hfb"
    @dragenter.prevent="onDragEnter"
    @dragover.prevent
    @dragleave="onDragLeave"
    @drop.prevent="onDrop"
  >
    <div v-if="loading" class="hfb-state">正在读取目录…</div>
    <div v-else-if="error" class="hfb-state hfb-state--error">
      <ReButton icon="WarningFilled" type="danger" text @click="$emit('drop-files', [])" />
      <span>{{ error }}</span>
    </div>
    <div v-else-if="!items.length" class="hfb-state hfb-state--empty">
      <ReButton icon="FolderOpened" type="primary" text />
      <b>这个目录是空的</b>
      <span>把文件拖进来，或点右上角「上传」</span>
    </div>

    <!-- 列表视图：ReTable -->
    <ReTable
      v-else-if="view === 'list'"
      ref="tableRef"
      :data="items as unknown as Array<Record<string, unknown>>"
      :columns="columns"
      :loading="loading"
      row-key="key"
      :show-selection="true"
      :pagination="false"
      :toolbar="false"
      :context-menu="contextMenu"
      :settings="{ border: true, highlightCurrentRow: false }"
      class="hfb-table"
      @selection-change="onSelectionChange"
      @row-click="onRowClick"
      @sort-change="onSortChange"
      @context-menu-select="onMenuSelect"
    >
      <template #col-name="{ row }">
        <div class="hfb-name">
          <span class="hfb-tile" :class="`hfb-tile--${kindTone(row.kind)}`">
            <ReButton :icon="row.directory ? 'Folder' : 'Document'" layout="square" size="mini" decorative />
          </span>
          <div class="hfb-name-text">
            <span class="hfb-name-main" :title="row.key">
              <span class="hfb-name-label">{{ row.name }}</span>
            </span>
            <span class="hfb-name-sub">
              {{ row.directory ? "目录" : kindName(row) }}
              <template v-if="!row.directory && maxSize">
                · <span class="hfb-bar"><i :style="{ width: sizePercent(row.size, maxSize) + '%' }" /></span>
              </template>
            </span>
          </div>
        </div>
      </template>

      <template #col-kind="{ row }">
        <b class="hfb-badge" :class="`hfb-badge--${kindTone(row.kind)}`">{{ badgeOf(row) }}</b>
      </template>

      <template #col-md5="{ row }">
        <span v-if="row.md5" class="mono hfb-md5" :title="row.md5">{{ row.md5 }}</span>
        <span v-else class="hfb-md5 dim">—</span>
      </template>

      <template #col-actions="{ row }">
        <div class="hfb-ops" @click.stop>
          <!-- 操作列统一 square 图标按钮：目录=进入；文件=详情 / 上传项目 / 更多 -->
          <ReButton
            v-if="row.directory"
            icon="FolderOpened"
            layout="square"
            size="mini"
            tip="进入目录"
            @click="emit('open', row as unknown as ReleaseHostFileItem)"
          />
          <template v-else>
            <ReButton
              icon="View"
              layout="square"
              size="mini"
              tip="详情"
              @click="emit('open', row as unknown as ReleaseHostFileItem)"
            />
            <ReButton
              icon="Promotion"
              layout="square"
              size="mini"
              tip="上传项目"
              @click="emit('menu-select', 'push', row as unknown as ReleaseHostFileItem)"
            />
            <ReButton
              icon="MoreFilled"
              layout="square"
              size="mini"
              tip="更多"
              @click="emit('menu-select', '__more', row as unknown as ReleaseHostFileItem)"
            />
          </template>
        </div>
      </template>
    </ReTable>

    <!-- 图标视图（自绘大图标，供大目录速览） -->
    <div v-else class="hfb-grid">
      <button
        v-for="item in items"
        :key="item.key"
        type="button"
        class="hfb-cell"
        @click="emit('open', item)"
      >
        <span class="hfb-cell-tile" :class="`hfb-tile--${kindTone(item.kind)}`">
          <ReButton :icon="item.directory ? 'Folder' : 'Document'" layout="square" size="mini" decorative />
        </span>
        <span class="hfb-cell-name" :title="item.name">{{ item.name }}</span>
        <span class="hfb-cell-meta">{{ item.directory ? "目录" : formatSize(item.size) }}</span>
      </button>
    </div>

    <div v-if="truncated" class="hfb-note">
      <ReButton icon="InfoFilled" type="primary" text />
      条目较多，本页只显示前 {{ items.length }} 项；用搜索或类型筛选缩小范围。
    </div>

    <div v-if="dragging" class="hfb-drop">
      <ReButton icon="UploadFilled" type="primary" text />
      <b>松开即上传到当前目录</b>
      <span>拖到文件上可指定目标文件夹</span>
    </div>
  </div>
</template>

<style scoped>
.hfb {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  background: var(--bg-container);
  overflow: auto;
}

/* ---------- 状态 ---------- */
.hfb-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 220px;
  color: var(--text-tertiary);
  font-size: 13px;
}
.hfb-state b { color: var(--text-primary); font-size: 14px; }
.hfb-state--error { color: var(--status-error); flex-direction: row; gap: 8px; }
.hfb-state--empty :deep(.re-button__tip-wrap) { color: var(--text-tertiary); opacity: 0.5; }

/* ---------- ReTable 容器 ---------- */
.hfb-table {
  flex: 1;
  min-height: 0;
  width: 100%;
}
.hfb-table :deep(.el-table__header th) {
  background: var(--bg-elevated);
}
.hfb-table :deep(.el-table__row) {
  cursor: pointer;
}

/* ---------- 名称列 ---------- */
.hfb-name {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
}
.hfb-tile {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  color: #fff;
  background: var(--text-tertiary);
}
.hfb-tile--folder { background: #f0a020; }
.hfb-tile--package { background: #5b6ef5; }
.hfb-tile--archive { background: #8b5cf6; }
.hfb-tile--image { background: #14b8a6; }
.hfb-tile--text { background: #64748b; }
.hfb-tile--code { background: #0ea5e9; }
.hfb-tile--media { background: #ec4899; }
.hfb-tile--other { background: #8792a2; }

.hfb-name-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.hfb-name-main {
  display: flex;
  align-items: center;
  gap: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-primary);
  font-weight: 500;
}
.hfb-name-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hfb-name-sub {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--text-tertiary);
}
.hfb-bar {
  display: inline-block;
  width: 54px;
  height: 4px;
  border-radius: 2px;
  background: var(--bg-fill-secondary);
  overflow: hidden;
  vertical-align: middle;
}
.hfb-bar i {
  display: block;
  height: 100%;
  border-radius: 2px;
  background: var(--brand-400);
}

/* ---------- 类型 / MD5 ---------- */
.hfb-badge {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.3px;
  color: var(--text-secondary);
  background: var(--bg-fill);
  border: 1px solid var(--border-subtle);
}
.hfb-badge--folder { color: #b06a00; background: #fff6e5; border-color: #ffe0a8; }
.hfb-badge--package { color: #3846c9; background: #eceefe; border-color: #cfd4fb; }
.hfb-badge--archive { color: #6d28d9; background: #f3ecff; border-color: #ddccfb; }
.hfb-badge--image { color: #0f766e; background: #e6fbf7; border-color: #bfeee7; }
.hfb-badge--code { color: #0369a1; background: #e8f6ff; border-color: #c2e6fa; }
.hfb-badge--media { color: #9d174d; background: #fdecf4; border-color: #facfdf; }

.hfb-md5 {
  font-size: 11px;
  color: var(--text-secondary);
  word-break: break-all;
}

/* ---------- 操作列 ---------- */
.hfb-ops {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 2px;
}
.hfb-ops .re-button__tip-wrap {
  margin-left: 2px;
}

/* ---------- 图标视图 ---------- */
.hfb-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(132px, 1fr));
  gap: 8px;
  padding: 12px;
}
.hfb-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 8px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
  text-align: center;
}
.hfb-cell:hover { background: var(--bg-fill); }
.hfb-cell-tile {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: 12px;
  color: #fff;
  background: var(--text-tertiary);
}
.hfb-cell-name {
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12.5px;
  color: var(--text-primary);
}
.hfb-cell-meta { font-size: 11px; color: var(--text-tertiary); }

/* ---------- 说明 / 拖拽遮罩 ---------- */
.hfb-note {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-top: 1px solid var(--border-subtle);
  color: var(--text-tertiary);
  font-size: 12px;
}
.hfb-drop {
  position: absolute;
  inset: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 2px dashed var(--brand-500);
  border-radius: 12px;
  background: color-mix(in srgb, var(--brand-500) 8%, var(--bg-container));
  color: var(--brand-500);
  font-size: 13px;
  pointer-events: none;
  z-index: 3;
}
.hfb-drop b { font-size: 14px; }
.hfb-drop span { color: var(--text-tertiary); font-size: 12px; }
</style>