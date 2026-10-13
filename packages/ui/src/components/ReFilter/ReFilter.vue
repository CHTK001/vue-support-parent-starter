<script setup lang="ts">
/**
 * ReFilter —— 筛选组件
 *
 * 支持：
 *   - 水平筛选栏，一行显示多个筛选条件
 *   - "展开更多"按钮，折叠/展开额外筛选条件
 *   - 抽屉模式（高级筛选），自定义条件布局
 *   - 自动重置/查询操作
 *
 * 用法：
 *   <ReFilter
 *     :items="[
 *       { prop: 'name', label: '名称', type: 'input' },
 *       { prop: 'status', label: '状态', type: 'select', options: [...] },
 *       { prop: 'date', label: '日期', type: 'daterange', always: false },
 *     ]"
 *     @search="onSearch"
 *     @reset="onReset"
 *   />
 */
import { computed, ref, watch } from "vue";
import {
  ElInput,
  ElSelect,
  ElOption,
  ElDatePicker,
  ElCheckbox,
  ElInputNumber,
  ElButton,
  ElDrawer,
  ElForm,
  ElFormItem,
  ElRow,
  ElCol,
  ElIcon,
} from "element-plus";
import { ArrowDown, ArrowUp, Setting, Refresh, Search } from "@element-plus/icons-vue";
import type { ModelValueType, SelectProps } from "element-plus";
import type { ReFilterItem } from "./types";
import ReSelect from "../ReSelect/ReSelect.vue";
import type { ReSelectLoader } from "../ReSelect/types";

defineOptions({ name: "ReFilter", inheritAttrs: true });

const props = withDefaults(
  defineProps<{
    /** 筛选项配置 */
    items?: ReFilterItem[];
    /** 一行显示几个（默认 4） */
    columns?: number;
    /** 超过一行时显示"展开更多" */
    collapsible?: boolean;
    /** 默认是否展开 */
    expanded?: boolean;
    /** 是否显示重置/查询按钮 */
    showActions?: boolean;
    /** 查询按钮文案 */
    searchText?: string;
    /** 重置按钮文案 */
    resetText?: string;
    /** 是否显示抽屉模式（高级筛选） */
    drawerEnabled?: boolean;
    /** 抽屉标题 */
    drawerTitle?: string;
    /** 抽屉宽度 */
    drawerSize?: string | number;
  }>(),
  {
    items: () => [],
    columns: 4,
    collapsible: true,
    expanded: false,
    showActions: true,
    searchText: "查询",
    resetText: "重置",
    drawerEnabled: false,
    drawerTitle: "高级筛选",
    drawerSize: "480",
  },
);

const emit = defineEmits<{
  (e: "search", values: Record<string, unknown>): void;
  (e: "reset"): void;
  (e: "change", prop: string, value: unknown): void;
}>();

/** 表单数据 */
const formData = ref<Record<string, unknown>>({});

/** 动态表单值按 ElSelect 的 model-value 类型收窄 */
function selectModel(prop: string): SelectProps["modelValue"] {
  return formData.value[prop] as SelectProps["modelValue"];
}

/** 动态表单值按 ElDatePicker 的 model-value 类型收窄 */
function dateModel(prop: string): ModelValueType | undefined {
  return formData.value[prop] as ModelValueType | undefined;
}

/** 筛选项是否声明了远端数据源（dataSource / url / loader） */
function isRemoteSelect(item: ReFilterItem): boolean {
  return Boolean(item.url) || typeof item.loader === "function"
    || typeof item.dataSource === "string" || typeof item.dataSource === "function";
}

/** 筛选项生效的远端 url：显式 url 优先，dataSource 为字符串时兜底 */
function filterUrl(item: ReFilterItem): string {
  return item.url || (typeof item.dataSource === "string" ? item.dataSource : "");
}

/** 筛选项生效的远端加载器：显式 loader 优先，dataSource 为函数时兜底 */
function filterLoader(item: ReFilterItem): ReSelectLoader | undefined {
  return item.loader || (typeof item.dataSource === "function" ? item.dataSource : undefined);
}

/** 展开状态 */
const isExpanded = ref(props.expanded);

/** 抽屉可见性 */
const drawerVisible = ref(false);

/** 初始化默认值 */
function initDefaults(): void {
  const data: Record<string, unknown> = {};
  for (const item of props.items) {
    if (item.defaultValue !== undefined) {
      data[item.prop] = item.defaultValue;
    } else {
      // 根据类型设置空值
      switch (item.type) {
        case "checkbox":
          data[item.prop] = false;
          break;
        case "number":
          data[item.prop] = undefined;
          break;
        case "daterange":
          data[item.prop] = null;
          break;
        case "select":
          data[item.prop] = item.multiple ? [] : "";
          break;
        default:
          data[item.prop] = "";
      }
    }
  }
  formData.value = data;
}

watch(
  () => props.items,
  () => initDefaults(),
  { immediate: true, deep: true },
);

/** 始终显示的项（always=true 或前一行的项） */
const alwaysItems = computed<ReFilterItem[]>(() =>
  props.items.filter((item) => item.always),
);

/** 一行显示的项数 */
const itemsPerRow = computed(() => props.columns);

/** 折叠时显示的项（始终显示的 + 第一行内的非 always 项） */
const collapsedItems = computed<ReFilterItem[]>(() => {
  const always = alwaysItems.value;
  const remaining = props.columns - always.length - 1; // -1 for action button
  const others = props.items.filter((item) => !item.always);
  return [...always, ...others.slice(0, Math.max(0, remaining))];
});

/** 当前显示的项 */
const visibleItems = computed<ReFilterItem[]>(() => {
  if (!props.collapsible || isExpanded.value) {
    return props.items;
  }
  return collapsedItems.value;
});

/** 是否有被折叠的项 */
const hasCollapsedItems = computed(() => {
  if (!props.collapsible) return false;
  return props.items.length > collapsedItems.value.length;
});

/** 计算每个 item 的栅格 span */
function getItemSpan(item: ReFilterItem): number {
  if (item.span) return item.span;
  return Math.floor(24 / props.columns);
}

/** 值变化 */
function onValueChange(prop: string, value: unknown): void {
  formData.value = { ...formData.value, [prop]: value };
  emit("change", prop, value);
}

/** 查询 */
function onSearch(): void {
  emit("search", { ...formData.value });
}

/** 重置 */
function onReset(): void {
  initDefaults();
  emit("reset");
}

/** 打开抽屉 */
function openDrawer(): void {
  drawerVisible.value = true;
}

/** 抽屉内应用 */
function onDrawerApply(): void {
  drawerVisible.value = false;
  emit("search", { ...formData.value });
}

/** 暴露方法 */
defineExpose({
  getValues: () => ({ ...formData.value }),
  reset: onReset,
  setValues: (values: Record<string, unknown>) => {
    formData.value = { ...formData.value, ...values };
  },
});
</script>

<template>
  <div class="re-filter">
    <!-- 筛选栏 -->
    <ElForm
      :model="formData"
      inline
      class="re-filter__form"
      @submit.prevent
    >
      <ElRow :gutter="16" align="middle">
        <template v-for="item in visibleItems" :key="item.prop">
          <ElCol :span="getItemSpan(item)">
            <ElFormItem :label="item.label" class="re-filter__item">
              <!-- slot 类型：使用自定义插槽 -->
              <slot
                v-if="item.type === 'slot'"
                :name="item.prop"
                :value="formData[item.prop]"
                :on-change="(v: unknown) => onValueChange(item.prop, v)"
              />

              <!-- input 类型 -->
              <ElInput
                v-else-if="item.type === 'input' || !item.type"
                :model-value="(formData[item.prop] as string) ?? ''"
                :placeholder="item.placeholder || `请输入${item.label}`"
                :clearable="item.clearable !== false"
                :disabled="item.disabled"
                @update:model-value="(v: string | number) => onValueChange(item.prop, v)"
              />

              <!-- select 类型：声明 dataSource / url / loader 时走 ReSelect 远端加载 -->
              <ReSelect
                v-else-if="item.type === 'select' && isRemoteSelect(item)"
                :model-value="(selectModel(item.prop) as any)"
                :data="item.options ?? []"
                :url="filterUrl(item)"
                :loader="filterLoader(item)"
                :placeholder="item.placeholder || `请选择${item.label}`"
                :clearable="item.clearable !== false"
                :multiple="item.multiple"
                :disabled="item.disabled"
                @update:model-value="(v: unknown) => onValueChange(item.prop, v)"
              />

              <!-- select 类型 -->
              <ElSelect
                v-else-if="item.type === 'select'"
                :model-value="selectModel(item.prop)"
                :placeholder="item.placeholder || `请选择${item.label}`"
                :clearable="item.clearable !== false"
                :multiple="item.multiple"
                :disabled="item.disabled"
                collapse-tags
                collapse-tags-tooltip
                @update:model-value="(v: unknown) => onValueChange(item.prop, v)"
              >
                <ElOption
                  v-for="opt in item.options ?? []"
                  :key="String(opt.value)"
                  :label="opt.label"
                  :value="opt.value"
                />
              </ElSelect>

              <!-- date 类型 -->
              <ElDatePicker
                v-else-if="item.type === 'date'"
                :model-value="dateModel(item.prop)"
                :placeholder="item.placeholder || `请选择${item.label}`"
                :clearable="item.clearable !== false"
                :disabled="item.disabled"
                type="date"
                value-format="YYYY-MM-DD"
                @update:model-value="(v: unknown) => onValueChange(item.prop, v)"
              />

              <!-- daterange 类型 -->
              <ElDatePicker
                v-else-if="item.type === 'daterange'"
                :model-value="dateModel(item.prop)"
                :start-placeholder="'开始日期'"
                :end-placeholder="'结束日期'"
                :clearable="item.clearable !== false"
                :disabled="item.disabled"
                type="daterange"
                value-format="YYYY-MM-DD"
                @update:model-value="(v: unknown) => onValueChange(item.prop, v)"
              />

              <!-- checkbox 类型 -->
              <ElCheckbox
                v-else-if="item.type === 'checkbox'"
                :model-value="formData[item.prop] as boolean"
                :disabled="item.disabled"
                @update:model-value="(v: boolean | string | number) => onValueChange(item.prop, !!v)"
              >
                {{ item.placeholder || item.label }}
              </ElCheckbox>

              <!-- number 类型 -->
              <ElInputNumber
                v-else-if="item.type === 'number'"
                :model-value="formData[item.prop] as number | undefined"
                :placeholder="item.placeholder || `请输入${item.label}`"
                :disabled="item.disabled"
                controls-position="right"
                @update:model-value="(v: number | undefined) => onValueChange(item.prop, v)"
              />
            </ElFormItem>
          </ElCol>
        </template>

        <!-- 操作按钮 -->
        <ElCol v-if="showActions" :span="getItemSpan({ prop: '', label: '' })" class="re-filter__actions">
          <ElButton type="primary" :icon="Search" @click="onSearch">
            {{ searchText }}
          </ElButton>
          <ElButton :icon="Refresh" @click="onReset">
            {{ resetText }}
          </ElButton>
          <ElButton
            v-if="hasCollapsedItems"
            text
            type="primary"
            @click="isExpanded = !isExpanded"
          >
            {{ isExpanded ? '收起' : '更多' }}
            <ElIcon class="re-filter__expand-icon" :class="{ 'is-expanded': isExpanded }">
              <ArrowDown v-if="!isExpanded" />
              <ArrowUp v-else />
            </ElIcon>
          </ElButton>
          <ElButton
            v-if="drawerEnabled"
            :icon="Setting"
            text
            @click="openDrawer"
          >
            高级
          </ElButton>
        </ElCol>
      </ElRow>
    </ElForm>

    <!-- 抽屉模式（高级筛选） -->
    <ElDrawer
      v-if="drawerEnabled"
      v-model="drawerVisible"
      :title="drawerTitle"
      :size="drawerSize"
      direction="rtl"
      :destroy-on-close="false"
    >
      <ElForm :model="formData" label-position="top" class="re-filter__drawer-form">
        <ElFormItem
          v-for="item in items"
          :key="item.prop"
          :label="item.label"
        >
          <slot
            v-if="item.type === 'slot'"
            :name="`drawer-${item.prop}`"
            :value="formData[item.prop]"
            :on-change="(v: unknown) => onValueChange(item.prop, v)"
          />
          <ElInput
            v-else-if="item.type === 'input' || !item.type"
            :model-value="(formData[item.prop] as string) ?? ''"
            :placeholder="item.placeholder || `请输入${item.label}`"
            :clearable="item.clearable !== false"
            :disabled="item.disabled"
            @update:model-value="(v: string | number) => onValueChange(item.prop, v)"
          />
          <ReSelect
            v-else-if="item.type === 'select' && isRemoteSelect(item)"
            :model-value="(selectModel(item.prop) as any)"
            :data="item.options ?? []"
            :url="filterUrl(item)"
            :loader="filterLoader(item)"
            :placeholder="item.placeholder || `请选择${item.label}`"
            :clearable="item.clearable !== false"
            :multiple="item.multiple"
            :disabled="item.disabled"
            style="width: 100%"
            @update:model-value="(v: unknown) => onValueChange(item.prop, v)"
          />
          <ElSelect
            v-else-if="item.type === 'select'"
            :model-value="selectModel(item.prop)"
            :placeholder="item.placeholder || `请选择${item.label}`"
            :clearable="item.clearable !== false"
            :multiple="item.multiple"
            :disabled="item.disabled"
            @update:model-value="(v: unknown) => onValueChange(item.prop, v)"
          >
            <ElOption
              v-for="opt in item.options ?? []"
              :key="String(opt.value)"
              :label="opt.label"
              :value="opt.value"
            />
          </ElSelect>
          <ElDatePicker
            v-else-if="item.type === 'date'"
            :model-value="dateModel(item.prop)"
            :placeholder="item.placeholder || `请选择${item.label}`"
            :clearable="item.clearable !== false"
            :disabled="item.disabled"
            type="date"
            value-format="YYYY-MM-DD"
            style="width: 100%"
            @update:model-value="(v: unknown) => onValueChange(item.prop, v)"
          />
          <ElDatePicker
            v-else-if="item.type === 'daterange'"
            :model-value="dateModel(item.prop)"
            :start-placeholder="'开始日期'"
            :end-placeholder="'结束日期'"
            :clearable="item.clearable !== false"
            :disabled="item.disabled"
            type="daterange"
            value-format="YYYY-MM-DD"
            style="width: 100%"
            @update:model-value="(v: unknown) => onValueChange(item.prop, v)"
          />
          <ElCheckbox
            v-else-if="item.type === 'checkbox'"
            :model-value="formData[item.prop] as boolean"
            :disabled="item.disabled"
            @update:model-value="(v: boolean | string | number) => onValueChange(item.prop, !!v)"
          >
            {{ item.placeholder || item.label }}
          </ElCheckbox>
          <ElInputNumber
            v-else-if="item.type === 'number'"
            :model-value="formData[item.prop] as number | undefined"
            :placeholder="item.placeholder || `请输入${item.label}`"
            :disabled="item.disabled"
            style="width: 100%"
            controls-position="right"
            @update:model-value="(v: number | undefined) => onValueChange(item.prop, v)"
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="onReset">{{ resetText }}</ElButton>
        <ElButton type="primary" @click="onDrawerApply">{{ searchText }}</ElButton>
      </template>
    </ElDrawer>
  </div>
</template>

<style scoped>
.re-filter {
  padding: 0;
}
.re-filter__form :deep(.el-form-item) {
  margin-bottom: 12px;
}
.re-filter__form :deep(.el-form-item__label) {
  font-size: 13px;
  color: var(--el-text-color-regular);
}
.re-filter__item {
  width: 100%;
}
.re-filter__item :deep(.el-input),
.re-filter__item :deep(.el-select),
.re-filter__item :deep(.el-date-editor) {
  width: 100% !important;
}
.re-filter__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.re-filter__expand-icon {
  margin-left: 2px;
  transition: transform 0.25s ease;
}
.re-filter__expand-icon.is-expanded {
  transform: rotate(180deg);
}
.re-filter__drawer-form :deep(.el-form-item) {
  margin-bottom: 16px;
}
</style>
