<template>
  <div class="spider-node-panel">
    <div class="spider-node-panel__section">
      <div class="spider-node-panel__section-head">
        <strong>文档下载器</strong>
        <span>下载模式、文件过滤与落盘目录</span>
      </div>

      <label class="spider-node-panel__item">
        <span>节点标题</span>
        <el-input :model-value="nodeTitle" @update:model-value="updateTitle" />
      </label>

      <div class="spider-node-panel__item">
        <span>下载模式</span>
        <el-select :model-value="downloadMode" @update:model-value="value => updateConfig('downloadMode', value)">
          <el-option v-for="item in downloadModeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </div>

      <label class="spider-node-panel__item">
        <span>文件类型过滤</span>
        <el-input :model-value="fileTypes" @update:model-value="value => updateConfig('fileTypes', value)" />
      </label>

      <label class="spider-node-panel__item">
        <span>保存目录</span>
        <el-input :model-value="saveDirectory" @update:model-value="value => updateConfig('saveDirectory', value)" />
      </label>

      <label class="spider-node-panel__item">
        <span>AI 处理提示</span>
        <el-input :model-value="aiPrompt" type="textarea" :rows="4" @update:model-value="value => updateConfig('aiPrompt', value)" />
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
import { ElButton, ElInput, ElOption, ElSelect } from "element-plus";
import type { ScMFlowNodeMeta } from "@repo/components/ScMFlowEditor";
import SpiderAiAssistSection from "./SpiderAiAssistSection.vue";

defineOptions({ name: "SpiderDownloaderConfigPanel" });

const props = defineProps<{
  nodeMeta: ScMFlowNodeMeta;
  nodeTitle: string;
  nodeConfig: Record<string, any>;
  updateTitle: (value: string) => void;
  updateConfig: (field: string, value: unknown) => void;
  saveConfig: () => void;
  removeNode: () => void;
}>();

const downloadModeOptions = [
  { label: "普通下载", value: "NORMAL" },
  { label: "AI 辅助", value: "AI" },
];

const downloadMode = computed(() => String(props.nodeConfig.downloadMode || "NORMAL"));
const fileTypes = computed(() => String(props.nodeConfig.fileTypes || ""));
const saveDirectory = computed(() => String(props.nodeConfig.saveDirectory || ""));
const aiPrompt = computed(() => String(props.nodeConfig.aiPrompt || ""));
</script>

<style scoped lang="scss">
.spider-node-panel { display: grid; gap: 18px; }
.spider-node-panel__section { display: grid; gap: 12px; }
.spider-node-panel__section-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.spider-node-panel__section-head strong { color: var(--lay-text-primary); font-size: 14px; }
.spider-node-panel__section-head span { color: var(--lay-text-placeholder); font-size: 12px; }
.spider-node-panel__item { display: grid; gap: 8px; }
.spider-node-panel__item > span { color: var(--lay-text-secondary); font-size: 12px; }
.spider-node-panel__footer { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.spider-node-panel :deep(.el-input__wrapper),
.spider-node-panel :deep(.el-textarea__inner),
.spider-node-panel :deep(.el-select__wrapper) { border-radius: 12px; }
</style>
