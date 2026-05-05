<template>
  <div class="spider-node-panel">
    <div class="spider-node-panel__section">
      <div class="spider-node-panel__section-head">
        <strong>条件判断</strong>
        <span>表达式与分支文案配置</span>
      </div>

      <label class="spider-node-panel__item">
        <span>节点标题</span>
        <el-input :model-value="nodeTitle" @update:model-value="updateTitle" />
      </label>

      <label class="spider-node-panel__item">
        <span>条件表达式</span>
        <el-input :model-value="expressionValue" type="textarea" :rows="5" @update:model-value="value => updateConfig('expression', value)" />
      </label>

      <div class="spider-node-panel__branch-grid">
        <label class="spider-node-panel__item">
          <span>满足分支文案</span>
          <el-input :model-value="trueLabelValue" @update:model-value="value => updateConfig('trueLabel', value)" />
        </label>
        <label class="spider-node-panel__item">
          <span>不满足分支文案</span>
          <el-input :model-value="falseLabelValue" @update:model-value="value => updateConfig('falseLabel', value)" />
        </label>
      </div>
    </div>

    <SpiderAiAssistSection :node-config="nodeConfig" :update-config="updateConfig" />

    <div class="spider-node-panel__footer">
      <el-button type="danger" plain @click="removeNode">删除节点</el-button>
      <el-button type="primary" @click="saveConfig">保存配置</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ElButton, ElInput } from "element-plus";
import type { ScMFlowNodeMeta } from "@repo/components/ScMFlowEditor";
import SpiderAiAssistSection from "./SpiderAiAssistSection.vue";
defineOptions({ name: "SpiderConditionConfigPanel" });

const props = defineProps<{
  nodeMeta: ScMFlowNodeMeta;
  nodeTitle: string;
  nodeConfig: Record<string, any>;
  updateTitle: (value: string) => void;
  updateConfig: (field: string, value: unknown) => void;
  saveConfig: () => void;
  removeNode: () => void;
}>();

const expressionValue = computed(() => String(props.nodeConfig.expression || ""));
const trueLabelValue = computed(() => String(props.nodeConfig.trueLabel || "满足"));
const falseLabelValue = computed(() => String(props.nodeConfig.falseLabel || "不满足"));
</script>

<style scoped lang="scss">
.spider-node-panel { display: grid; gap: 18px; }
.spider-node-panel__section { display: grid; gap: 12px; }
.spider-node-panel__section-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.spider-node-panel__section-head strong { color: var(--lay-text-primary); font-size: 14px; }
.spider-node-panel__section-head span { color: var(--lay-text-placeholder); font-size: 12px; }
.spider-node-panel__item { display: grid; gap: 8px; }
.spider-node-panel__item > span { color: var(--lay-text-secondary); font-size: 12px; }
.spider-node-panel__branch-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.spider-node-panel__footer { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.spider-node-panel :deep(.el-input__wrapper),
.spider-node-panel :deep(.el-textarea__inner) { border-radius: 12px; }
</style>
