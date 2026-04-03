<template>
  <div v-if="!hidePagination || !hideDo" class="scTable-page">
    <div class="scTable-pagination">
      <ElPagination
        v-if="!hidePagination"
        v-model:currentPage="currentPage"
        background
        :size="size"
        :layout="resolvedLayout"
        :total="total"
        :page-size="scPageSize"
        :page-sizes="pageSizes"
        @current-change="paginationChange"
        @update:page-size="pageSizeChange"
      />
    </div>
    <div v-if="!hideDo" class="scTable-do">
      <ScButton v-if="!hideRefresh" icon="el-icon-refresh" circle style="margin-left: 15px" @click="refresh" />
    </div>
  </div>
</template>
<script setup>
import { ElPagination } from "element-plus";
import { ref, watch } from "vue";
import config from "./setting";

defineOptions({
  name: "ScPagination",
});

const props = defineProps({
  currentPage: { type: Number, default: 1 },
  pageSize: { type: Number, default: config.pageSize },
  pageSizes: { type: Array, default: () => config.pageSizes },
  hidePagination: { type: Boolean, default: false },
  size: { type: String, default: "default" },
  total: { type: Number, default: 0 },
  hideDo: { type: Boolean, default: false },
  hideRefresh: { type: Boolean, default: false },
  layout: { type: String, default: "" },
  paginationLayout: { type: String, default: config.paginationLayout },
});

const emit = defineEmits([
  "dataChange",
  "update:currentPage",
  "current-change",
  "currentChange",
  "update:pageSize",
  "size-change",
]);
const scPageSize = ref(props.pageSize);
const currentPage = ref(props.currentPage || 1);
const page = ref(props.currentPage || 1);
const resolvedLayout = ref(props.layout || props.paginationLayout);

watch(
  () => props.currentPage,
  (value) => {
    currentPage.value = value || 1;
    page.value = value || 1;
  },
  { immediate: true },
);

watch(
  () => props.pageSize,
  (value) => {
    scPageSize.value = value;
  },
);

watch(
  () => props.layout,
  (value) => {
    resolvedLayout.value = value || props.paginationLayout;
  },
  { immediate: true },
);

function getData() {
  emit("dataChange", { pageSize: scPageSize.value, page: page.value });
}

function refresh() {
  getData();
}

function paginationChange(nextPage) {
  page.value = nextPage;
  currentPage.value = nextPage;
  emit("update:currentPage", nextPage);
  emit("current-change", nextPage);
  emit("currentChange", nextPage);
  getData();
}

function pageSizeChange(nextSize) {
  scPageSize.value = nextSize;
  page.value = 1;
  currentPage.value = 1;
  emit("update:pageSize", nextSize);
  emit("size-change", nextSize);
  emit("update:currentPage", 1);
  getData();
}
</script>

<style>
.scTable {
}

.scTable-table {
  height: calc(100% - 50px);
}

.scTable-page {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 15px;
  bottom: 0;
  z-index: 10;
  width: 100%;
}

.scTable-do {
  white-space: nowrap;
}

.scTable:deep(.el-table__footer) .cell {
  font-weight: bold;
}

.scTable:deep(.el-table__body-wrapper) .el-scrollbar__bar.is-horizontal {
  height: 12px;
  border-radius: 12px;
}

.scTable:deep(.el-table__body-wrapper) .el-scrollbar__bar.is-vertical {
  width: 12px;
  border-radius: 12px;
}
</style>
