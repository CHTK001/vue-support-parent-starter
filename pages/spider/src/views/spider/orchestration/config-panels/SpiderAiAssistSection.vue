<template>
  <div class="spider-ai-section">
    <div class="spider-ai-section__head">
      <strong>AI 介入</strong>
      <span>系统提示、目标和辅助说明</span>
    </div>

    <label class="spider-ai-section__switch">
      <span>启用 AI</span>
      <el-switch :model-value="Boolean(nodeConfig.aiEnabled)" @update:model-value="value => updateConfig('aiEnabled', value)" />
    </label>

    <label class="spider-ai-section__item">
      <span>AI 目标</span>
      <el-input
        :model-value="String(nodeConfig.aiGoal || '')"
        type="textarea"
        :rows="3"
        @update:model-value="value => updateConfig('aiGoal', value)"
      />
    </label>

    <label class="spider-ai-section__item">
      <span>系统提示词</span>
      <el-input
        :model-value="String(nodeConfig.aiSystemPrompt || '')"
        type="textarea"
        :rows="3"
        @update:model-value="value => updateConfig('aiSystemPrompt', value)"
      />
    </label>

    <label class="spider-ai-section__item">
      <span>用户提示词</span>
      <el-input
        :model-value="String(nodeConfig.aiUserPrompt || '')"
        type="textarea"
        :rows="3"
        @update:model-value="value => updateConfig('aiUserPrompt', value)"
      />
    </label>
  </div>
</template>

<script setup lang="ts">
import { ElInput, ElSwitch } from "element-plus";

defineOptions({ name: "SpiderAiAssistSection" });

defineProps<{
  nodeConfig: Record<string, any>;
  updateConfig: (field: string, value: unknown) => void;
}>();
</script>

<style scoped lang="scss">
.spider-ai-section {
  display: grid;
  gap: 12px;
}

.spider-ai-section__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.spider-ai-section__head strong {
  color: var(--lay-text-primary);
  font-size: 14px;
}

.spider-ai-section__head span {
  color: var(--lay-text-placeholder);
  font-size: 12px;
}

.spider-ai-section__item {
  display: grid;
  gap: 8px;
}

.spider-ai-section__item > span,
.spider-ai-section__switch > span {
  color: var(--lay-text-secondary);
  font-size: 12px;
}

.spider-ai-section :deep(.el-textarea__inner),
.spider-ai-section :deep(.el-input__wrapper) {
  border-radius: 12px;
}

.spider-ai-section__switch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
</style>
