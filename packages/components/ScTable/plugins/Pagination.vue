<script setup>
import IconifyIconOnline from "@repo/components/ReIcon/src/iconifyIconOnline";
import { computed, onMounted, ref, watch } from "vue";
import { getLogger } from "@repo/utils";
import { config } from "../column";
import columnSetting from "../plugins/columnSetting.vue"; // 更新为新路径

const logger = getLogger("[ScTable][Pagination]");

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
      size: "default",
      cacheEnabled: false,
      pageMemoryEnabled: false
    })
  },
  // 卡片布局相关配置
  rowSize: { type: Number, default: 4 }, // 卡片布局行数
  colSize: { type: Number, default: 3 }, // 卡片布局列数
  tableLayout: { type: String, default: "table" }, // 表格布局类型：'table', 'card', 'list', 'virtual', 'canvas'
  cardLayout: { type: String, default: "card" }, // 卡片内部布局类型：'card', 'default'
  theme: { type: String, default: "" } // 主题
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
  cardLayout: props.cardLayout,
  draggable: false,
  crossHighlight: false,
  cacheEnabled: false,
  pageMemoryEnabled: false
});

// columnSetting组件的引用
const columnSettingRef = ref(null);

// 计算属性
const isListLayout = computed(() => props.tableLayout === "list");
const isCardLayout = computed(() => props.tableLayout === "card");
// 只有表格模式才显示表格设置
const isTableLayout = computed(() => props.tableLayout === "table");
const showTableSettings = computed(() => !props.hideSetting && isTableLayout.value);
const showColumnSettings = computed(() => !props.hideSetting && isTableLayout.value && props.columns && props.columns.length > 0);
// 列表模式显示设置按钮，但只显示拖拽选项
const showListSettings = computed(() => !props.hideSetting && isListLayout.value);
// 卡片模式显示设置按钮
const showCardSettings = computed(() => !props.hideSetting && isCardLayout.value);

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
    cardLayout: props.cardLayout,
    draggable: props.tableConfig.draggable ?? false,
    crossHighlight: props.tableConfig.crossHighlight ?? false,
    cacheEnabled: props.tableConfig.cacheEnabled ?? false,
    pageMemoryEnabled: props.tableConfig.pageMemoryEnabled ?? false
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

// 使用版本号避免深度监听 columns
const columnsVersion = computed(() => props.columns?.length ?? 0);
watch(
  columnsVersion,
  () => {
    // 在列数据变化时，可以进行处理
  }
);

// 使用版本号避免深度监听 tableConfig
const tableConfigVersion = computed(() => 
  `${props.tableConfig?.border}-${props.tableConfig?.stripe}-${props.tableConfig?.size}-${props.tableConfig?.draggable}`
);
watch(
  tableConfigVersion,
  () => {
    const newValue = props.tableConfig;
    if (newValue) {
      tableConfigData.value = {
        border: newValue.border ?? tableConfigData.value.border,
        stripe: newValue.stripe ?? tableConfigData.value.stripe,
        size: newValue.size || tableConfigData.value.size,
        rowSize: props.rowSize,
        colSize: props.colSize,
        cardLayout: props.cardLayout,
        draggable: newValue.draggable ?? tableConfigData.value.draggable,
        crossHighlight: newValue.crossHighlight ?? tableConfigData.value.crossHighlight,
        cacheEnabled: newValue.cacheEnabled ?? tableConfigData.value.cacheEnabled,
        pageMemoryEnabled: newValue.pageMemoryEnabled ?? tableConfigData.value.pageMemoryEnabled
      };
    }
  },
  { immediate: true }
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

// 监听拖拽排序变更
const handleDraggableChange = value => {
  tableConfigData.value.draggable = value;
  emit("save-config", { type: "table", config: tableConfigData.value });
};

// 监听缓存开启变更
const handleCacheEnabledChange = value => {
  tableConfigData.value.cacheEnabled = value;
  emit("save-config", { type: "table", config: tableConfigData.value });
};

// 监听缓存页数变更
const handleCachePageCountChange = value => {
  tableConfigData.value.cachePageCount = value;
  emit("save-config", { type: "table", config: tableConfigData.value });
};

// 监听页码缓存变更
const handlePageMemoryEnabledChange = value => {
  tableConfigData.value.pageMemoryEnabled = value;
  emit("save-config", { type: "table", config: tableConfigData.value });
};

// 监听十字标记变更
const handleCrossHighlightChange = value => {
  tableConfigData.value.crossHighlight = value;
  emit("save-config", { type: "table", config: tableConfigData.value });
};

// 监听行数变更
const handleRowSizeChange = value => {
  logger.info("行数变更: {}", value);
  tableConfigData.value.rowSize = value;
  // 确保最小值为 1
  if (value < 1) value = 1;
  emit("update:rowSize", value);
  emit("save-config", { type: "table", config: tableConfigData.value });
};

// 监听列数变更
const handleColSizeChange = value => {
  logger.info("列数变更: {}", value);
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
  <div class="pagination-container" :class="[`theme--${props.theme}`]">
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
      <ScTooltip v-if="!props.hideRefresh" content="刷新" placement="top">
        <el-button circle size="default" @click="handleRefresh">
          <IconifyIconOnline icon="ep:refresh" />
        </el-button>
      </ScTooltip>

      <!-- 列设置按钮 - 在列表布局和卡片布局下隐藏 -->
      <template v-if="!!showColumnSettings">
        <el-popover v-model:visible="columnSettingVisible" placement="bottom" :width="500" trigger="click" popper-class="column-settings-popover">
          <template #reference>
            <el-button circle size="default">
              <IconifyIconOnline icon="ep:list" />
            </el-button>
          </template>
          33
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
      </template>

      <!-- 表格设置按钮 - 仅在标准表格布局和Canvas表格布局下显示 -->
      <el-popover v-if="showTableSettings" v-model:visible="tableSettingVisible" placement="bottom" :width="340" trigger="click" popper-class="table-settings-popover">
        <template #reference>
          <el-button circle size="default">
            <IconifyIconOnline icon="ep:setting" />
          </el-button>
        </template>

        <div class="table-settings-container">
          <div class="settings-header">
            <IconifyIconOnline icon="ep:setting" class="settings-icon" />
            <h4 class="settings-title">表格设置</h4>
          </div>

          <div class="settings-body">
            <!-- 表格尺寸设置 -->
            <div class="setting-item full-width">
              <div class="setting-label-vertical">
                <div class="label-row">
                  <IconifyIconOnline icon="ep:zoom-in" class="setting-icon" />
                  <span>表格尺寸</span>
                </div>
                <div class="setting-control-full">
                  <el-segmented
                    :model-value="tableConfigData.size"
                    :options="[
                      { label: '大号', value: 'large' },
                      { label: '默认', value: 'default' },
                      { label: '小号', value: 'small' }
                    ]"
                    size="default"
                    @change="handleTableSizeChange"
                  />
                </div>
              </div>
            </div>

            <!-- 边框设置 -->
            <div class="setting-item">
              <div class="setting-label">
                <IconifyIconOnline icon="ep:grid" class="setting-icon" />
                <span>显示边框</span>
              </div>
              <div class="setting-control">
                <el-switch :model-value="tableConfigData.border" @change="handleBorderChange" />
              </div>
            </div>

            <!-- 斑马纹设置 -->
            <div class="setting-item">
              <div class="setting-label">
                <IconifyIconOnline icon="ep:menu" class="setting-icon" />
                <span>斑马纹样式</span>
              </div>
              <div class="setting-control">
                <el-switch :model-value="tableConfigData.stripe" @change="handleStripeChange" />
              </div>
            </div>

            <!-- 分隔线 -->
            <div class="settings-divider"></div>

            <!-- 拖拽排序 -->
            <div class="setting-item">
              <div class="setting-label">
                <IconifyIconOnline icon="ep:rank" class="setting-icon" />
                <span>启用拖拽排序</span>
              </div>
              <div class="setting-control">
                <el-switch :model-value="tableConfigData.draggable" @change="handleDraggableChange" />
              </div>
            </div>

            <!-- 十字标记 -->
            <div class="setting-item">
              <div class="setting-label">
                <IconifyIconOnline icon="ep:aim" class="setting-icon" />
                <span>单元格十字标记</span>
              </div>
              <div class="setting-control">
                <el-switch :model-value="tableConfigData.crossHighlight" @change="handleCrossHighlightChange" />
              </div>
            </div>

            <!-- 分隔线 -->
            <div class="settings-divider"></div>

            <!-- 缓存设置：数据缓存（固定预取3页） -->
            <div class="setting-item-with-tooltip">
              <div class="setting-label">
                <IconifyIconOnline icon="ep:document-copy" class="setting-icon" />
                <span>数据缓存</span>
                <ScTooltip content="开启后会预加载3页数据到缓存，翻页时优先使用缓存" placement="top" :show-after="200">
                  <IconifyIconOnline icon="ep:question-filled" class="help-icon" />
                </ScTooltip>
              </div>
              <div class="setting-control">
                <el-switch :model-value="tableConfigData.cacheEnabled" @change="handleCacheEnabledChange" />
              </div>
            </div>

            <!-- 页码缓存开关 -->
            <div class="setting-item-with-tooltip">
              <div class="setting-label">
                <IconifyIconOnline icon="ep:collection" class="setting-icon" />
                <span>页码记忆</span>
                <ScTooltip content="开启后，刷新或重新查询时从上次访问的页码开始" placement="top" :show-after="200">
                  <IconifyIconOnline icon="ep:question-filled" class="help-icon" />
                </ScTooltip>
              </div>
              <div class="setting-control">
                <el-switch :model-value="tableConfigData.pageMemoryEnabled" @change="handlePageMemoryEnabledChange" />
              </div>
            </div>
          </div>
        </div>
      </el-popover>

      <!-- 列表设置按钮 - 只显示拖拽排序选项 -->
      <el-popover v-if="showListSettings" v-model:visible="tableSettingVisible" placement="bottom" :width="340" trigger="click" popper-class="table-settings-popover">
        <template #reference>
          <el-button circle size="default">
            <IconifyIconOnline icon="ep:setting" />
          </el-button>
        </template>

        <div class="table-settings-container">
          <div class="settings-header">
            <IconifyIconOnline icon="ep:setting" class="settings-icon" />
            <h4 class="settings-title">列表设置</h4>
          </div>

          <div class="settings-body">
            <!-- 拖拽排序 -->
            <div class="setting-item">
              <div class="setting-label">
                <IconifyIconOnline icon="ep:rank" class="setting-icon" />
                <span>启用拖拽排序</span>
              </div>
              <div class="setting-control">
                <el-switch :model-value="tableConfigData.draggable" @change="handleDraggableChange" />
              </div>
            </div>
            <!-- 边框设置 -->
            <div class="setting-item">
              <div class="setting-label">
                <IconifyIconOnline icon="ep:border" class="setting-icon" />
                <span>显示边框</span>
              </div>
              <div class="setting-control">
                <el-switch :model-value="tableConfigData.border" @change="handleBorderChange" />
              </div>
            </div>
          </div>
        </div>
      </el-popover>

      <!-- 卡片设置按钮 - 显示拖拽排序和边框选项 -->
      <el-popover v-if="showCardSettings" v-model:visible="tableSettingVisible" placement="bottom" :width="340" trigger="click" popper-class="table-settings-popover">
        <template #reference>
          <el-button circle size="default">
            <IconifyIconOnline icon="ep:setting" />
          </el-button>
        </template>

        <div class="table-settings-container">
          <div class="settings-header">
            <IconifyIconOnline icon="ep:setting" class="settings-icon" />
            <h4 class="settings-title">卡片设置</h4>
          </div>

          <div class="settings-body">
            <!-- 拖拽排序 -->
            <div class="setting-item">
              <div class="setting-label">
                <IconifyIconOnline icon="ep:rank" class="setting-icon" />
                <span>启用拖拽排序</span>
              </div>
              <div class="setting-control">
                <el-switch :model-value="tableConfigData.draggable" @change="handleDraggableChange" />
              </div>
            </div>
            <!-- 边框设置 -->
            <div class="setting-item">
              <div class="setting-label">
                <IconifyIconOnline icon="ep:border" class="setting-icon" />
                <span>显示边框</span>
              </div>
              <div class="setting-control">
                <el-switch :model-value="tableConfigData.border" @change="handleBorderChange" />
              </div>
            </div>
          </div>
        </div>
      </el-popover>
    </div>
    <!-- 滚动分页触发器（卡片/列表布局） -->
    <div v-if="props.paginationType === 'scroll'" class="scroll-pagination-trigger" style="width: 100%; height: 1px; opacity: 0" />
  </div>
</template>

<style lang="scss" scoped>
@use "@/styles/mixins.scss" as *;

.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  min-height: 56px;
  flex-shrink: 0; /* 防止被压缩 */
  box-sizing: border-box;
  margin: 0;
  padding: 14px 20px;
  background: var(--stitch-lay-bg-panel);
  border-radius: 10px;

  // 主题变体
  @mixin theme-variant($type, $color, $light, $bg) {
    .settings-header {
      background: linear-gradient(135deg, 
        #{$bg} 0%, 
        var(--stitch-lay-bg-panel) 50%,
        #{$bg} 100%);
      box-shadow: 0 2px 8px color-mix(in srgb, #{$color}, transparent 90%);
      
      .settings-icon {
        color: #{$color};
      }
    }
    
    .table-actions .el-button:hover {
      border-color: #{$color};
      color: #{$color};
    }

    .setting-item:hover,
    .setting-item-with-tooltip:hover {
      border-color: #{$light};
      box-shadow: 0 2px 8px color-mix(in srgb, #{$color}, transparent 85%);
    }

    .setting-control-full :deep(.el-segmented) {
      --el-segmented-item-selected-bg-color: #{$bg};
      --el-segmented-item-selected-color: #{$color};
    }
  }

  &.theme--primary { @include theme-variant('primary', var(--stitch-lay-primary), var(--stitch-lay-primary-light), var(--stitch-lay-primary-alpha)); }
  &.theme--success { @include theme-variant('success', var(--stitch-lay-success), var(--stitch-lay-success-light), var(--stitch-lay-success-bg)); }
  &.theme--warning { @include theme-variant('warning', var(--stitch-lay-warning), var(--stitch-lay-warning-light), var(--stitch-lay-warning-bg)); }
  &.theme--danger { @include theme-variant('danger', var(--stitch-lay-error), var(--stitch-lay-error-light), var(--stitch-lay-error-bg)); }
  &.theme--info { @include theme-variant('info', var(--stitch-lay-info), var(--stitch-lay-info-light), var(--stitch-lay-info-bg)); }
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
  gap: 10px;
  flex-shrink: 0;
  
  .el-button {
    border-radius: 8px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    border: 1px solid var(--stitch-lay-border);
    
    &:hover {
      transform: translateY(-2px) scale(1.05);
      box-shadow: var(--stitch-lay-shadow-sm);
      border-color: var(--stitch-lay-primary);
    }
    
    &:active {
      transform: translateY(0) scale(1);
    }
  }
}

// 表格设置容器样式 - 现代化设计
.table-settings-container {
  padding: 16px;
  max-height: 560px;
  overflow-y: auto;
  overflow-x: hidden;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: var(--stitch-lay-bg-hover);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--stitch-lay-bg-active);
    border-radius: 3px;
    
    &:hover {
      background: var(--stitch-lay-primary-light);
    }
  }
}

.settings-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  margin-bottom: 20px;
  background: linear-gradient(135deg, 
    var(--stitch-lay-primary-alpha) 0%, 
    var(--stitch-lay-bg-panel) 50%,
    var(--stitch-lay-primary-alpha) 100%);
  border-radius: 10px;
  box-shadow: 0 2px 8px color-mix(in srgb, var(--stitch-lay-primary), transparent 90%);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    animation: settingsShimmer 3s infinite;
  }

  .settings-icon {
    font-size: 24px;
    color: var(--stitch-lay-primary);
    animation: rotate 3s linear infinite;
    position: relative;
    z-index: 1;
  }

  .settings-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--stitch-lay-text-main);
    position: relative;
    z-index: 1;
  }
}

@keyframes settingsShimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.settings-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: var(--stitch-lay-bg-group);
  border-radius: 10px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  cursor: pointer;

  &:hover {
    background: linear-gradient(135deg, var(--stitch-lay-bg-hover) 0%, var(--stitch-lay-bg-group) 100%);
    border-color: var(--stitch-lay-primary-light);
    transform: translateX(4px);
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
  }
  
  &:active {
    transform: translateX(2px) scale(0.98);
  }
}

.setting-item-with-tooltip {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: var(--stitch-lay-bg-group);
  border-radius: 10px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  cursor: pointer;

  &:hover {
    background: linear-gradient(135deg, var(--stitch-lay-bg-hover) 0%, var(--stitch-lay-bg-group) 100%);
    border-color: var(--stitch-lay-primary-light);
    transform: translateX(4px);
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
  }
  
  &:active {
    transform: translateX(2px) scale(0.98);
  }
}

.setting-item.full-width {
  flex-direction: column;
  align-items: stretch;
}

.setting-label-vertical {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;

  .label-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: var(--stitch-lay-text-normal);
    font-weight: 500;
  }
}

.setting-control-full {
  width: 100%;
  
  :deep(.el-segmented) {
    width: 100%;
  }
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: var(--stitch-lay-text-normal);
  font-weight: 500;
  flex: 1;

  .setting-icon {
    font-size: 18px;
    color: var(--stitch-lay-primary);
    transition: transform 0.3s ease;
  }
  
  .help-icon {
    font-size: 15px;
    color: var(--stitch-lay-text-secondary);
    cursor: help;
    margin-left: 4px;
    transition: all 0.3s ease;
    
    &:hover {
      color: var(--stitch-lay-primary);
      transform: scale(1.15);
    }
  }
}

.setting-item:hover .setting-icon,
.setting-item-with-tooltip:hover .setting-icon {
  transform: scale(1.1) rotate(5deg);
}

.setting-control {
  flex-shrink: 0;
}

.settings-divider {
  height: 2px;
  background: linear-gradient(90deg, 
    transparent 0%, 
    var(--stitch-lay-primary-alpha) 20%,
    var(--stitch-lay-primary-light) 50%,
    var(--stitch-lay-primary-alpha) 80%,
    transparent 100%);
  margin: 12px 0;
  border-radius: 1px;
}
</style>