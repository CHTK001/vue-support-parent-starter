<script setup>
import IconifyIconOnline from "@repo/components/ReIcon/src/iconifyIconOnline";
import { computed, onMounted, ref, watch } from "vue";
import { config } from "../column";
import columnSetting from "../plugins/columnSetting.vue"; // 更新为新路径

// 定义组件属性
const props = defineProps({
  currentPage: { type: Number, default: 1 },
  pageSize: { type: Number, default: config.pageSize },
  pageSizes: { type: Array, default: () => config.pageSizes },
  total: { type: Number, default: 0 },
  layout: { type: String, default: config.paginationLayout },
  paginationType: { type: String, default: "default" }, // 分页类型：default-当前分页，scroll-滚动分页
  loading: { type: Boolean, default: false },
  hidePagination: { type: Boolean, default: false },
  hideRefresh: { type: Boolean, default: false },
  hideSetting: { type: Boolean, default: false },
  showColumnSetting: { type: Boolean, default: false },
  // 表格当前列配置
  columns: { type: Array, default: () => [] },
  // 表格设置
  tableConfig: {
    type: Object,
    default: () => ({
      border: false,
      stripe: false,
      size: "default"
    })
  },
  // 卡片布局相关配置
  rowSize: { type: Number, default: 4 }, // 卡片布局行数
  colSize: { type: Number, default: 3 }, // 卡片布局列数
  tableLayout: { type: String, default: "table" }, // 表格布局类型：'table', 'card', 'list', 'virtual', 'canvas'
  cardLayout: { type: String, default: "card" } // 卡片内部布局类型：'card', 'default'
});

// 定义组件事件
const emit = defineEmits([
  "update:currentPage",
  "current-change",
  "update:total",
  "total-change",
  "sizeChange",
  "currentChange",
  "update:pageSize",
  "size-change",
  "load-more",
  "refresh",
  "column-setting",
  "table-setting",
  "save-config",
  "get-columns",
  "get-table-config",
  "update:rowSize",
  "update:colSize",
  "update:cardLayout"
]);

// 响应式数据
const currentPageValue = ref(props.currentPage);
const pageSizeValue = ref(props.pageSize);
const columnSettingVisible = ref(false);
const tableSettingVisible = ref(false);

// 表格设置相关数据
const tableConfigData = ref({
  border: false,
  stripe: false,
  size: "default",
  rowSize: props.rowSize,
  colSize: props.colSize,
  cardLayout: props.cardLayout
});

// columnSetting组件的引用
const columnSettingRef = ref(null);

// 计算属性
const isListLayout = computed(() => props.tableLayout === "list");
const isCardLayout = computed(() => props.tableLayout === "card");
const showTableSettings = computed(() => !props.hideSetting && !isListLayout.value);
const showColumnSettings = computed(() => !props.hideSetting && !isListLayout.value && !isCardLayout.value && props.columns && props.columns.length > 0);

// 初始化表格设置
const getTableConfig = () => {
  emit("get-table-config");
  // 更新表格配置
  tableConfigData.value = {
    border: props.tableConfig.border ?? false,
    stripe: props.tableConfig.stripe ?? false,
    size: props.tableConfig.size || "default",
    rowSize: props.rowSize,
    colSize: props.colSize,
    cardLayout: props.cardLayout
  };
};

// 监听属性变化
watch(
  () => props.currentPage,
  newValue => {
    currentPageValue.value = newValue;
  },
  { immediate: true }
);

watch(
  () => props.pageSize,
  newValue => {
    pageSizeValue.value = newValue;
  },
  { immediate: true }
);

watch(
  () => props.columns,
  newValue => {
    // 在列数据变化时，可以进行处理
  },
  { deep: true }
);

watch(
  () => props.tableConfig,
  newValue => {
    if (newValue) {
      tableConfigData.value = {
        border: newValue.border ?? tableConfigData.value.border,
        stripe: newValue.stripe ?? tableConfigData.value.stripe,
        size: newValue.size || tableConfigData.value.size,
        rowSize: props.rowSize,
        colSize: props.colSize,
        cardLayout: props.cardLayout
      };
    }
  },
  { deep: true }
);

watch(
  () => props.rowSize,
  newValue => {
    tableConfigData.value.rowSize = newValue;
  },
  { immediate: true }
);

watch(
  () => props.colSize,
  newValue => {
    tableConfigData.value.colSize = newValue;
  },
  { immediate: true }
);

// 监听cardLayout变更
watch(
  () => props.cardLayout,
  newValue => {
    tableConfigData.value.cardLayout = newValue;
  },
  { immediate: true }
);

// 分页点击
const handleCurrentChange = page => {
  currentPageValue.value = page;
  emit("update:currentPage", page);
  emit("current-change", page);
};

// 监听尺寸变更
const handleSizeChange = size => {
  pageSizeValue.value = size;
  emit("update:pageSize", size);
  emit("size-change", size);
};

// 监听表格尺寸变更
const handleTableSizeChange = size => {
  tableConfigData.value.size = size;
  emit("save-config", { type: "table", config: tableConfigData.value });
};

// 监听边框样式变更
const handleBorderChange = value => {
  tableConfigData.value.border = value;
  emit("save-config", { type: "table", config: tableConfigData.value });
};

// 监听斑马纹样式变更
const handleStripeChange = value => {
  tableConfigData.value.stripe = value;
  emit("save-config", { type: "table", config: tableConfigData.value });
};

// 监听行数变更
const handleRowSizeChange = value => {
  console.log("行数变更:", value);
  tableConfigData.value.rowSize = value;
  // 确保最小值为 1
  if (value < 1) value = 1;
  emit("update:rowSize", value);
  emit("save-config", { type: "table", config: tableConfigData.value });
};

// 监听列数变更
const handleColSizeChange = value => {
  console.log("列数变更:", value);
  tableConfigData.value.colSize = value;
  // 确保最小值为 1
  if (value < 1) value = 1;
  emit("update:colSize", value);
  emit("save-config", { type: "table", config: tableConfigData.value });
};

// 加载更多数据（滚动分页）
const loadMore = () => {
  if (props.paginationType !== "scroll") return;
  emit("load-more");
};

// 刷新表格数据
const handleRefresh = () => {
  emit("refresh");
};

// 打开列设置
const openColumnSetting = () => {
  columnSettingVisible.value = true;
  emit("column-setting");
};

// 打开表格设置
const openTableSetting = () => {
  tableSettingVisible.value = true;
  getTableConfig();
  emit("table-setting");
};

// 处理列设置保存
const handleColumnSave = columns => {
  columnSettingVisible.value = false;
  emit("save-config", { type: "column", config: columns });
};

// 处理列设置重置
const handleColumnReset = () => {
  emit("save-config", { type: "column", config: props.columns });
};

// 处理实时列设置更新
const handleLiveColumnUpdate = columns => {
  emit("save-config", { type: "column", config: columns });
};

// 处理cardLayout变更
const handleCardLayoutChange = value => {
  tableConfigData.value.cardLayout = value;
  emit("update:cardLayout", value);
  emit("save-config", { type: "table", config: tableConfigData.value });
};

// 在组件挂载时初始化表格配置
onMounted(() => {
  // 初始化表格配置
  getTableConfig();
});
</script>

<template>
  <div class="pagination-container">
    <!-- 标准分页 -->
    <el-pagination
      v-if="!props.hidePagination && props.paginationType === 'default'"
      v-model:currentPage="currentPageValue"
      background
      :small="false"
      :layout="props.layout"
      :total="props.total"
      :page-size="pageSizeValue"
      :page-sizes="props.pageSizes"
      @current-change="handleCurrentChange"
      @update:page-size="handleSizeChange"
    />

    <!-- 操作按钮 -->
    <div class="table-actions">
      <el-tooltip v-if="!props.hideRefresh" content="刷新" placement="top" :effect="'light'">
        <el-button circle size="default" @click="handleRefresh">
          <IconifyIconOnline icon="ep:refresh" />
        </el-button>
      </el-tooltip>

      <!-- 列设置按钮 - 在列表布局和卡片布局下隐藏 -->
      <el-popover v-if="showColumnSettings" v-model:visible="columnSettingVisible" placement="bottom" :width="500" trigger="click" popper-class="column-settings-popover">
        <template #reference>
          <el-button circle size="default">
            <IconifyIconOnline icon="ep:list" />
          </el-button>
        </template>
        <div class="column-setting-container">
          <component
            :is="columnSetting"
            ref="columnSettingRef"
            :column="columns"
            :layout="tableLayout"
            :live-update="true"
            @save="handleColumnSave"
            @back="handleColumnReset"
            @live-update="handleLiveColumnUpdate"
          />
        </div>
      </el-popover>

      <!-- 表格设置按钮 - 仅在标准表格布局和Canvas表格布局下显示 -->
      <el-popover v-if="showTableSettings" v-model:visible="tableSettingVisible" placement="bottom" :width="340" trigger="click" popper-class="table-settings-popover">
        <template #reference>
          <el-button circle size="default">
            <IconifyIconOnline icon="ep:setting" />
          </el-button>
        </template>

        <div class="table-settings-container">
          <h4 class="settings-title">表格设置</h4>

          <!-- 表格尺寸设置 -->
          <div class="setting-item">
            <span class="setting-label">表格尺寸:</span>
            <div class="setting-control">
              <el-radio-group v-model="tableConfigData.size" size="small" @change="handleTableSizeChange">
                <el-radio-button label="large">大号</el-radio-button>
                <el-radio-button label="default">默认</el-radio-button>
                <el-radio-button label="small">小号</el-radio-button>
              </el-radio-group>
            </div>
          </div>

          <!-- 边框设置 -->
          <div class="setting-item">
            <span class="setting-label">显示边框:</span>
            <div class="setting-control">
              <el-switch v-model="tableConfigData.border" @change="handleBorderChange" />
            </div>
          </div>

          <!-- 斑马纹设置 -->
          <div class="setting-item">
            <span class="setting-label">显示斑马纹:</span>
            <div class="setting-control">
              <el-switch v-model="tableConfigData.stripe" @change="handleStripeChange" />
            </div>
          </div>

          <!-- 卡片布局行数设置 -->
          <div v-if="isCardLayout" class="setting-item">
            <span class="setting-label">行显示数量:</span>
            <div class="setting-control">
              <el-input-number v-model="tableConfigData.rowSize" :min="1" :max="10" size="small" @change="handleRowSizeChange" />
            </div>
          </div>

          <!-- 卡片布局列数设置 -->
          <div v-if="isCardLayout" class="setting-item">
            <span class="setting-label">列显示数量:</span>
            <div class="setting-control">
              <el-input-number v-model="tableConfigData.colSize" :min="1" :max="8" size="small" @change="handleColSizeChange" />
            </div>
          </div>

          <!-- 卡片布局类型设置 -->
          <div v-if="isCardLayout" class="setting-item">
            <span class="setting-label">卡片样式:</span>
            <div class="setting-control">
              <el-radio-group v-model="tableConfigData.cardLayout" size="small" @change="handleCardLayoutChange">
                <el-radio-button label="card">卡片</el-radio-button>
                <el-radio-button label="default">无边框</el-radio-button>
              </el-radio-group>
            </div>
          </div>
        </div>
      </el-popover>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  min-height: 40px;
  flex-shrink: 0; /* 防止被压缩 */
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.pagination-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 确保分页控件不会撑大父元素 */
:deep(.el-pagination) {
  flex-wrap: wrap;
  justify-content: flex-end;
  margin: 0;
  padding: 0;
  white-space: normal;
  box-sizing: border-box;
  width: auto;
}

/* 在小屏幕上优化显示 */
@media (max-width: 768px) {
  .pagination-container {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .pagination-right {
    width: 100%;
    justify-content: flex-end;
  }
}

.table-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.settings-title {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-label {
  font-size: 14px;
  color: var(--el-text-color-regular);
  flex-basis: 100px;
}

.setting-control {
  flex-grow: 1;
  text-align: right;
}

/* 暗黑模式适配 */
html.dark .table-settings-container,
html.dark .column-setting-container {
  background-color: var(--el-bg-color);
}
</style>
