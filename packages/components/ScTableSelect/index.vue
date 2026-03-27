<template>
  <BaseTableSelect
    ref="baseRef"
    :model-value="modelValue"
    :data="data"
    :url="url"
    :params="params"
    :keywords="keywords"
    :columns="columns"
    :multiple="multiple"
    :placeholder="placeholder"
    :max-height="maxHeight"
    :filterable="filterable"
    :remote="remote"
    :remote-parameter-name="remoteParameterName"
    @update:modelValue="(value) => emit('update:modelValue', value)"
    @selectionChange="(rows, value) => emit('selectionChange', rows, value)"
    @success="(value) => emit('success', value)"
    @failure="(error) => emit('failure', error)"
  >
    <template #toolbar>
      <slot name="toolbar" />
    </template>
    <template #footer>
      <slot name="footer" />
    </template>
  </BaseTableSelect>
</template>

<script setup lang="ts">
import { ref } from "vue";
import BaseTableSelect from "./BaseTableSelect.vue";

const props = withDefaults(
  defineProps<{
    modelValue?: unknown;
    data?: Record<string, any>[];
    url?: ((params: Record<string, any>) => Promise<any>) | null;
    keywords?: Record<string, string>;
    columns?: Array<Record<string, any>>;
    params?: Record<string, any>;
    tableWidth?: string;
    maxHeight?: number;
    filterable?: boolean;
    placeholder?: string;
    remote?: boolean;
    multiple?: boolean;
    remoteParameterName?: string;
  }>(),
  {
    modelValue: "",
    data: () => [],
    url: null,
    keywords: () => ({ label: "label", value: "id" }),
    columns: () => [],
    params: () => ({ page: 1, pageSize: 10 }),
    tableWidth: "100%",
    maxHeight: 300,
    filterable: true,
    placeholder: "请选择",
    remote: false,
    multiple: false,
    remoteParameterName: "keywords",
  },
);

const emit = defineEmits(["update:modelValue", "selectionChange", "success", "failure"]);
const baseRef = ref<InstanceType<typeof BaseTableSelect>>();

const {
  modelValue,
  data,
  url,
  keywords,
  columns,
  params,
  maxHeight,
  filterable,
  placeholder,
  remote,
  multiple,
  remoteParameterName,
} = props;

defineExpose({
  reload: (form?: Record<string, any>) => baseRef.value?.reload(form),
  setValue: (value: unknown) => baseRef.value?.setValue(value),
  handleClose: () => baseRef.value?.handleClose(),
});
</script>
