<template>
  <div>
     <TSelectTable
        class="w-full"
        :table="state.table"
        :columns="state.table.columns"
        :isShowInput="true"
        :multiple="props.multiple"
        :max-height="props.maxHeight"
                :keywords="{ label: 'name', value: 'id' }"

        @selectionChange="selectionChange"
        isShowPagination
        @page-change="pageChange"
      />
  </div>
</template>

<script setup >
import "@wocwin/t-ui-plus/lib/style.css";
import config from "./setting.ts";
import { TSelectTable } from "@wocwin/t-ui-plus";
import { defineProps, onMounted, reactive } from "vue";
const props = defineProps({
  modelValue: {
    type: Object,
  },
  url: {
    type: Function,
    default: () => { },
  },
  columns: {
    type: Array,
    default: () => { },
  },
  params: {
    type: Object,
    default: () => { },
  },
  maxHeight: {
    type: Number,
    default: 300,
  },
  multiple: {
    type: Boolean,
    default: false,
  }
});
const state = reactive({
  table: {
    data: [ { id: 1, code: 1, name: "物料名称1", spec: "物料规格1", unitName: "吨" },
    { id: 2, code: 2, name: "物料名称2", spec: "物料规格2", unitName: "吨" },
    { id: 3, code: 3, name: "物料名称3", spec: "物料规格3", unitName: "吨" },
    { id: 4, code: 4, name: "物料名称4", spec: "物料规格4", unitName: "吨" },
    { id: 5, code: 5, name: "物料名称5", spec: "物料规格5", unitName: "吨" },
    { id: 6, code: 6, name: "物料名称6", spec: "物料规格6", unitName: "吨" },
    { id: 7, code: 7, name: "物料名称7", spec: "物料规格7", unitName: "吨" },
    { id: 8, code: 8, name: "物料名称8", spec: "物料规格8", unitName: "吨" },
    { id: 9, code: 9, name: "物料名称9", spec: "物料规格9", unitName: "吨" }],
    total: 0,
    currentPage: 1,
    pageSize: 10,
     columns: [
    { label: "物料编号", width: "100px", prop: "code" },
    { label: "物料名称", width: "149px", prop: "name" },
    { label: "规格", width: "149px", prop: "spec" },
    { label: "单位", width: "110px", prop: "unitName" },
    { label: "物料编号1", width: "149px", prop: "code" },
    { label: "物料名称1", width: "149px", prop: "name" },
    { label: "规格1", width: "149px", prop: "spec" },
    { label: "单位1", width: "110px", prop: "unitName" },
    { label: "物料编号11", width: "149px", prop: "code" },
    { label: "物料名称11", width: "149px", prop: "name" },
    { label: "规格11", width: "149px", prop: "spec" },
    { label: "单位11", width: "110px", prop: "unitName" },
    { label: "物料编号111", width: "149px", prop: "code" },
    { label: "物料名称111", width: "149px", prop: "name" },
    { label: "规格111", width: "149px", prop: "spec" },
    { label: "单位111", width: "110px", prop: "unitName" }
  ]
  },
});

onMounted(async () => {
  // state.table.columns = props.columns;
  // getData();
})
const getData = async () => {
  const res = await props.url(props.params)
  const response = config.parseData(res);
  state.table.data = response.data
  state.table.total = response.total
}
const pageChange = val => {
  state.table.currentPage = val
  getData(val)
}

const selectionChange = (val, ids) => {
  console.log("复选框", val)
  console.log("复选框--id", ids)
}
</script>

<style scoped>
.sc-table-select__table {
  padding: 12px;
}
.sc-table-select__page {
  padding-top: 12px;
}
</style>
