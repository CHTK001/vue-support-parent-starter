<!--
  设计表列网格 —— **唯一**的一处实现。

  <p>数据库管理器的「表结构」视图与「新建表（设计表）」弹窗此前各写了一份列网格：
  两边的列清单不同步（弹窗有「小数位」，表结构视图没有），改一处另一处必然漏。
  本组件把列清单、单元格控件、类型显隐规则、主键/自增联动全部收进来，
  宿主只负责提供行数据与处理保存/删除等业务动作。</p>

  <p>两种模式（{@code mode}）：</p>
  <ul>
    <li>{@code existing}：编辑已存在的表 —— 开拖拽排序、行内保存、列属性入口、删除列；</li>
    <li>{@code new}：新建表 —— 只填列，无拖拽/无单行保存（尚未落库，保存无意义）。</li>
  </ul>

  <p>列类型与长度 / 小数位的适用范围取自 `utils/columnTypes.ts`，与列属性对话框同一份。</p>
-->
<script setup lang="ts">
import { computed, ref } from "vue";

import ReButton from "@repo/ui/re-button";
import ReIcon from "@repo/ui/re-icon";
import ReInput from "@repo/ui/re-input";
import ReInputNumber from "@repo/ui/re-input-number";
import ReSelect from "@repo/ui/re-select";
import ReTable from "@repo/ui/re-table";
import BooleanSegmented from "./BooleanSegmented.vue";
import type { ReTableColumn } from "@repo/ui/re-table";
import { columnTypeSelectOptions, ENUM_LIKE_TYPES, typeAllowsScale, typeNeedsSize } from "../../utils/columnTypes";
import type { DesignColumnRow } from "./designColumnModel";

defineOptions({ name: "DesignColumnGrid" });

const props = withDefaults(
  defineProps<{
    /** 设计行（宿主持有，组件不复制） */
    rows: DesignColumnRow[];
    /** existing=编辑已有表（开拖拽/行内保存/删列）；new=新建表 */
    mode?: "existing" | "new";
    /** 表格加载态 */
    loading?: boolean;
    /** 行是否已改动（existing 模式用来高亮与启用单行保存）。
     *  参数类型刻意放宽成 DesignColumnRow：宿主可能用自己更宽的行类型（如带 originalName/origin 的
     *  DesignRow），函数参数在 TS 里是逆变的，若这里写死 DesignRow 反而会让宿主无法传入。 */
    isDirty?: (row: DesignColumnRow) => boolean;
    /** 空态文案 */
    emptyText?: string;
    /** 表格最大高度（existing 模式由宿主给整块高度） */
    maxHeight?: string;
  }>(),
  {
    mode: "new",
    loading: false,
    isDirty: () => false,
    emptyText: "还没有列",
    maxHeight: "40vh",
  },
);

const emit = defineEmits<{
  /** 某行的某个字段被改动（行对象是同一个引用，宿主无需回写） */
  (e: "change"): void;
  /** 保存单行（existing） */
  (e: "save-row", row: DesignColumnRow): void;
  /** 删除一行 */
  (e: "remove-row", row: DesignColumnRow): void;
  /** 打开列属性对话框（existing） */
  (e: "open-column", row: DesignColumnRow): void;
  /** 拖拽排序：from → to */
  (e: "reorder", from: number, to: number): void;
}>();

/** 类型下拉项（分组） */
const typeOptions = computed(() => columnTypeSelectOptions());

const isExisting = computed(() => props.mode === "existing");

/**
 * 列配置 —— 唯一的列清单。加一列只改这里。
 *
 * <p>宽度按原轨道等价给出；类型列有意加宽，因为 ENUM/SET 的取值输入在其单元格内。</p>
 */
const columns = computed<ReTableColumn[]>(() => {
  // 宽度全部走 minWidth：el-table 里明确写 width 的列会被钉死，
  // 内容（输入框 / 类型下拉）反而被压扁；minWidth 让该列吃得住内容、又能随容器伸缩。
  // 「字段名」给足 150：此前 minWidth 110 时输入框只剩 ~70px，device_channel 只显示成 device_cl。
  const list: ReTableColumn[] = [
    { prop: "name", label: "字段名", minWidth: 200, slot: "name" },
    { prop: "type", label: "类型", minWidth: 170, slot: "type" },
    { prop: "size", label: "长度", minWidth: 84, slot: "size" },
    { prop: "scale", label: "小数位", minWidth: 84, slot: "scale" },
    { prop: "nullable", label: "可空", minWidth: 100, align: "center", slot: "nullable" },
    { prop: "primaryKey", label: "主键", minWidth: 100, align: "center", slot: "primaryKey" },
  ];
  // 自增只在新建表时给（已有表改自增要走方言特定的 DDL，风险大，不在此处开放）
  if (!isExisting.value) {
    list.push({ prop: "autoIncrement", label: "自增", minWidth: 100, align: "center", slot: "autoIncrement" });
  }
  list.push(
    { prop: "defaultValue", label: "默认值", minWidth: 110, slot: "defaultValue" },
    { prop: "comment", label: "注释", minWidth: 120, slot: "comment" },
  );
  // 操作列：两种模式都要 —— 新建表也必须有「删除这一行」，
  // 否则多添的一行删不掉（之前 new 模式不渲染操作列，宿主传了 @remove-row 却点不到）。
  // 宽度按按钮个数给足：existing 三个按钮，new 一个；宽度不足时表头会被压成「操…」。
  list.push({
    prop: "actions",
    label: "操作",
    minWidth: isExisting.value ? 132 : 72,
    align: "center",
    slot: "actions",
  });
  return list;
});

/** 表格数据桥接：DesignColumnRow 没有索引签名，直接喂 data 会报 TS2322 */
const gridData = computed(() => props.rows as unknown as Array<Record<string, unknown>>);

/** 拖拽：记录来源下标（组件内部状态，不对外暴露） */
const dragFrom = ref<number | null>(null);

/**
 * 勾「主键」：主键列必非空（内核会把 PRIMARY KEY 当成 NOT NULL）。
 */
function togglePk(row: DesignColumnRow, value: unknown): void {
  row.primaryKey = value === true;
  if (row.primaryKey) {
    row.nullable = false;
  }
  emit("change");
}

/**
 * 勾「自增」：自增列不可空是后端构造期就拒绝的硬规则。
 */
function toggleAuto(row: DesignColumnRow, value: unknown): void {
  row.autoIncrement = value === true;
  if (row.autoIncrement) {
    row.nullable = false;
  }
  emit("change");
}

/**
 * 拖拽开始：只允许列结构非空时拖。
 */
function onDragStart(i: number, event: DragEvent): void {
  if (props.rows.length < 2) {
    event.preventDefault();
    return;
  }
  dragFrom.value = i;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    // Firefox 不设数据不会触发拖拽
    event.dataTransfer.setData("text/plain", String(i));
  }
}

/**
 * 拖拽结束：放下时交回宿主处理（宿主负责落库）。
 */
function onDrop(i: number): void {
  const from = dragFrom.value;
  dragFrom.value = null;
  if (from === null || from === i) {
    return;
  }
  emit("reorder", from, i);
}

/** 行是否改动 */
const dirtyOf = (row: DesignColumnRow): boolean => props.isDirty(row);

/** 行组件取行对象（插槽给的是 Record） */
const asRow = (cellRow: Record<string, unknown>): DesignColumnRow => cellRow as unknown as DesignColumnRow;

/**
 * 行类名：`dcg-row` 是稳定的行选择器（验收脚本按它定位行），
 * `dirty` 用于已改动行高亮 —— 与迁移前手写网格的行语义一一对应。
 *
 * @param arg el-table 的 row-class-name 回调参数
 * @return 行类名
 */
function rowClassName(arg: { row: Record<string, unknown> }): string {
  return dirtyOf(asRow(arg.row)) ? "dcg-row dirty" : "dcg-row";
}
</script>

<template>
  <div class="dcg" data-design-grid :data-dcg-mode="mode">
    <ReTable
      :data="gridData"
      :columns="columns"
      :loading="loading"
      engine="element"
      :layout-table="{ maxHeight: maxHeight }"
      :settings="{ border: false }"
      row-key="key"
      :row-class-name="rowClassName"
      show-index
      index-width="40"
      index-align="right"
      :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
    >
      <template #col-name="{ row }">
        <!-- 行级拖放区：只在 existing 模式接拖放，新建表没有落库顺序可调 -->
        <div
          class="dcg-name"
          @dragover.prevent
          @drop.prevent="isExisting ? onDrop(rows.indexOf(asRow(row))) : undefined"
        >
          <ReIcon
            v-if="isExisting"
            name="Sort"
            :size="13"
            class="dcg-grip"
            title="拖拽调整列顺序"
            draggable="true"
            @dragstart="onDragStart(rows.indexOf(asRow(row)), $event)"
          />
          <ReInput v-model="asRow(row).name" class="dcg-mono" placeholder="字段名" />
        </div>
      </template>

      <template #col-type="{ row }">
        <ReSelect v-model="asRow(row).type" :options="typeOptions" filterable />
        <!-- ENUM/SET 取值：收进「类型」单元格里，语义上属于该类型 -->
        <div v-if="ENUM_LIKE_TYPES.has(asRow(row).type)" class="dcg-sub">
          <span class="dcg-sub__label">{{ asRow(row).type }} 取值</span>
          <ReInput v-model="asRow(row).enumText" placeholder="a, b, c（逗号分隔，必填）" />
        </div>
      </template>

      <!-- 长度 / 小数位：该类型用不上时留占位横线，说明「这个类型没有这一项」 -->
      <template #col-size="{ row }">
        <ReInputNumber
          v-if="typeNeedsSize(asRow(row).type)"
          :model-value="asRow(row).size ?? undefined"
          size="small"
          :min="1"
          :max="65535"
          controls-position="right"
          placeholder="长度"
          @update:model-value="asRow(row).size = $event ?? null"
        />
        <span v-else class="dcg-na" aria-hidden="true">—</span>
      </template>

      <template #col-scale="{ row }">
        <ReInputNumber
          v-if="typeAllowsScale(asRow(row).type)"
          :model-value="asRow(row).scale ?? undefined"
          size="small"
          :min="0"
          :max="30"
          controls-position="right"
          placeholder="位"
          @update:model-value="asRow(row).scale = $event ?? null"
        />
        <span v-else class="dcg-na" aria-hidden="true">—</span>
      </template>

      <!-- 布尔列用「是/否」分段，两态文字直读 -->
      <template #col-nullable="{ row }">
        <BooleanSegmented
          v-model="asRow(row).nullable"
          size="small"
          class="dcg-bool"
          aria-label="允许为空"
          title="允许为空"
          :disabled="asRow(row).primaryKey || asRow(row).autoIncrement"
        />
      </template>

      <template #col-primaryKey="{ row }">
        <BooleanSegmented
          :model-value="asRow(row).primaryKey"
          size="small"
          class="dcg-bool"
          aria-label="主键"
          title="主键"
          @update:model-value="togglePk(asRow(row), $event)"
        />
      </template>

      <template #col-autoIncrement="{ row }">
        <BooleanSegmented
          :model-value="asRow(row).autoIncrement"
          size="small"
          class="dcg-bool"
          aria-label="自增"
          title="自增"
          @update:model-value="toggleAuto(asRow(row), $event)"
        />
      </template>

      <template #col-defaultValue="{ row }">
        <ReInput v-model="asRow(row).defaultValue" class="dcg-mono" placeholder="默认值" />
      </template>

      <template #col-comment="{ row }">
        <ReInput v-model="asRow(row).comment" placeholder="列注释" />
      </template>

      <template #col-actions="{ row }">
        <span class="dcg-ops">
          <template v-if="isExisting">
            <ReButton icon="Setting" layout="square" tip="列属性" @click="emit('open-column', asRow(row))" />
            <ReButton
              icon="Check"
              layout="square"
              tip="保存该行"
              :disabled="!dirtyOf(asRow(row))"
              @click="emit('save-row', asRow(row))"
            />
          </template>
          <ReButton icon="Delete" layout="square" type="danger" tip="删除列" @click="emit('remove-row', asRow(row))" />
        </span>
      </template>

      <template #empty>
        <p class="dcg-empty">{{ emptyText }}</p>
      </template>
    </ReTable>
  </div>
</template>

<style scoped>
/* ==== el-table 观感对回原设计（与弹窗/表结构视图一致） ==== */
.dcg :deep(.el-table__header th.el-table__cell) {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
}

.dcg :deep(.el-table .cell) {
  padding: 4px 6px;
}

.dcg :deep(.el-table__body tr:hover > td.el-table__cell) {
  background: var(--el-fill-color-extra-light, var(--el-fill-color-light));
}

.dcg :deep(.el-table-column--index .cell) {
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Consolas, monospace);
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  text-align: right;
}

/* 字段名 + 拖拽手柄 */
.dcg-name {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}
.dcg-name > :deep(.re-input) {
  min-width: 0;
  flex: 1;
  /* ReInput 的根是 display:contents，span 上的宽度规则到不了内部 input；
     这里直接给内部原生 input / 包装盒定宽，否则它按默认 20 字符宽撑出单元格再被裁掉。 */
}
.dcg-name :deep(input) {
  width: 100%;
}

.dcg-grip {
  flex: 0 0 auto;
  color: var(--el-text-color-placeholder);
  cursor: grab;
}
.dcg-grip:hover {
  color: var(--el-color-primary);
}
.dcg-grip:active {
  cursor: grabbing;
}

.dcg-mono :deep(input),
.dcg-mono {
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Consolas, monospace);
}

.dcg-bool {
  display: inline-flex;
  align-items: center;
  min-width: 0;
}

/* ENUM/SET 取值（类型单元格内） */
.dcg-sub {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
}
.dcg-sub__label {
  flex: 0 0 auto;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}
.dcg-sub > :deep(.re-input) {
  flex: 1;
  min-width: 0;
}

/* 类型用不上的长度 / 小数位占位 */
.dcg-na {
  display: block;
  text-align: center;
  color: var(--el-text-color-placeholder);
  font-size: 12px;
}

/* 操作列三枚方块按钮 */
.dcg-ops {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.dcg-ops :deep(.rs-btn) {
  margin: 0;
}

/* 改动行高亮（与迁移前手写网格的 .dirty 语义一致） */
.dcg :deep(.el-table__body tr.dirty > td.el-table__cell) {
  background: var(--el-color-warning-light-9);
}

.dcg-empty {
  margin: 24px 0;
  text-align: center;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
</style>
