<!--
  中间件节点表单（InfluxDB / Neo4j 读写四型共用）：参数按后端 meta 渲染，
  唯一的专属逻辑是「数据源下拉按类型过滤」—— influx 节点只列 influxdb 数据源、
  neo4j 节点只列 neo4j 数据源，避免选错类型到运行期才报错。

  <p>实现方式是给 ParamField 喂一份 ctx 拷贝（datasourceOptions 换成过滤后的清单），
  其余参数渲染与 genericForm 同口径。</p>
-->
<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { fetchDataSources } from "@pages/datasource";
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

/** 中间件表单没有 pairs 类参数，按后端 meta 顺序渲染全部参数即可 */
const { fields, valueOf } = useShapeFieldList(() => props.node, () => props.meta, []);

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
    {{ node.shape.startsWith("influxdb")
      ? "InfluxDB 节点：查询按 Flux 取行、写入按行协议落点；数据源必须是 influxdb 类型。"
      : "Neo4j 节点：查询执行 Cypher 取行、写入按标签新建 / 合并节点；数据源必须是 neo4j 类型。" }}
    <span v-if="typeLoading">（数据源清单加载中…）</span>
    <span v-else-if="typeError" class="intro-error">（{{ typeError }}）</span>
    <span v-else-if="!typeOptions.length" class="intro-error">
      （数据源中心还没有 {{ dsType }} 类型的启用数据源，先到「数据源」页添加）
    </span>
  </div>

  <template v-for="param in fields" :key="param.name">
    <div class="field" :class="{ 'field-wide': isWide(param) }">
      <ParamField
        :param="param"
        :value="valueOf(param.name)"
        :pairs="[]"
        :node-id="node.id"
        :ctx="filteredCtx"
        @update="(value: unknown) => emit('set-param', param, value)"
      />
      <div v-if="extraTip(param.name)" class="field-tip">{{ extraTip(param.name) }}</div>
    </div>
  </template>

  <!-- 循环迭代分节：留空单次执行；ctx 走 filteredCtx 与主字段同口径 -->
  <LoopFields
    :node="node"
    :meta="meta"
    :ctx="filteredCtx"
    @set-param="(param: CollectParamMeta, value: unknown) => emit('set-param', param, value)"
    @set-pairs="(param: CollectParamMeta, pairs: ParamPair[]) => emit('set-pairs', param, pairs)"
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
}

.intro-error {
  color: var(--el-color-warning);
}

/* 分组标题样式已随「循环」分段一起移除：循环参数改由 LoopFields 独立分节渲染 */

/* 前端补充的参数说明 */
.field-tip {
  margin-top: 3px;
  font-size: 11px;
  line-height: 1.45;
  color: var(--el-text-color-secondary);
}
</style>
