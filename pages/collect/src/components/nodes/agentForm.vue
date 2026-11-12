<!--
  Agent 节点表单。

  节点参数仍由后端 metas 驱动；这里只补两件 UI 事：
  ① 显示当前已注册 Agent 数量；
  ② 允许设计器内刷新运行期 Agent 目录，不要求整页重载。
-->
<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import NodeParamForm from "./NodeParamForm.vue";
import { fetchAgentOptions } from "../../api/collectApi";
import type { NodeForm, NodeFormContext } from "./paramContext";
import type { ParamPair } from "../../utils/dsl";
import type { CollectOption, CollectParamMeta, CollectShapeMeta } from "../../types/collect";

const props = defineProps<{
  /** 当前节点的表单镜像 */
  node: NodeForm;
  /** 该 shape 的参数元数据 */
  meta: CollectShapeMeta;
  /** 表单共享上下文 */
  ctx: NodeFormContext;
  /** 分区渲染：input / output / loop / advanced；缺省 all 表示旧行为 */
  section?: "all" | "input" | "output" | "loop" | "advanced";
}>();

const emit = defineEmits<{
  (e: "set-param", param: CollectParamMeta, value: unknown): void;
  (e: "set-pairs", param: CollectParamMeta, pairs: ParamPair[]): void;
}>();

const AGENT_PARAM = "agentName";
const loading = ref(false);
const agents = ref<CollectOption[]>([]);

/** 从 metas 里同步 Agent 选项；后端已经把它们放进参数字段 */
function syncFromMeta(): void {
  const param = props.meta.params.find(item => item.name === AGENT_PARAM);
  agents.value = (param?.options ?? []).map(value => ({ value, label: value }));
}

watch(() => props.meta, syncFromMeta, { immediate: true });

/** 刷新运行期 Agent 目录，失败时保留 metas 里的快照 */
async function refresh(): Promise<void> {
  if (loading.value) return;
  loading.value = true;
  try {
    const options = await fetchAgentOptions();
    agents.value = Array.isArray(options) ? options : [];
  } catch {
    // 刷新失败不打断编排；保留后端 metas 当前快照
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  // metas 是页面打开时的快照；进入表单时补一次实时目录
  void refresh();
});

/** 只替换 agentName 的候选项，其余参数元数据原样保留 */
const displayMeta = computed<CollectShapeMeta>(() => ({
  ...props.meta,
  params: props.meta.params.map(param =>
    param.name === AGENT_PARAM
      ? { ...param, options: agents.value.map(item => item.value) }
      : param,
  ),
}));

const agentCount = computed(() => agents.value.length);
const emptyAgent = computed(() => agentCount.value === 0);
</script>

<template>
  <div class="agent-form">
    <div v-if="!section || section === 'input'" class="agent-form__summary">
      <div class="agent-form__summary-main">
        <span class="agent-form__badge">{{ agentCount }}</span>
        <span>个已注册 Agent 可用于本节点</span>
      </div>
      <button
        type="button"
        class="agent-form__refresh"
        :disabled="loading"
        @click="refresh"
      >
        {{ loading ? "刷新中…" : "刷新目录" }}
      </button>
    </div>
    <p v-if="emptyAgent && (!section || section === 'input')" class="agent-form__empty">
      运行期还没有可用 Agent。请先在 AI Agent 管理中创建并确认已注册，再刷新本目录。
    </p>

    <NodeParamForm
      :node="node"
      :meta="displayMeta"
      :ctx="ctx"
      :section="section"
      @set-param="(param: CollectParamMeta, value: unknown) => emit('set-param', param, value)"
      @set-pairs="(param: CollectParamMeta, pairs: ParamPair[]) => emit('set-pairs', param, pairs)"
    />
  </div>
</template>

<style scoped>
.agent-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.agent-form__summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-regular);
  font-size: 12px;
}

.agent-form__summary-main {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.agent-form__badge {
  display: inline-flex;
  min-width: 20px;
  height: 20px;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--el-color-primary);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
}

.agent-form__refresh {
  flex: none;
  padding: 3px 8px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  background: var(--el-bg-color);
  color: var(--el-color-primary);
  cursor: pointer;
  font: inherit;
}

.agent-form__refresh:disabled {
  cursor: wait;
  opacity: 0.6;
}

.agent-form__empty {
  margin: 0;
  padding: 7px 10px;
  border-radius: 6px;
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning-dark-2);
  font-size: 12px;
  line-height: 1.5;
}
</style>
