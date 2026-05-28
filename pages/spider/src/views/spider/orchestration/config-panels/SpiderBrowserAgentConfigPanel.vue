<template>
  <div class="spider-node-panel">
    <div class="spider-node-panel__section">
      <div class="spider-node-panel__section-head">
        <strong>AI 浏览器代理</strong>
        <span>AI 自主操作浏览器，支持 navigate / click / fill / extract，遇登录/验证码交人工</span>
      </div>
      <label class="spider-node-panel__item">
        <span>节点标题</span>
        <el-input :model-value="nodeTitle" @update:model-value="updateTitle" />
      </label>
      <label class="spider-node-panel__item">
        <span>入口 URL（可选）</span>
        <el-input :model-value="entryUrl" @update:model-value="value => updateConfig('entryUrl', value)" />
      </label>
    </div>

    <div class="spider-node-panel__section">
      <div class="spider-node-panel__section-head">
        <strong>AI 目标</strong>
        <span>告诉 AI 需要完成什么任务</span>
      </div>
      <label class="spider-node-panel__item">
        <span>目标描述</span>
        <el-input
          :model-value="goal"
          type="textarea"
          :rows="5"
          placeholder="例如：打开 Gitee Explore 页面，采集 trending 项目名称和描述"
          @update:model-value="value => updateConfig('goal', value)"
        />
      </label>
    </div>

    <div class="spider-node-panel__section">
      <div class="spider-node-panel__section-head">
        <strong>执行参数</strong>
        <span>控制 AI 代理的行为上限</span>
      </div>
      <label class="spider-node-panel__item">
        <span>最大步数</span>
        <el-input-number
          :model-value="maxSteps"
          :min="1"
          :max="100"
          @update:model-value="value => updateConfig('maxSteps', Number(value || 10))"
        />
        <span class="spider-node-panel__hint">AI 自动执行的最大操作步数，建议 10~30 步</span>
      </label>
      <label class="spider-node-panel__item">
        <span>回落策略</span>
        <el-select :model-value="fallbackStrategy" @update:model-value="value => updateConfig('fallbackStrategy', value)">
          <el-option label="自动处理，处理不了交人工" value="AUTO_THEN_HUMAN" />
          <el-option label="直接交人工处理" value="HUMAN_ONLY" />
        </el-select>
        <span class="spider-node-panel__hint">遇到验证码/登录等场景时的处理方式</span>
      </label>
    </div>

    <div class="spider-node-panel__section">
      <div class="spider-node-panel__section-head">
        <strong>结果保存（可选）</strong>
        <span>配置后将直接保存提取结果，无需后续 SAVE_RESULT 节点</span>
      </div>
      <label class="spider-node-panel__item">
        <span>结果结构编码</span>
        <el-input
          :model-value="schemaCode"
          placeholder="留空则不自动保存"
          @update:model-value="value => updateConfig('schemaCode', value)"
        />
      </label>
    </div>

    <div class="spider-node-panel__footer">
      <button type="button" class="spider-node-panel__danger" @click="removeNode">删除节点</button>
      <button type="button" class="spider-node-panel__primary" @click="saveConfig">保存配置</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ElInput, ElInputNumber, ElOption, ElSelect } from "element-plus";
import type { ScMFlowNodeMeta } from "@repo/components/ScFlowEditor";

defineOptions({ name: "SpiderBrowserAgentConfigPanel" });

const props = defineProps<{
  nodeMeta: ScMFlowNodeMeta;
  nodeTitle: string;
  nodeConfig: Record<string, any>;
  updateTitle: (value: string) => void;
  updateConfig: (field: string, value: unknown) => void;
  saveConfig: () => void;
  removeNode: () => void;
}>();

const entryUrl = computed(() => String(props.nodeConfig.entryUrl || ""));
const goal = computed(() => String(props.nodeConfig.goal || ""));
const maxSteps = computed(() => Number(props.nodeConfig.maxSteps || 15));
const fallbackStrategy = computed(() => String(props.nodeConfig.fallbackStrategy || "AUTO_THEN_HUMAN"));
const schemaCode = computed(() => String(props.nodeConfig.schemaCode || ""));
</script>

<style scoped lang="scss">
.spider-node-panel__item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
}
.spider-node-panel__item > span:first-child {
  font-size: 12px;
  font-weight: 600;
  color: var(--lay-text-secondary, #6b7280);
  padding-left: 2px;
}
.spider-node-panel__hint {
  font-size: 11px;
  color: var(--lay-text-placeholder, #9ca3af);
  margin-top: 2px;
}
.spider-node-panel__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--lay-border, #e5e7eb);
}
.spider-node-panel__danger {
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid #fca5a5;
  background: transparent;
  color: #dc2626;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.spider-node-panel__primary {
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  background: var(--lay-accent, #6366f1);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
</style>
