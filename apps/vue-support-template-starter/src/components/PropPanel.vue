<template>
  <div class="prop-panel">
    <div class="prop-panel__header">
      <span class="prop-panel__title">参数面板</span>
      <el-tag type="info" effect="plain">{{ meta.name }}</el-tag>
    </div>
    <div class="prop-panel__body">
      <el-form label-position="top" >
        <el-form-item
          v-for="field in meta.props"
          :key="field.key"
          :label="field.label"
          :class="`prop-field prop-field--${field.type}`"
        >
          <template #label>
            <div class="prop-field-label">
              <span class="prop-field-name">{{ field.label }}</span>
              <el-tag v-if="field.type" type="info" effect="plain" round>{{ field.type }}</el-tag>
              <el-tooltip v-if="field.description" :content="field.description" placement="top">
                <el-icon class="prop-field-tip"><QuestionFilled /></el-icon>
              </el-tooltip>
            </div>
          </template>

          <!-- boolean -->
          <ReSwitch
            v-if="field.type === 'boolean'"
            layout="square"
            :title="field.label"
            :model-value="Boolean(state.values[field.key] ?? field.default)"
            @update:model-value="(val: boolean | string | number) => updateField(field.key, Boolean(val))"
          />

          <!-- string -->
          <el-input
            v-else-if="field.type === 'string'"
            :model-value="stringValue(state.values[field.key] ?? field.default)"
            :placeholder="field.description || '输入文字'"
            @update:model-value="(val: string) => updateField(field.key, val)"
          />

          <!-- number -->
          <el-input-number
            v-else-if="field.type === 'number'"
            :model-value="numberValue(state.values[field.key] ?? field.default)"
            :placeholder="field.description || '输入数字'"
            @update:model-value="(val: number) => updateField(field.key, val)"
          />

          <!-- json -->
          <el-input
            v-else-if="field.type === 'json'"
            :model-value="jsonValue(state.values[field.key] ?? field.default)"
            type="textarea"
            :rows="3"
            :placeholder="field.description || 'JSON 格式数据'"
            @update:model-value="(val: string) => updateJson(field.key, val)"
          />

          <!-- select：统一使用 ReSelect square 布局 -->
          <ReSelect
            v-else-if="field.type === 'select'"
            layout="square"
            :model-value="String(state.values[field.key] ?? field.default)"
            :options="selectOptions(field)"
            :size="16"
            @update:model-value="(val: any) => updateField(field.key, val)"
          />

          <!-- color -->
          <el-color-picker
            v-else-if="field.type === 'color'"
            :model-value="(state.values[field.key] as string) ?? (field.default as string)"
            @update:model-value="(val: string) => updateField(field.key, val)"
          />
        </el-form-item>

        <!-- v-model 控件 -->
        <el-form-item v-if="meta.modelable" label="v-model">
          <div class="prop-model-control">
            <el-input
              :model-value="String(state.model ?? '')"
              placeholder="绑定值"
              @update:model-value="(val: string) => updateModel(val)"
            />
            <el-button-group>
              <el-button :type="typeof state.model === 'boolean' ? 'primary' : 'default'" @click="setModelType('boolean')">布尔</el-button>
              <el-button :type="typeof state.model === 'string' ? 'primary' : 'default'" @click="setModelType('string')">字符串</el-button>
              <el-button :type="typeof state.model === 'number' ? 'primary' : 'default'" @click="setModelType('number')">数字</el-button>
            </el-button-group>
          </div>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropField, TemplateMeta, TemplateState } from "../templates";
import { QuestionFilled } from "@element-plus/icons-vue";

const props = defineProps<{
  meta: TemplateMeta;
  state: TemplateState;
}>();

const emit = defineEmits<{
  (e: "update", state: TemplateState): void;
}>();

const stringValue = (v: unknown) => (v === undefined || v === null ? "" : String(v));
const numberValue = (v: unknown) => (typeof v === "number" ? v : 0);

/** 将模板选项转换为 ReSelect 选项（保留图标，无图标时由布局自身 fallback 显示首字符） */
const selectOptions = (field: PropField) =>
  (field.options ?? []).map((opt) => ({
    label: opt.label,
    value: opt.value,
    icon: opt.icon,
  }));
const jsonValue = (v: unknown) => {
  if (v === undefined || v === null || v === "") return "";
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
};

const updateField = (key: string, val: unknown) => {
  const values = { ...props.state.values, [key]: val };
  // 联动：当被监听字段变化时，自动填充关联字段的预设值（仅当目标字段未自定义时）
  for (const field of props.meta.props) {
    if (!field.defaultBy || field.defaultBy.watch !== key) continue;
    const preset = field.defaultBy.presets[String(val)];
    if (preset !== undefined && isDefaultValue(field, values[field.key])) {
      values[field.key] = preset;
    }
  }
  emit("update", {
    ...props.state,
    values,
  });
};

/** 判断值是否为字段默认值 */
function isDefaultValue(field: PropField, value: unknown): boolean {
  if (value === undefined) return true;
  if (field.default === undefined) return value === undefined;
  if (typeof value === "object") return JSON.stringify(value) === JSON.stringify(field.default);
  return value === field.default;
}

const updateJson = (key: string, val: string | number) => {
  const text = String(val ?? "");
  if (!text.trim()) {
    updateField(key, undefined);
    return;
  }
  try {
    updateField(key, JSON.parse(text));
  } catch {
    // 解析失败保留原值
  }
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
  /* 原 10px，取最近档 lg(12px)：参数面板属卡片层 */
  border-radius: var(--el-radius-lg, 12px);
  overflow: hidden;
}

.prop-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 600;
  /* 原 #eaf3ff→#d9eaff 与 primary-light-9/8 基本同色，改走语义浅色档 */
  background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-color-primary-light-8) 100%);
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
}

.prop-panel__title {
  color: var(--el-text-color-primary);
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
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color);
  padding: 1px 6px;
  border-radius: var(--el-radius-xs, 4px);
  font-family: monospace;
}

.prop-field-tip {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  cursor: help;
  &:hover {
    color: var(--el-color-primary);
  }
}

.prop-select {
  width: 100%;
}

.prop-model-control {
  display: flex;
  gap: 8px;
  width: 100%;
  :deep(.el-input) {
    flex: 1;
  }
}

.prop-pill-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.prop-pill__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  font-size: 14px;
  font-weight: 700;
  /* 这两个是 Element Plus 核心令牌，必然有值，var() 里的 hex 兜底属死代码，去掉 */
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-radius: var(--el-radius-md, 8px);
  text-transform: uppercase;
}

/* 尊重系统「减少动态效果」偏好：本组件样式未声明 transition / animation
   （动效都在 el-form / el-input / ReSwitch 内部），这里做显式归零兜底。 */
@media (prefers-reduced-motion: reduce) {
  .prop-panel,
  .prop-panel__header,
  .prop-panel__body {
    transition: none;
    animation: none;
  }
}
</style>