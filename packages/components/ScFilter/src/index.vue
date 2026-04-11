<template>
  <div class="sc-filter">
    <div class="sc-filter__shell">
      <div class="sc-filter__fields">
        <div
          v-for="field in normalizedFields"
          :key="field.prop"
          class="sc-filter__field"
          :style="resolveFieldStyle(field)"
          :class="{
            'sc-filter__field--form': isFormMode(field),
            'sc-filter__field--pure': !isFormMode(field)
          }"
        >
          <!-- 表单模式显示标签 -->
          <label 
            v-if="isFormMode(field) && field.label" 
            class="sc-filter__field-label"
          >
            {{ field.label }}
            <span v-if="field.required" class="sc-filter__field-required">*</span>
          </label>
          
          <!-- 组件容器 -->
          <div class="sc-filter__field-content">
            <ScInput
              v-if="field.type === 'input'"
              :model-value="fieldValue(field.prop)"
              :placeholder="field.placeholder"
              clearable
              v-bind="field.props"
              @update:model-value="(value) => updateField(field.prop, value)"
              @keyup.enter="handleSearch"
            />
            <ScSelect
              v-else-if="field.type === 'select'"
              :model-value="fieldValue(field.prop)"
              :placeholder="field.placeholder"
              clearable
              layout="list"
              :multiple="Boolean(field.multiple)"
              v-bind="field.props"
              @update:model-value="(value) => updateField(field.prop, value)"
            >
              <!-- 下拉框默认无数据，仅当配置了options时才渲染 -->
              <ScOption
                v-for="option in field.options"
                :key="`${field.prop}-${option.value}`"
                :label="option.label"
                :value="option.value"
                :disabled="option.disabled"
              />
            </ScSelect>
            <ScDatePicker
              v-else-if="field.type === 'date'"
              :model-value="fieldValue(field.prop)"
              type="date"
              :placeholder="field.placeholder"
              v-bind="field.props"
              @update:model-value="(value) => updateField(field.prop, value)"
            />
            <ScDatePicker
              v-else-if="field.type === 'daterange'"
              :model-value="fieldValue(field.prop)"
              type="daterange"
              range-separator="至"
              :start-placeholder="field.startPlaceholder || '开始日期'"
              :end-placeholder="field.endPlaceholder || '结束日期'"
              v-bind="field.props"
              @update:model-value="(value) => updateField(field.prop, value)"
            />
            <ScDatePicker
              v-else-if="field.type === 'datetimerange'"
              :model-value="fieldValue(field.prop)"
              type="datetimerange"
              range-separator="至"
              :start-placeholder="field.startPlaceholder || '开始时间'"
              :end-placeholder="field.endPlaceholder || '结束时间'"
              v-bind="field.props"
              @update:model-value="(value) => updateField(field.prop, value)"
            />
            <ScSwitch
              v-else-if="field.type === 'switch'"
              :model-value="fieldValue(field.prop)"
              v-bind="field.props"
              @update:model-value="(value) => updateField(field.prop, value)"
            />
            <slot
              v-else-if="field.slot"
              :name="field.slot"
              :field="field"
              :value="fieldValue(field.prop)"
              :update="(value) => updateField(field.prop, value)"
            />
            <ScInput
              v-else
              :model-value="fieldValue(field.prop)"
              :placeholder="field.placeholder"
              clearable
              v-bind="field.props"
              @update:model-value="(value) =>  updateField(field.prop, value)"
              @keyup.enter="handleSearch"
            />
          </div>
        </div>
      </div>
      <div class="sc-filter__actions">
        <!-- 自定义按钮插槽：完全替换默认按钮 -->
        <slot 
          name="actions" 
          :values="currentValues"
          :search="handleSearch"
          :reset="handleReset"
        >
          <!-- 只有 showDefaultActions = true 才显示默认按钮 -->
          <template v-if="showDefaultActions">
            <ScButton
              type="primary"
              class="sc-filter__action"
              :loading="loading"
              @click="handleSearch"
              :icon-only="buttonIconOnly"
            >
              <IconifyIconOnline icon="ri:search-line" />
              <span v-if="!buttonIconOnly">{{ searchText }}</span>
            </ScButton>
            <ScButton
              class="sc-filter__action sc-filter__action--ghost"
              @click="handleReset"
              :icon-only="buttonIconOnly"
            >
              <IconifyIconOnline icon="ri:refresh-line" />
              <span v-if="!buttonIconOnly">{{ resetText }}</span>
            </ScButton>
          </template>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";

type FilterOption = {
  label: string;
  value: string | number | boolean | null;
  disabled?: boolean
};

type FilterField = {
  prop?: string;
  value?: string;
  label?: string;
  type?: string;
  placeholder?: string;
  width?: string | number;
  multiple?: boolean;
  options?: FilterOption[];
  props?: Record<string, unknown>;
  slot?: string;
  startPlaceholder?: string;
  endPlaceholder?: string;
  defaultValue?: unknown;
  extend?: {
    data?: FilterOption[];
    multiple?: boolean;
  };
  mode?: 'form' | 'pure';
  required?: boolean;
};

const props = withDefaults(
  defineProps<{
    modelValue?: Record<string, any>;
    fields?: FilterField[];
    loading?: boolean;
    searchText?: string;
    resetText?: string;
    showDefaultActions?: boolean; // 控制默认按钮显示/隐藏
    mode?: 'form' | 'pure';
    buttonIconOnly?: boolean;
    baseFieldWidth?: string | number;
  }>(),
  {
    modelValue: () => ({}),
    fields: () => [],
    loading: false,
    searchText: "查询",
    resetText: "重置",
    showDefaultActions: true, // 默认显示原有按钮
    mode: 'form',
    buttonIconOnly: true,
    baseFieldWidth: 200
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: Record<string, any>): void;
  (e: "search", value: Record<string, any>): void;
  (e: "reset", value: Record<string, any>): void;
  (e: "change", value: Record<string, any>, prop: string): void;
}>();

const isFormMode = (field: FilterField) => {
  return field.mode ?? props.mode === 'form';
};

const normalizedFields = computed(() => {
  return (props.fields || [])
    .map((field) => {
      const prop = field.prop || field.value || "";
      const normalizedType =
        field.type === "text" ? "input" : field.type || "input";
      const options = field.options || field.extend?.data || [];
      const multiple = field.multiple ?? field.extend?.multiple ?? false;

      return {
        ...field,
        prop,
        type: normalizedType,
        options,
        multiple,
        placeholder:
          field.placeholder ||
          (normalizedType === "select"
            ? `请选择${field.label || ""}`
            : `请输入${field.label || ""}`),
      };
    })
    .filter((field) => Boolean(field.prop));
});

const currentValues = computed(() => {
  return props.modelValue || {};
});

const cloneValues = (source: Record<string, any>) => {
  return Object.entries(source || {}).reduce<Record<string, any>>(
    (result, [key, value]) => {
      result[key] = Array.isArray(value) ? [...value] : value;
      return result;
    },
    {},
  );
};

const fieldValue = (prop: string) => {
  return currentValues.value?.[prop];
};

const updateField = (prop: string, value: unknown) => {
  const nextValues = {
    ...cloneValues(currentValues.value),
    [prop]: value,
  };
  emit("update:modelValue", nextValues);
  emit("change", nextValues, prop);
};

const resolveResetValue = (
  field: FilterField & { prop: string; type: string; multiple?: boolean },
) => {
  if (field.defaultValue !== undefined) {
    return field.defaultValue;
  }

  if (
    field.multiple ||
    field.type === "daterange" ||
    field.type === "datetimerange"
  ) {
    return [];
  }

  if (field.type === "switch") {
    return false;
  }

  return "";
};

const handleSearch = () => {
  emit("search", cloneValues(currentValues.value));
};

const handleReset = () => {
  const resetValues = normalizedFields.value.reduce<Record<string, any>>(
    (result, field) => {
      result[field.prop] = resolveResetValue(
        field as FilterField & {
          prop: string;
          type: string;
          multiple?: boolean;
        },
      );
      return result;
    },
    {},
  );

  emit("update:modelValue", resetValues);
  emit("reset", resetValues);
};

const resolveFieldStyle = (
  field: FilterField & { width?: string | number },
) => {
  const finalWidth = field.width || props.baseFieldWidth;
  
  if (!finalWidth) {
    return undefined;
  }

  return {
    "--sc-filter-field-width":
      typeof finalWidth === "number" ? `${finalWidth}px` : finalWidth,
    "--sc-filter-content-width": 
      typeof finalWidth === "number" ? `${finalWidth - (isFormMode(field) ? 80 : 0)}px` : 
        (isFormMode(field) ? `calc(${finalWidth} - 80px)` : finalWidth)
  };
};
</script>

<style scoped lang="scss">
.sc-filter {
  width: 100%;
  box-sizing: border-box;
}

.sc-filter__shell {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  flex-wrap: wrap;
  box-sizing: border-box;
  padding: 8px 0;
}

.sc-filter__fields {
  display: flex;
  gap: 16px;
  align-items: center;
  flex: 1;
  flex-wrap: wrap;
  min-width: 0;
}

.sc-filter__field {
  flex: 0 0 auto;
  width: var(--sc-filter-field-width, 200px);
  max-width: 100%;
  box-sizing: border-box;
}

.sc-filter__field--form {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sc-filter__field--pure {
  display: block;
}

.sc-filter__field-label {
  flex: 0 0 70px;
  text-align: right;
  font-size: 12px;
  color: #333;
  white-space: nowrap;
}

.sc-filter__field-required {
  color: #f56c6c;
  margin-right: 2px;
}

.sc-filter__field-content {
  flex: 1;
  width: var(--sc-filter-content-width, 150px);
  min-width: 0;
}

.sc-filter :deep(.el-input),
.sc-filter :deep(.el-select),
.sc-filter :deep(.el-date-editor),
.sc-filter :deep(.el-range-editor) {
  width: 100% !important;
  box-sizing: border-box;
}

.sc-filter__actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex: 0 0 auto;
  white-space: nowrap;
}

.sc-filter__action {
  min-width: 32px;
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 8px;
  font-size: 12px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sc-filter__action:not([icon-only="true"]) {
  min-width: 80px;
  width: auto;
  padding: 0 16px;
}

.sc-filter__action--ghost {
  background: rgb(255 255 255 / 92%);
  border-color: rgba(148, 163, 184, 0.24);
}

.sc-filter :deep(.el-input__wrapper),
.sc-filter :deep(.el-select__wrapper),
.sc-filter :deep(.el-range-editor.el-input__wrapper),
.sc-filter :deep(.el-date-editor.el-input__wrapper) {
  min-height: 32px;
  height: 32px;
  border-radius: 8px;
  box-shadow: none;
  background: linear-gradient(180deg, #fff, #f8fbff);
  border: 1px solid rgba(203, 213, 225, 0.96);
  box-sizing: border-box;
  width: 100% !important;
}

.sc-filter :deep(.el-input__inner::placeholder) {
  font-size: 12px;
}

.sc-filter :deep(.el-range-editor .el-input__inner) {
  height: 30px;
  line-height: 30px;
}

@media (max-width: 980px) {
  .sc-filter__shell {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .sc-filter__fields {
    width: 100%;
    justify-content: flex-start;
  }

  .sc-filter__field--form {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .sc-filter__field-label {
    flex: 0 0 auto;
    text-align: left;
    min-width: auto;
  }

  .sc-filter__field-content {
    width: 100% !important;
  }

  .sc-filter__actions {
    width: 100%;
    justify-content: flex-end;
  }

  .sc-filter__action {
    min-width: 80px;
    width: auto;
    padding: 0 16px;
  }
}

@media (max-width: 640px) {
  .sc-filter__fields {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .sc-filter__field {
    width: 100% !important;
  }

  .sc-filter__actions {
    justify-content: flex-end;
    gap: 8px;
  }

  .sc-filter__action {
    flex: 1;
    min-width: 60px;
  }
}
</style>