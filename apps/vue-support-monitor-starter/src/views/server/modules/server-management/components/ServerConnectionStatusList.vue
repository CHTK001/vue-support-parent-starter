<template>
  <div class="server-connection-status-list">
    <!-- 统计概览 -->
    <div class="status-overview">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-card class="status-card">
            <div class="status-content">
              <div class="status-icon total">
                <IconifyIconOnline icon="ri:server-line" />
              </div>
              <div class="status-info">
                <div class="status-value">{{ statistics.totalServers }}</div>
                <div class="status-label">总服务器</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="status-card">
            <div class="status-content">
              <div class="status-icon connected">
                <IconifyIconOnline icon="ri:checkbox-circle-line" />
              </div>
              <div class="status-info">
                <div class="status-value">{{ statistics.connectedServers }}</div>
                <div class="status-label">在线</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="status-card">
            <div class="status-content">
              <div class="status-icon disconnected">
                <IconifyIconOnline icon="ri:close-circle-line" />
              </div>
              <div class="status-info">
                <div class="status-value">{{ statistics.disconnectedServers }}</div>
                <div class="status-label">离线</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="status-card">
            <div class="status-content">
              <div class="status-icon error">
                <IconifyIconOnline icon="ri:error-warning-line" />
              </div>
              <div class="status-info">
                <div class="status-value">{{ statistics.errorServers }}</div>
                <div class="status-label">异常</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button type="primary" @click="handleCheckAll" :loading="checkingAll">
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
          检查所有连接
        </el-button>
        
        <el-button @click="handleRefresh">
          <IconifyIconOnline icon="ep:refresh" class="mr-1" />
          刷新
        </el-button>
      </div>
      
      <div class="toolbar-right">
        <el-select
          v-model="filterStatus"
          placeholder="连接状态"
          clearable
          style="width: 120px"
          @change="handleFilter"
        >
          <el-option label="在线" :value="CONNECTION_STATUS.CONNECTED" />
          <el-option label="离线" :value="CONNECTION_STATUS.DISCONNECTED" />
          <el-option label="连接中" :value="CONNECTION_STATUS.CONNECTING" />
          <el-option label="异常" :value="CONNECTION_STATUS.ERROR" />
        </el-select>
        
        <el-input
          v-model="searchKeyword"
          placeholder="搜索服务器..."
          clearable
          style="width: 200px; margin-left: 12px"
          @input="handleSearch"
        >
          <template #prefix>
            <IconifyIconOnline icon="ep:search" />
          </template>
        </el-input>
      </div>
    </div>

    <!-- 连接状态表格 -->
    <el-table
      v-loading="loading"
      :data="paginatedConnectionStatusList"
      stripe
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      
      <el-table-column label="服务器信息" min-width="200">
        <template #default="{ row }">
          <div class="server-info">
            <div class="server-name">
              <IconifyIconOnline :icon="getProtocolIcon(row.protocol)" class="protocol-icon" />
              {{ row.serverName }}
            </div>
            <div class="server-address">{{ row.host }}:{{ row.port }}</div>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column label="连接状态" width="120" align="center">
        <template #default="{ row }">
          <el-tag
            :type="getConnectionStatusColor(row.monitorSysGenServerConnectionStatus)"
            size="small"
            effect="light"
          >
            <IconifyIconOnline
              :icon="getConnectionStatusIcon(row.monitorSysGenServerConnectionStatus)"
              class="mr-1"
            />
            {{ getConnectionStatusText(row.monitorSysGenServerConnectionStatus) }}
          </el-tag>
        </template>
      </el-table-column>
      
      <el-table-column label="响应时间" width="100" align="center">
        <template #default="{ row }">
          <span v-if="row.monitorSysGenServerConnectionResponseTime">
            {{ row.monitorSysGenServerConnectionResponseTime }}ms
          </span>
          <span v-else class="text-muted">-</span>
        </template>
      </el-table-column>
      
      <el-table-column label="最后测试时间" width="160" align="center">
        <template #default="{ row }">
          <span v-if="row.monitorSysGenServerConnectionTestTime">
            {{ formatDateTime(row.monitorSysGenServerConnectionTestTime) }}
          </span>
          <span v-else class="text-muted">从未测试</span>
        </template>
      </el-table-column>
      
      <el-table-column label="最后成功时间" width="160" align="center">
        <template #default="{ row }">
          <span v-if="row.monitorSysGenServerConnectionLastSuccessTime">
            {{ formatDateTime(row.monitorSysGenServerConnectionLastSuccessTime) }}
          </span>
          <span v-else class="text-muted">从未成功</span>
        </template>
      </el-table-column>
      
      <el-table-column label="重试次数" width="80" align="center">
        <template #default="{ row }">
          {{ row.monitorSysGenServerConnectionRetryCount || 0 }}
        </template>
      </el-table-column>
      
      <el-table-column label="错误信息" min-width="200">
        <template #default="{ row }">
          <span v-if="row.monitorSysGenServerConnectionError" class="error-text">
            {{ row.monitorSysGenServerConnectionError }}
          </span>
          <span v-else class="text-muted">无</span>
        </template>
      </el-table-column>
      
      <el-table-column label="操作" width="200" align="center" fixed="right">
        <template #default="{ row }">
          <el-button-group>
            <el-button
              size="small"
              type="primary"
              :loading="testingServers.has(row.monitorSysGenServerId)"
              @click="handleTestConnection(row)"
            >
              <IconifyIconOnline icon="ri:wifi-line" />
              测试
            </el-button>
            
            <el-button size="small" @click="handleViewTrend(row)">
              <IconifyIconOnline icon="ri:line-chart-line" />
              趋势
            </el-button>
            
            <el-button size="small" @click="handleReset(row)">
              <IconifyIconOnline icon="ri:restart-line" />
              重置
            </el-button>
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="filteredConnectionStatusList.length"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 连接趋势对话框 -->
    <el-dialog
      v-model="trendDialogVisible"
      title="连接状态趋势"
      width="80%"
      destroy-on-close
    >
      <div v-if="trendData.length > 0" class="trend-chart">
        <!-- 这里可以集成图表组件显示趋势数据 -->
        <div class="chart-placeholder">
          <p>连接状态趋势图表</p>
          <p>数据点数量: {{ trendData.length }}</p>
        </div>
      </div>
      <el-empty v-else description="暂无趋势数据" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import { message } from "@repo/utils";
import { ElMessageBox } from "element-plus";
import {
  getAllServerConnectionStatus,
  getConnectionStatusStatistics,
  testServerConnection,
  batchTestServerConnection,
  checkAllServerConnections,
  resetServerConnectionStatus,
  batchResetServerConnectionStatus,
  getServerConnectionTrend,
  CONNECTION_STATUS,
  getConnectionStatusColor,
  getConnectionStatusText,
  getConnectionStatusIcon,
  type ServerConnectionStatus,
  type ConnectionStatusStatistics,
} from "@/api/server/connection-status";

// 定义事件
const emit = defineEmits<{
  test: [server: any];
  batchTest: [servers: any[]];
}>();

// 响应式状态
const loading = ref(false);
const checkingAll = ref(false);
const connectionStatusList = ref<any[]>([]);
const selectedConnections = ref<any[]>([]);
const testingServers = ref(new Set<number>());

// 搜索和筛选
const searchKeyword = ref("");
const filterStatus = ref("");

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
});

// 统计数据
const statistics = reactive<ConnectionStatusStatistics>({
  totalServers: 0,
  connectedServers: 0,
  disconnectedServers: 0,
  connectingServers: 0,
  errorServers: 0,
  averageResponseTime: 0,
  connectionSuccessRate: 0,
});

// 趋势对话框
const trendDialogVisible = ref(false);
const trendData = ref<any[]>([]);

// 计算属性
const filteredConnectionStatusList = computed(() => {
  let result = connectionStatusList.value;

  // 按状态筛选
  if (filterStatus.value !== "") {
    result = result.filter(item =>
      item.monitorSysGenServerConnectionStatus === filterStatus.value
    );
  }

  // 按关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase();
    result = result.filter(item =>
      item.serverName?.toLowerCase().includes(keyword) ||
      item.host?.toLowerCase().includes(keyword)
    );
  }

  return result;
});

const paginatedConnectionStatusList = computed(() => {
  const start = (pagination.page - 1) * pagination.pageSize;
  const end = start + pagination.pageSize;
  return filteredConnectionStatusList.value.slice(start, end);
});

/**
 * 加载连接状态列表
 */
const loadConnectionStatusList = async () => {
  try {
    loading.value = true;
    const res = await getAllServerConnectionStatus();
    if (res.code === "00000") {
      connectionStatusList.value = res.data || [];
    }
  } catch (error) {
    console.error("加载连接状态失败:", error);
    message.error("加载连接状态失败");
  } finally {
    loading.value = false;
  }
};

/**
 * 加载统计数据
 */
const loadStatistics = async () => {
  try {
    const res = await getConnectionStatusStatistics();
    if (res.code === "00000") {
      Object.assign(statistics, res.data);
    }
  } catch (error) {
    console.error("加载统计数据失败:", error);
  }
};

/**
 * 获取协议图标
 */
const getProtocolIcon = (protocol: string) => {
  const iconMap: Record<string, string> = {
    SSH: "ri:terminal-line",
    RDP: "ri:computer-line",
    VNC: "ri:remote-control-line",
  };
  return iconMap[protocol] || "ri:server-line";
};

/**
 * 格式化日期时间
 */
const formatDateTime = (dateTime: string) => {
  return new Date(dateTime).toLocaleString();
};

/**
 * 处理搜索
 */
const handleSearch = () => {
  pagination.page = 1;
};

/**
 * 处理筛选
 */
const handleFilter = () => {
  pagination.page = 1;
};

/**
 * 处理刷新
 */
const handleRefresh = () => {
  loadConnectionStatusList();
  loadStatistics();
};

/**
 * 处理检查所有连接
 */
const handleCheckAll = async () => {
  try {
    checkingAll.value = true;
    const res = await checkAllServerConnections();
    if (res.code === "00000") {
      message.success("已开始检查所有服务器连接");
      // 延迟刷新数据
      setTimeout(() => {
        loadConnectionStatusList();
        loadStatistics();
      }, 2000);
    } else {
      message.error(`检查失败: ${res.msg}`);
    }
  } catch (error) {
    console.error("检查所有连接失败:", error);
    message.error("检查所有连接失败");
  } finally {
    checkingAll.value = false;
  }
};

/**
 * 处理选择变化
 */
const handleSelectionChange = (selection: any[]) => {
  selectedConnections.value = selection;
};

/**
 * 处理测试连接
 */
const handleTestConnection = async (connection: any) => {
  try {
    testingServers.value.add(connection.monitorSysGenServerId);
    const res = await testServerConnection(connection.monitorSysGenServerId);
    if (res.code === "00000") {
      message.success("连接测试成功");
      loadConnectionStatusList();
      emit("test", connection);
    } else {
      message.error(`连接测试失败: ${res.msg}`);
    }
  } catch (error) {
    console.error("连接测试失败:", error);
    message.error("连接测试失败");
  } finally {
    testingServers.value.delete(connection.monitorSysGenServerId);
  }
};

/**
 * 处理查看趋势
 */
const handleViewTrend = async (connection: any) => {
  try {
    const res = await getServerConnectionTrend(connection.monitorSysGenServerId, 24);
    if (res.code === "00000") {
      trendData.value = res.data || [];
      trendDialogVisible.value = true;
    } else {
      message.error(`获取趋势数据失败: ${res.msg}`);
    }
  } catch (error) {
    console.error("获取趋势数据失败:", error);
    message.error("获取趋势数据失败");
  }
};

/**
 * 处理重置连接状态
 */
const handleReset = async (connection: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要重置服务器 "${connection.serverName}" 的连接状态吗？`,
      "重置确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    const res = await resetServerConnectionStatus(connection.monitorSysGenServerId);
    if (res.code === "00000") {
      message.success("连接状态重置成功");
      loadConnectionStatusList();
    } else {
      message.error(`重置失败: ${res.msg}`);
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("重置连接状态失败:", error);
      message.error("重置连接状态失败");
    }
  }
};

/**
 * 处理页面大小变化
 */
const handleSizeChange = (size: number) => {
  pagination.pageSize = size;
  pagination.page = 1;
};

/**
 * 处理当前页变化
 */
const handleCurrentChange = (page: number) => {
  pagination.page = page;
};

/**
 * 刷新数据
 */
const refresh = () => {
  loadConnectionStatusList();
  loadStatistics();
};

// 暴露方法
defineExpose({
  refresh,
});

// 生命周期
onMounted(() => {
  loadConnectionStatusList();
  loadStatistics();
});
</script>

<style scoped lang="scss">
.server-connection-status-list {
  .status-overview {
    margin-bottom: 20px;

    .status-card {
      .status-content {
        display: flex;
        align-items: center;

        .status-icon {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 16px;
          font-size: 24px;
          color: white;

          &.total {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }

          &.connected {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          }

          &.disconnected {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          }

          &.error {
            background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
          }
        }

        .status-info {
          .status-value {
            font-size: 28px;
            font-weight: 600;
            color: #303133;
            line-height: 1;
          }

          .status-label {
            font-size: 14px;
            color: #909399;
            margin-top: 4px;
          }
        }
      }
    }
  }

  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .toolbar-right {
      display: flex;
      align-items: center;
    }
  }

  .server-info {
    .server-name {
      display: flex;
      align-items: center;
      font-weight: 500;
      margin-bottom: 4px;

      .protocol-icon {
        margin-right: 6px;
        color: #409eff;
      }
    }

    .server-address {
      font-size: 12px;
      color: #909399;
    }
  }

  .text-muted {
    color: #c0c4cc;
  }

  .error-text {
    color: #f56c6c;
    font-size: 12px;
  }

  .pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 20px;
  }

  .trend-chart {
    .chart-placeholder {
      height: 300px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #f5f7fa;
      border-radius: 8px;
      color: #909399;
    }
  }
}
</style>
