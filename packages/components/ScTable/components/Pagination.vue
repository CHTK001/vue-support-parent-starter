<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { config } from '../column';
import columnSetting from '../columnSetting.vue';
// 移除 Element Plus 图标导入
// import { Setting, Refresh, List } from '@element-plus/icons-vue';

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
      size: 'default'
    })
  }
});

// 定义组件事件
const emit = defineEmits([
  'update:currentPage',
  'current-change',
  'update:pageSize',
  'size-change',
  'load-more',
  'refresh',
  'column-setting',
  'table-setting',
  'save-config',
  'get-columns',
  'get-table-config'
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
  size: 'default'
});

// columnSetting组件的引用
const columnSettingRef = ref(null);

// 初始化表格设置
const getTableConfig = () => {
  emit('get-table-config');
  // 更新表格配置
  tableConfigData.value = {
    border: props.tableConfig.border ?? false,
    stripe: props.tableConfig.stripe ?? false,
    size: props.tableConfig.size || 'default'
  };
};

// 监听属性变化
watch(() => props.currentPage, (newValue) => {
  currentPageValue.value = newValue;
}, { immediate: true });

watch(() => props.pageSize, (newValue) => {
  pageSizeValue.value = newValue;
}, { immediate: true });

watch(() => props.columns, (newValue) => {
  // 在列数据变化时，可以进行处理
}, { deep: true });

watch(() => props.tableConfig, (newValue) => {
  if (newValue) {
    tableConfigData.value = {
      border: newValue.border ?? tableConfigData.value.border,
      stripe: newValue.stripe ?? tableConfigData.value.stripe,
      size: newValue.size || tableConfigData.value.size
    };
  }
}, { deep: true });

// 分页点击
const handleCurrentChange = (page) => {
  currentPageValue.value = page;
  emit('update:currentPage', page);
  emit('current-change', page);
};

// 监听尺寸变更
const handleSizeChange = (size) => {
  pageSizeValue.value = size;
  emit('update:pageSize', size);
  emit('size-change', size);
};

// 监听表格尺寸变更
const handleTableSizeChange = (size) => {
  tableConfigData.value.size = size;
  emit('save-config', { type: 'table', config: tableConfigData.value });
};

// 监听边框样式变更
const handleBorderChange = (value) => {
  tableConfigData.value.border = value;
  emit('save-config', { type: 'table', config: tableConfigData.value });
};

// 监听斑马纹样式变更
const handleStripeChange = (value) => {
  tableConfigData.value.stripe = value;
  emit('save-config', { type: 'table', config: tableConfigData.value });
};

// 加载更多数据（滚动分页）
const loadMore = () => {
  if (props.paginationType !== 'scroll') return;
  emit('load-more');
};

// 刷新表格数据
const handleRefresh = () => {
  emit('refresh');
};

// 打开列设置
const openColumnSetting = () => {
  columnSettingVisible.value = true;
  emit('column-setting');
};

// 打开表格设置
const openTableSetting = () => {
  tableSettingVisible.value = true;
  getTableConfig();
  emit('table-setting');
};

// 处理列设置保存
const handleColumnSave = (columns) => {
  columnSettingVisible.value = false;
  emit('save-config', { type: 'column', config: columns });
};

// 处理列设置重置
const handleColumnReset = () => {
  emit('save-config', { type: 'column', config: props.columns });
};

// 处理实时列设置更新
const handleLiveColumnUpdate = (columns) => {
  emit('save-config', { type: 'column', config: columns });
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
    <el-pagination v-if="!props.hidePagination && props.paginationType === 'default'"
      v-model:currentPage="currentPageValue" background :small="false" :layout="props.layout" :total="props.total"
      :page-size="pageSizeValue" :page-sizes="props.pageSizes" @current-change="handleCurrentChange"
      @update:page-size="handleSizeChange" />

    <!-- 操作按钮 -->
    <div class="table-actions">
      <el-tooltip content="刷新" placement="top" :effect="'light'" v-if="!props.hideRefresh">
        <el-button circle size="default" @click="handleRefresh">
          <IconifyIconOnline icon="ep:refresh" />
        </el-button>
      </el-tooltip>

      <el-popover v-if="columns && columns.length > 0 && !props.hideSetting" placement="bottom" :width="500"
        trigger="click" v-model:visible="columnSettingVisible" popper-class="column-settings-popover">
        <template #reference>
          <el-button circle size="default">
            <IconifyIconOnline icon="ep:list" />
          </el-button>
        </template>
        <div class="column-setting-container">
          <component :is="columnSetting" ref="columnSettingRef" :column="columns" :layout="'table'" :live-update="true"
            @save="handleColumnSave" @back="handleColumnReset" @live-update="handleLiveColumnUpdate">
          </component>
        </div>
      </el-popover>

      <el-popover v-if="!props.hideSetting" placement="top" title="表格设置" :width="400" trigger="click" :hide-after="0">
        <template #reference>
          <el-button circle size="default">
            <IconifyIconOnline icon="ep:setting" />
          </el-button>
        </template>
        <div class="setting-popover">
          <div class="setting-content">
            <el-divider />
            <!-- 自定义设置 -->
            <el-form label-width="80px" label-position="left">
              <el-form-item label="表格尺寸">
                <el-radio-group v-model="tableConfigData.size" size="small" @change="handleTableSizeChange">
                  <el-radio-button label="large">大</el-radio-button>
                  <el-radio-button label="default">正常</el-radio-button>
                  <el-radio-button label="small">小</el-radio-button>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="样式">
                <el-checkbox v-model="tableConfigData.border" label="纵向边框" @change="handleBorderChange"></el-checkbox>
                <el-checkbox v-model="tableConfigData.stripe" label="斑马纹" @change="handleStripeChange"></el-checkbox>
              </el-form-item>
            </el-form>
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
  padding: 10px 0;
}

.table-actions {
  display: flex;
  gap: 8px;
}

.load-more-container {
  display: flex;
  justify-content: center;
  margin-top: 10px;

  .no-more-text {
    color: var(--el-text-color-secondary);
    font-size: 14px;
  }
}

.setting-popover {
  .setting-title {
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 15px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    padding-bottom: 10px;
  }

  .setting-content {
    margin-bottom: 15px;

    h4 {
      margin: 10px 0;
      font-size: 14px;
      color: var(--el-text-color-regular);
    }

    .divider {
      height: 1px;
      background-color: var(--el-border-color-lighter);
      margin: 12px 0;
    }

    .preset-styles {
      margin-bottom: 10px;

      .preset-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 8px;
      }
    }

    .setting-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }

    .column-setting-header {
      margin-bottom: 10px;
    }

    .column-list {
      max-height: 200px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
  }

  .setting-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
}

.column-setting-container {
  // 列设置容器样式
  max-height: 400px;
  overflow: auto;
}
</style>