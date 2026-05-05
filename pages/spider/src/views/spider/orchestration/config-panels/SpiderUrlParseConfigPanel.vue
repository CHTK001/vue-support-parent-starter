<template>
  <div class="spider-node-panel">
    <div class="spider-node-panel__section">
      <div class="spider-node-panel__section-head">
        <strong>URL 解析</strong>
        <span>抽取方式、筛选提示与入队策略</span>
      </div>

      <label class="spider-node-panel__item">
        <span>节点标题</span>
        <el-input :model-value="nodeTitle" @update:model-value="updateTitle" />
      </label>

      <div class="spider-node-panel__item">
        <span>解析模式</span>
        <el-select :model-value="parseMode" @update:model-value="value => updateConfig('parseMode', value)">
          <el-option v-for="item in parseModeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </div>

      <label class="spider-node-panel__item">
        <span>选择器 / 规则</span>
        <el-input :model-value="selectorValue" type="textarea" :rows="4" @update:model-value="value => updateConfig('selector', value)" />
      </label>

      <label class="spider-node-panel__item">
        <span>AI 提示词</span>
        <el-input :model-value="aiPromptValue" type="textarea" :rows="4" @update:model-value="value => updateConfig('aiPrompt', value)" />
      </label>

      <label class="spider-node-panel__item">
        <span>最大抽取数</span>
        <el-input-number :model-value="collectLimit" :min="1" @update:model-value="value => updateConfig('collectLimit', Number(value || 0))" />
      </label>

      <label class="spider-node-panel__switch">
        <span>去重后入队</span>
        <el-switch :model-value="Boolean(nodeConfig.dedupBeforeQueue)" @update:model-value="value => updateConfig('dedupBeforeQueue', value)" />
        <em>{{ nodeConfig.dedupBeforeQueue ? "开启" : "关闭" }}</em>
      </label>
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
import { ElButton, ElInput, ElInputNumber, ElOption, ElSelect, ElSwitch } from "element-plus";
import type { ScMFlowNodeMeta } from "@repo/components/ScMFlowEditor";
import SpiderAiAssistSection from "./SpiderAiAssistSection.vue";
defineOptions({ name: "SpiderUrlParseConfigPanel" });

const props = defineProps<{
  nodeMeta: ScMFlowNodeMeta;
  nodeTitle: string;
  nodeConfig: Record<string, any>;
  updateTitle: (value: string) => void;
  updateConfig: (field: string, value: unknown) => void;
  saveConfig: () => void;
  removeNode: () => void;
}>();

const parseModeOptions = [
  { label: "AUTO_LINKS", value: "AUTO_LINKS" },
  { label: "CSS", value: "CSS" },
  { label: "XPATH", value: "XPATH" },
  { label: "REGEX", value: "REGEX" },
  { label: "AI", value: "AI" },
];

const parseMode = computed(() => String(props.nodeConfig.parseMode || "AUTO_LINKS"));
const selectorValue = computed(() => String(props.nodeConfig.selector || ""));
const aiPromptValue = computed(() => String(props.nodeConfig.aiPrompt || ""));
const collectLimit = computed(() => Number(props.nodeConfig.collectLimit || 1000));
</script>

<style scoped lang="scss">
.spider-node-panel { display: grid; gap: 18px; }
.spider-node-panel__section { display: grid; gap: 12px; }
.spider-node-panel__section-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.spider-node-panel__section-head strong { color: var(--lay-text-primary); font-size: 14px; }
.spider-node-panel__section-head span { color: var(--lay-text-placeholder); font-size: 12px; }
.spider-node-panel__item { display: grid; gap: 8px; }
.spider-node-panel__item > span { color: var(--lay-text-secondary); font-size: 12px; }
.spider-node-panel__switch { display: flex; align-items: center; gap: 8px; }
.spider-node-panel__footer { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.spider-node-panel :deep(.el-input__wrapper),
.spider-node-panel :deep(.el-textarea__inner),
.spider-node-panel :deep(.el-select__wrapper) { border-radius: 12px; }
</style>
