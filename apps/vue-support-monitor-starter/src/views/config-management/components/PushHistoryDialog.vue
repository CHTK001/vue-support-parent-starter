<template>
  <sc-dialog v-model="visibleProxy" class="push-history-dialog" :show-close="true" width="900px">
    <template #header>
      <div class="dlg-header">
        <div class="title">
          <IconifyIconOnline icon="ri:history-line" class="mr-2" />
          推送历史
        </div>
        <div class="subtitle">查看配置推送记录，支持从历史记录还原推送</div>
      </div>
    </template>

    <div class="content">
      <!-- 筛选工具栏 -->
      <div class="toolbar">
        <el-input
          v-model="queryParams.keyword"
          placeholder="搜索配置键"
          class="search-input"
          clearable
          @keyup.enter="loadHistory"
        >
          <template #prefix>
            <IconifyIconOnline icon="ri:search-line" />
          </template>
        </el-input>
        <el-select
          v-model="queryParams.pushSuccess"
          placeholder="推送状态"
          clearable
          class="filter-select"
          @change="loadHistory"
        >
          <el-option label="成功" :value="1" />
          <el-option label="失败" :value="0" />
        </el-select>
        <el-button type="primary" @click="loadHistory">
          <IconifyIconOnline icon="ri:search-2-line" class="mr-1" />
          搜索
        </el-button>
        <el-button 
          :disabled="selectedHistories.length === 0" 
          @click="handleBatchRepush"
        >
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
          批量还原 ({{ selectedHistories.length }})
        </el-button>
        <el-button 
          type="danger"
          :disabled="selectedHistories.length === 0" 
          @click="handleBatchDelete"
        >
          <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
          批量删除
        </el-button>
      </div>

      <!-- 历史列表 -->
      <el-table
        ref="tableRef"
        :data="historyList"
        v-loading="loading"
        @selection-change="handleSelectionChange"
        max-height="400"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column label="配置键" prop="configKey" min-width="180">
          <template #default="{ row }">
            <span class="config-key">{{ row.configKey }}</span>
          </template>
        </el-table-column>
        <el-table-column label="配置值" prop="configValue" min-width="150">
          <template #default="{ row }">
            <el-tooltip :content="row.configValue" placement="top" :disabled="!row.configValue">
              <span class="config-value">{{ row.configValue || '—' }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="目标服务器" prop="serverName" width="120" />
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.success ? 'success' : 'danger'" size="small">
              {{ row.success ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="推送时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.pushTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作人" prop="operator" width="80" />
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" plain @click="handleRepush(row)">
              <IconifyIconOnline icon="ri:refresh-line" />
              还原
            </el-button>
            <el-button size="small" type="danger" plain @click="handleDelete(row)">
              <IconifyIconOnline icon="ri:delete-bin-line" />
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @current-change="loadHistory"
          @size-change="loadHistory"
        />
      </div>
    </div>

    <template #footer>
      <div class="dlg-footer">
        <el-button @click="visibleProxy = false">关闭</el-button>
      </div>
    </template>
  </sc-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch, reactive } from 'vue';
import { ElMessageBox } from 'element-plus';
import { message } from '@repo/utils';
import { 
  getConfigPushHistory, 
  repushFromHistory, 
  batchRepushFromHistory,
  deletePushHistory,
  batchDeletePushHistory,
  type ConfigPushHistory 
} from '@/api/config';

interface Props { 
  visible: boolean;
  configId?: number;
}

interface Emits { 
  (e: 'update:visible', v: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const visibleProxy = computed({ 
  get: () => props.visible, 
  set: v => emit('update:visible', v) 
});

const loading = ref(false);
const historyList = ref<ConfigPushHistory[]>([]);
const selectedHistories = ref<ConfigPushHistory[]>([]);
const total = ref(0);

const queryParams = reactive({
  keyword: '',
  pushSuccess: undefined as number | undefined,
  pageNum: 1,
  pageSize: 10,
});

// 加载历史记录
async function loadHistory() {
  try {
    loading.value = true;
    const res: any = await getConfigPushHistory({
      ...queryParams,
      configId: props.configId,
    });
    if (res?.code === '00000') {
      historyList.value = res.data?.records || [];
      total.value = res.data?.total || 0;
    }
  } catch (e) {
    console.error('加载推送历史失败', e);
  } finally {
    loading.value = false;
  }
}

// 选择变更
function handleSelectionChange(selection: ConfigPushHistory[]) {
  selectedHistories.value = selection;
}

// 单个还原推送
async function handleRepush(history: ConfigPushHistory) {
  try {
    await ElMessageBox.confirm(
      `确认使用历史记录中的配置值 "${history.configKey}" 重新推送到服务器 "${history.serverName}"？`,
      '还原推送确认',
      { type: 'warning' }
    );
    
    const res: any = await repushFromHistory(history.id);
    if (res?.code === '00000') {
      const result = res.data;
      if (result.success > 0) {
        message('还原推送成功', { type: 'success' });
      } else {
        message('还原推送失败', { type: 'error' });
      }
      loadHistory();
    } else {
      message(res?.msg || '还原推送失败', { type: 'error' });
    }
  } catch (e) {
    if (e !== 'cancel') {
      console.error('还原推送失败', e);
    }
  }
}

// 批量还原推送
async function handleBatchRepush() {
  if (selectedHistories.value.length === 0) return;
  
  try {
    await ElMessageBox.confirm(
      `确认批量还原推送 ${selectedHistories.value.length} 条历史记录？`,
      '批量还原确认',
      { type: 'warning' }
    );
    
    const ids = selectedHistories.value.map(h => h.id);
    const res: any = await batchRepushFromHistory(ids);
    if (res?.code === '00000') {
      const result = res.data;
      message(`还原推送完成: 成功 ${result.success} 条, 失败 ${result.failed} 条`, { 
        type: result.failed > 0 ? 'warning' : 'success' 
      });
      selectedHistories.value = [];
      loadHistory();
    } else {
      message(res?.msg || '批量还原推送失败', { type: 'error' });
    }
  } catch (e) {
    if (e !== 'cancel') {
      console.error('批量还原推送失败', e);
    }
  }
}

// 单个删除
async function handleDelete(history: ConfigPushHistory) {
  try {
    await ElMessageBox.confirm(
      `确认删除推送历史记录？`,
      '删除确认',
      { type: 'warning' }
    );
    
    const res: any = await deletePushHistory(history.id);
    if (res?.code === '00000') {
      message('删除成功', { type: 'success' });
      loadHistory();
    } else {
      message(res?.msg || '删除失败', { type: 'error' });
    }
  } catch (e) {
    if (e !== 'cancel') {
      console.error('删除失败', e);
    }
  }
}

// 批量删除
async function handleBatchDelete() {
  if (selectedHistories.value.length === 0) return;
  
  try {
    await ElMessageBox.confirm(
      `确认删除 ${selectedHistories.value.length} 条推送历史记录？`,
      '批量删除确认',
      { type: 'warning' }
    );
    
    const ids = selectedHistories.value.map(h => h.id);
    const res: any = await batchDeletePushHistory(ids);
    if (res?.code === '00000') {
      message('批量删除成功', { type: 'success' });
      selectedHistories.value = [];
      loadHistory();
    } else {
      message(res?.msg || '批量删除失败', { type: 'error' });
    }
  } catch (e) {
    if (e !== 'cancel') {
      console.error('批量删除失败', e);
    }
  }
}

// 格式化时间
function formatTime(time: string): string {
  if (!time) return '—';
  return new Date(time).toLocaleString('zh-CN');
}

// 监听对话框打开
watch(() => visibleProxy.value, (val) => {
  if (val) {
    queryParams.pageNum = 1;
    loadHistory();
  } else {
    selectedHistories.value = [];
  }
});
</script>

<style scoped>
.push-history-dialog :deep(.el-dialog__body) {
  padding: 0 20px 16px;
}

.dlg-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dlg-header .title {
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  color: var(--app-text-primary);
}

.dlg-header .subtitle {
  font-size: 13px;
  color: var(--app-text-secondary);
  margin-left: 28px;
}

.content {
  max-height: 600px;
  overflow-y: auto;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.search-input {
  width: 200px;
}

.filter-select {
  width: 120px;
}

.config-key {
  font-weight: 600;
  color: var(--el-color-primary);
}

.config-value {
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 12px;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.dlg-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
