<!--
  单个节点参数控件。

  <p>按 meta.type 渲染对应控件；参数值、pairs 组与数据源联动状态由父级通过 props 传入，
  控件变更只 emit「新值 / 新 pairs」，写回仍由 FlowDesigner 统一处理。</p>
-->
<script setup lang="ts">
import {
  computed,
  ref } from "vue";
import ReIcon from "@repo/ui/re-icon";
import ReInput from "@repo/ui/re-input";
import ReInputNumber from "@repo/ui/re-input-number";
// 数据源 / 表下拉走共享件：中文名与副标题的口径全站只有一份，
// 且取数仍由宿主给（middlewareForm 要按节点类型过滤数据源）
import { DatasourceSelect, TableSelect } from "@pages/datasource";
import RePlaceholderPicker from "@repo/ui/re-placeholder-picker";
import ReSelect from "@repo/ui/re-select";
import ReSwitch from "@repo/ui/re-switch";
import MappingEditor from "../MappingEditor.vue";
import PairsEditor from "../PairsEditor.vue";
import { pairPlaceholder } from "../../utils/dsl";
import type { ParamPair } from "../../utils/dsl";
import type { CollectParamMeta } from "../../types/collect";
import type { NodeFormContext } from "./paramContext";
import ReDialog from "@repo/ui/re-dialog";

const props = defineProps<{
  /** 参数元数据，决定控件类型、标题与提示 */
  param: CollectParamMeta;
  /** 当前参数值（字符串形态） */
  value: string;
  /** pairs / mapping 组的键值对 */
  pairs: ParamPair[];
  /** 节点 ID，pairs / mapping 组件的重渲染 key 用 */
  nodeId: string;
  /** 表单共享上下文 */
  ctx: NodeFormContext;
}>();

const emit = defineEmits<{
  (e: "update", value: unknown): void;
  (e: "pairs", value: ParamPair[]): void;
}>();

/** 同一个枚举值在不同参数里语义不同（all 在"继承上游变量"里是全部继承，在"变量回写"里是全部回写），按参数名覆盖 */
const OPTION_LABELS: Record<string, string> = {
  "0": "否",
  "1": "是",
  branch: "仅本分支",
  global: "写入全局",
  flow: "本流程",
  task: "本次任务",
  single: "单条抽取",
  list: "列表抽行",
  // 写入方式（database 节点的 mode）：值是后端枚举，直接显示等于让用户读英文
  append: "追加（只插入）",
  replace: "覆盖（先清空整表）",
  update: "按主键更新（改或插）",
  // 批次失败策略（database 节点的 onBatchError）
  stop: "失败即终止（默认）",
  continue: "记录失败后继续",
  // HTTP 方法（request 节点的 method）：动词保留英文（行业习惯、便于对照文档），补中文语义
  GET: "GET（查询）",
  POST: "POST（提交）",
  PUT: "PUT（覆盖）",
  PATCH: "PATCH（局部更新）",
  DELETE: "DELETE（删除）",
  HEAD: "HEAD（仅取响应头）",
  OPTIONS: "OPTIONS（探询支持的方法）",
};

const PARAM_OPTION_LABELS: Record<string, string> = {
  "inherit:all": "全部继承",
  "inherit:none": "不继承",
  "writeBack:changed": "仅回写改动",
  "writeBack:all": "全部回写",
  "writeBack:none": "不回写",
};

function optionLabel(param: CollectParamMeta, value: string): string {
  return PARAM_OPTION_LABELS[`${param.name}:${value}`] ?? OPTION_LABELS[value] ?? value;
}

/**
 * 分段选择（写入方式 / 抽取模式）的短标签（UI 稿「抽取模式」分段控件）。
 *
 * <p>分段控件按选项均分宽度，OPTION_LABELS 里的长文案（如「按主键更新（改或插）」）
 * 会把每一格挤爆；这里给短标签，长文案口径仍在下拉与 title 提示里保留。</p>
 */
const SEGMENT_LABELS: Record<string, string> = {
  single: "单条取一",
  list: "列表抽行",
  append: "追加",
  replace: "覆盖",
  update: "按主键更新",
};

/**
 * 分段项文案：短标签优先，没收录的回落到通用选项文案。
 *
 * @param opt 后端下发的枚举值
 * @returns 展示文案
 */
function segmentLabel(opt: string): string {
  return SEGMENT_LABELS[opt] ?? optionLabel(props.param, opt);
}

/** ReSelect 吃的是对象字面量数组，自定义接口不能直接赋值，故逐项新建 */
function optionsOf(param: CollectParamMeta): { value: string; label: string }[] {
  return (param.options ?? []).map(item => ({ value: item, label: optionLabel(param, item) }));
}

/** textarea / pairs / mapping / table 占满整行，与 FlowDesigner 的 .field-wide 规则一致 */
const wide = computed(
  () =>
    props.param.type === "textarea" ||
    props.param.type === "pairs" ||
    props.param.type === "mapping" ||
    props.param.type === "table",
);

const numberValue = computed<number | undefined>(() =>
  props.value === "" ? undefined : Number(props.value),
);

const keyPlaceholder = computed(() => pairPlaceholder(props.param.name));

/**
 * 是否给这个参数提供「插入占位」入口。
 *
 * <p>只在文本类参数上给：text / textarea 是写 `${}` 表达式最常见的地方。
 * number / switch / select 不吃占位；pairs / mapping 的每一行值是子组件内部的输入框，
 * 从这里插入到整串值里没有意义（会拼成畸形）。</p>
 */
const showPlaceholderPicker = computed(
  () =>
    (props.param.type === "text" || props.param.type === "textarea")
    && (props.ctx.placeholderGroups?.length ?? 0) > 0,
);

/**
 * 插入一个占位字段：追加到当前值末尾。
 *
 * <p>追加而不是替换 —— 用户往往是在「前缀里已经有文字」的情况下补一个 `${变量}`，
 * 覆盖掉已有内容会把正在写的表达式弄丢。</p>
 *
 * @param value 形如 `${name}` 的占位串
 */
function appendPlaceholder(value: string): void {
  emit("update", `${props.value ?? ""}${value}`);
}

/** 字段映射弹框开关（每个 mapping 参数各一个实例，互不影响） */
const mappingOpen = ref(false);

/** 映射预览行数：UI 稿口径——先露 5 行，其余折叠进「展开查看」 */
const MAP_PREVIEW = 5;

/** 预览展开态（仅影响预览；编辑仍在弹框里，两处不互相打架） */
const mapExpanded = ref(false);

/** 预览行：折叠态只露前 5 行 */
const shownPairs = computed<ParamPair[]>(() => {
  const list = props.pairs ?? [];
  return mapExpanded.value ? list : list.slice(0, MAP_PREVIEW);
});

/**
 * 预览行的类型徽标：左列名去表列元数据里找 typeName。
 *
 * <p>找不到就不显示 —— 表还没建时列元数据本来就是空的，此时猜一个类型
 * 比留空更误导（徽标是「数据库里真实是什么」的证据，不是装饰）。</p>
 *
 * @param key 映射行的目标列名
 * @returns 类型名；元数据里没有则空串
 */
function typeOf(key: string): string {
  return props.ctx.activeColumns?.find(col => col.name === key)?.typeName ?? "";
}
</script>

<template>
  <div class="field" :class="{ 'field-wide': wide }" :data-param="param.name">
    <div class="field-label">
      {{ param.label }}<span v-if="param.required" class="req">*</span>
      <RePlaceholderPicker
        v-if="showPlaceholderPicker"
        class="label-picker"
        :groups="ctx.placeholderGroups"
        mode="icon"
        @pick="appendPlaceholder"
      />
    </div>

    <ReInput
      v-if="param.type === 'textarea'"
      type="textarea"
      :rows="3"
      :placeholder="param.tip || ''"
      :model-value="value"
      @update:model-value="(v: unknown) => emit('update', v)"
    />
    <ReInputNumber
      v-else-if="param.type === 'number'"
      :controls="false"
      :placeholder="param.tip || ''"
      :model-value="numberValue"
      @update:model-value="(v: number | undefined) => emit('update', v)"
    />
    <ReSwitch
      v-else-if="param.type === 'switch'"
      :model-value="value === '1'"
      @update:model-value="(v: boolean | string | number) => emit('update', v ? '1' : '0')"
    />
    <!-- 写入方式 / 抽取模式：选项少且语义对仗，走分段选择（UI 稿「抽取模式」控件）；其余 select 仍是下拉 -->
    <div
      v-else-if="param.type === 'select' && param.name === 'mode'"
      class="seg"
      role="group"
      :aria-label="param.label"
    >
      <button
        v-for="opt in param.options"
        :key="opt"
        type="button"
        class="seg-item"
        :class="{ 'is-active': value === opt }"
        :title="optionLabel(param, opt)"
        @click="emit('update', opt)"
      >
        {{ segmentLabel(opt) }}
      </button>
    </div>
    <ReSelect
      v-else-if="param.type === 'select'"
      class="pane-fill"
      :placeholder="param.tip || '请选择'"
      :model-value="value"
      :options="optionsOf(param)"
      @update:model-value="(v: string | number | (string | number)[] | null) => emit('update', v)"
    />
    <ReSelect
      v-else-if="param.type === 'flow' && ctx.flowOptions.length"
      filterable
      clearable
      class="pane-fill"
      placeholder="选择子流程"
      :model-value="value"
      :options="ctx.flowOptions"
      @update:model-value="(v: string | number | (string | number)[] | null) => emit('update', v)"
    />
    <DatasourceSelect
      v-else-if="param.type === 'datasource'"
      class="pane-fill"
      placeholder="选择数据源"
      :model-value="value || param.defaultValue || ''"
      :options="ctx.datasourceOptions"
      @update:model-value="(v: string) => emit('update', v)"
    />
    <!--
      allow-create + default-first-option 必须成对用，缺一个就配不出新表：
      allow-create 负责在下拉顶部渲染「新建 xxx」这条真实 el-option，
      而 default-first-option 才让 el-select 把高亮落到它上面——
      没有它，hoveringIndex 停在 -1（useSelect.updateHoveringIndex），
      敲回车什么也不会发生，用户必须先按一下 ↓ 才建得出来。
      ReSelect 的 filter-method 只收集远程搜索词、不过滤静态候选，
      所以这里还得靠 default-first-option 兜住「回车选第一个」。
    -->
    <TableSelect
      v-else-if="param.type === 'table'"
      class="pane-fill"
      :model-value="value"
      :options="ctx.tableOptions"
      :placeholder="ctx.tablePlaceholder"
      :loading="ctx.tablesLoading"
      allow-create
      @update:model-value="(v: string) => emit('update', v)"
    />
    <template v-else-if="param.type === 'mapping'">
      <!-- 字段映射卡片（UI 稿）：头＝标题 + 计数 + 配置入口；行＝列名 / 表达式 / 表列类型；编辑仍在弹框 -->
      <div class="map-card">
        <div class="map-card-head">
          <span class="map-card-title">{{ param.label }}</span>
          <span class="map-card-badge"><b>{{ pairs.length }}</b> 个字段</span>
          <button type="button" class="map-card-action" @click="mappingOpen = true">
            <ReIcon name="EditPen" :size="13" />
            配置字段映射
          </button>
        </div>
        <div v-if="pairs.length" class="map-card-rows">
          <div
            v-for="(row, index) in shownPairs"
            :key="`${index}:${row.key}`"
            class="map-row"
            title="点击配置字段映射"
            @click="mappingOpen = true"
          >
            <span class="map-row-key">{{ row.key }}</span>
            <span class="map-row-val">{{ row.value || "—" }}</span>
            <span v-if="typeOf(row.key)" class="map-row-type">{{ typeOf(row.key) }}</span>
          </div>
          <button
            v-if="pairs.length > MAP_PREVIEW"
            type="button"
            class="map-card-more"
            @click="mapExpanded = !mapExpanded"
          >
            <ReIcon :name="mapExpanded ? 'ArrowUp' : 'ArrowDown'" :size="12" />
            {{ mapExpanded ? "收起" : `其余 ${pairs.length - MAP_PREVIEW} 个字段 · 展开查看` }}
          </button>
        </div>
        <div v-else class="map-card-empty">还没有映射字段，点「配置字段映射」开始</div>
      </div>
      <ReDialog v-model="mappingOpen" :title="param.label" width="920px" append-to-body>
        <MappingEditor
          :key="`${nodeId}:${param.name}:${ctx.columnKey}`"
          :model-value="pairs"
          :columns="ctx.activeColumns"
          :table="ctx.activeTable"
          :table-exists="ctx.tableExists"
          :loading="ctx.columnsLoading"
          :load-error="ctx.columnsError"
          :on-refresh="ctx.refreshColumns"
          @update:model-value="(v: ParamPair[]) => emit('pairs', v)"
        />
      </ReDialog>
    </template>
    <PairsEditor
      v-else-if="param.type === 'pairs'"
      :key="`${nodeId}:${param.name}`"
      :model-value="pairs"
      :key-placeholder="keyPlaceholder"
      value-placeholder="值 / ${表达式}"
      @update:model-value="(v: ParamPair[]) => emit('pairs', v)"
    />
    <ReInput
      v-else
      :placeholder="param.tip || ''"
      :model-value="value"
      @update:model-value="(v: unknown) => emit('update', v)"
    />
    <div v-if="param.tip && param.type !== 'textarea'" class="field-tip">
      {{ param.tip }}
    </div>
  </div>
</template>

<style scoped>
/* 参数控件已下沉到子组件，作用域样式需在此重复声明，与 FlowDesigner 的字段样式保持一致 */
.field {
  min-width: 0;
}

.field-wide {
  grid-column: 1 / -1;
}

.field-label {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
  font-size: 12px;
  /* 写死的 #86909c 在暗色模式下与底色对比不足，且不跟随主题；改用令牌 */
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}

/* 插在标签行右侧的「插入占位」入口，不参与网格排版 */
.label-picker {
  margin-left: auto;
}

.req {
  margin-left: 2px;
  color: var(--el-color-danger);
}

.pane-fill {
  width: 100%;
}

/* ===== 分段选择（UI 稿「抽取模式」）：浅底盘 + 白底激活格 ===== */
.seg {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--radius-lg, 12px);
}

.seg-item {
  flex: 1;
  min-width: 0;
  padding: 7px 8px;
  overflow: hidden;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--el-text-color-regular);
  text-overflow: ellipsis;
  white-space: nowrap;
  background: transparent;
  border: none;
  border-radius: var(--radius-md, 8px);
  cursor: pointer;
  transition:
    background-color 0.2s var(--ease-out, ease),
    color 0.2s var(--ease-out, ease),
    box-shadow 0.2s var(--ease-out, ease);
}

.seg-item:hover {
  color: var(--el-color-primary);
}

.seg-item.is-active {
  color: var(--el-color-primary);
  background: var(--el-bg-color);
  box-shadow: var(--el-box-shadow-light);
}

/* ===== 字段映射卡片（UI 稿「字段映射」） ===== */
.map-card {
  overflow: hidden;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--radius-lg, 12px);
}

.map-card-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--el-fill-color-lighter);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.map-card-title {
  min-width: 0;
  overflow: hidden;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.map-card-badge {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 3px;
  padding: 2px 8px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color);
  border-radius: var(--radius-sm, 6px);
}

/* 计数走主色（UI 稿徽标里的数字是彩色的） */
.map-card-badge b {
  font-weight: 700;
  color: var(--el-color-primary);
}

.map-card-action {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  padding: 0;
  font-size: 12px;
  color: var(--el-color-primary);
  background: none;
  border: none;
  cursor: pointer;
}

.map-card-action:hover {
  text-decoration: underline;
}

.map-card-rows {
  display: flex;
  flex-direction: column;
}

/* 预览行：可点击（打开编辑弹框），行内三项＝列名 / 表达式 / 表列类型 */
.map-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 12px;
  cursor: pointer;
  border-bottom: 1px solid var(--el-border-color-extra-light);
  transition: background-color 0.15s var(--ease-out, ease);
}

.map-row:hover {
  background: var(--el-fill-color-light);
}

.map-row-key {
  flex: none;
  min-width: 0;
  max-width: 42%;
  overflow: hidden;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Courier New", monospace;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.map-row-val {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Courier New", monospace;
  font-size: 12px;
  color: var(--el-color-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.map-row-type {
  flex: none;
  max-width: 88px;
  padding: 1px 7px;
  overflow: hidden;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Courier New", monospace;
  font-size: 10.5px;
  color: var(--el-text-color-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--radius-sm, 6px);
}

.map-card-more {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 7px 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background: none;
  border: none;
  cursor: pointer;
  transition:
    color 0.15s var(--ease-out, ease),
    background-color 0.15s var(--ease-out, ease);
}

.map-card-more:hover {
  color: var(--el-color-primary);
  background: var(--el-fill-color-light);
}

.map-card-empty {
  padding: 14px 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  text-align: center;
}

.field-tip {
  margin-top: 4px;
  font-size: 11px;
  line-height: 1.45;
  /* 原为 #a3abb6：比任何主题令牌都浅，暗色下几乎不可读（对比度不足 4.5:1）。
     说明文字最浅只到 secondary，这是可访问性下限，不要再往回改。 */
  color: var(--el-text-color-secondary);
}
</style>
