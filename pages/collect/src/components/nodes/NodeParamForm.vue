<!--
  节点参数表单的统一外壳。

  各 shape 表单此前的共同样板：声明同一套 props/emits、调 useShapeFieldList、
  v-for 渲染 ParamField、再来一份 LoopFields，外加复制粘贴的 .field/.field-wide/
  .node-intro 样式。差异其实只有三处——专属参数顺序、节点级说明、个别补充提示——
  于是全部收敛到这一个组件：

    * ownParamNames：本 shape 专属参数顺序（其余后端参数由 orderedParams 兜底追加）；
    * intro：节点级说明（左侧主色竖条 + 浅底），留空不渲染；
    * extraTips：按参数名补充一句前端说明（后端 meta 没讲到的取舍）。

  ParamField 自身根元素就是 .field 且自带 field-wide 判定（textarea / pairs / mapping /
  table / outputVariable），因此这里**直接**渲染 ParamField、不再套一层 .field 容器——
  旧表单普遍双重包裹（.field.field-wide > .field）是冗余。只有带补充提示的参数才包一层，
  以便把提示排在参数正下方，行为与旧 processForm 一致。

  循环迭代分节（LoopFields）与抽取字段块（FieldTable）对所有可迭代 / 带 fieldEditor 的
  shape 通用，也在这里统一渲染；形状真正特有的区段走默认插槽，排在最后。
-->
<script setup lang="ts">
import { computed, ref } from "vue";
import ReButton from "@repo/ui/re-button";
import ReDialog from "@repo/ui/re-dialog";
import ReIcon from "@repo/ui/re-icon";
import { DesignTableDialog } from "@pages/datasource";
import FieldTable from "../FieldTable.vue";
import ParamField from "./ParamField.vue";
import LoopFields from "./LoopFields.vue";
import { useShapeFieldList } from "./paramContext";
import type { NodeForm, NodeFormContext } from "./paramContext";
import type { ParamPair } from "../../utils/dsl";
import type { CollectParamMeta, CollectShapeMeta } from "../../types/collect";

const props = defineProps<{
  /** 当前节点的表单镜像 */
  node: NodeForm;
  /** 该 shape 的参数元数据 */
  meta: CollectShapeMeta;
  /** 表单共享上下文 */
  ctx: NodeFormContext;
  /** 本 shape 专属参数名，按期望展示顺序；其余后端参数由 orderedParams 兜底追加 */
  ownParamNames?: string[];
  /** 节点级说明；留空则不渲染说明条 */
  intro?: string;
  /** 按参数名补充的前端说明；key 为参数名 */
  extraTips?: Record<string, string>;
  /** 分区渲染：input / output / loop / advanced；缺省 all 保持旧行为 */
  section?: "all" | "input" | "output" | "loop" | "advanced";
}>();

const emit = defineEmits<{
  (e: "set-param", param: CollectParamMeta, value: unknown): void;
  (e: "set-pairs", param: CollectParamMeta, pairs: ParamPair[]): void;
}>();

/** 高级配置参数名：这些字段只在「高级配置」Tab 展示 */
const ADVANCED_PARAM_NAMES = new Set([
  "timeout",
  "timeoutPolicy",
  "retry",
  "retryInterval",
  "proxy",
  "userAgent",
  "fetcher",
  "saveDocument",
  "batchSize",
  "onBatchError",
  "writeBack",
  "outputPrefix",
  "maxTokens",
  "temperature",
]);

/** 循环参数名：只在「循环」Tab 展示 */
const LOOP_PARAM_NAMES = new Set(["loopCount", "loopVariableName", "loopItemVariableName", "loopParallel"]);

/** 数据库节点的输出组：目标数据源/表/写入方式与字段映射放同一 Tab */
const DATABASE_OUTPUT_NAMES = new Set(["datasource", "table", "mode", "batchSize", "onBatchError"]);

/** 数据库节点输出参数顺序：先数据库，再表，再写入方式，最后字段映射 */
const DATABASE_OUTPUT_ORDER = [
  "datasource",
  "table",
  "mode",
  "column:目标列",
  "key:主键列",
  "batchSize",
  "onBatchError",
];

function isMappingParam(name: string): boolean {
  return name.startsWith("column:") || name.startsWith("key:");
}

function isRegularInput(p: CollectParamMeta): boolean {
  return (
    p.name !== "outputVariable" &&
    !p.name.startsWith("column:") &&
    !p.name.startsWith("cell:") &&
    !p.name.startsWith("key:") &&
    !ADVANCED_PARAM_NAMES.has(p.name) &&
    !LOOP_PARAM_NAMES.has(p.name) &&
    // 数据格式 / 上游格式由本组件顶部专用分段控件渲染
    p.name !== "format" &&
    p.name !== "sourceFormat"
  );
}

const inputFields = computed(() => {
  if (props.meta.shape === "database") {
    return fields.value.filter(p => p.name === "source");
  }
  return fields.value.filter(isRegularInput);
});

const outputFields = computed(() => {
  if (props.meta.shape === "database") {
    const byName = new Map(fields.value.map(field => [field.name, field]));
    return DATABASE_OUTPUT_ORDER
      .map(name => byName.get(name))
      .filter((param): param is CollectParamMeta => Boolean(param));
  }
  return fields.value.filter(
    p => p.name === "outputVariable" || p.name.startsWith("column:") || p.name.startsWith("cell:") || p.name.startsWith("key:"),
  );
});

const advancedFields = computed(() =>
  fields.value.filter(
    p =>
      ADVANCED_PARAM_NAMES.has(p.name) &&
      !(props.meta.shape === "database" && DATABASE_OUTPUT_NAMES.has(p.name)),
  ),
);

/** 专属参数顺序给空数组：orderedParams 按必填前置输出 meta 其余参数（循环四参数已剥离走 LoopFields） */
const { fields, valueOf, pairsOfParam } = useShapeFieldList(
  () => props.node,
  () => props.meta,
  props.ownParamNames ?? [],
);

/** 抽取/映射字段弹窗可见性 */
const fieldsOpen = ref(false);

/** 数据库节点「建表 / 补列」弹窗可见性 */
const ddlOpen = ref(false);

/** 字段映射只有在目标数据库和目标表都确定后才开放 */
const databaseReady = computed(() =>
  props.meta.shape === "database"
    && Boolean(valueOf("datasource").trim())
    && Boolean(valueOf("table").trim()),
);

/** 数据库节点：按字段映射的目标列作为设计表预填列 */
const ddlColumns = computed(() =>
  pairsOfParam("column:目标列")
    .map(pair => String(pair.key ?? "").trim())
    .filter(Boolean),
);

/** 设计表组件需要数字数据源 ID；app/空值不传，由后端走连接默认库 */
const designDatasourceId = computed<number | undefined>(() => {
  const raw = valueOf("datasource").trim();
  if (!/^\d+$/.test(raw)) return undefined;
  return Number(raw);
});

const designInitialColumns = computed(() =>
  ddlColumns.value.map(name => ({ name })),
);

function onDesignCreated(_database: string, table: string): void {
  const tableParam = props.meta.params.find(param => param.name === "table");
  if (tableParam) {
    emit("set-param", tableParam, table);
  }
  props.ctx.refreshColumns();
  ddlOpen.value = false;
}

const ddlLabel = computed(() => {
  if (props.meta.shape !== "database") return "";
  return "设计表";
});

/** 字段摘要：有字段显示数量，没有显式提示未配置 */
const fieldSummary = computed(() => {
  const list = props.node.fields ?? [];
  if (!list.length) return "未配置字段";
  const types = [...new Set(list.map(field => (field.parserType || "CSS").toUpperCase()))];
  return `${list.length} 个字段（${types.join(" / ")}）`;
});

/** 前端补充的参数说明优先传给 ParamField 的 label 图标；没补时回落后端 param.tip */
function extraTipOf(name: string): string {
  return props.extraTips?.[name] ?? "";
}

/** 数据录入节点：数据格式参数 */
const ENTRY_FORMAT_OPTIONS = [
  { label: "CSV / 逗号分隔", value: "csv" },
  { label: "JSONL / 每行一条 JSON", value: "jsonl" },
  { label: "HTTP JSON", value: "http-json" },
  { label: "纯文本", value: "text" },
];
const ENTRY_FORMAT_PARAM: CollectParamMeta = {
  name: "format",
  label: "数据格式",
  type: "select",
  options: ["csv", "jsonl", "http-json", "text"],
  defaultValue: "csv",
  required: false,
  tip: "CSV 按首行表头解析；JSONL 每行一条 JSON；HTTP JSON 提供 JSON 数组或对象。",
};
const entryFormat = computed({
  get: () => valueOf("format") || "csv",
  set: (value: string) => emit("set-param", ENTRY_FORMAT_PARAM, value),
});

/** 链接节点：上游数据类型参数 */
const LINK_FORMAT_OPTIONS = [
  { label: "HTML 页面", value: "html" },
  { label: "JSON 数据", value: "json" },
  { label: "纯文本", value: "text" },
];
const LINK_FORMAT_PARAM: CollectParamMeta = {
  name: "sourceFormat",
  label: "数据格式",
  type: "select",
  options: ["html", "json", "text"],
  defaultValue: "html",
  required: false,
  tip: "上游节点产出的数据类型：HTML 用选择器抽取链接，JSON/文本按对应解析。",
};
const linkFormat = computed({
  get: () => valueOf("sourceFormat") || "html",
  set: (value: string) => emit("set-param", LINK_FORMAT_PARAM, value),
});
</script>

<template>
  <template v-if="section === 'loop'">
    <LoopFields
      :node="node"
      :meta="meta"
      :ctx="ctx"
      @set-param="(param: CollectParamMeta, value: unknown) => emit('set-param', param, value)"
      @set-pairs="(param: CollectParamMeta, pairs: ParamPair[]) => emit('set-pairs', param, pairs)"
    />
  </template>

  <template v-else-if="section === 'output'">
    <template v-for="param in outputFields" :key="param.name">
      <div
        v-if="meta.shape === 'database' && isMappingParam(param.name) && !databaseReady"
        class="field field-wide mapping-lock"
      >
        <div class="field-label">
          {{ param.label }}<span v-if="param.required" class="req">*</span>
        </div>
        <div class="mapping-lock-text">请先选择目标数据库和目标表，再配置字段映射。</div>
      </div>
      <ParamField
        v-else
        :param="param"
        :hint="extraTipOf(param.name)"
        :required="meta.shape === 'database' && (param.name === 'datasource' || param.name === 'table')"
        :value="valueOf(param.name)"
        :pairs="pairsOfParam(param.name)"
        :node-id="node.id"
        :ctx="ctx"
        @update="(value: unknown) => emit('set-param', param, value)"
        @pairs="(value: ParamPair[]) => emit('set-pairs', param, value)"
      />
      <!-- 数据库节点：设计表放在目标表正下方，复用数据源中心自带弹窗 -->
      <div
        v-if="meta.shape === 'database' && param.name === 'table'"
        class="field field-wide ddl-actions"
      >
        <ReButton text type="primary" :disabled="!valueOf('datasource').trim() || !valueOf('table').trim()" @click="ddlOpen = true">
          {{ ddlLabel }}
        </ReButton>
        <span class="ddl-hint">
          打开数据源中心设计表：配置表名与字段后创建，创建后自动回填目标表并刷新字段与类型候选。
        </span>
      </div>
    </template>
    <div v-if="meta.fieldEditor" class="field field-wide">
      <div class="field-label">抽取字段</div>
      <div class="field-summary" :class="{ 'summary-missing': !node.fields?.length }">
        <span class="summary-text">{{ fieldSummary }}</span>
        <ReButton text type="primary" @click="fieldsOpen = true">配置</ReButton>
      </div>
      <ReDialog v-model="fieldsOpen" title="抽取字段" width="min(1400px, 94vw)" top="10px" append-to-body>
        <FieldTable
          :model-value="node.fields"
          :preview-url="ctx.previewUrl"
          :load-preview="ctx.loadPreview"
          :placeholder-groups="ctx.placeholderGroups"
          @update:model-value="ctx.writeFields"
        />
      </ReDialog>
    </div>

    <DesignTableDialog
      v-if="meta.shape === 'database'"
      v-model="ddlOpen"
      :datasource-id="designDatasourceId"
      :initial-name="valueOf('table').trim()"
      :initial-columns="designInitialColumns"
      @created="onDesignCreated"
    />
  </template>

  <template v-else-if="section === 'advanced'">
    <template v-for="param in advancedFields" :key="param.name">
      <ParamField
        :param="param"
        :hint="extraTipOf(param.name)"
        :value="valueOf(param.name)"
        :pairs="pairsOfParam(param.name)"
        :node-id="node.id"
        :ctx="ctx"
        @update="(value: unknown) => emit('set-param', param, value)"
        @pairs="(value: ParamPair[]) => emit('set-pairs', param, value)"
      />
    </template>
  </template>

  <template v-else-if="section === 'input'">
    <!-- 数据录入节点：数据格式（CSV / JSONL / HTTP JSON / 文本） -->
    <div v-if="meta.shape === 'entry'" class="field field-wide">
      <div class="field-label">
        {{ ENTRY_FORMAT_PARAM.label }}
        <el-tooltip :content="ENTRY_FORMAT_PARAM.tip ?? undefined" placement="top" :show-after="200" :teleported="true">
          <span class="label-tip"><ReIcon name="InfoFilled" :size="13" /></span>
        </el-tooltip>
      </div>
      <el-segmented
        v-model="entryFormat"
        class="format-seg"
        :options="ENTRY_FORMAT_OPTIONS"
        block
      />
    </div>

    <!-- 链接节点：上游数据类型（HTML / JSON / 文本） -->
    <div v-else-if="meta.shape === 'link'" class="field field-wide">
      <div class="field-label">
        {{ LINK_FORMAT_PARAM.label }}
        <el-tooltip :content="LINK_FORMAT_PARAM.tip ?? undefined" placement="top" :show-after="200" :teleported="true">
          <span class="label-tip"><ReIcon name="InfoFilled" :size="13" /></span>
        </el-tooltip>
      </div>
      <el-segmented
        v-model="linkFormat"
        class="format-seg"
        :options="LINK_FORMAT_OPTIONS"
        block
      />
    </div>

    <template v-for="param in inputFields" :key="param.name">
      <ParamField
        :param="param"
        :hint="extraTipOf(param.name)"
        :value="valueOf(param.name)"
        :pairs="pairsOfParam(param.name)"
        :node-id="node.id"
        :ctx="ctx"
        @update="(value: unknown) => emit('set-param', param, value)"
        @pairs="(value: ParamPair[]) => emit('set-pairs', param, value)"
      />
    </template>
  </template>

  <template v-else>
    <template v-for="param in fields" :key="param.name">
      <ParamField
        :param="param"
        :hint="extraTipOf(param.name)"
        :value="valueOf(param.name)"
        :pairs="pairsOfParam(param.name)"
        :node-id="node.id"
        :ctx="ctx"
        @update="(value: unknown) => emit('set-param', param, value)"
        @pairs="(value: ParamPair[]) => emit('set-pairs', param, value)"
      />
    </template>

    <LoopFields
      :node="node"
      :meta="meta"
      :ctx="ctx"
      @set-param="(param: CollectParamMeta, value: unknown) => emit('set-param', param, value)"
      @set-pairs="(param: CollectParamMeta, pairs: ParamPair[]) => emit('set-pairs', param, pairs)"
    />

    <div v-if="meta.fieldEditor" class="field field-wide">
      <div class="field-label">抽取字段</div>
      <FieldTable
        :model-value="node.fields"
        :placeholder-groups="ctx.placeholderGroups"
        @update:model-value="ctx.writeFields"
      />
    </div>

    <slot />
  </template>
</template>

<style scoped>
/* 字段容器：ParamField 根元素同样是 .field，这里只补最小宽度，宽度由 ParamField 自判 */
.field {
  min-width: 0;
}

.field-wide {
  grid-column: 1 / -1;
}

/* 顶部数据格式分段控件占满整行 */
.format-seg {
  width: 100%;
}

.field-label {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 3px;
  font-size: 12px;
  /* 写死的 #86909c 不跟随主题；改用 koi 体系令牌 */
  color: var(--el-text-color-secondary);
}

/* label 右侧的信息图标：备注全部收进 tooltip，不占输入区版面 */
.label-tip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  color: var(--el-text-color-secondary);
  cursor: help;
  border-radius: 50%;
}

.label-tip:hover {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

/* 字段摘要行：与数据库映射一样，不整表铺在面板里 */
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
.summary-missing {
  background: var(--el-color-danger-light-9);
  border-color: var(--el-color-danger-light-5);
}
.summary-missing .summary-text {
  color: var(--el-color-danger);
}

/* 数据库节点「建表 / 补列」入口：和字段映射贴在一起 */
.ddl-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
  align-items: baseline;
  margin-top: 4px;
}

.ddl-hint {
  flex: 1 1 260px;
  min-width: 0;
  font-size: 11px;
  line-height: 1.45;
  color: var(--el-text-color-secondary);
}

/* 数据库节点字段映射锁定态：先选库和表，免得出现无源映射 */
.mapping-lock {
  padding: 8px 10px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-left: 2px solid var(--el-color-warning);
  border-radius: var(--el-radius-md, 8px);
}

.mapping-lock-text {
  margin-top: 2px;
  font-size: 11px;
  line-height: 1.45;
  color: var(--el-text-color-secondary);
}
</style>
