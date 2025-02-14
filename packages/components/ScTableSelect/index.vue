<template>
  <div>
    <t-select-table :defaultSelectVal="defaultSettingValue" class="!w-full" :table="state.table"
      :columns="state.table.columns" :multiple="props.multiple" :tableWidth="props.tableWidth"
      :keywords="props.keywords" :filterable="props.filterable" :remote="props.remote" :remote-method="remoteMethod"
      :max-height="props.maxHeight" @selectionChange="selectionChange" @radioChange="selectionChange" isShowPagination
      :placeholder="placeholder" ref="tSelectTableRef" @page-change="pageChange">
      <template #footer>
        <slot name="footer"></slot>
      </template>
      <template #toolbar>
        <slot name="toolbar"></slot>
      </template>
    </t-select-table>
  </div>
</template>

<script setup>
import "@wocwin/t-ui-plus/lib/style.css";
import config from "./setting.ts";
import { TSelectTable } from "@wocwin/t-ui-plus";
import { defineProps, onMounted, reactive, defineEmits, watch, defineExpose, ref } from "vue";
const selectedValue = ref(null);
const emit = defineEmits()
const tSelectTableRef = ref();
const defaultSettingValue = ref([]);
const props = defineProps({
  modelValue: {
    type: Object,
  },
  url: {
    type: Function,
    default: () => { },
  },
  keywords: {
    type: Object,
    default: { label: 'label', value: 'id' },
  },
  columns: {
    type: Array,
    default: () => { },
  },
  params: {
    type: Object,
    default: () => {
      return {
        page: 1,
        pageSize: 10
      }
    },
  },
  tableWidth: {
    type: String,
    default: "100%",
  },
  maxHeight: {
    type: Number,
    default: 300,
  },
  filterable: {
    type: Boolean,
    default: true,
  },
  placeholder: {
    type: String,
    default: "请选择",
  },
  remote: {
    type: Boolean,
    default: false,
  },
  multiple: {
    type: Boolean,
    default: false,
  },
  remoteParameterName: {
    type: String,
    default: 'keywords'
  }
});
const condition = reactive({
  page: 1,
  pageSize: 10
})
const state = reactive({
  table: {
    data: [],
    columns: [],
    total: 0,
    currentPage: 1,
    pageSize: 10,
  },
});

onMounted(async () => {
  selectedValue.value = props.modelValue;
  state.table.columns = props.columns;
  Object.assign(condition, props.params)
  state.table.pageSize = condition.pageSize
  state.table.currentPage = condition.page;
  await getData();
  handleSettingDefault([props.modelValue])
});

const reload = async (form) => {
  Object.assign(condition, form)
  getData();
}

const remoteMethod = (query) => {
  if (query) {
    setTimeout(() => {
      condition[props.remoteParameterName] = query;
      getData();
    }, 200)
  }
}
const getData = async () => {
  props.url(condition).then(res => {
    const response = config.parseData(res);
    state.table.data = response.data;
    state.table.total = response.total;
    emit("success");
  }).catch(e => {
    emit("failure", e);
  })
}
const pageChange = val => {
  state.table.currentPage = val;
  condition.page = val;
  getData()
}

const selectionChange = (val, ids) => {
  emit("update:modelValue", ids);
  emit("selectionChange", val, ids);
}

const handleClose = async () => {
  tSelectTableRef.value?.clear();
  tSelectTableRef.value?.blur();
}

watch(() => props.modelValue, (val) => {
  if (!val) {
    return;
  }
  if (val instanceof Array) {
    handleSettingDefault(val);
    return;
  }
  try {
    handleSettingDefault([val]);
  } catch (error) {

  }
}, { immediate: true, deep: true })

const handleSettingDefault = (val) => {
  defaultSettingValue.value = val;
}
const setValue = async (val) => {
  defaultSettingValue.value = val;
}
defineExpose({
  reload,
  setValue,
  handleClose
})

</script>

<style scoped>
.sc-table-select__table {
  padding: 12px;
}

.sc-table-select__page {
  padding-top: 12px;
}
</style>
