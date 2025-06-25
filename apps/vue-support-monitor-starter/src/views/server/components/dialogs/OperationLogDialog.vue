<template>
  <el-dialog
    v-model="visible"
    title="操作日志"
    width="900px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="operation-log">
      <!-- 过滤器 -->
      <div class="log-filters">
        <el-row :gutter="16">
          <el-col :span="6">
            <el-date-picker
              v-model="filters.dateRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              size="small"
              style="width: 100%"
            />
          </el-col>
          <el-col :span="4">
            <el-select v-model="filters.operation" placeholder="操作类型" size="small" clearable>
              <el-option label="连接" value="connect" />
              <el-option label="断开" value="disconnect" />
              <el-option label="执行命令" value="command" />
              <el-option label="文件传输" value="file_transfer" />
              <el-option label="配置修改" value="config_change" />
              <el-option label="监控操作" value="monitoring" />
            </el-select>
          </el-col>
          <el-col :span="4">
            <el-select v-model="filters.status" placeholder="操作状态" size="small" clearable>
              <el-option label="成功" value="success" />
              <el-option label="失败" value="failed" />
              <el-option label="进行中" value="running" />
            </el-select>
          </el-col>
          <el-col :span="4">
            <el-input
              v-model="filters.user"
              placeholder="操作用户"
              size="small"
              clearable
            />
          </el-col>
          <el-col :span="6">
            <el-button size="small" type="primary" @click="searchLogs">
              <IconifyIconOnline icon="ri:search-line" class="mr-1" />
              查询
            </el-button>
            <el-button size="small" @click="resetFilters">
              <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
              重置
            </el-button>
            <el-button size="small" @click="exportLogs">
              <IconifyIconOnline icon="ri:download-line" class="mr-1" />
              导出
            </el-button>
          </el-col>
        </el-row>
      </div>

      <!-- 日志列表 -->
      <div class="log-list" v-loading="loading">
        <el-table
          :data="logs"
          stripe
          size="small"
          height="400"
          @row-click="showLogDetail"
        >
          <el-table-column prop="time" label="时间" width="160">
            <template #default="{ row }">
              {{ formatTime(row.time) }}
            </template>
          </el-table-column>
          <el-table-column prop="user" label="用户" width="100" />
          <el-table-column prop="operation" label="操作类型" width="120">
            <template #default="{ row }">
              <el-tag :type="getOperationType(row.operation)" size="small">
                {{ getOperationText(row.operation) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="target" label="目标" width="150" show-overflow-tooltip />
          <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
          <el-table-column prop="status" label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)" size="small">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="duration" label="耗时" width="80">
            <template #default="{ row }">
              {{ row.duration ? row.duration + 'ms' : '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="ip" label="IP地址" width="120" />
          <el-table-column label="操作" width="80" fixed="right">
            <template #default="{ row }">
              <el-button size="small" text @click.stop="showLogDetail(row)">
                <IconifyIconOnline icon="ri:eye-line" />
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="log-pagination">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :total="pagination.total"
            :page-sizes="[20, 50, 100, 200]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>

      <!-- 统计信息 -->
      <div class="log-statistics">
        <el-row :gutter="16">
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-value">{{ statistics.total }}</div>
              <div class="stat-label">总操作数</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item success">
              <div class="stat-value">{{ statistics.success }}</div>
              <div class="stat-label">成功操作</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item failed">
              <div class="stat-value">{{ statistics.failed }}</div>
              <div class="stat-label">失败操作</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-value">{{ statistics.avgDuration }}ms</div>
              <div class="stat-label">平均耗时</div>
            </div>
          </el-col>
        </el-row>
      </div>
    </div>

    <!-- 日志详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="操作详情"
      width="600px"
      append-to-body
    >
      <div class="log-detail" v-if="selectedLog">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="操作时间">
            {{ formatTime(selectedLog.time) }}
          </el-descriptions-item>
          <el-descriptions-item label="操作用户">
            {{ selectedLog.user }}
          </el-descriptions-item>
          <el-descriptions-item label="操作类型">
            <el-tag :type="getOperationType(selectedLog.operation)" size="small">
              {{ getOperationText(selectedLog.operation) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="操作状态">
            <el-tag :type="getStatusType(selectedLog.status)" size="small">
              {{ getStatusText(selectedLog.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="目标对象">
            {{ selectedLog.target }}
          </el-descriptions-item>
          <el-descriptions-item label="执行耗时">
            {{ selectedLog.duration ? selectedLog.duration + 'ms' : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="客户端IP">
            {{ selectedLog.ip }}
          </el-descriptions-item>
          <el-descriptions-item label="用户代理">
            {{ selectedLog.userAgent || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="操作描述" :span="2">
            {{ selectedLog.description }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 详细信息 -->
        <div class="detail-content" v-if="selectedLog.details">
          <el-divider content-position="left">详细信息</el-divider>
          <div class="detail-section">
            <h4>请求参数</h4>
            <pre class="detail-code">{{ JSON.stringify(selectedLog.details.request, null, 2) }}</pre>
          </div>
          <div class="detail-section" v-if="selectedLog.details.response">
            <h4>响应结果</h4>
            <pre class="detail-code">{{ JSON.stringify(selectedLog.details.response, null, 2) }}</pre>
          </div>
          <div class="detail-section" v-if="selectedLog.details.error">
            <h4>错误信息</h4>
            <pre class="detail-code error">{{ selectedLog.details.error }}</pre>
          </div>
        </div>
      </div>
    </el-dialog>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { message } from "@repo/utils";

// Props
const props = defineProps<{
  server?: any;
}>();

// 状态
const visible = ref(false);
const loading = ref(false);
const detailDialogVisible = ref(false);
const selectedLog = ref<any>(null);

// 过滤器
const filters = reactive({
  dateRange: [],
  operation: '',
  status: '',
  user: ''
});

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
});

// 日志数据
const logs = ref<any[]>([]);

// 统计信息
const statistics = reactive({
  total: 0,
  success: 0,
  failed: 0,
  avgDuration: 0
});

// 方法
const open = (server?: any) => {
  visible.value = true;
  if (server) {
    // 如果指定了服务器，只显示该服务器的日志
    filters.operation = '';
    loadLogs();
  } else {
    loadLogs();
  }
};

const handleClose = () => {
  visible.value = false;
  resetFilters();
};

const loadLogs = async () => {
  try {
    loading.value = true;
    
    // 模拟加载日志数据
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 模拟日志数据
    const mockLogs = [
      {
        id: 1,
        time: new Date(Date.now() - 3600000),
        user: 'admin',
        operation: 'connect',
        target: 'server01 (192.168.1.100:22)',
        description: 'SSH连接到服务器',
        status: 'success',
        duration: 1250,
        ip: '192.168.1.50',
        userAgent: 'Mozilla/5.0...',
        details: {
          request: { host: '192.168.1.100', port: 22, protocol: 'SSH' },
          response: { connected: true, sessionId: 'sess_123' }
        }
      },
      {
        id: 2,
        time: new Date(Date.now() - 1800000),
        user: 'admin',
        operation: 'command',
        target: 'server01',
        description: '执行命令: ls -la',
        status: 'success',
        duration: 850,
        ip: '192.168.1.50',
        details: {
          request: { command: 'ls -la' },
          response: { output: 'total 24\ndrwxr-xr-x...' }
        }
      },
      {
        id: 3,
        time: new Date(Date.now() - 900000),
        user: 'admin',
        operation: 'file_transfer',
        target: 'server02',
        description: '上传文件: config.txt',
        status: 'failed',
        duration: 5000,
        ip: '192.168.1.50',
        details: {
          request: { file: 'config.txt', size: 1024 },
          error: 'Permission denied'
        }
      }
    ];
    
    logs.value = mockLogs;
    pagination.total = mockLogs.length;
    
    // 更新统计信息
    updateStatistics();
    
  } catch (error) {
    message.error('加载日志失败');
    console.error('加载日志失败:', error);
  } finally {
    loading.value = false;
  }
};

const updateStatistics = () => {
  statistics.total = logs.value.length;
  statistics.success = logs.value.filter(log => log.status === 'success').length;
  statistics.failed = logs.value.filter(log => log.status === 'failed').length;
  
  const durations = logs.value.filter(log => log.duration).map(log => log.duration);
  statistics.avgDuration = durations.length > 0 
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0;
};

const searchLogs = () => {
  pagination.page = 1;
  loadLogs();
};

const resetFilters = () => {
  filters.dateRange = [];
  filters.operation = '';
  filters.status = '';
  filters.user = '';
  pagination.page = 1;
  loadLogs();
};

const exportLogs = () => {
  const data = logs.value.map(log => ({
    时间: formatTime(log.time),
    用户: log.user,
    操作类型: getOperationText(log.operation),
    目标: log.target,
    描述: log.description,
    状态: getStatusText(log.status),
    耗时: log.duration ? log.duration + 'ms' : '-',
    IP地址: log.ip
  }));
  
  const csv = convertToCSV(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `operation_logs_${Date.now()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  message.success('日志导出成功');
};

const convertToCSV = (data: any[]) => {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
  ].join('\n');
  
  return '\uFEFF' + csvContent; // 添加BOM以支持中文
};

const handleSizeChange = (size: number) => {
  pagination.pageSize = size;
  loadLogs();
};

const handleCurrentChange = (page: number) => {
  pagination.page = page;
  loadLogs();
};

const showLogDetail = (log: any) => {
  selectedLog.value = log;
  detailDialogVisible.value = true;
};

const getOperationType = (operation: string) => {
  const typeMap = {
    connect: 'success',
    disconnect: 'info',
    command: 'primary',
    file_transfer: 'warning',
    config_change: 'danger',
    monitoring: 'info'
  };
  return typeMap[operation as keyof typeof typeMap] || 'info';
};

const getOperationText = (operation: string) => {
  const textMap = {
    connect: '连接',
    disconnect: '断开',
    command: '执行命令',
    file_transfer: '文件传输',
    config_change: '配置修改',
    monitoring: '监控操作'
  };
  return textMap[operation as keyof typeof textMap] || operation;
};

const getStatusType = (status: string) => {
  const typeMap = {
    success: 'success',
    failed: 'danger',
    running: 'warning'
  };
  return typeMap[status as keyof typeof typeMap] || 'info';
};

const getStatusText = (status: string) => {
  const textMap = {
    success: '成功',
    failed: '失败',
    running: '进行中'
  };
  return textMap[status as keyof typeof textMap] || status;
};

const formatTime = (time: Date) => {
  return time.toLocaleString();
};

// 生命周期
onMounted(() => {
  // 组件挂载时不自动加载，等待open调用
});

// 暴露方法
defineExpose({
  open
});
</script>

<style lang="scss" scoped>
.operation-log {
  .log-filters {
    margin-bottom: 16px;
    padding: 16px;
    background-color: var(--el-fill-color-extra-light);
    border-radius: 6px;
  }

  .log-list {
    margin-bottom: 16px;

    .log-pagination {
      margin-top: 16px;
      display: flex;
      justify-content: center;
    }
  }

  .log-statistics {
    padding: 16px;
    background-color: var(--el-fill-color-extra-light);
    border-radius: 6px;

    .stat-item {
      text-align: center;
      padding: 12px;
      border-radius: 6px;
      background-color: var(--el-bg-color);

      &.success {
        border-left: 4px solid var(--el-color-success);
      }

      &.failed {
        border-left: 4px solid var(--el-color-danger);
      }

      .stat-value {
        font-size: 24px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        margin-bottom: 4px;
      }

      .stat-label {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }
  }
}

.log-detail {
  .detail-content {
    margin-top: 20px;

    .detail-section {
      margin-bottom: 16px;

      h4 {
        margin: 0 0 8px 0;
        font-size: 14px;
        font-weight: 500;
        color: var(--el-text-color-primary);
      }

      .detail-code {
        background-color: #f5f5f5;
        border: 1px solid var(--el-border-color-light);
        border-radius: 4px;
        padding: 12px;
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        font-size: 12px;
        line-height: 1.4;
        overflow-x: auto;
        margin: 0;

        &.error {
          background-color: #fef0f0;
          border-color: var(--el-color-danger-light-7);
          color: var(--el-color-danger);
        }
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.el-table) {
  .el-table__row {
    cursor: pointer;

    &:hover {
      background-color: var(--el-fill-color-light);
    }
  }
}
</style>
