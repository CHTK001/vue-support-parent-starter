<template>
  <div>
    <!-- @ts-ignore -->
    <TSelectTable
      ref="tSelectTableRef"
      class="!w-full"
      :table="state.table"
      :columns="state.table.columns"
      :multiple="multiple"
      :isShowFirstColumn="multiple"
      :max-height="height"
      isShowPagination
      :placeholder="placeholder"
      :keywords="keywords"
      :border="border"
      :table-width="0"
      :tableLoading="tableLoading"
      :remote="remoteSearch"
      :remote-method="remoteMethod"
      @selectionChange="selectionChange"
      @radioChange="selectionChange"
      @page-change="pageChange"
    >
      <!-- 头部插槽 -->
      <template #header>
        <slot name="header" />
      </template>
      <!-- 底部插槽 -->
      <template #footer>
        <slot name="footer" />
      </template>
      <!-- 工具栏插槽 -->
      <template #toolbar>
        <slot name="toolbar" />
      </template>
      <!-- 空数据插槽 -->
      <template #empty>
        <slot name="empty">
          <el-empty description="暂无数据" :image-size="60" />
        </slot>
      </template>
      <!-- 动态列插槽 - 透传所有列的自定义渲染 -->
      <template v-for="col in state.table.columns" :key="col.prop" #[col.prop]="scope">
        <slot :name="col.prop" v-bind="scope">
          {{ scope.row[col.prop] }}
        </slot>
      </template>
    </TSelectTable>
  </div>
</template>

<script setup lang="ts">
import { TSelectTable } from "@wocwin/t-ui-plus";
import "@wocwin/t-ui-plus/lib/style.css";
import config from "../../ScTableSelect/setting";

import { onMounted, reactive, ref } from "vue";
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
const tSelectTableRef = ref();
const tableLoading = ref(true);

export interface ImageOption {
  width: string;
  height: string;
}

const props = defineProps({
  keywords: {
    type: Object,
    default: () => {}
  },
  options: {
    type: Array as () => DropdownOption[],
    required: true
  },
  modelValue: {
    type: [String, Number, Array],
    default: ""
  },
  url: {
    type: Function,
    default: () => {}
  },
  urlParams: {
    type: Object,
    default: () => {}
  },
  remoteSearch: {
    type: Boolean,
    default: false
  },
  multiple: {
    type: Boolean,
    default: false
  },
  border: {
    type: Boolean,
    default: false
  },
  limit: {
    type: Number,
    default: 0
  },
  isRemote: {
    type: Boolean,
    default: false
  },
  width: {
    type: String,
    default: "120px"
  },
  height: {
    type: String,
    default: "600px"
  },
  icon: {
    type: String,
    default: "ri:settings-3-line"
  },
  title: {
    type: String,
    default: ""
  },
  placeholder: {
    type: String,
    default: "请选择"
  },
  columns: {
    type: Array as () => TableColumn[],
    default: () => []
  },
  pageSize: {
    type: Number,
    default: 10
  }
});

const state = reactive({
  table: {
    data: [],
    columns: props.columns.length
      ? props.columns
      : ([
          { label: "名称", prop: "label" },
          { label: "数值", prop: "value" }
        ] as any),
    total: 0,
    currentPage: 1,
    pageSize: 10
  }
});

const condition = reactive({
  page: 1,
  pageSize: 10
});

const remoteMethod = query => {
  if (query) {
    setTimeout(() => {
      condition["page"] = query?.page;
      condition["pageSize"] = query?.pageSize || props.pageSize;
      Object.assign(condition, props.urlParams);
      getData();
    }, 200);
  }
};
const getData = async () => {
  tableLoading.value = true;
  props
    .url(condition)
    .then(res => {
      const response = config.parseData(res);
      state.table.data = response.data;
      state.table.total = response.total;
      state.table.pageSize = condition.pageSize;
      state.table.currentPage = condition.page;
      if (res.columns) {
        state.table.columns = res.columns;
      }
      emit("success");
    })
    .catch(e => {
      emit("failure", e);
    })
    .finally(() => {
      tableLoading.value = false;
    });
};

const pageChange = val => {
  state.table.currentPage = val;
  condition.page = val;
  getData();
};

const selectionChange = (val, ids) => {
  emit("update:modelValue", ids);
  emit("selectionChange", val, ids);
};

const handleClose = async () => {
  tSelectTableRef.value?.clear();
  tSelectTableRef.value?.blur();
};

const initializer = async () => {
  if (!props.isRemote) {
    tableLoading.value = false;
    state.table.data = props.options as any;
    state.table.columns = props.columns.length
      ? props.columns
      : ([
          { label: "名称", prop: "label" },
          { label: "数值", prop: "value" }
        ] as any);
    state.table.currentPage = 1;
    state.table.pageSize = props.limit == 0 ? props.options.length : props.limit;
    state.table.total = props.options.length;
    return;
  }
  getData();
};

onMounted(async () => {
  initializer();
});
</script>
