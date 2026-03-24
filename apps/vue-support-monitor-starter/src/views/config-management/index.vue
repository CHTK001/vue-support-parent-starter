<template>
  <div class="config-management system-container modern-bg">
    <!-- 统计卡片区域 -->
    <div class="stats-row">
      <ScCard
        layout="stats-simple"
        theme="purple"
        icon="ri:settings-3-line"
        :value="stats.total"
        label="配置总数"
      />
      <ScCard
        layout="stats-simple"
        theme="success"
        icon="ri:checkbox-circle-line"
        :value="stats.enabled"
        label="已启用"
      />
      <ScCard
        layout="stats-simple"
        theme="default"
        icon="ri:close-circle-line"
        :value="stats.disabled"
        label="已禁用"
      />
      <ScCard
        layout="stats-simple"
        theme="blue"
        icon="ri:global-line"
        :value="Object.keys(stats.envStats).length"
        label="环境数"
      />
    </div>

    <!-- 工具栏 -->
    <div class="toolbar-section">
      <div class="toolbar-left">
        <el-button @click="reload">
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
          刷新
        </el-button>
        <el-button type="primary" @click="openEdit()">
          <IconifyIconOnline icon="ri:add-line" class="mr-1" />
          新增配置
        </el-button>
        <el-input
          v-model="params.keyword"
          placeholder="搜索配置键/值/描述"
          class="search-input"
          clearable
          @keyup.enter="reload"
        >
          <template #prefix>
            <IconifyIconOnline icon="ri:search-line" />
          </template>
        </el-input>
        <el-select
          v-model="params.env"
          placeholder="环境"
          clearable
          class="filter-select"
          @change="reload"
        >
          <el-option label="全部环境" value="" />
          <el-option v-for="env in envList" :key="env" :label="env" :value="env" />
        </el-select>
        <el-select
          v-model="params.status"
          placeholder="状态"
          clearable
          class="filter-select"
          @change="reload"
        >
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
        <el-button type="primary" @click="reload">
          <IconifyIconOnline icon="ri:search-2-line" class="mr-1" />
          搜索
        </el-button>
      </div>
      <div class="toolbar-right">
        <el-button @click="openHistoryDialog">
          <IconifyIconOnline icon="ri:history-line" class="mr-1" />
          推送历史
        </el-button>
        <el-button 
          :disabled="selectedConfigs.length === 0" 
          @click="openPushDialog"
        >
          <IconifyIconOnline icon="ri:send-plane-line" class="mr-1" />
          下发配置 ({{ selectedConfigs.length }})
        </el-button>
      </div>
    </div>

    <!-- 配置列表 -->
    <div class="table-section">
      <ScTable
        ref="tableRef"
        :url="getConfigPageList"
        :params="params"
        row-key="monitorSysGenConfigId"
        layout="card"
        :col-size="3"
        :row-size="4"
        :page-size="12"
        table-name="config-management-list"
        @selection-change="handleSelectionChange"
      >
        <template #default="{ row }">
          <div class="config-card" :class="{ disabled: row.monitorSysGenConfigStatus === 0 }">
            <div class="card-header">
              <div class="config-key">
                <el-checkbox 
                  :model-value="isSelected(row)" 
                  @change="toggleSelect(row)"
                  @click.stop
                />
                <span class="key-text">{{ row.monitorSysGenConfigKey }}</span>
              </div>
              <div class="config-badges">
                <el-tag 
                  size="small" 
                  :type="row.monitorSysGenConfigStatus === 1 ? 'success' : 'info'"
                >
                  {{ row.monitorSysGenConfigStatus === 1 ? '启用' : '禁用' }}
                </el-tag>
                <el-tag 
                  v-if="row.monitorSysGenConfigEnv" 
                  size="small" 
                  :type="getEnvTagType(row.monitorSysGenConfigEnv)"
                >
                  {{ row.monitorSysGenConfigEnv }}
                </el-tag>
              </div>
            </div>
            <div class="card-body">
              <div class="config-value">
                <IconifyIconOnline icon="ri:code-line" class="value-icon" />
                <span class="value-text" :title="row.monitorSysGenConfigValue">
                  {{ row.monitorSysGenConfigValue || '—' }}
                </span>
              </div>
              <div class="config-desc" v-if="row.monitorSysGenConfigDescription">
                <IconifyIconOnline icon="ri:file-text-line" class="desc-icon" />
                <span class="desc-text">{{ row.monitorSysGenConfigDescription }}</span>
              </div>
              <div class="config-app" v-if="row.monitorSysGenConfigApp">
                <IconifyIconOnline icon="ri:apps-line" class="app-icon" />
                <span class="app-text">{{ row.monitorSysGenConfigApp }}</span>
              </div>
            </div>
            <div class="card-footer">
              <div class="update-time">
                <IconifyIconOnline icon="ri:time-line" class="time-icon" />
                {{ formatTime(row.updateTime) }}
              </div>
              <div class="card-actions">
                <el-button size="small" type="primary" plain @click.stop="openEdit(row)">
                  <IconifyIconOnline icon="ri:edit-line" />
                </el-button>
                <el-button size="small" plain @click.stop="openPushSingle(row)">
                  <IconifyIconOnline icon="ri:send-plane-line" />
                </el-button>
                <el-button size="small" type="danger" plain @click.stop="handleDelete(row)">
                  <IconifyIconOnline icon="ri:delete-bin-line" />
                </el-button>
              </div>
            </div>
          </div>
        </template>
      </ScTable>
    </div>

    <!-- 编辑对话框 -->
    <ConfigEditDialog 
      v-model:visible="editVisible" 
      :config="currentConfig"
      :env-list="envList"
      @success="onEditSuccess"
    />

    <!-- 下发对话框 -->
    <ConfigPushDialog
      v-model:visible="pushVisible"
      :configs="selectedConfigs"
      @success="onPushSuccess"
    />

    <!-- 推送历史对话框 -->
    <PushHistoryDialog
      v-model:visible="historyVisible"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessageBox } from 'element-plus';
import { message } from '@repo/utils';
import ScTable from '@repo/components/ScTable/index.vue';
import { ScCard } from '@repo/components';
import { 
  getConfigPageList, 
  deleteConfig, 
  getEnvList as fetchEnvList,
  getConfigStats,
  type MonitorConfig,
  type ConfigStats
} from '@/api/config';
import ConfigEditDialog from './components/ConfigEditDialog.vue';
import ConfigPushDialog from './components/ConfigPushDialog.vue';
import PushHistoryDialog from './components/PushHistoryDialog.vue';

const tableRef = ref();
const editVisible = ref(false);
const pushVisible = ref(false);
const historyVisible = ref(false);
const currentConfig = ref<MonitorConfig | null>(null);
const selectedConfigs = ref<MonitorConfig[]>([]);
const envList = ref<string[]>([]);

const params = reactive({
  keyword: '',
  env: '',
  status: undefined as number | undefined,
});

const stats = reactive<ConfigStats>({
  total: 0,
  enabled: 0,
  disabled: 0,
  envStats: {},
});

// 加载环境列表
async function loadEnvList() {
  try {
    const res: any = await fetchEnvList();
    if (res?.code === '00000') {
      envList.value = res.data || [];
    }
  } catch (e) {
    console.error('加载环境列表失败', e);
  }
}

// 加载统计数据
async function loadStats() {
  try {
    const res: any = await getConfigStats();
    if (res?.code === '00000' && res.data) {
      Object.assign(stats, res.data);
    }
  } catch (e) {
    console.error('加载统计数据失败', e);
  }
}

// 刷新列表
function reload() {
  tableRef.value?.reload?.(params, 1);
  loadStats();
}

// 打开编辑对话框
function openEdit(config?: MonitorConfig) {
  currentConfig.value = config || null;
  editVisible.value = true;
}

// 打开下发对话框（批量）
function openPushDialog() {
  if (selectedConfigs.value.length === 0) {
    return message('请选择要下发的配置', { type: 'warning' });
  }
  pushVisible.value = true;
}

// 打开下发对话框（单个）
function openPushSingle(config: MonitorConfig) {
  selectedConfigs.value = [config];
  pushVisible.value = true;
}

// 打开推送历史对话框
function openHistoryDialog() {
  historyVisible.value = true;
}

// 删除配置
async function handleDelete(config: MonitorConfig) {
  try {
    await ElMessageBox.confirm(
      `确认删除配置 "${config.monitorSysGenConfigKey}"？`,
      '删除确认',
      { type: 'warning' }
    );
    
    const res: any = await deleteConfig(config.monitorSysGenConfigId!);
    if (res?.code === '00000') {
      message('删除成功', { type: 'success' });
      reload();
    } else {
      message(res?.msg || '删除失败', { type: 'error' });
    }
  } catch (e) {
    if (e !== 'cancel') {
      console.error('删除失败', e);
    }
  }
}

// 选择变更
function handleSelectionChange(selection: MonitorConfig[]) {
  selectedConfigs.value = selection;
}

// 检查是否选中
function isSelected(config: MonitorConfig): boolean {
  return selectedConfigs.value.some(c => c.monitorSysGenConfigId === config.monitorSysGenConfigId);
}

// 切换选择
function toggleSelect(config: MonitorConfig) {
  const index = selectedConfigs.value.findIndex(
    c => c.monitorSysGenConfigId === config.monitorSysGenConfigId
  );
  if (index === -1) {
    selectedConfigs.value.push(config);
  } else {
    selectedConfigs.value.splice(index, 1);
  }
}

// 编辑成功回调
function onEditSuccess() {
  reload();
}

// 下发成功回调
function onPushSuccess() {
  selectedConfigs.value = [];
}

// 获取环境标签类型
function getEnvTagType(env: string): 'success' | 'warning' | 'danger' | 'info' {
  switch (env?.toLowerCase()) {
    case 'prod':
    case 'production':
      return 'danger';
    case 'test':
    case 'testing':
      return 'warning';
    case 'dev':
    case 'development':
      return 'success';
    default:
      return 'info';
  }
}

// 格式化时间
function formatTime(time: string): string {
  if (!time) return '—';
  return new Date(time).toLocaleString('zh-CN');
}

onMounted(() => {
  loadEnvList();
  loadStats();
});
</script>

<style scoped lang="scss">
@use "@/styles/mixins.scss" as *;
@use "@/styles/variables.scss" as *;

.config-management {
  @include system-container;
  @include modern-bg;
  @include flex-column;
  padding: $padding-container;
  gap: $spacing-lg;
}

// 统计卡片
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $spacing-lg;

  @include respond-to(lg) {
    grid-template-columns: repeat(2, 1fr);
  }

  @include respond-to(sm) {
    grid-template-columns: 1fr;
  }
}

// 工具栏
.toolbar-section {
  @include toolbar-style;

  .toolbar-left {
    @include flex-align-center;
    gap: $spacing-md;
  }

  .toolbar-right {
    @include flex-align-center;
    gap: $spacing-md;
  }

  .search-input {
    width: 280px;

    :deep(.el-input__wrapper) {
      border-radius: $radius-md;
    }
  }

  .filter-select {
    width: 140px;

    :deep(.el-input__wrapper) {
      border-radius: $radius-md;
    }
  }
}

// 表格区域
.table-section {
  padding: $spacing-xl $spacing-4xl;
}

// 配置卡片
.config-card {
  @include card-base;
  @include flex-column;
  padding: $spacing-lg;
  height: 100%;

  &:hover {
    @include card-hover;
  }

  &.disabled {
    opacity: 0.7;
    background: var(--el-fill-color-lighter);
  }

  .card-header {
    @include flex-between;
    align-items: flex-start;
    margin-bottom: $spacing-md;
  }

  .config-key {
    @include flex-align-center;
    gap: $spacing-sm;

    .key-text {
      font-weight: $font-weight-semibold;
      font-size: 15px;
      color: var(--el-text-color-primary);
      word-break: break-all;
    }
  }

  .config-badges {
    @include flex-align-center;
    gap: $spacing-sm;
    flex-shrink: 0;
  }

  .card-body {
    flex: 1;
    @include flex-column;
    gap: $spacing-sm;
  }

  .config-value {
    @include flex-align-center;
    align-items: flex-start;
    gap: $spacing-sm;

    .value-icon {
      color: var(--el-color-primary);
      flex-shrink: 0;
      margin-top: 2px;
    }

    .value-text {
      @include text-ellipsis-multiline(2);
      font-size: $font-sm;
      color: var(--el-text-color-regular);
      word-break: break-all;
      font-family: 'Monaco', 'Consolas', monospace;
      background: var(--el-fill-color-light);
      padding: 4px $spacing-sm;
      border-radius: $radius-sm;
      flex: 1;
    }
  }

  .config-desc,
  .config-app {
    @include flex-align-center;
    gap: $spacing-sm;
    font-size: $font-xs;
    color: var(--el-text-color-secondary);

    .desc-icon,
    .app-icon {
      flex-shrink: 0;
    }

    .desc-text,
    .app-text {
      @include text-ellipsis;
    }
  }

  .card-footer {
    @include flex-between;
    padding-top: $spacing-md;
    border-top: 1px solid $border-light;
    margin-top: auto;

    .update-time {
      @include flex-align-center;
      gap: 4px;
      font-size: $font-xs;
      color: var(--el-text-color-secondary);

      .time-icon {
        font-size: $font-sm;
      }
    }

    .card-actions {
      @include flex-align-center;
      gap: $spacing-sm;
    }
  }
}

// 响应式
@include respond-to(md) {
  .toolbar-section {
    flex-direction: column;
    gap: $spacing-md;
    padding: $spacing-lg;

    .toolbar-left,
    .toolbar-right {
      width: 100%;
      flex-wrap: wrap;
    }

    .search-input {
      width: 100%;
    }

    .filter-select {
      flex: 1;
      min-width: 100px;
    }
  }

  .table-section {
    padding: $spacing-lg;
  }
}
</style>
