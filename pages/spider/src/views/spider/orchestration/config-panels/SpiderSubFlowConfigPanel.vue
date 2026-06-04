<template>
  <div class="spider-node-panel">
    <div class="spider-node-panel__section">
      <div class="spider-node-panel__section-head">
        <strong>子流程</strong>
        <span>子流程引用与进入条件</span>
      </div>

      <label class="spider-node-panel__item">
        <span>节点标题</span>
        <el-input :model-value="nodeTitle" @update:model-value="updateTitle" />
      </label>

      <label class="spider-node-panel__item">
        <span>子流程编码</span>
        <el-input :model-value="subFlowCodeValue" @update:model-value="value => updateConfig('subFlowCode', value)" />
      </label>

      <label class="spider-node-panel__item">
        <span>进入条件</span>
        <el-input :model-value="entryConditionValue" type="textarea" :rows="4" @update:model-value="value => updateConfig('entryCondition', value)" />
      </label>
    </div>

    <div class="spider-node-panel__section">
      <div class="spider-node-panel__section-head">
        <strong>流程说明</strong>
        <span>建议用于登录页、详情页、验证码页等正式链路</span>
      </div>
      <div class="spider-node-panel__note">
        子流程不是异常兜底，而是正式编排能力。一个爬虫内部可以维护多个私有子流程，通过编码进行引用。
      </div>

    </div>

    <div class="spider-node-panel__footer">
      <el-button type="danger" plain @click="removeNode">删除节点</el-button>
      <el-button type="primary" @click="saveConfig">保存配置</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ElButton, ElInput } from "element-plus";
import type { ScMFlowNodeMeta } from "@repo/components/ScFlowEditor";

defineOptions({ name: "SpiderSubFlowConfigPanel" });

const props = defineProps<{
  nodeMeta: ScMFlowNodeMeta;
  nodeTitle: string;
  nodeConfig: Record<string, any>;
  updateTitle: (value: string) => void;
  updateConfig: (field: string, value: unknown) => void;
  saveConfig: () => void;
  removeNode: () => void;
}>();

const subFlowCodeValue = computed(() => String(props.nodeConfig.subFlowCode || ""));
const entryConditionValue = computed(() => String(props.nodeConfig.entryCondition || ""));
</script>

<style scoped lang="scss">
.spider-node-panel { display: grid; gap: 16px; }
.spider-node-panel__section { display: grid; gap: 10px; }
.spider-node-panel__section-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.spider-node-panel__section-head strong { color: var(--lay-text-primary); font-size: 13px; font-weight: 700; }
.spider-node-panel__section-head span { color: var(--lay-text-placeholder); font-size: 11px; }
.spider-node-panel__item { display: grid; gap: 6px; }
.spider-node-panel__item > span { color: var(--lay-text-secondary); font-size: 12px; }
.spider-node-panel__note { padding: 12px; border: 1px solid color-mix(in srgb, var(--lay-accent) 12%, var(--lay-border)); border-radius: 8px; background: color-mix(in srgb, var(--lay-bg) 92%, transparent); color: var(--lay-text-secondary); line-height: 1.6; font-size: 12px; }
.spider-node-panel__footer { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.spider-node-panel :deep(.el-input__wrapper),
.spider-node-panel :deep(.el-textarea__inner) { border-radius: 6px; }
</style>
