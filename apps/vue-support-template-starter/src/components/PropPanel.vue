<template>
  <div class="prop-panel">
    <div class="prop-panel__header">
      <span class="prop-panel__title">参数面板</span>
      <el-tag type="info" effect="plain">{{ meta.name }}</el-tag>
    </div>
    <div class="prop-panel__body">
      <el-form label-position="top" >
        <!-- 常用字段 -->
        <el-form-item
          v-for="field in normalFields"
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

          <PropFieldControl
            :field="field"
            :value="state.values[field.key]"
            @change="(val: unknown) => updateField(field.key, val)"
            @json="(text: string) => updateJson(field.key, text)"
            @dataset="(label: string) => applyDataset(field, label)"
          />
        </el-form-item>

        <!-- 高级参数：默认折叠，展开才显示（如关系图的 nodes / edges 原始 JSON） -->
        <el-collapse v-if="advancedFields.length" v-model="advancedOpen" class="prop-advanced">
          <el-collapse-item name="advanced">
            <template #title>
              <span class="prop-advanced__title">
                高级参数
                <el-tag type="info" effect="plain" round size="small">{{ advancedFields.length }}</el-tag>
              </span>
            </template>
            <el-form-item
              v-for="field in advancedFields"
              :key="field.key"
              :label="field.label"
              :class="`prop-field prop-field--${field.type}`"
            >
              <template #label>
                <div class="prop-field-label">
                  <span class="prop-field-name">{{ field.label }}</span>
                  <el-tooltip v-if="field.description" :content="field.description" placement="top">
                    <el-icon class="prop-field-tip"><QuestionFilled /></el-icon>
                  </el-tooltip>
                </div>
              </template>

              <PropFieldControl
                :field="field"
                :value="state.values[field.key]"
                @change="(val: unknown) => updateField(field.key, val)"
                @json="(text: string) => updateJson(field.key, text)"
                @dataset="(label: string) => applyDataset(field, label)"
              />
            </el-form-item>
          </el-collapse-item>
        </el-collapse>

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
import { computed, ref } from "vue";
import type { PropField, TemplateMeta, TemplateState } from "../templates";
import { QuestionFilled } from "@element-plus/icons-vue";
import PropFieldControl from "./PropFieldControl.vue";

const props = defineProps<{
  meta: TemplateMeta;
  state: TemplateState;
}>();

const emit = defineEmits<{
  (e: "update", state: TemplateState): void;
}>();

/**
 * 字段分两段渲染：
 *   - 常用字段：直接铺在面板上
 *   - 高级字段（field.advanced）：折进「高级参数」，默认收起
 *
 * <p>典型用法是关系图的 nodes / edges —— 平时用分段控件选示例数据就够了，
 * 只有要试自定义结构时才展开手改 JSON。折叠起来能让面板一屏放得下。</p>
 */
const normalFields = computed(() => props.meta.props.filter((f) => !f.advanced));
const advancedFields = computed(() => props.meta.props.filter((f) => f.advanced));

/** 高级参数折叠状态：默认收起 */
const advancedOpen = ref<string[]>([]);

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

/* ==================== dataset（分段切换示例数据） ==================== */

/** 分段按钮文案 */
const datasetLabels = (field: PropField) => (field.datasets ?? []).map((d) => d.label);

/**
 * 应用数据集：把该档声明的多个字段一次性写入参数状态。
 *
 * <p>多个 key 必须<b>一次 emit</b>，不能逐个 updateField —— 逐个发会让中间态
 * （比如节点已换、边还是旧的）被渲染一帧，图上会出现引用了不存在节点的边。</p>
 *
 * @param field dataset 类型字段
 * @param label 选中的档位 label
 */
const applyDataset = (field: PropField, label: string) => {
  const target = (field.datasets ?? []).find((d) => d.label === label);
  if (!target) return;
  emit("update", {
    ...props.state,
    values: {
      ...props.state.values,
      // 档位 label 也要落库：分段控件靠它回显当前选中项
      [field.key]: label,
      ...target.values,
    },
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

/* ---------- 高级参数折叠区 ---------- */
.prop-advanced {
  margin-top: 4px;
  border-top: 1px dashed var(--el-border-color-lighter);
  border-bottom: none;
}

.prop-advanced :deep(.el-collapse-item__header) {
  height: 38px;
  padding-left: 2px;
  border-bottom: none;
  background: transparent;
}

.prop-advanced :deep(.el-collapse-item__wrap) {
  border-bottom: none;
  background: transparent;
}

.prop-advanced :deep(.el-collapse-item__content) {
  padding-bottom: 8px;
}

.prop-advanced__title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
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