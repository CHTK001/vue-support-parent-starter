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
            v-model="searchForm.monitorSysGenServerProxyType"
            placeholder="代理类型"
            clearable
            @change="handleSearch"
          >
            <el-option label="HTTP" value="HTTP" />
            <el-option label="SOCKS4" value="SOCKS4" />
            <el-option label="SOCKS5" value="SOCKS5" />
            <el-option label="GUACAMOLE" value="GUACAMOLE" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select
            v-model="searchForm.monitorSysGenServerProxyStatus"
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
        </el-col>
      </el-row>
    </div>

    <!-- 数据表格 -->
    <div class="table-section">
      <ScTable
        ref="tableRef"
        :url="getServerProxyPageList"
        :params="searchForm"
        v-model:page="pagination"
        stripe
        border
        height="calc(100vh - 320px)"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />

        <el-table-column prop="monitorSysGenServerProxyType" label="代理类型" width="120">
          <template #default="{ row }">
            <div class="proxy-type-cell">
             
              <IconifyIconOnline :icon="getProxyTypeIcon(row.monitorSysGenServerProxyType)" class="proxy-icon" />
              <el-tag :type="getProxyTypeTagType(row.monitorSysGenServerProxyType)" size="small">
                {{ row.monitorSysGenServerProxyType }}
              </el-tag>
               {{row.monitorSysGenServerProxyName}}
            </div>
          </template>
        </el-table-column>


        <el-table-column prop="monitorSysGenServerProxyConfig" label="代理地址" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="config-cell">
              <span class="config-text">{{ row.monitorSysGenServerProxyHost || '-' }}</span>
              <span class="config-text">:{{ row.monitorSysGenServerProxyPort || '-' }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="monitorSysGenServerProxyEnabled" label="启用状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.monitorSysGenServerProxyEnabled"
              :active-value="1"
              :inactive-value="0"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>

        <el-table-column label="测试结果" width="120">
          <template #default="{ row }">
            <div class="test-result">
              <el-tag
                v-if="row.monitorSysGenServerProxyTestResult !== undefined"
                :type="row.monitorSysGenServerProxyTestResult === 1 ? 'success' : 'danger'"
                size="small"
                effect="light"
              >
                {{ row.monitorSysGenServerProxyTestResult === 1 ? '成功' : '失败' }}
              </el-tag>
              <span v-else class="no-test">未测试</span>
              <div v-if="row.monitorSysGenServerProxyTestLatency" class="latency">
                {{ row.monitorSysGenServerProxyTestLatency }}ms
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="monitorSysGenServerProxyDescription" label="描述" min-width="150" show-overflow-tooltip />

        <el-table-column prop="monitorSysGenServerProxyUpdateTime" label="更新时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.monitorSysGenServerProxyUpdateTime) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
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
      </ScTable>
    </div>

    <!-- 代理编辑对话框 -->
    <ProxyEditDialog ref="editDialogRef" @success="handleSuccess" />
  </div>
</template>

<script setup lang="ts">
import {
  getServerProxyPageList,
  deleteServerProxy,
  testProxyConnection,
  enableServerProxy,
  disableServerProxy,
  type ServerProxyPageParams,
  type ServerProxy
} from "@/api/monitor/gen/server-proxy";
import { message, messageBox } from "@repo/utils";
import { reactive, ref } from "vue";
import ProxyEditDialog from "./components/ProxyEditDialog.vue";

// 响应式数据
const tableRef = ref();
const selectedRows = ref<ServerProxy[]>([]);
const editDialogRef = ref();

// 搜索表单
const searchForm = reactive({
  keyword: "",
  monitorSysGenServerProxyType: "",
  monitorSysGenServerProxyStatus: undefined as number | undefined
});

// 分页数据
const pagination = reactive({
  pageNum: 1,
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
    case 'GUACAMOLE':
      return 'ri:remote-control-line';
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
    case 'GUACAMOLE':
      return 'danger';
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
 * 搜索
 */
const handleSearch = () => {
  pagination.pageNum = 1;
  tableRef.value?.refresh();
};

/**
 * 重置
 */
const handleReset = () => {
  searchForm.keyword = "";
  searchForm.monitorSysGenServerProxyType = "";
  searchForm.monitorSysGenServerProxyStatus = undefined;
  pagination.pageNum = 1;
  tableRef.value?.refresh();
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
const handleSelectionChange = (selection: ServerProxy[]) => {
  selectedRows.value = selection;
};

/**
 * 处理状态变化
 */
const handleStatusChange = async (row: ServerProxy) => {
  try {
    let result: any;
    if (row.monitorSysGenServerProxyEnabled === 1) {
      result = await enableServerProxy(row.monitorSysGenServerProxyId!);
    } else {
      result = await disableServerProxy(row.monitorSysGenServerProxyId!);
    }

    if (result.code === '00000') {
      message.success('状态更新成功');
      tableRef.value?.refresh();
    } else {
      message.error(result.msg || '状态更新失败');
      // 恢复原状态
      row.monitorSysGenServerProxyEnabled = row.monitorSysGenServerProxyEnabled === 1 ? 0 : 1;
    }
  } catch (error) {
    console.error('状态更新失败:', error);
    message.error('状态更新失败');
    // 恢复原状态
    row.monitorSysGenServerProxyEnabled = row.monitorSysGenServerProxyEnabled === 1 ? 0 : 1;
  }
};

/**
 * 测试连接
 */
const handleTest = async (row: ServerProxy) => {
  try {
    const result = await testProxyConnection(row.monitorSysGenServerProxyId!);
    if (result.code === '00000') {
      message.success('连接测试成功');
      tableRef.value?.refresh();
    } else {
      message.error(result.msg || '测试失败');
    }
  } catch (error) {
    console.error('测试连接失败:', error);
    message.error('测试连接失败');
  }
};

/**
 * 编辑
 */
const handleEdit = (row: ServerProxy) => {
  editDialogRef.value?.open("edit", row);
};

/**
 * 复制
 */
const handleCopy = async (row: ServerProxy) => {
  try {
    // 创建一个副本数据
    const copyData = {
      ...row,
      monitorSysGenServerProxyId: undefined,
      monitorSysGenServerProxyRemark: `${row.monitorSysGenServerProxyRemark || ''}_副本`
    };

    message.info('复制功能待实现');
    // TODO: 实现复制功能
  } catch (error) {
    console.error('复制失败:', error);
    message.error('复制失败');
  }
};

/**
 * 删除
 */
const handleDelete = async (row: ServerProxy) => {
  try {
    await messageBox.confirm(`确定要删除这个代理配置吗？`, '确认删除', {
      type: 'warning'
    });

    const result = await deleteServerProxy(row.monitorSysGenServerProxyId!);
    if (result.code === '00000') {
      message.success('删除成功');
      tableRef.value?.refresh();
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
 * 处理成功回调
 */
const handleSuccess = () => {
  tableRef.value?.refresh();
};
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

  .proxy-type-cell {
    display: flex;
    align-items: center;
    gap: 8px;

    .proxy-icon {
      color: var(--el-color-primary);
    }
  }

  .config-cell {
    .config-text {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      color: var(--el-text-color-regular);
    }
  }

  .test-result {
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
</style>
