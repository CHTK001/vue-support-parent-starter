<template>
  <div class="prop-panel">
    <div class="prop-panel__header">
      <span class="prop-panel__title">参数面板</span>
      <el-tag size="small" type="info" effect="plain">{{ meta.props.length }} 个参数</el-tag>
    </div>

    <div class="prop-panel__body">
      <el-form label-position="top" size="default">
        <el-form-item
          v-for="field in meta.props"
          :key="field.key"
        >
          <template #label>
            <div class="prop-field-label">
              <span class="prop-field-name">{{ field.label }}</span>
              <code class="prop-field-key">{{ field.key }}</code>
              <el-tag size="small" effect="plain" round>{{ field.type }}</el-tag>
            </div>
          </template>

          <el-input
            v-if="field.type === 'string'"
            :model-value="stringValue(state.values[field.key])"
            :placeholder="field.description ?? '请输入'"
            clearable
            @update:model-value="(val: string | number) => updateField(field.key, val)"
          />

          <el-input-number
            v-else-if="field.type === 'number'"
            :model-value="numberValue(state.values[field.key])"
            :min="field.min"
            :max="field.max"
            :step="field.step ?? 1"
            :placeholder="field.description"
            controls-position="right"
            class="prop-number"
            @update:model-value="(val: number | undefined) => updateField(field.key, val ?? 0)"
          />

          <el-switch
            v-else-if="field.type === 'boolean'"
            :model-value="Boolean(state.values[field.key])"
            @update:model-value="(val: string | number | boolean) => updateField(field.key, val)"
          />

          <el-select
            v-else-if="field.type === 'select'"
            :model-value="state.values[field.key] as string | number | undefined"
            :placeholder="field.description ?? '请选择'"
            class="prop-select"
            @update:model-value="(val: string | number | boolean) => updateField(field.key, val)"
          >
            <el-option
              v-for="opt in field.options"
              :key="String(opt.value)"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>

<el-input
              v-else-if="field.type === 'json'"
              :model-value="jsonValue(state.values[field.key])"
              type="textarea"
              :rows="3"
              placeholder="合法 JSON"
              @update:model-value="(val: string | number) => updateJson(field.key, val)"
            />

          <div v-if="field.description && field.type !== 'json'" class="prop-field-tip">
            {{ field.description }}
          </div>
        </el-form-item>

        <!-- v-model 控件（仅当组件支持） -->
        <el-form-item v-if="meta.modelable">
          <template #label>
            <div class="prop-field-label">
              <span class="prop-field-name">v-model 绑定值</span>
              <code class="prop-field-key">v-model</code>
              <el-tag size="small" type="warning" effect="plain" round>model</el-tag>
            </div>
          </template>
          <div class="prop-model">
            <el-input
              :model-value="String(state.model)"
              placeholder="v-model 当前值"
              @update:model-value="(val: string | number) => updateModel(val)"
            />
            <el-button-group>
              <el-button :type="typeof state.model === 'boolean' ? 'primary' : 'default'" @click="setModelType('boolean')">布尔</el-button>
              <el-button :type="typeof state.model === 'string' ? 'primary' : 'default'" @click="setModelType('string')">字符串</el-button>
              <el-button :type="typeof state.model === 'number' ? 'primary' : 'default'" @click="setModelType('number')">数字</el-button>
            </el-button-group>
          </div>
        </el-form-item>

        <!-- 插槽编辑 -->
        <template v-if="meta.slots?.length">
          <el-form-item v-for="slot in meta.slots" :key="slot.name">
            <template #label>
              <div class="prop-field-label">
                <span class="prop-field-name">{{ slot.label }}</span>
                <code v-if="slot.name !== 'default'" class="prop-field-key">#{{ slot.name }}</code>
                <code v-else class="prop-field-key">default</code>
                <el-tag size="small" type="success" effect="plain" round>slot</el-tag>
              </div>
            </template>
            <el-input
              :model-value="state.slots[slot.name]"
              type="textarea"
              :rows="2"
              :placeholder="`插槽 ${slot.name} 的文本内容`"
              @update:model-value="(val: string | number) => updateSlot(slot.name, val)"
            />
          </el-form-item>
        </template>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropField, TemplateMeta, TemplateState } from "../templates";

const props = defineProps<{
  meta: TemplateMeta;
  state: TemplateState;
}>();

const emit = defineEmits<{
  (e: "update", state: TemplateState): void;
}>();

const stringValue = (v: unknown) => (v === undefined || v === null ? "" : String(v));
const numberValue = (v: unknown) => (typeof v === "number" ? v : 0);
const jsonValue = (v: unknown) => {
  if (v === undefined || v === null || v === "") return "";
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
};

const updateField = (key: string, val: unknown) => {
  emit("update", {
    ...props.state,
    values: { ...props.state.values, [key]: val },
  });
};

const updateJson = (key: string, val: string | number) => {
  const text = String(val ?? "");
  if (!text.trim()) {
    updateField(key, undefined);
    return;
  }
  try {
    updateField(key, JSON.parse(text));
  } catch {
    // 解析失败保留原值，等待用户修正
  }
};

const updateSlot = (name: string, val: string | number) => {
  emit("update", {
    ...props.state,
    slots: { ...props.state.slots, [name]: String(val ?? "") },
  });
};

const updateModel = (val: string | number) => {
  let typed: boolean | string | number = val;
  if (typeof props.state.model === "number") {
    const n = Number(val);
    typed = Number.isFinite(n) ? n : props.state.model;
  }
  emit("update", { ...props.state, model: typed });
};

const setModelType = (type: "boolean" | "string" | "number") => {
  let next: boolean | string | number;
  if (type === "boolean") next = true;
  else if (type === "number") next = 0;
  else next = "";
  emit("update", { ...props.state, model: next });
};
</script>

<style lang="scss" scoped>
.prop-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  overflow: hidden;
}

.prop-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 600;
  background: linear-gradient(135deg, #eaf3ff 0%, #d9eaff 100%);
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
}

.prop-panel__title {
  color: #1f2329;
}

.prop-panel__body {
  flex: 1;
  min-height: 0;
  padding: 16px;
  overflow-y: auto;
}

.prop-field-label {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  margin-bottom: 6px;
}

.prop-field-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.prop-field-key {
  font-size: 11px;
  padding: 1px 5px;
  color: #5b8fd9;
  background: rgba(64, 158, 255, 0.08);
  border-radius: 4px;
}

.prop-field-tip {
  margin-top: 4px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}

.prop-number,
.prop-select {
  width: 100%;
}

.prop-model {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;

  :deep(.el-input) {
    flex: 1;
    min-width: 120px;
  }
}
</style>