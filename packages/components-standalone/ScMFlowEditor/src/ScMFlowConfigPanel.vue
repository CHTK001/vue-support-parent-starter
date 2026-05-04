<template>
  <el-drawer
    v-if="nodeMeta"
    :model-value="visible"
    size="520px"
    destroy-on-close
    @close="$emit('close')"
  >
    <template #header>
      <div class="sc-mflow-drawer__header">
        <div class="sc-mflow-drawer__titles">
          <span class="sc-mflow-drawer__eyebrow">{{ nodeMeta.kind }}</span>
          <strong>{{ nodeTitle || nodeMeta.title }}</strong>
        </div>
        <button type="button" class="sc-mflow-drawer__close" @click="$emit('close')">
          <IconifyIconOnline icon="ri:close-line" />
        </button>
      </div>
    </template>

    <div class="sc-mflow-drawer__body thin-scroller">
      <slot
        name="config-panel"
        :node-meta="nodeMeta"
        :node-title="nodeTitle"
        :node-config="nodeConfig"
        :schema="schema"
        :update-title="updateTitle"
        :update-config="updateConfig"
        :save-config="saveConfig"
        :remove-node="removeNode"
      >
        <div class="sc-mflow-drawer__meta">
          <span>{{ nodeMeta.kind }}</span>
          <strong>{{ nodeMeta.title }}</strong>
        </div>

        <div class="sc-mflow-drawer__form">
          <label class="sc-mflow-drawer__item">
            <span>节点标题</span>
            <input :value="nodeTitle" type="text" @input="updateTitle(($event.target as HTMLInputElement).value)" />
          </label>

          <label
            v-for="field in schema"
            :key="field.field"
            class="sc-mflow-drawer__item"
          >
            <span>{{ field.label }}</span>
            <input
              v-if="field.component === 'input'"
              :value="stringValue(nodeConfig[field.field])"
              type="text"
              @input="updateConfig(field.field, ($event.target as HTMLInputElement).value)"
            />
            <textarea
              v-else-if="field.component === 'textarea'"
              :value="stringValue(nodeConfig[field.field])"
              rows="4"
              @input="updateConfig(field.field, ($event.target as HTMLTextAreaElement).value)"
            />
            <select
              v-else-if="field.component === 'select'"
              :value="nodeConfig[field.field] as any"
              @change="updateConfig(field.field, ($event.target as HTMLSelectElement).value)"
            >
              <option
                v-for="option in field.options || []"
                :key="String(option.value)"
                :value="String(option.value)"
              >
                {{ option.label }}
              </option>
            </select>
            <input
              v-else-if="field.component === 'number'"
              :value="numberValue(nodeConfig[field.field])"
              type="number"
              @input="updateConfig(field.field, Number(($event.target as HTMLInputElement).value || 0))"
            />
            <label v-else class="sc-mflow-drawer__switch">
              <input
                :checked="Boolean(nodeConfig[field.field])"
                type="checkbox"
                @change="updateConfig(field.field, ($event.target as HTMLInputElement).checked)"
              />
              <em>{{ nodeConfig[field.field] ? "开启" : "关闭" }}</em>
            </label>
          </label>
        </div>

        <div class="sc-mflow-drawer__actions">
          <button type="button" class="is-secondary" @click="removeNode">删除节点</button>
          <button type="button" class="is-primary" @click="saveConfig">保存配置</button>
        </div>
      </slot>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { ElDrawer } from "element-plus";
import { IconifyIconOnline } from "../../ReIcon";
import type { ScMFlowFieldSchema, ScMFlowNodeMeta } from "../types";

defineOptions({ name: "ScMFlowConfigPanel" });

defineProps<{
  visible: boolean;
  nodeMeta: ScMFlowNodeMeta | null;
  nodeTitle: string;
  nodeConfig: Record<string, any>;
  schema: ScMFlowFieldSchema[];
  updateTitle: (value: string) => void;
  updateConfig: (field: string, value: unknown) => void;
  saveConfig: () => void;
  removeNode: () => void;
}>();

defineEmits<{
  close: [];
}>();

const stringValue = (value: unknown) => typeof value === "string" ? value : value == null ? "" : String(value);
const numberValue = (value: unknown) => typeof value === "number" ? value : Number(value || 0);
</script>

<style scoped lang="scss">
.sc-mflow-drawer__header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}

.sc-mflow-drawer__titles {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.sc-mflow-drawer__titles strong {
  color: var(--lay-text-primary);
  font-size: 16px;
  line-height: 1.25;
}

.sc-mflow-drawer__eyebrow,
.sc-mflow-drawer__meta span {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--lay-accent);
}

.sc-mflow-drawer__close {
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 10px;
  border: 1px solid var(--lay-border);
  background: color-mix(in srgb, var(--lay-bg) 92%, transparent);
  color: var(--lay-text-secondary);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sc-mflow-drawer__body {
  overflow: auto;
  display: grid;
  gap: 18px;
}

.sc-mflow-drawer__body :deep(.el-drawer__body) {
  padding: 20px;
}

.sc-mflow-drawer__meta {
  display: grid;
  gap: 4px;
}

.sc-mflow-drawer__meta strong {
  color: var(--lay-text-primary);
}

.sc-mflow-drawer__form {
  display: grid;
  gap: 14px;
}

.sc-mflow-drawer__item {
  display: grid;
  gap: 8px;
}

.sc-mflow-drawer__item > span {
  font-size: 12px;
  color: var(--lay-text-secondary);
}

.sc-mflow-drawer__item input,
.sc-mflow-drawer__item textarea,
.sc-mflow-drawer__item select {
  width: 100%;
  padding: 11px 12px;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--lay-border) 86%, transparent);
  background: color-mix(in srgb, var(--lay-bg) 94%, transparent);
  color: var(--lay-text-primary);
  outline: none;
  transition: border-color .16s ease, box-shadow .16s ease, background .16s ease;
}

.sc-mflow-drawer__item input:focus,
.sc-mflow-drawer__item textarea:focus,
.sc-mflow-drawer__item select:focus {
  border-color: color-mix(in srgb, var(--lay-accent) 36%, transparent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--lay-accent) 12%, transparent);
  background: color-mix(in srgb, var(--lay-bg) 98%, transparent);
}

.sc-mflow-drawer__switch {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sc-mflow-drawer__actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding-top: 8px;
}

.sc-mflow-drawer__actions button {
  height: 38px;
  padding: 0 12px;
  border-radius: 12px;
  border: 1px solid var(--lay-border);
  background: color-mix(in srgb, var(--lay-bg) 92%, transparent);
  color: var(--lay-text-primary);
  cursor: pointer;
  font-size: 13px;
}

.sc-mflow-drawer__actions button.is-secondary {
  color: var(--lay-text-secondary);
}

.sc-mflow-drawer__actions button.is-primary {
  border-color: color-mix(in srgb, var(--lay-accent) 24%, var(--lay-border));
  background: color-mix(in srgb, var(--lay-accent) 12%, transparent);
}
</style>
