<!--
 * ScFilterBar 高级筛选组件
 * 支持显示指定个数的过滤条件，超过的点击展开显示，类似淘宝筛选
 * @author CH
 * @version 1.0.0
 * @since 2025-12-05
-->
<template>
  <div class="sc-filter-bar" :class="filterBarClass">
    <!-- 快捷筛选 -->
    <div v-if="showQuickFilters && quickFilters?.length" class="sc-filter-bar__quick">
      <span class="sc-filter-bar__quick-label">快捷筛选：</span>
      <div class="sc-filter-bar__quick-list">
        <el-tag
          v-for="item in quickFilters"
          :key="item.key"
          :type="item.active ? 'primary' : 'info'"
          :effect="item.active ? 'dark' : 'plain'"
          class="sc-filter-bar__quick-item"
          @click="handleQuickFilter(item)"
        >
          <IconifyIconOnline v-if="item.icon" :icon="item.icon" />
          {{ item.label }}
        </el-tag>
      </div>
    </div>

    <!-- 筛选表单 -->
    <el-form ref="formRef" :model="formModel" :label-width="labelWidth" :label-position="labelPosition" :size="size" :inline="layout === 'inline'" :disabled="disabled" class="sc-filter-bar__form">
      <div class="sc-filter-bar__fields" :class="fieldsClass">
        <!-- 可见字段 -->
        <template v-for="(field, index) in visibleFields" :key="field.prop">
          <el-form-item
            :label="showLabel ? field.label : ''"
            :prop="field.prop"
            :rules="field.rules"
            :label-width="field.labelWidth"
            class="sc-filter-bar__field"
            :class="getFieldClass(field)"
            :style="getFieldStyle(field)"
          >
            <!-- 自定义插槽 -->
            <slot v-if="field.slot" :name="field.slot" :field="field" :value="formModel[field.prop]" :change="(val: unknown) => handleChange(field, val)" />

            <!-- 输入框 -->
            <el-input
              v-else-if="field.type === 'input' || !field.type"
              v-model="formModel[field.prop]"
              :placeholder="field.placeholder || `请输入${field.label}`"
              :clearable="field.clearable !== false"
              :disabled="field.disabled"
              v-bind="field.props"
              @change="handleChange(field, $event)"
            />

            <!-- 选择框 -->
            <el-select
              v-else-if="field.type === 'select'"
              v-model="formModel[field.prop]"
              :placeholder="field.placeholder || `请选择${field.label}`"
              :clearable="field.clearable !== false"
              :disabled="field.disabled"
              :multiple="field.multiple"
              v-bind="field.props"
              @change="handleChange(field, $event)"
            >
              <el-option v-for="opt in getFieldOptions(field)" :key="opt.value" :label="opt.label" :value="opt.value" :disabled="opt.disabled" />
            </el-select>

            <!-- 日期选择 -->
            <el-date-picker
              v-else-if="field.type === 'date'"
              v-model="formModel[field.prop]"
              type="date"
              :placeholder="field.placeholder || `请选择${field.label}`"
              :clearable="field.clearable !== false"
              :disabled="field.disabled"
              v-bind="field.props"
              @change="handleChange(field, $event)"
            />

            <!-- 日期范围 -->
            <el-date-picker
              v-else-if="field.type === 'daterange'"
              v-model="formModel[field.prop]"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              :clearable="field.clearable !== false"
              :disabled="field.disabled"
              v-bind="field.props"
              @change="handleChange(field, $event)"
            />

            <!-- 日期时间 -->
            <el-date-picker
              v-else-if="field.type === 'datetime'"
              v-model="formModel[field.prop]"
              type="datetime"
              :placeholder="field.placeholder || `请选择${field.label}`"
              :clearable="field.clearable !== false"
              :disabled="field.disabled"
              v-bind="field.props"
              @change="handleChange(field, $event)"
            />

            <!-- 日期时间范围 -->
            <el-date-picker
              v-else-if="field.type === 'datetimerange'"
              v-model="formModel[field.prop]"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              :clearable="field.clearable !== false"
              :disabled="field.disabled"
              v-bind="field.props"
              @change="handleChange(field, $event)"
            />

            <!-- 数字输入 -->
            <el-input-number
              v-else-if="field.type === 'number'"
              v-model="formModel[field.prop]"
              :placeholder="field.placeholder"
              :disabled="field.disabled"
              v-bind="field.props"
              @change="handleChange(field, $event)"
            />

            <!-- 级联选择 -->
            <el-cascader
              v-else-if="field.type === 'cascader'"
              v-model="formModel[field.prop]"
              :options="getFieldOptions(field)"
              :placeholder="field.placeholder || `请选择${field.label}`"
              :clearable="field.clearable !== false"
              :disabled="field.disabled"
              v-bind="field.props"
              @change="handleChange(field, $event)"
            />

            <!-- 树选择 -->
            <el-tree-select
              v-else-if="field.type === 'tree-select'"
              v-model="formModel[field.prop]"
              :data="getFieldOptions(field)"
              :placeholder="field.placeholder || `请选择${field.label}`"
              :clearable="field.clearable !== false"
              :disabled="field.disabled"
              v-bind="field.props"
              @change="handleChange(field, $event)"
            />

            <!-- 开关 -->
            <el-switch v-else-if="field.type === 'switch'" v-model="formModel[field.prop]" :disabled="field.disabled" v-bind="field.props" @change="handleChange(field, $event)" />

            <!-- 单选 -->
            <el-radio-group v-else-if="field.type === 'radio'" v-model="formModel[field.prop]" :disabled="field.disabled" v-bind="field.props" @change="handleChange(field, $event)">
              <el-radio v-for="opt in getFieldOptions(field)" :key="opt.value" :value="opt.value" :disabled="opt.disabled">
                {{ opt.label }}
              </el-radio>
            </el-radio-group>

            <!-- 多选 -->
            <el-checkbox-group v-else-if="field.type === 'checkbox'" v-model="formModel[field.prop]" :disabled="field.disabled" v-bind="field.props" @change="handleChange(field, $event)">
              <el-checkbox v-for="opt in getFieldOptions(field)" :key="opt.value" :value="opt.value" :disabled="opt.disabled">
                {{ opt.label }}
              </el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </template>

        <!-- 操作按钮 -->
        <el-form-item class="sc-filter-bar__actions" :class="{ 'sc-filter-bar__actions--inline': layout === 'inline' }">
          <!-- 展开/收起按钮 -->
          <el-button v-if="showExpand && collapsedFields.length > 0" link type="primary" @click="toggleExpand">
            <template v-if="!iconOnly">{{ isExpanded ? collapseText : expandText }}</template>
            <IconifyIconOnline :icon="isExpanded ? 'ep:arrow-up' : 'ep:arrow-down'" />
          </el-button>

          <!-- 搜索按钮 -->
          <el-tooltip v-if="showSearch" :content="searchText" :disabled="!iconOnly" placement="top">
            <el-button type="primary" :loading="loading" :circle="iconOnly" @click="handleSearch">
              <IconifyIconOnline icon="ep:search" />
              <template v-if="!iconOnly">{{ searchText }}</template>
            </el-button>
          </el-tooltip>

          <!-- 重置按钮 -->
          <el-tooltip v-if="showReset" :content="resetText" :disabled="!iconOnly" placement="top">
            <el-button :circle="iconOnly" @click="handleReset">
              <IconifyIconOnline icon="ep:refresh" />
              <template v-if="!iconOnly">{{ resetText }}</template>
            </el-button>
          </el-tooltip>

          <!-- 自定义操作插槽 -->
          <slot name="actions" :values="formModel" :search="handleSearch" :reset="handleReset" />
        </el-form-item>
      </div>
    </el-form>

    <!-- 已选筛选标签 -->
    <div v-if="hasActiveFilters" class="sc-filter-bar__tags">
      <span class="sc-filter-bar__tags-label">已选条件：</span>
      <div class="sc-filter-bar__tags-list">
        <el-tag v-for="tag in activeTags" :key="tag.prop" closable type="info" @close="handleRemoveTag(tag)">{{ tag.label }}: {{ tag.displayValue }}</el-tag>
        <el-button v-if="activeTags.length > 1" link type="primary" @click="handleReset">清空全部</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, reactive } from "vue";
import type { FormInstance } from "element-plus";
import type { ScFilterBarProps, FilterField, FilterValue, FilterOption, QuickFilter } from "./types";

defineOptions({
  name: "ScFilterBar"
});

const props = withDefaults(defineProps<ScFilterBarProps>(), {
  layout: "inline",
  visibleCount: 3,
  showExpand: true,
  expandText: "更多筛选",
  collapseText: "收起",
  showSearch: true,
  searchText: "搜索",
  showReset: true,
  resetText: "重置",
  labelWidth: "80px",
  labelPosition: "right",
  size: "default",
  inline: true,
  columns: 4,
  gutter: 16,
  border: false,
  background: false,
  showLabel: true,
  realtime: false,
  debounceTime: 300,
  disabled: false,
  loading: false,
  defaultExpanded: false,
  showQuickFilters: true,
  iconOnly: false
});

const emit = defineEmits<{
  (e: "update:modelValue", value: FilterValue): void;
  (e: "search", value: FilterValue): void;
  (e: "reset"): void;
  (e: "change", prop: string, value: unknown, values: FilterValue): void;
  (e: "expand", expanded: boolean): void;
  (e: "quick-filter", filter: QuickFilter): void;
}>();

// ==================== 状态 ====================
const formRef = ref<FormInstance>();
const formModel = reactive<FilterValue>({});
const isExpanded = ref(props.defaultExpanded);
const fieldOptions = ref<Record<string, FilterOption[]>>({});
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// ==================== 计算属性 ====================

/**
 * 筛选栏样式类
 */
const filterBarClass = computed(() => {
  return {
    "sc-filter-bar--border": props.border,
    "sc-filter-bar--background": props.background,
    [`sc-filter-bar--${props.layout}`]: true,
    [`sc-filter-bar--${props.size}`]: props.size !== "default"
  };
});

/**
 * 字段容器样式类
 */
const fieldsClass = computed(() => {
  return {
    "sc-filter-bar__fields--grid": props.layout === "grid",
    "sc-filter-bar__fields--vertical": props.layout === "vertical"
  };
});

/**
 * 排序后的字段
 */
const sortedFields = computed(() => {
  return [...props.fields].sort((a, b) => (a.order || 0) - (b.order || 0));
});

/**
 * 可见字段
 */
const visibleFields = computed(() => {
  const always = sortedFields.value.filter(f => f.alwaysShow);
  const others = sortedFields.value.filter(f => !f.alwaysShow);

  if (isExpanded.value) {
    return [...always, ...others];
  }

  const remaining = props.visibleCount - always.length;
  return [...always, ...others.slice(0, Math.max(0, remaining))];
});

/**
 * 折叠的字段
 */
const collapsedFields = computed(() => {
  const always = sortedFields.value.filter(f => f.alwaysShow);
  const others = sortedFields.value.filter(f => !f.alwaysShow);
  const remaining = props.visibleCount - always.length;
  return others.slice(Math.max(0, remaining));
});

/**
 * 是否有激活的筛选
 */
const hasActiveFilters = computed(() => {
  return activeTags.value.length > 0;
});

/**
 * 激活的筛选标签
 */
const activeTags = computed(() => {
  const tags: { prop: string; label: string; displayValue: string; value: unknown }[] = [];

  props.fields.forEach(field => {
    const value = formModel[field.prop];
    if (value !== undefined && value !== null && value !== "" && !(Array.isArray(value) && value.length === 0)) {
      let displayValue = String(value);

      // 处理选择框的显示值
      if (field.type === "select" || field.type === "radio") {
        const options = getFieldOptions(field);
        const opt = options.find(o => o.value === value);
        if (opt) displayValue = opt.label;
      }

      // 处理多选的显示值
      if (field.multiple && Array.isArray(value)) {
        const options = getFieldOptions(field);
        displayValue = value
          .map(v => {
            const opt = options.find(o => o.value === v);
            return opt ? opt.label : v;
          })
          .join(", ");
      }

      // 处理日期范围
      if (Array.isArray(value) && (field.type === "daterange" || field.type === "datetimerange")) {
        displayValue = value.join(" 至 ");
      }

      tags.push({
        prop: field.prop,
        label: field.label,
        displayValue,
        value
      });
    }
  });

  return tags;
});

// ==================== 方法 ====================

/**
 * 获取字段选项
 */
function getFieldOptions(field: FilterField): FilterOption[] {
  return fieldOptions.value[field.prop] || field.options || [];
}

/**
 * 获取字段样式类
 */
function getFieldClass(field: FilterField): Record<string, boolean> {
  return {
    "sc-filter-bar__field--required": !!field.required,
    "sc-filter-bar__field--disabled": !!field.disabled
  };
}

/**
 * 获取字段样式
 */
function getFieldStyle(field: FilterField): Record<string, string> {
  const style: Record<string, string> = {};

  if (field.width) {
    style.width = typeof field.width === "number" ? `${field.width}px` : field.width;
  }

  if (props.layout === "grid" && field.span) {
    style.gridColumn = `span ${field.span}`;
  }

  return style;
}

/**
 * 切换展开状态
 */
function toggleExpand(): void {
  isExpanded.value = !isExpanded.value;
  emit("expand", isExpanded.value);
}

/**
 * 处理字段值变化
 */
function handleChange(field: FilterField, value: unknown): void {
  formModel[field.prop] = value;
  emit("change", field.prop, value, { ...formModel });
  emit("update:modelValue", { ...formModel });

  // 执行字段回调
  field.onChange?.(value, field);

  // 处理联动
  handleLinkage(field, value);

  // 实时搜索
  if (props.realtime) {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      handleSearch();
    }, props.debounceTime);
  }
}

/**
 * 处理字段联动
 */
function handleLinkage(field: FilterField, value: unknown): void {
  if (!field.linkage) return;

  field.linkage.forEach(link => {
    const targetField = props.fields.find(f => f.prop === link.target);
    if (!targetField) return;

    const shouldTrigger = link.condition ? link.condition(value) : true;
    if (!shouldTrigger) return;

    switch (link.type) {
      case "options":
        if (link.data) {
          fieldOptions.value[link.target] = typeof link.data === "function" ? link.data(value) : link.data;
        }
        break;
      case "value":
        formModel[link.target] = undefined;
        break;
    }
  });
}

/**
 * 搜索
 */
function handleSearch(): void {
  emit("search", { ...formModel });
}

/**
 * 重置
 */
function handleReset(): void {
  // 重置表单值
  props.fields.forEach(field => {
    formModel[field.prop] = field.defaultValue ?? undefined;
  });

  emit("update:modelValue", { ...formModel });
  emit("reset");
}

/**
 * 移除筛选标签
 */
function handleRemoveTag(tag: { prop: string }): void {
  formModel[tag.prop] = undefined;
  emit("update:modelValue", { ...formModel });

  if (props.realtime) {
    handleSearch();
  }
}

/**
 * 处理快捷筛选
 */
function handleQuickFilter(filter: QuickFilter): void {
  // 应用快捷筛选值
  Object.entries(filter.value).forEach(([key, value]) => {
    formModel[key] = value;
  });

  emit("update:modelValue", { ...formModel });
  emit("quick-filter", filter);
  handleSearch();
}

/**
 * 加载字段选项
 */
async function loadFieldOptions(): Promise<void> {
  const promises = props.fields
    .filter(field => field.fetchOptions)
    .map(async field => {
      try {
        const options = await field.fetchOptions!();
        fieldOptions.value[field.prop] = options;
      } catch (error) {
        console.error(`加载字段 ${field.prop} 选项失败:`, error);
      }
    });

  await Promise.all(promises);
}

/**
 * 初始化表单值
 */
function initFormModel(): void {
  props.fields.forEach(field => {
    if (props.modelValue && props.modelValue[field.prop] !== undefined) {
      formModel[field.prop] = props.modelValue[field.prop];
    } else if (field.defaultValue !== undefined) {
      formModel[field.prop] = field.defaultValue;
    }
  });
}

/**
 * 获取表单值
 */
function getValues(): FilterValue {
  return { ...formModel };
}

/**
 * 设置表单值
 */
function setValues(values: FilterValue): void {
  Object.entries(values).forEach(([key, value]) => {
    formModel[key] = value;
  });
  emit("update:modelValue", { ...formModel });
}

/**
 * 验证表单
 */
async function validate(): Promise<boolean> {
  if (!formRef.value) return true;
  try {
    await formRef.value.validate();
    return true;
  } catch {
    return false;
  }
}

// ==================== 生命周期 ====================

onMounted(() => {
  initFormModel();
  loadFieldOptions();
});

// 监听 modelValue 变化
watch(
  () => props.modelValue,
  newVal => {
    if (newVal) {
      Object.entries(newVal).forEach(([key, value]) => {
        formModel[key] = value;
      });
    }
  },
  { deep: true }
);

// 暴露方法
defineExpose({
  getValues,
  setValues,
  validate,
  handleSearch,
  handleReset,
  toggleExpand
});
</script>

<style lang="scss" scoped>
.sc-filter-bar {
  width: 100%;

  &--border {
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    padding: 16px;
  }

  &--background {
    background-color: var(--el-fill-color-lighter);
    border-radius: 8px;
    padding: 16px;
  }

  // ==================== 快捷筛选 ====================
  &__quick {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--el-border-color-lighter);

    &-label {
      font-size: 13px;
      color: var(--el-text-color-secondary);
      white-space: nowrap;
    }

    &-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    &-item {
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-1px);
      }
    }
  }

  // ==================== 表单 ====================
  &__form {
    :deep(.el-form-item) {
      margin-bottom: 16px;
    }
  }

  &__fields {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;

    &--grid {
      display: grid;
      grid-template-columns: repeat(var(--columns, 4), 1fr);
      gap: 16px;
    }

    &--vertical {
      flex-direction: column;
    }
  }

  &__field {
    margin-bottom: 0 !important;
    min-width: 200px;

    // 确保表单控件宽度
    :deep(.el-select),
    :deep(.el-cascader),
    :deep(.el-tree-select),
    :deep(.el-date-editor),
    :deep(.el-input),
    :deep(.el-input-number) {
      width: 100%;
      min-width: 180px;
    }

    // 日期范围选择器需要更宽
    :deep(.el-date-editor--daterange),
    :deep(.el-date-editor--datetimerange),
    :deep(.el-date-editor--monthrange) {
      min-width: 260px;
    }

    &--required {
      :deep(.el-form-item__label)::before {
        content: "*";
        color: var(--el-color-danger);
        margin-right: 4px;
      }
    }
  }

  // ==================== 操作按钮 ====================
  &__actions {
    margin-bottom: 0 !important;

    &--inline {
      margin-left: auto;
    }
  }

  // ==================== 已选标签 ====================
  &__tags {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid var(--el-border-color-lighter);

    &-label {
      font-size: 13px;
      color: var(--el-text-color-secondary);
      white-space: nowrap;
      line-height: 24px;
    }

    &-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }
  }

  // ==================== 布局 ====================
  &--inline {
    .sc-filter-bar__form {
      :deep(.el-form-item) {
        margin-right: 16px;
        margin-bottom: 16px;

        // 确保 inline 布局下控件有合适的宽度
        .el-form-item__content {
          min-width: 180px;

          .el-select,
          .el-cascader,
          .el-tree-select,
          .el-input {
            width: 180px;
          }

          .el-date-editor--daterange,
          .el-date-editor--datetimerange {
            width: 280px;
          }
        }
      }
    }
  }

  &--horizontal {
    .sc-filter-bar__fields {
      flex-direction: row;
    }
  }

  &--vertical {
    .sc-filter-bar__fields {
      flex-direction: column;
    }

    .sc-filter-bar__field {
      width: 100%;
    }
  }

  &--grid {
    .sc-filter-bar__fields {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
    }
  }

  // ==================== 大小 ====================
  &--small {
    .sc-filter-bar__quick,
    .sc-filter-bar__tags {
      font-size: 12px;
    }
  }

  &--large {
    .sc-filter-bar__quick,
    .sc-filter-bar__tags {
      font-size: 14px;
    }
  }
}
</style>
