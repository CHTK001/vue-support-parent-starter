<template>
  <div class="proxy-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">
          <IconifyIconOnline icon="ri:server-line" class="title-icon" />
          代理管理
        </h2>
        <p class="page-description">管理服务器连接代理配置</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="showAddDialog">
          <IconifyIconOnline icon="ri:add-line" class="mr-1" />
          新增代理
        </el-button>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <div class="search-section">
      <el-row :gutter="16">
        <el-col :span="8">
          <el-input
            v-model="searchForm.keyword"
            placeholder="搜索代理名称、地址或描述"
            clearable
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <IconifyIconOnline icon="ri:search-line" />
            </template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-select
            v-model="searchForm.type"
            placeholder="代理类型"
            clearable
            @change="handleSearch"
          >
            <el-option label="HTTP" value="HTTP" />
            <el-option label="SOCKS4" value="SOCKS4" />
            <el-option label="SOCKS5" value="SOCKS5" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select
            v-model="searchForm.status"
            placeholder="状态"
            clearable
            @change="handleSearch"
          >
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-col>
        <el-col :span="8">
          <el-button type="primary" @click="handleSearch">
            <IconifyIconOnline icon="ri:search-line" class="mr-1" />
            搜索
          </el-button>
          <el-button @click="handleReset">
            <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
            重置
          </el-button>
          <el-button 
            type="success" 
            @click="handleBatchTest"
            :disabled="selectedRows.length === 0"
            :loading="batchTestLoading"
          >
            <IconifyIconOnline icon="ri:test-tube-line" class="mr-1" />
            批量测试
          </el-button>
        </el-col>
      </el-row>
    </div>

    <!-- 数据表格 -->
    <div class="table-section">
      <el-table
        v-loading="loading"
        :data="tableData"
        @selection-change="handleSelectionChange"
        stripe
        border
        height="calc(100vh - 320px)"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column prop="monitorSysGenServerProxyName" label="代理名称" min-width="150">
          <template #default="{ row }">
            <div class="proxy-name-cell">
              <IconifyIconOnline :icon="getProxyTypeIcon(row.monitorSysGenServerProxyType)" class="proxy-icon" />
              <span class="proxy-name">{{ row.monitorSysGenServerProxyName }}</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="monitorSysGenServerProxyType" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getProxyTypeTagType(row.monitorSysGenServerProxyType)" size="small">
              {{ row.monitorSysGenServerProxyType }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="地址" min-width="200">
          <template #default="{ row }">
            <span>{{ row.monitorSysGenServerProxyHost }}:{{ row.monitorSysGenServerProxyPort }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="monitorSysGenServerProxyStatus" label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.monitorSysGenServerProxyStatus"
              :active-value="1"
              :inactive-value="0"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>
        
        <el-table-column label="连接状态" width="120">
          <template #default="{ row }">
            <div class="connection-status">
              <el-tag
                v-if="row.monitorSysGenServerProxyTestResult !== undefined"
                :type="row.monitorSysGenServerProxyTestResult === 1 ? 'success' : 'danger'"
                size="small"
                effect="light"
              >
                {{ row.monitorSysGenServerProxyTestResult === 1 ? '正常' : '异常' }}
              </el-tag>
              <span v-else class="no-test">未测试</span>
              <div v-if="row.monitorSysGenServerProxyTestLatency" class="latency">
                {{ row.monitorSysGenServerProxyTestLatency }}ms
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="monitorSysGenServerProxyDescription" label="描述" min-width="150" show-overflow-tooltip />
        
        <el-table-column prop="updateTime" label="更新时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.updateTime) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" text @click="handleTest(row)">
              <IconifyIconOnline icon="ri:test-tube-line" class="mr-1" />
              测试
            </el-button>
            <el-button size="small" text @click="handleEdit(row)">
              <IconifyIconOnline icon="ri:edit-line" class="mr-1" />
              编辑
            </el-button>
            <el-button size="small" text @click="handleCopy(row)">
              <IconifyIconOnline icon="ri:file-copy-line" class="mr-1" />
              复制
            </el-button>
            <el-button size="small" text type="danger" @click="handleDelete(row)">
              <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-section">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 代理编辑对话框 -->
    <ProxyEditDialog ref="editDialogRef" @success="handleSuccess" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { message, messageBox } from "@repo/utils";
import {
  getProxyPageList,
  updateProxyStatus,
  deleteProxy,
  testProxyConnection,
  batchTestProxyConnection,
  copyProxy,
  type MonitorProxy,
  type ProxyPageParams
} from "@/api/monitor/gen/proxy";
import ProxyEditDialog from "./components/ProxyEditDialog.vue";

// 响应式数据
const loading = ref(false);
const batchTestLoading = ref(false);
const tableData = ref<MonitorProxy[]>([]);
const selectedRows = ref<MonitorProxy[]>([]);
const editDialogRef = ref();

// 搜索表单
const searchForm = reactive({
  keyword: "",
  type: "",
  status: undefined as number | undefined
});

// 分页数据
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
});

/**
 * 获取代理类型图标
 */
const getProxyTypeIcon = (type: string) => {
  switch (type) {
    case 'HTTP':
      return 'ri:global-line';
    case 'SOCKS4':
      return 'ri:shield-line';
    case 'SOCKS5':
      return 'ri:shield-check-line';
    default:
      return 'ri:server-line';
  }
};

/**
 * 获取代理类型标签类型
 */
const getProxyTypeTagType = (type: string) => {
  switch (type) {
    case 'HTTP':
      return 'primary';
    case 'SOCKS4':
      return 'warning';
    case 'SOCKS5':
      return 'success';
    default:
      return 'info';
  }
};

/**
 * 格式化时间
 */
const formatTime = (time: string) => {
  if (!time) return '-';
  return new Date(time).toLocaleString();
};

/**
 * 加载数据
 */
const loadData = async () => {
  try {
    loading.value = true;
    
    const params: ProxyPageParams = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword,
      params: {
        status: searchForm.status,
        type: searchForm.type
      }
    };
    
    const result = await getProxyPageList(params);
    if (result.success) {
      tableData.value = result.data.data || [];
      pagination.total = result.data.total || 0;
    } else {
      message.error(result.msg || '获取数据失败');
    }
  } catch (error) {
    console.error('加载数据失败:', error);
    message.error('加载数据失败');
  } finally {
    loading.value = false;
  }
};

/**
 * 搜索
 */
const handleSearch = () => {
  pagination.page = 1;
  loadData();
};

/**
 * 重置
 */
const handleReset = () => {
  searchForm.keyword = "";
  searchForm.type = "";
  searchForm.status = undefined;
  pagination.page = 1;
  loadData();
};

/**
 * 显示新增对话框
 */
const showAddDialog = () => {
  editDialogRef.value?.open("add");
};

/**
 * 处理选择变化
 */
const handleSelectionChange = (selection: MonitorProxy[]) => {
  selectedRows.value = selection;
};

/**
 * 处理状态变化
 */
const handleStatusChange = async (row: MonitorProxy) => {
  try {
    const result = await updateProxyStatus(row.proxyId!, row.proxyStatus);
    if (result.success) {
      message.success('状态更新成功');
    } else {
      message.error(result.msg || '状态更新失败');
      // 恢复原状态
      row.proxyStatus = row.proxyStatus === 1 ? 0 : 1;
    }
  } catch (error) {
    console.error('状态更新失败:', error);
    message.error('状态更新失败');
    // 恢复原状态
    row.proxyStatus = row.proxyStatus === 1 ? 0 : 1;
  }
};

/**
 * 测试连接
 */
const handleTest = async (row: MonitorProxy) => {
  try {
    const result = await testProxyConnection(row.proxyId!);
    if (result.success) {
      // 注意：这些字段可能需要扩展 MonitorProxy 接口
      (row as any).testResult = result.data.success;
      (row as any).testLatency = result.data.latency;
      message.success(result.data.message);
    } else {
      message.error(result.msg || '测试失败');
    }
  } catch (error) {
    console.error('测试连接失败:', error);
    message.error('测试连接失败');
  }
};

/**
 * 批量测试
 */
const handleBatchTest = async () => {
  try {
    batchTestLoading.value = true;
    const proxyIds = selectedRows.value.map(row => row.proxyId!);
    const result = await batchTestProxyConnection(proxyIds);

    if (result.success) {
      // 更新测试结果
      result.data.forEach(testResult => {
        const row = tableData.value.find(r => r.proxyId === testResult.proxyId);
        if (row) {
          (row as any).testResult = testResult.success;
          (row as any).testLatency = testResult.latency;
        }
      });
      message.success('批量测试完成');
    } else {
      message.error(result.msg || '批量测试失败');
    }
  } catch (error) {
    console.error('批量测试失败:', error);
    message.error('批量测试失败');
  } finally {
    batchTestLoading.value = false;
  }
};

/**
 * 编辑
 */
const handleEdit = (row: MonitorProxy) => {
  editDialogRef.value?.open("edit", row);
};

/**
 * 复制
 */
const handleCopy = async (row: MonitorProxy) => {
  try {
    const newName = `${row.proxyName}_副本`;
    const result = await copyProxy(row.proxyId!, newName);
    if (result.success) {
      message.success('复制成功');
      loadData();
    } else {
      message.error(result.msg || '复制失败');
    }
  } catch (error) {
    console.error('复制失败:', error);
    message.error('复制失败');
  }
};

/**
 * 删除
 */
const handleDelete = async (row: MonitorProxy) => {
  try {
    await messageBox.confirm(`确定要删除代理 "${row.proxyName}" 吗？`, '确认删除', {
      type: 'warning'
    });

    const result = await deleteProxy(row.proxyId!);
    if (result.success) {
      message.success('删除成功');
      loadData();
    } else {
      message.error(result.msg || '删除失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error);
      message.error('删除失败');
    }
  }
};

/**
 * 处理页面大小变化
 */
const handleSizeChange = (size: number) => {
  pagination.pageSize = size;
  pagination.page = 1;
  loadData();
};

/**
 * 处理当前页变化
 */
const handleCurrentChange = (page: number) => {
  pagination.page = page;
  loadData();
};

/**
 * 处理成功回调
 */
const handleSuccess = () => {
  loadData();
};

// 组件挂载时加载数据
onMounted(() => {
  loadData();
});
</script>

<style scoped lang="scss">
.proxy-management {
  padding: 20px;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);

  .header-left {
    .page-title {
      display: flex;
      align-items: center;
      margin: 0 0 8px 0;
      font-size: 24px;
      font-weight: 600;
      color: var(--el-text-color-primary);

      .title-icon {
        margin-right: 12px;
        color: var(--el-color-primary);
      }
    }

    .page-description {
      margin: 0;
      color: var(--el-text-color-regular);
      font-size: 14px;
    }
  }
}

.search-section {
  margin-bottom: 20px;
}

.table-section {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .proxy-name-cell {
    display: flex;
    align-items: center;

    .proxy-icon {
      margin-right: 8px;
      color: var(--el-color-primary);
    }

    .proxy-name {
      font-weight: 500;
    }
  }

  .connection-status {
    .latency {
      font-size: 11px;
      color: var(--el-text-color-placeholder);
      margin-top: 2px;
    }

    .no-test {
      font-size: 12px;
      color: var(--el-text-color-placeholder);
    }
  }
}

.pagination-section {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}
</style>
