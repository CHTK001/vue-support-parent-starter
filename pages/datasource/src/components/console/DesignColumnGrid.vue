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
import { columnDefaultOptions, columnTypeSelectOptions, ENUM_LIKE_TYPES, typeAllowsScale, typeNeedsSize } from "../../utils/columnTypes";
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
    /**
     * 目标库方言：决定类型下拉里出现哪一套类型。
     *
     * <p>不传按 MySQL 处理（历史行为）。ClickHouse 传 clickhouse、DuckDB 传 duckdb，
     * 其它 JDBC 库传 mysql/postgresql/oracle/sqlserver/sqlite/h2。</p>
     */
    dialect?: string;
  }>(),
  {
    mode: "new",
    loading: false,
    isDirty: () => false,
    emptyText: "还没有列",
    maxHeight: "40vh",
    dialect: "mysql",
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

/** 类型下拉项（分组，按当前方言过滤） */
const typeOptions = computed(() => columnTypeSelectOptions(props.dialect));

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
  // className 既是样式钩子也是验收选择器：两处复用点共用同一套类名（dcg-col-*），
  // 验收脚本按它定位单元格，不再依赖某一边手写网格的私有结构。
  const list: ReTableColumn[] = [
    { prop: "name", label: "字段名", minWidth: 200, slot: "name", className: "dcg-col-name" },
    { prop: "type", label: "类型", minWidth: 170, slot: "type", className: "dcg-col-type" },
    { prop: "size", label: "长度", minWidth: 84, slot: "size", className: "dcg-col-size" },
    { prop: "scale", label: "小数位", minWidth: 84, slot: "scale", className: "dcg-col-scale" },
    { prop: "nullable", label: "可空", minWidth: 64, align: "center", slot: "nullable", className: "dcg-col-nullable" },
    { prop: "primaryKey", label: "主键", minWidth: 64, align: "center", slot: "primaryKey", className: "dcg-col-pk" },
  ];
  // 自增只在新建表时给（已有表改自增要走方言特定的 DDL，风险大，不在此处开放）
  if (!isExisting.value) {
    list.push({
      prop: "autoIncrement", label: "自增", minWidth: 64, align: "center", slot: "autoIncrement", className: "dcg-col-auto",
    });
  }
  list.push(
    { prop: "defaultValue", label: "默认值", minWidth: 110, slot: "defaultValue", className: "dcg-col-default" },
    { prop: "comment", label: "注释", minWidth: 120, slot: "comment", className: "dcg-col-comment" },
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
    className: "dcg-col-actions",
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
 * 网格内切换类型：自动设置合理的默认长度 / 小数位。
 *
 * <p>切到 DECIMAL / NUMERIC 时长度默认 8、小数位默认 2（MySQL 惯例）；
 * 切到其它需长度类型时长度默认 255；不支持小数位时清空 scale。</p>
 *
 * @param row 被修改的行
 * @param newType 新的类型名
 */
function onTypeChange(row: DesignColumnRow, newType: string): void {
  const t = newType.toUpperCase();
  if (typeNeedsSize(t)) {
    if (!row.size) {
      row.size = typeAllowsScale(t) ? 8 : 255;
    }
  } else {
    row.size = null;
  }
  if (typeAllowsScale(t)) {
    if (row.scale === null) {
      row.scale = 2;
    }
  } else {
    row.scale = null;
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
 * 拖拽结束：在**根节点**上接 drop，按落点所在行算目标下标。
 *
 * <p>不能只在「字段名」那格里接 drop：拖拽期间指针一旦离开那格，浏览器就认为
 * 「这里不接受放下」，drop 不再触发 —— 而用户拖拽时几乎必然扫过类型/长度等
 * 其他单元格（验收脚本就是这么拖的，结果时过时不过）。根节点覆盖整块网格，
 * 又不会被表格自身的 overflow 裁掉。</p>
 *
 * @param event drop 事件
 */
function onDropAt(event: DragEvent): void {
  const from = dragFrom.value;
  dragFrom.value = null;
  if (from === null) {
    return;
  }
  const rowEl = (event.target as HTMLElement | null)?.closest?.("tr.dcg-row");
  const to = rowEl ? Array.prototype.indexOf.call(rowEl.parentElement?.children ?? [], rowEl) : -1;
  // 落点不在数据行上（表头/空白区）当作原地放下：不重排、不落库
  if (to < 0 || to === from) {
    return;
  }
  emit("reorder", from, to);
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
  <div
    class="dcg"
    data-design-grid
    :data-dcg-mode="mode"
    @dragover.prevent
    @drop.prevent="onDropAt($event)"
  >
    <ReTable
      :data="gridData"
      :columns="columns"
      :loading="loading"
      engine="element"
      :layout-table="{ maxHeight: maxHeight }"
      :settings="{ border: false }"
      row-key="key"
      :row-class-name="rowClassName"
      size="mini"
      show-index
      index-width="52"
      index-align="right"
      :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
    >
      <template #col-name="{ row }">
        <div class="dcg-name">
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
        <ReSelect v-model="asRow(row).type" :options="typeOptions" filterable @change="onTypeChange(asRow(row), $event)" />
        <!-- ENUM/SET 取值：收进「类型」单元格里，语义上属于该类型 -->
        <div v-if="ENUM_LIKE_TYPES.has(asRow(row).type)" class="dcg-sub">
          <span class="dcg-sub__label">{{ asRow(row).type }} 取值</span>
          <ReInput v-model="asRow(row).enumText" placeholder="a, b, c（逗号分隔，必填）" />
        </div>
      </template>

      <!-- 长度 / 小数位：该类型用不上时留占位横线，说明「这个类型没有这一项」。
           两列去掉步进按钮（controls=false）：modern 布局的加减按钮各占 28px + min-width 96px，
           84px 列放不下会被挤扁；无按钮后只剩输入框，宽度让回给列，调值靠聚焦方向键步进。 -->
      <template #col-size="{ row }">
        <ReInputNumber
          v-if="typeNeedsSize(asRow(row).type)"
          :model-value="asRow(row).size ?? undefined"
          size="small"
          :min="1"
          :max="65535"
          :controls="false"
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
          :controls="false"
          placeholder="位"
          @update:model-value="asRow(row).scale = $event ?? null"
        />
        <span v-else class="dcg-na" aria-hidden="true">—</span>
      </template>

      <!-- 布尔列用「是/否」方形图标钮：选中实心主色 ✓、未选灰 ✕，双态一眼可读。
           方形图标比文字分段短几倍，几列布尔可以全部省下来给宽列。 -->
      <template #col-nullable="{ row }">
        <BooleanSegmented
          v-model="asRow(row).nullable"
          variant="square"
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
          variant="square"
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
          variant="square"
          size="small"
          class="dcg-bool"
          aria-label="自增"
          title="自增"
          @update:model-value="toggleAuto(asRow(row), $event)"
        />
      </template>

      <template #col-defaultValue="{ row }">
        <!-- 默认值自动补全：按列类型给建议（日期类型给 CURRENT_TIMESTAMP 全家），
             filterable 可搜索、allow-create 可输入下拉里没有的自定义 SQL 表达式。 -->
        <ReSelect
          v-model="asRow(row).defaultValue as never"
          :options="columnDefaultOptions(asRow(row).type ?? '')"
          filterable
          allow-create
          clearable
          placeholder="默认值 / 自动补全"
          class="dcg-mono dcg-default"
        />
      </template>

      <template #col-comment="{ row }">
        <!-- 注释列：modern 布局 + 右侧专注图标 —— 列窄（120px），点输入框内的专注
             图标才弹出编辑框；输入框自身尺寸/定位不变，不会撑乱表格布局。 -->
        <ReInput
          v-model="asRow(row).comment"
          layout="modern"
          focus-right
          placeholder="列注释"
          class="dcg-comment"
        />
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
  /* 表头高度：比 el-table 的 small（紧凑，约 40px）还要更小 ——
     el-table 只有 default/large/small 三档，无更小的标准档，
     这里直接压 th 的 padding 与行高来收紧（与 .cell padding 联动，避免 12px 字被裁）。 */
  height: 30px;
  padding: 0;
  line-height: 30px;
}
.dcg :deep(.el-table__header .el-table__cell .cell) {
  padding: 0 6px;
  line-height: 30px;
  /* 表头文字单行：mini 档表头只有 30px 高，长表头（如「默认值」）一旦换行就顶高表头；
      nowrap + 省略号让每个表头永远一行一个。 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

/* 长度 / 小数位输入框：去掉步进按钮后收到单元格内自适应宽度。
   modern 布局默认 min-width 96px，在 84px 列（内容区约 72px）里会溢出挤扁；
   这里让 .rm-number 收缩到单元格可用宽度，宽度不足时只留数字本身。 */
.dcg :deep(.column-cell .rm-number),
.dcg :deep(.cell .rm-number),
.dcg :deep(.rm-number) {
  width: 100%;
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
