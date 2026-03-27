<template>
  <BaseTableSelect
    ref="baseRef"
    :model-value="modelValue"
    :options="options"
    :url="url"
    :url-params="urlParams"
    :keywords="keywords"
    :columns="columns"
    :multiple="multiple"
    :placeholder="placeholder"
    :height="height"
    :border="border"
    :limit="limit"
    :is-remote="isRemote"
    :remote-search="remoteSearch"
    :page-size="pageSize"
    :title="title"
    @update:modelValue="(value) => emit('update:modelValue', value)"
    @selectionChange="(rows, value) => emit('selectionChange', rows, value)"
    @success="(value) => emit('success', value)"
    @failure="(error) => emit('failure', error)"
  >
    <template #header>
      <slot name="header" />
    </template>
    <template #toolbar>
      <slot name="toolbar" />
    </template>
    <template #footer>
      <slot name="footer" />
    </template>
    <template #empty>
      <slot name="empty">
        <ScEmpty description="暂无数据" :image-size="60" />
      </slot>
    </template>
    <template
      v-for="column in columns"
      :key="column.prop"
      #[column.prop]="scope"
    >
      <slot :name="column.prop" v-bind="scope">
        {{ scope.row[column.prop] }}
      </slot>
    </template>
  </BaseTableSelect>
</template>

<script setup lang="ts">
import { ref } from "vue";
import BaseTableSelect from "../../ScTableSelect/BaseTableSelect.vue";
import { TableColumn } from "../index.vue";

const emit = defineEmits(["update:modelValue", "selectionChange", "success", "failure"]);

export interface DropdownOption {
  label?: string;
  name?: string;
  describe?: string;
  description?: string;
  value: string | number;
  icon?: string;
  image: ImageOption;
  preview?: string;
}

export interface ImageOption {
  width: string;
  height: string;
}

const props = withDefaults(
  defineProps<{
    keywords?: Record<string, string>;
    options?: DropdownOption[];
    modelValue?: string | number | Array<string | number>;
    url?: ((params: Record<string, any>) => Promise<any>) | null;
    urlParams?: Record<string, any>;
    remoteSearch?: boolean;
    multiple?: boolean;
    border?: boolean;
    limit?: number;
    isRemote?: boolean;
    width?: string;
    height?: string;
    icon?: string;
    title?: string;
    placeholder?: string;
    columns?: TableColumn[];
    pageSize?: number;
  }>(),
  {
    keywords: () => ({}),
    options: () => [],
    modelValue: "",
    url: null,
    urlParams: () => ({}),
    remoteSearch: false,
    multiple: false,
    border: false,
    limit: 0,
    isRemote: false,
    width: "120px",
    height: "600px",
    icon: "ri:settings-3-line",
    title: "",
    placeholder: "请选择",
    columns: () => [],
    pageSize: 10,
  },
);

const baseRef = ref<InstanceType<typeof BaseTableSelect>>();

const {
  modelValue,
  options,
  url,
  urlParams,
  keywords,
  multiple,
  border,
  limit,
  isRemote,
  height,
  title,
  placeholder,
  columns,
  pageSize,
  remoteSearch,
} = props;

defineExpose({
  handleClose: () => baseRef.value?.handleClose(),
});
</script>
