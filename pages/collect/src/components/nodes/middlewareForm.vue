<!--
  中间件节点表单（InfluxDB / Neo4j 读写四型共用）：参数按后端 meta 渲染，
  唯一的专属逻辑是「数据源下拉按类型过滤」—— influx 节点只列 influxdb 数据源、
  neo4j 节点只列 neo4j 数据源，避免选错类型到运行期才报错。

  <p>实现方式是给 ParamField 喂一份 ctx 拷贝（datasourceOptions 换成过滤后的清单），
  其余参数渲染与 genericForm 同口径。</p>

  <p>属性面板页签化之后（components/NodeFormTabs.vue，每页签下发 section）：
  本组件只自渲染「输入参数 / 输出参数」两页的字段（要带过滤后的数据源候选），
  循环与高级配置直接委派 NodeParamForm，并把 filteredCtx 透传下去 ——
  之前「高级配置」页签在这里只写了一句「暂无独立高级配置」的说明，而 metas 明明下发了
  timeout / timeoutPolicy，超时于是再也没有地方可填。</p>
-->
<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { fetchDataSources } from "@pages/datasource";
import NodeAlert from "./NodeAlert.vue";
import NodeParamForm from "./NodeParamForm.vue";
import ParamField from "./ParamField.vue";
import { isInputParam, isOutputParamName, useShapeFieldList } from "./paramContext";
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

/** 中间件表单没有 pairs 类参数，按后端 meta 顺序渲染全部参数即可 */
const { fields, valueOf } = useShapeFieldList(() => props.node, () => props.meta, []);

/** 输入参数页签：除出参变量名以外的参数 */
const inputFields = computed(() => fields.value.filter(isInputParam));
/** 输出参数页签：出参变量名 */
const outputFields = computed(() => fields.value.filter(param => isOutputParamName(param.name)));

/** 本节点要求的数据源类型：shape 前缀决定（influxdb-* / neo4j-*） */
const dsType = computed(() => (props.node.shape.startsWith("influxdb") ? "influxdb" : "neo4j"));

/** 类型过滤后的数据源候选（只列启用项；值是台账 ID 字符串，与全局下拉同口径）
 *
 * <p>候选必须是 computed 而不能在 onMounted 里定格：宿主 `<component :is>` 没有 key，
 * influxdb-* 与 neo4j-* 共用本组件实例 —— 挂载时按当时的 dsType 过滤一次，从
 * Influx 节点切到 Neo4j 节点（或反之）会把异类型的清单一直挂在下拉里。
 * 清单挂载拉一次（原始行），过滤随 dsType 反应式重算。</p> */
const allRows = ref<Awaited<ReturnType<typeof fetchDataSources>>>([]);
const typeLoading = ref(false);
const typeError = ref("");

const typeOptions = computed(() =>
  (allRows.value ?? [])
    .filter(
      row =>
        (row.type || "").toLowerCase() === dsType.value
        && (row.status === null || row.status !== 0),
    )
    .map(row => ({
      value: String(row.id),
      label: `${row.name}（${row.host ?? ""}${row.port ? `:${row.port}` : ""}）`,
    })),
);

onMounted(async () => {
  typeLoading.value = true;
  try {
    allRows.value = (await fetchDataSources()) ?? [];
  } catch (error) {
    typeError.value = error instanceof Error ? error.message : String(error);
  } finally {
    typeLoading.value = false;
  }
});

/** 只给数据源参数换候选，其余 ctx 能力（表 / 列联动、DDL 等）原样透传 */
const filteredCtx = computed<NodeFormContext>(() => ({
  ...props.ctx,
  datasourceOptions: typeOptions.value,
}));

/**
 * 节点专属参数说明：hint 写在控件外面，比 tip 占位更耐读（textarea 输入后 tip 即消失）。
 */
const EXTRA_TIPS: Record<string, string> = {
  datasource: `只列 ${dsType.value} 类型且已启用的数据源；到「数据源」页添加后回来刷新即可。`,
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
  <!-- 节点级说明：每个页签顶部都显示一次（含数据源清单的加载/缺失状态） -->
  <NodeAlert kind="intro">
    {{ node.shape.startsWith("influxdb")
      ? "InfluxDB 节点：查询按 Flux 取行、写入按行协议落点；数据源必须是 influxdb 类型。"
      : "Neo4j 节点：查询执行 Cypher 取行、写入按标签新建 / 合并节点；数据源必须是 neo4j 类型。" }}
    <span v-if="typeLoading">（数据源清单加载中…）</span>
    <span v-else-if="typeError" class="intro-error">（{{ typeError }}）</span>
    <span v-else-if="!typeOptions.length" class="intro-error">
      （数据源中心还没有 {{ dsType }} 类型的启用数据源，先到「数据源」页添加）
    </span>
  </NodeAlert>

  <!-- 循环 / 高级配置：委派 NodeParamForm，但 ctx 必须是过滤后的那份 -->
  <NodeParamForm
    v-if="section && section !== 'input' && section !== 'output'"
    :node="node"
    :meta="meta"
    :ctx="filteredCtx"
    :section="section"
    :extra-tips="EXTRA_TIPS"
    @set-param="(param: CollectParamMeta, value: unknown) => emit('set-param', param, value)"
    @set-pairs="(param: CollectParamMeta, pairs: ParamPair[]) => emit('set-pairs', param, pairs)"
  />

  <template v-else-if="section === 'output'">
    <ParamField
      v-for="param in outputFields"
      :key="param.name"
      :param="param"
      :hint="extraTip(param.name)"
      :value="valueOf(param.name)"
      :pairs="[]"
      :node-id="node.id"
      :ctx="filteredCtx"
      @update="(value: unknown) => emit('set-param', param, value)"
    />
  </template>

  <template v-else>
    <ParamField
      v-for="param in inputFields"
      :key="param.name"
      :param="param"
      :hint="extraTip(param.name)"
      :value="valueOf(param.name)"
      :pairs="[]"
      :node-id="node.id"
      :ctx="filteredCtx"
      @update="(value: unknown) => emit('set-param', param, value)"
    />
  </template>
</template>

<style scoped>
/* 节点级说明里的异常提示：数据源清单读不到 / 没有可用数据源 */
.intro-error {
  color: var(--el-color-warning);
}
</style>
