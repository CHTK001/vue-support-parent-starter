<!--
  数据录入节点表单：录入口径说明 + 录入数据 / 出参名 / 建表数据源与表 / 一键建表。

  <p>参数顺序由 paramContext 统一决定（必填置顶）；循环四参数由 LoopFields 以
  「循环迭代」分节展示。建表入口挂在
  「建表目标表」下面，请求按录入文本的表头列生成（与后端 parseRows 同口径），
  对话框走共享的 CreateTableDialog（预览 → 执行）。</p>
-->
<script setup lang="ts">
import { computed, ref } from "vue";
import { CreateTableDialog } from "@pages/datasource";
import ReButton from "@repo/ui/re-button";
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
  /** 分区渲染：input / output / loop / advanced；缺省 all 保持旧行为 */
  section?: "all" | "input" | "output" | "loop" | "advanced";
}>();

const emit = defineEmits<{
  (e: "set-param", param: CollectParamMeta, value: unknown): void;
  (e: "set-pairs", param: CollectParamMeta, pairs: ParamPair[]): void;
}>();

/** 数据录入节点专属参数，按后端 meta 的下发顺序排列 */
const { fields, valueOf } = useShapeFieldList(
  () => props.node,
  () => props.meta,
  ["rows", "outputVariable", "datasource", "table"],
);

/**
 * 录入文本的表头列：首行非空行按制表符 / 逗号拆（与后端 parseRows 的分隔符判定同口径）。
 *
 * <p>表达式占位（${...}）不参与拆分 —— 建表列必须是字面列名。</p>
 */
const headerColumns = computed<string[]>(() => {
  const text = props.node.params.find(item => item.name === "rows")?.value ?? "";
  const firstLine = text.split(/\r?\n/).find(line => line.trim().length > 0) ?? "";
  if (!firstLine.trim() || firstLine.includes("${")) {
    return [];
  }
  const delimiter = firstLine.includes("\t") ? "\t" : ",";
  return firstLine
    .split(delimiter)
    .map(cell => cell.trim().replace(/^"(.*)"$/, "$1"))
    .filter(Boolean);
});

/** 弹窗可见性；预览 / 执行 / 类型补齐都在共享组件里 */
const ddlOpen = ref(false);

/** 建表入口：选了数据源和表 + 表头至少一列 */
const canDdl = computed(
  () =>
    Boolean(valueOf("datasource").trim())
    && Boolean(valueOf("table").trim())
    && headerColumns.value.length > 0,
);

/** 打开建表对话框：按表头列建，预览 / 执行交给共享组件 */
function openDdl(): void {
  ddlOpen.value = true;
}

const inputFields = computed(() => fields.value.filter(p => p.name !== "outputVariable"));
const outputFields = computed(() => fields.value.filter(p => p.name === "outputVariable"));

/**
 * 参数是否整行展示（与 ParamField 的宽控件判定一致）。
 *
 * @param param 参数元数据
 * @returns 是则返回 true
 */
function isWide(param: CollectParamMeta): boolean {
  return (
    param.type === "textarea" ||
    param.type === "pairs" ||
    param.type === "mapping" ||
    param.type === "table"
  );
}

/** 前端补充的参数说明（后端 tip 对 textarea 只当占位符，输入后即消失） */
const EXTRA_TIPS: Record<string, string> = {
  rows:
    "首行表头、其后每行一条；也支持 JSON 数组 [{\"列\": 值}]。单元格空值落 NULL，纯数字与布尔按值收型，前导零（007）保留文本。文本支持 ${} 拼接。",
  outputVariable: "本节点产出的集合变量名，默认 data；下游用 ${data} 引用整批行（旧流程留空时仍按 ${rows} 兜底）。",
  datasource: "只给「建表」按钮用：选数据源中心里的 JDBC 数据源；本节点自身不写库。",
  table: "配合「建表」按钮把上方录入列落成实际表；下游数据库节点选同一数据源与表即可写入。",
};

/**
 * 取某参数的补充说明。
 *
 * @param name 参数名
 * @returns 补充说明；没有则返回空串
 */
function extraTip(name: string): string {
  return EXTRA_TIPS[name] ?? "";
}
</script>

<template>
  <div class="field field-wide node-intro">
    手工录行：首行表头、每行一条数据，产出集合（默认 ${data}，同 ${rows}）供下游数据库 / 采集平台节点整批消费。
    需要目标表时，先用「建表」按表头列把表落好，再让下游选同一数据源与表写入。
  </div>

  <template v-for="param in fields" :key="param.name">
    <div class="field" :class="{ 'field-wide': isWide(param) }">
      <ParamField
        :param="param"
        :value="valueOf(param.name)"
        :pairs="[]"
        :node-id="node.id"
        :ctx="ctx"
        @update="(value: unknown) => emit('set-param', param, value)"
      />
      <div v-if="extraTip(param.name)" class="field-tip">{{ extraTip(param.name) }}</div>
      <!-- 建表入口挂在「建表目标表」下面：选完数据源与表 → 一键按表头列建表 -->
      <div v-if="param.name === 'table' && canDdl" class="ddl-actions">
        <ReButton text type="primary" @click="openDdl">建表…</ReButton>
        <span class="ddl-hint">按录入表头的 {{ headerColumns.length }} 列建表（列类型 TEXT），建完在下游节点选同表写入。</span>
      </div>
    </div>
  </template>

  <!-- 循环迭代分节：留空单次执行，本节点可对录入集合逐项迭代 -->
  <LoopFields
    :node="node"
    :meta="meta"
    :ctx="ctx"
    @set-param="(param: CollectParamMeta, value: unknown) => emit('set-param', param, value)"
    @set-pairs="(param: CollectParamMeta, pairs: ParamPair[]) => emit('set-pairs', param, pairs)"
  />

  <!-- 共享建表对话框：与数据库节点、数据源中心同一份实现 -->
  <CreateTableDialog
    v-model="ddlOpen"
    :datasource="valueOf('datasource').trim()"
    :table="valueOf('table').trim()"
    :columns="headerColumns"
    @executed="ctx.refreshColumns()"
  />
</template>

<style scoped>
/* 参数容器：与 ParamField / genericForm 的字段样式保持一致，宽控件由容器占满整行 */
.field {
  min-width: 0;
}

.field-wide {
  grid-column: 1 / -1;
}

/* 节点级说明：一眼看清这个节点在流程里扮演什么角色 */
.node-intro {
  padding: 8px 10px;
  font-size: 12px;
  line-height: 1.45;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-left: 2px solid var(--el-color-primary);
  border-radius: var(--el-radius-md, 8px);
  transition: border-color 200ms, background-color 200ms;
}

/* 分组标题样式已随「循环」分段一起移除：循环参数改由 LoopFields 独立分节渲染 */

/* 前端补充的参数说明 */
.field-tip {
  margin-top: 3px;
  font-size: 11px;
  line-height: 1.45;
  color: var(--el-text-color-secondary);
}

/* 建表入口：与「建表目标表」贴在一起 */
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
</style>
