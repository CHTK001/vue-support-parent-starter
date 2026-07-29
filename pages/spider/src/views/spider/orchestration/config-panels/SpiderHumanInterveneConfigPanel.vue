<template>
  <div class="spider-node-panel">
    <div class="spider-node-panel__section">
      <div class="spider-node-panel__section-head">
        <strong>人工干预</strong>
        <span>任务类型、提示文案与通知通道</span>
      </div>

      <label class="spider-node-panel__item">
        <span>节点标题</span>
        <el-input :model-value="nodeTitle" @update:model-value="updateTitle" />
      </label>

      <label class="spider-node-panel__item">
        <span>人工任务类型</span>
        <el-input :model-value="taskType" @update:model-value="value => updateConfig('taskType', value)" />
      </label>

      <label class="spider-node-panel__item">
        <span>人工提示文案</span>
        <el-input :model-value="taskPrompt" type="textarea" :rows="4" @update:model-value="value => updateConfig('taskPrompt', value)" />
      </label>

      <div class="spider-node-panel__item">
        <span>通知通道</span>
        <el-select :model-value="notifyChannel" @update:model-value="value => updateConfig('notifyChannel', value)">
          <el-option v-for="item in notifyChannelOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </div>

      <div class="spider-node-panel__section-head">
        <strong>人工填写字段</strong>
        <el-button type="primary" plain @click="addFormField">添加字段</el-button>
      </div>

      <div v-if="formFields.length" class="spider-node-panel__mapping-list">
        <article
          v-for="(item, index) in formFields"
          :key="index"
          class="spider-node-panel__mapping-card"
        >
          <label class="spider-node-panel__item">
            <span>字段键</span>
            <el-input :model-value="item.fieldKey" @update:model-value="value => updateFormField(index, 'fieldKey', value)" />
          </label>
          <label class="spider-node-panel__item">
            <span>显示名称</span>
            <el-input :model-value="item.label" @update:model-value="value => updateFormField(index, 'label', value)" />
          </label>
          <label class="spider-node-panel__item">
            <span>占位提示</span>
            <el-input :model-value="item.placeholder" @update:model-value="value => updateFormField(index, 'placeholder', value)" />
          </label>
          <label class="spider-node-panel__switch">
            <span>必填</span>
            <el-switch :model-value="Boolean(item.required)" @update:model-value="value => updateFormField(index, 'required', value)" />
          </label>
          <div class="spider-node-panel__mapping-actions">
            <el-button type="danger" plain @click="removeFormField(index)">删除</el-button>
          </div>
        </article>
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
import { ElButton, ElInput, ElOption, ElSelect, ElSwitch } from "element-plus";
import type { ScMFlowNodeMeta } from "@repo/components/ScFlowEditor";
defineOptions({ name: "SpiderHumanInterveneConfigPanel" });

const props = defineProps<{
  nodeMeta: ScMFlowNodeMeta;
  nodeTitle: string;
  nodeConfig: Record<string, any>;
  updateTitle: (value: string) => void;
  updateConfig: (field: string, value: unknown) => void;
  saveConfig: () => void;
  removeNode: () => void;
}>();

const notifyChannelOptions = [
  { label: "lay-task", value: "lay-task" },
  { label: "lay-message", value: "lay-message" },
  { label: "ScOverlayTask", value: "ScOverlayTask" },
];

const taskType = computed(() => String(props.nodeConfig.taskType || "CAPTCHA"));
const taskPrompt = computed(() => String(props.nodeConfig.taskPrompt || ""));
const notifyChannel = computed(() => String(props.nodeConfig.notifyChannel || "lay-task"));
const formFields = computed<any[]>(() =>
  Array.isArray(props.nodeConfig.formFields) ? props.nodeConfig.formFields : [],
);

function nextFields() {
  return formFields.value.map(item => ({ ...item }));
}

function addFormField() {
  const next = nextFields();
  next.push({
    fieldKey: "",
    label: "",
    component: "text",
    placeholder: "",
    required: true,
  });
  props.updateConfig("formFields", next);
}

function updateFormField(index: number, field: string, value: unknown) {
  const next = nextFields();
  next[index] = {
    ...next[index],
    [field]: value,
  };
  props.updateConfig("formFields", next);
}

function removeFormField(index: number) {
  const next = nextFields();
  next.splice(index, 1);
  props.updateConfig("formFields", next);
}
</script>

<style scoped lang="scss">
.spider-node-panel { display: grid; gap: 16px; }
.spider-node-panel__section { display: grid; gap: 10px; }
.spider-node-panel__section-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.spider-node-panel__section-head strong { color: var(--el-text-color-primary); font-size: 13px; font-weight: 700; }
.spider-node-panel__section-head span { color: var(--el-text-color-placeholder); font-size: 11px; }
.spider-node-panel__item { display: grid; gap: 6px; }
.spider-node-panel__item > span { color: var(--el-text-color-secondary); font-size: 12px; }
.spider-node-panel__switch { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.spider-node-panel__switch > span { color: var(--el-text-color-secondary); font-size: 12px; }
.spider-node-panel__footer { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.spider-node-panel__mapping-list { display: grid; gap: 10px; }
.spider-node-panel__mapping-card { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; padding: 12px; border: 1px solid color-mix(in srgb, var(--el-color-primary) 12%, var(--el-border-color)); border-radius: 8px; background: color-mix(in srgb, var(--el-bg-color) 92%, transparent); }
.spider-node-panel__mapping-actions { display: flex; justify-content: flex-end; grid-column: 1 / -1; }
.spider-node-panel :deep(.el-input__wrapper),
.spider-node-panel :deep(.el-textarea__inner),
.spider-node-panel :deep(.el-select__wrapper) { border-radius: 6px; }
@media (max-width: 720px) { .spider-node-panel__mapping-card { grid-template-columns: 1fr; } }
</style>
