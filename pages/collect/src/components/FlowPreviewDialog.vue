<!--
  流程预览图（只读）。

  复刻设计器的那张画布而不是另画一张：FlowDesigner 加了 readonly 后，
  预览与「运行回放」共用同一套图渲染，节点形状、磁吸连线、状态描边全部一致，
  不会出现「设计里长这样、预览里长那样」。

  右侧清单是给人看的：光看图说不出「这个采集器到底做了什么」，
  节点类型 + 关键参数（数据源/表/URL）按执行顺序列出来才有信息量。
-->
<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { msgError } from "@repo/core";
import ReDialog from "@repo/ui/re-dialog";
import ReTag from "@repo/ui/re-tag";
import FlowDesigner from "./FlowDesigner.vue";
import { fetchDatasourceColumns, fetchDatasourceOptions, fetchDatasourceTables, fetchMetas, getFlow } from "../api/collectApi";
import { errText } from "../composables/useCollectView";
import type { CollectColumn, CollectFlow, CollectOption, CollectParam, CollectShapeMeta } from "../types/collect";

const props = defineProps<{
  modelValue: boolean;
  flowId: number | null;
}>();

const emit = defineEmits<{ (event: "update:modelValue", value: boolean): void }>();

const loading = ref(false);
const flow = ref<CollectFlow | null>(null);
const metas = ref<CollectShapeMeta[]>([]);
const datasourceOptions = ref<CollectOption[]>([]);
const designer = ref<InstanceType<typeof FlowDesigner> | null>(null);

/** shape → 中文标签，节点清单用 */
const labelOf = computed(() => {
  const map = new Map<string, string>();
  metas.value.forEach(meta => map.set(meta.shape, meta.label));
  return (shape: string) => map.get(shape) ?? shape;
});

/** 节点清单：按画布从上到下、从左到右近似排序，y 相同按 x */
const nodeRows = computed(() => {
  const nodes = flow.value?.dsl?.nodes ?? [];
  return [...nodes]
    .sort((a, b) => (a.y ?? 0) - (b.y ?? 0) || (a.x ?? 0) - (b.x ?? 0))
    .map((node, index) => ({
      key: node.id,
      order: index + 1,
      name: node.name || labelOf.value(node.shape),
      shape: node.shape,
      label: labelOf.value(node.shape),
      summary: summarize(node.params),
    }));
});

/**
 * 节点参数摘要：只挑「这个节点在跟什么打交道」的那几个。
 *
 * 全量参数对预览没有意义（分页大小、超时、线程数这些），真正说明问题的是
 * 数据源 / 表 / URL / 表达式，缺哪个就不显示哪段。
 */
function summarize(params: CollectParam[] | undefined): string {
  const value = (name: string) => params?.find(item => item.name === name)?.value ?? "";
  const parts = [
    ["数据源", value("datasource")],
    ["表", value("table")],
    ["URL", value("url")],
    ["表达式", value("expression")],
  ]
    .filter(([, text]) => Boolean(text))
    .map(([label, text]) => `${label} ${text}`);
  return parts.join(" · ");
}

/** 画布上的入库节点要能选表/列，透传数据源候选 */
async function loadTables(datasource: string): Promise<string[]> {
  return (await fetchDatasourceTables(datasource)) ?? [];
}

async function loadColumns(datasource: string, table: string): Promise<CollectColumn[]> {
  return (await fetchDatasourceColumns(datasource, table)) ?? [];
}

async function load(): Promise<void> {
  if (!props.flowId) {
    return;
  }
  loading.value = true;
  try {
    const [detail, metaList] = await Promise.all([getFlow(props.flowId), fetchMetas()]);
    flow.value = detail;
    metas.value = metaList ?? [];
    if (!datasourceOptions.value.length) {
      datasourceOptions.value = (await fetchDatasourceOptions()) ?? [];
    }
    // 画布是 v-if 随 flow 一起挂上的，等它挂完再灌图。
    // :initial-dsl 仍保留——它负责「引擎就绪比数据晚到」那一半，两条路径都指向同一张图。
    await nextTick();
    designer.value?.load(detail.dsl);
  } catch (error) {
    msgError(errText(error));
  } finally {
    loading.value = false;
  }
}

watch(() => [props.modelValue, props.flowId] as const, ([open]) => {
  if (open) {
    void load();
  }
}, { immediate: true });
</script>

<template>
  <ReDialog
    :model-value="modelValue"
    :title="`流程预览 · ${flow?.collectFlowName || ''}`"
    width="1180px"
    top="5vh"
    footer-hidden
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-loading="loading" class="flow-preview">
      <div class="flow-preview__canvas">
        <FlowDesigner
          v-if="flow?.dsl"
          ref="designer"
          readonly
          :metas="metas"
          :initial-dsl="flow.dsl"
          :datasource-options="datasourceOptions"
          :load-tables="loadTables"
          :load-columns="loadColumns"
        />
        <div v-else-if="!loading" class="flow-preview__empty">该采集器还没有流程图</div>
      </div>

      <div class="flow-preview__side">
        <div class="side-head">
          <span>节点清单</span>
          <ReTag size="small" type="info" effect="plain">{{ nodeRows.length }} 个</ReTag>
        </div>
        <ol class="node-list">
          <li v-for="row in nodeRows" :key="row.key" class="node-item">
            <span class="node-order">{{ row.order }}</span>
            <div class="node-body">
              <div class="node-title">
                {{ row.name }}
                <ReTag size="small" effect="plain">{{ row.label }}</ReTag>
              </div>
              <div v-if="row.summary" class="node-summary">{{ row.summary }}</div>
            </div>
          </li>
        </ol>
      </div>
    </div>
  </ReDialog>
</template>

<style scoped>
.flow-preview {
  display: flex;
  gap: 12px;
  height: calc(100vh - 210px);
}
.flow-preview__canvas {
  flex: 1;
  min-width: 0;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  overflow: hidden;
}
.flow-preview__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--el-text-color-placeholder);
}
.flow-preview__side {
  width: 320px;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  overflow: hidden;
}
.side-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 600;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.node-list {
  margin: 0;
  padding: 6px;
  list-style: none;
  overflow: auto;
}
.node-item {
  display: flex;
  gap: 8px;
  padding: 7px 8px;
  border-radius: 5px;
}
.node-item:hover {
  background: var(--el-fill-color-light);
}
.node-order {
  flex: none;
  width: 20px;
  height: 20px;
  line-height: 20px;
  text-align: center;
  font-size: 12px;
  border-radius: 50%;
  background: var(--el-fill-color);
  color: var(--el-text-color-regular);
}
.node-body {
  min-width: 0;
}
.node-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}
.node-summary {
  margin-top: 2px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  word-break: break-all;
}
</style>
