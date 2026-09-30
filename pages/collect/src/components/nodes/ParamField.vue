<!--
  单个节点参数控件。

  <p>按 meta.type 渲染对应控件；参数值、pairs 组与数据源联动状态由父级通过 props 传入，
  控件变更只 emit「新值 / 新 pairs」，写回仍由 FlowDesigner 统一处理。</p>
-->
<script setup lang="ts">
import { computed, ref } from "vue";
import { ElDialog } from "element-plus";
import ReButton from "@repo/ui/re-button";
import ReInput from "@repo/ui/re-input";
import ReInputNumber from "@repo/ui/re-input-number";
import RePlaceholderPicker from "@repo/ui/re-placeholder-picker";
import ReSelect from "@repo/ui/re-select";
import ReSwitch from "@repo/ui/re-switch";
import MappingEditor from "../MappingEditor.vue";
import PairsEditor from "../PairsEditor.vue";
import { pairPlaceholder } from "../../utils/dsl";
import type { ParamPair } from "../../utils/dsl";
import type { CollectParamMeta } from "../../types/collect";
import type { NodeFormContext } from "./paramContext";

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

/**
 * 字段映射的摘要文案。
 *
 * <p>映射行数一多（十几列很常见），整张表铺在属性面板里会把其它参数挤到屏幕外；
 * 这里只给「几列 + 列名」，需要改的时候再点开弹框。</p>
 */
const mappingSummary = computed(() => {
  const list = props.pairs ?? [];
  if (!list.length) {
    return "未配置";
  }
  const names = list.map(pair => pair.key).filter(Boolean);
  const shown = names.slice(0, 4).join(" / ");
  return `${list.length} 列（${shown}${names.length > 4 ? " …" : ""}）`;
});
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
    <ReSelect
      v-else-if="param.type === 'datasource'"
      filterable
      class="pane-fill"
      placeholder="选择数据源"
      :model-value="value || param.defaultValue || ''"
      :options="ctx.datasourceOptions"
      @update:model-value="(v: string | number | (string | number)[] | null) => emit('update', v)"
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
    <ReSelect
      v-else-if="param.type === 'table'"
      filterable
      allow-create
      default-first-option
      clearable
      class="pane-fill"
      :loading="ctx.tablesLoading"
      :placeholder="ctx.tablePlaceholder"
      :model-value="value"
      :options="ctx.tableOptions"
      @update:model-value="(v: string | number | (string | number)[] | null) => emit('update', v)"
    />
    <template v-else-if="param.type === 'mapping'">
      <!-- 映射收进弹框：与「抽取字段」同形（摘要 + 配置），需要改时才点开 -->
      <div class="field-summary">
        <span class="summary-text">{{ mappingSummary }}</span>
        <ReButton text type="primary" @click="mappingOpen = true">配置</ReButton>
      </div>
      <ElDialog v-model="mappingOpen" :title="param.label" width="920px" append-to-body>
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
      </ElDialog>
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
  margin-bottom: 3px;
  font-size: 12px;
  color: #86909c;
}

/* 插在标签行右侧的「插入占位」入口，不参与网格排版 */
.label-picker {
  margin-left: auto;
}

.req {
  margin-left: 2px;
  color: #e5484d;
}

.pane-fill {
  width: 100%;
}

/* 摘要行：与「抽取字段」的配置入口同形 */
.field-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 30px;
  padding: 0 10px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
}

.summary-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-size: 13px;
  color: var(--el-text-color-regular);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.field-tip {
  margin-top: 3px;
  font-size: 11px;
  line-height: 1.5;
  color: #a3abb6;
}
</style>
