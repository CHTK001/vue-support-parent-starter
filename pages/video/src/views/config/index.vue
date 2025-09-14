<template>
  <div class="video-config">
    <!-- 页面头部 -->
    <div class="config-header mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-800 mb-2">视频配置管理</h1>
          <p class="text-gray-600">管理视频同步渠道配置，支持手动同步和实时监听</p>
        </div>
        
        <div class="header-actions">
          <el-button type="primary" @click="showAddDialog = true">
            <el-icon><Plus /></el-icon>
            新增配置
          </el-button>
          <el-button @click="refreshConfigs">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="stats-cards grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="stat-card bg-white rounded-lg shadow p-4">
        <div class="flex items-center">
          <div class="stat-icon bg-blue-100 text-blue-600 p-3 rounded-full mr-3">
            <el-icon><Setting /></el-icon>
          </div>
          <div>
            <p class="text-sm text-gray-500">总配置数</p>
            <p class="text-2xl font-bold text-gray-800">{{ stats.totalConfigs }}</p>
          </div>
        </div>
      </div>
      
      <div class="stat-card bg-white rounded-lg shadow p-4">
        <div class="flex items-center">
          <div class="stat-icon bg-green-100 text-green-600 p-3 rounded-full mr-3">
            <el-icon><Check /></el-icon>
          </div>
          <div>
            <p class="text-sm text-gray-500">启用中</p>
            <p class="text-2xl font-bold text-gray-800">{{ stats.enabledConfigs }}</p>
          </div>
        </div>
      </div>
      
      <div class="stat-card bg-white rounded-lg shadow p-4">
        <div class="flex items-center">
          <div class="stat-icon bg-yellow-100 text-yellow-600 p-3 rounded-full mr-3">
            <el-icon><Clock /></el-icon>
          </div>
          <div>
            <p class="text-sm text-gray-500">同步中</p>
            <p class="text-2xl font-bold text-gray-800">{{ stats.syncingConfigs }}</p>
          </div>
        </div>
      </div>
      
      <div class="stat-card bg-white rounded-lg shadow p-4">
        <div class="flex items-center">
          <div class="stat-icon bg-red-100 text-red-600 p-3 rounded-full mr-3">
            <el-icon><Warning /></el-icon>
          </div>
          <div>
            <p class="text-sm text-gray-500">异常配置</p>
            <p class="text-2xl font-bold text-gray-800">{{ stats.errorConfigs }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 配置列表 -->
    <div class="config-list bg-white rounded-lg shadow">
      <div class="list-header p-4 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">同步配置列表</h3>
          
          <div class="list-actions flex items-center space-x-4">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索配置名称"
              style="width: 200px"
              @input="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            
            <el-select v-model="statusFilter" placeholder="状态筛选" style="width: 120px" @change="handleFilter">
              <el-option label="全部" value="" />
              <el-option label="启用" value="enabled" />
              <el-option label="禁用" value="disabled" />
              <el-option label="同步中" value="syncing" />
              <el-option label="异常" value="error" />
            </el-select>
          </div>
        </div>
      </div>
      
      <div class="list-content">
        <el-table
          :data="configList"
          v-loading="loading"
          stripe
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          
          <el-table-column prop="configName" label="配置名称" min-width="150">
            <template #default="{ row }">
              <div class="flex items-center">
                <el-icon class="mr-2" :class="getSourceIcon(row.configSource)"></el-icon>
                <span class="font-medium">{{ row.configName }}</span>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="configSource" label="同步源" width="120">
            <template #default="{ row }">
              <el-tag :type="getSourceType(row.configSource)" size="small">
                {{ getSourceName(row.configSource) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="configUrl" label="同步地址" min-width="200">
            <template #default="{ row }">
              <el-tooltip :content="row.configUrl" placement="top">
                <span class="text-blue-600 cursor-pointer truncate block" @click="copyUrl(row.configUrl)">
                  {{ row.configUrl }}
                </span>
              </el-tooltip>
            </template>
          </el-table-column>
          
          <el-table-column prop="configStatus" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.configStatus)" size="small">
                {{ getStatusName(row.configStatus) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="lastSyncTime" label="最后同步" width="160">
            <template #default="{ row }">
              <span class="text-gray-500">{{ formatTime(row.lastSyncTime) }}</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="syncCount" label="同步次数" width="100" align="center">
            <template #default="{ row }">
              <span class="font-medium">{{ row.syncCount || 0 }}</span>
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <div class="flex items-center space-x-2">
                <el-button
                  size="small"
                  type="primary"
                  @click="handleSync(row)"
                  :loading="row.syncing"
                  :disabled="row.configStatus === 'disabled'"
                >
                  同步
                </el-button>
                
                <el-button size="small" @click="editConfig(row)">
                  编辑
                </el-button>
                
                <el-dropdown @command="(command) => handleCommand(command, row)">
                  <el-button size="small">
                    更多
                    <el-icon class="ml-1"><ArrowDown /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item :command="row.configStatus === 'enabled' ? 'disable' : 'enable'">
                        {{ row.configStatus === 'enabled' ? '禁用' : '启用' }}
                      </el-dropdown-item>
                      <el-dropdown-item command="test">测试连接</el-dropdown-item>
                      <el-dropdown-item command="logs">查看日志</el-dropdown-item>
                      <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </template>
          </el-table-column>
        </el-table>
        
        <!-- 分页 -->
        <div class="pagination-container p-4 flex justify-center">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="totalCount"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </div>

    <!-- 新增/编辑配置对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="editingConfig ? '编辑配置' : '新增配置'"
      width="600px"
      @close="resetForm"
    >
      <el-form
        ref="configFormRef"
        :model="configForm"
        :rules="configRules"
        label-width="100px"
      >
        <el-form-item label="配置名称" prop="configName">
          <el-input v-model="configForm.configName" placeholder="请输入配置名称" />
        </el-form-item>
        
        <el-form-item label="同步源" prop="configSource">
          <el-select v-model="configForm.configSource" placeholder="选择同步源" style="width: 100%">
            <el-option label="PanSou" value="pansou" />
            <el-option label="在线视频" value="online" />
            <el-option label="本地文件" value="local" />
            <el-option label="RSS订阅" value="rss" />
            <el-option label="API接口" value="api" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="同步地址" prop="configUrl">
          <el-input v-model="configForm.configUrl" placeholder="请输入同步地址" />
        </el-form-item>
        
        <el-form-item label="同步间隔">
          <el-select v-model="configForm.syncInterval" placeholder="选择同步间隔">
            <el-option label="手动同步" :value="0" />
            <el-option label="每5分钟" :value="5" />
            <el-option label="每15分钟" :value="15" />
            <el-option label="每30分钟" :value="30" />
            <el-option label="每小时" :value="60" />
            <el-option label="每6小时" :value="360" />
            <el-option label="每天" :value="1440" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="请求头">
          <el-input
            v-model="configForm.configHeaders"
            type="textarea"
            :rows="3"
            placeholder="JSON格式的请求头，如：{\"User-Agent\": \"Mozilla/5.0\"}"
          />
        </el-form-item>
        
        <el-form-item label="配置说明">
          <el-input
            v-model="configForm.configDescription"
            type="textarea"
            :rows="2"
            placeholder="请输入配置说明"
          />
        </el-form-item>
        
        <el-form-item>
          <el-checkbox v-model="configForm.autoSync">启用自动同步</el-checkbox>
          <el-checkbox v-model="configForm.enableNotification">启用通知</el-checkbox>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddDialog = false">取消</el-button>
          <el-button type="primary" @click="saveConfig" :loading="saving">
            {{ editingConfig ? '更新' : '保存' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 同步日志对话框 -->
    <el-dialog v-model="showLogsDialog" title="同步日志" width="800px">
      <div class="logs-container">
        <div class="logs-header mb-4">
          <el-button @click="refreshLogs" size="small">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
          <el-button @click="clearLogs" size="small" type="danger">
            <el-icon><Delete /></el-icon>
            清空日志
          </el-button>
        </div>
        
        <div class="logs-content bg-gray-900 text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
          <div v-for="log in syncLogs" :key="log.id" class="log-line mb-1">
            <span class="text-gray-500">[{{ formatTime(log.createTime) }}]</span>
            <span :class="getLogLevelClass(log.level)">{{ log.level }}</span>
            <span>{{ log.message }}</span>
          </div>
          <div v-if="syncLogs.length === 0" class="text-gray-500 text-center py-8">
            暂无日志记录
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Refresh, Setting, Check, Clock, Warning, Search, ArrowDown, Delete } from '@element-plus/icons-vue';
import { io, Socket } from 'socket.io-client';
import {
  getSyncConfigs,
  getSyncConfigDetail,
  createSyncConfig,
  updateSyncConfig,
  deleteSyncConfig,
  enableSyncConfig,
  disableSyncConfig,
  executeSyncConfig,
  testSyncConfig
} from '../../api/config';
import type { SyncConfig, SyncConfigRequest } from '../../api/types';

/**
 * 视频配置管理页面
 * @author CH
 * @version 1.0.0
 * @since 2024-12-19
 */

// Socket.IO连接
let socket: Socket | null = null;

// 页面状态
const loading = ref(false);
const saving = ref(false);
const searchKeyword = ref('');
const statusFilter = ref('');
const currentPage = ref(1);
const pageSize = ref(20);
const totalCount = ref(0);

// 数据
const configList = ref<SyncConfig[]>([]);
const selectedConfigs = ref<SyncConfig[]>([]);
const syncLogs = ref<any[]>([]);

// 统计信息
const stats = reactive({
  totalConfigs: 0,
  enabledConfigs: 0,
  syncingConfigs: 0,
  errorConfigs: 0
});

// 对话框状态
const showAddDialog = ref(false);
const showLogsDialog = ref(false);
const editingConfig = ref<SyncConfig | null>(null);

// 表单
const configFormRef = ref();
const configForm = reactive<SyncConfigRequest>({
  configName: '',
  configSource: '',
  configUrl: '',
  configHeaders: '',
  configDescription: '',
  syncInterval: 0,
  autoSync: false,
  enableNotification: false
});

// 表单验证规则
const configRules = {
  configName: [
    { required: true, message: '请输入配置名称', trigger: 'blur' }
  ],
  configSource: [
    { required: true, message: '请选择同步源', trigger: 'change' }
  ],
  configUrl: [
    { required: true, message: '请输入同步地址', trigger: 'blur' },
    { type: 'url', message: '请输入有效的URL地址', trigger: 'blur' }
  ]
};

/**
 * 初始化Socket.IO连接
 */
const initSocket = () => {
  socket = io('/video-sync', {
    transports: ['websocket']
  });
  
  // 监听同步状态更新
  socket.on('sync-status', (data) => {
    const config = configList.value.find(c => c.configId === data.configId);
    if (config) {
      config.configStatus = data.status;
      config.lastSyncTime = data.lastSyncTime;
      config.syncCount = data.syncCount;
    }
    updateStats();
  });
  
  // 监听同步日志
  socket.on('sync-log', (log) => {
    syncLogs.value.unshift(log);
    if (syncLogs.value.length > 100) {
      syncLogs.value.pop();
    }
  });
  
  // 监听连接状态
  socket.on('connect', () => {
    console.log('Socket.IO连接成功');
  });
  
  socket.on('disconnect', () => {
    console.log('Socket.IO连接断开');
  });
};

/**
 * 加载配置列表
 */
const loadConfigs = async () => {
  loading.value = true;
  
  try {
    const response = await getSyncConfigs({
      page: currentPage.value,
      size: pageSize.value,
      keyword: searchKeyword.value,
      status: statusFilter.value
    });
    
    if (response.code === 1000) {
      configList.value = response.data.records;
      totalCount.value = response.data.total;
      updateStats();
    }
  } catch (error) {
    console.error('加载配置列表失败:', error);
    ElMessage.error('加载配置列表失败');
  } finally {
    loading.value = false;
  }
};

/**
 * 更新统计信息
 */
const updateStats = () => {
  stats.totalConfigs = configList.value.length;
  stats.enabledConfigs = configList.value.filter(c => c.configStatus === 'enabled').length;
  stats.syncingConfigs = configList.value.filter(c => c.configStatus === 'syncing').length;
  stats.errorConfigs = configList.value.filter(c => c.configStatus === 'error').length;
};

/**
 * 刷新配置
 */
const refreshConfigs = () => {
  loadConfigs();
};

/**
 * 处理搜索
 */
const handleSearch = () => {
  currentPage.value = 1;
  loadConfigs();
};

/**
 * 处理筛选
 */
const handleFilter = () => {
  currentPage.value = 1;
  loadConfigs();
};

/**
 * 处理选择变化
 */
const handleSelectionChange = (selection: SyncConfig[]) => {
  selectedConfigs.value = selection;
};

/**
 * 处理分页变化
 */
const handleCurrentChange = (page: number) => {
  currentPage.value = page;
  loadConfigs();
};

const handleSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
  loadConfigs();
};

/**
 * 执行同步
 */
const handleSync = async (config: SyncConfig) => {
  config.syncing = true;
  
  try {
    const response = await executeSyncConfig(config.configId);
    if (response.code === 1000) {
      ElMessage.success('同步任务已启动');
      config.configStatus = 'syncing';
    } else {
      ElMessage.error(response.message || '启动同步失败');
    }
  } catch (error) {
    console.error('执行同步失败:', error);
    ElMessage.error('执行同步失败');
  } finally {
    config.syncing = false;
  }
};

/**
 * 编辑配置
 */
const editConfig = async (config: SyncConfig) => {
  try {
    const response = await getSyncConfigDetail(config.configId);
    if (response.code === 1000) {
      editingConfig.value = config;
      Object.assign(configForm, response.data);
      showAddDialog.value = true;
    }
  } catch (error) {
    console.error('获取配置详情失败:', error);
    ElMessage.error('获取配置详情失败');
  }
};

/**
 * 处理命令
 */
const handleCommand = async (command: string, config: SyncConfig) => {
  switch (command) {
    case 'enable':
      await toggleConfigStatus(config, true);
      break;
    case 'disable':
      await toggleConfigStatus(config, false);
      break;
    case 'test':
      await testConfig(config);
      break;
    case 'logs':
      showSyncLogs(config);
      break;
    case 'delete':
      await deleteConfig(config);
      break;
  }
};

/**
 * 切换配置状态
 */
const toggleConfigStatus = async (config: SyncConfig, enable: boolean) => {
  try {
    const response = enable 
      ? await enableSyncConfig(config.configId)
      : await disableSyncConfig(config.configId);
    
    if (response.code === 1000) {
      config.configStatus = enable ? 'enabled' : 'disabled';
      ElMessage.success(`${enable ? '启用' : '禁用'}成功`);
      updateStats();
    } else {
      ElMessage.error(response.message || `${enable ? '启用' : '禁用'}失败`);
    }
  } catch (error) {
    console.error(`${enable ? '启用' : '禁用'}配置失败:`, error);
    ElMessage.error(`${enable ? '启用' : '禁用'}配置失败`);
  }
};

/**
 * 测试配置
 */
const testConfig = async (config: SyncConfig) => {
  try {
    const response = await testSyncConfig(config.configId);
    if (response.code === 1000) {
      ElMessage.success('连接测试成功');
    } else {
      ElMessage.error(response.message || '连接测试失败');
    }
  } catch (error) {
    console.error('测试配置失败:', error);
    ElMessage.error('测试配置失败');
  }
};

/**
 * 显示同步日志
 */
const showSyncLogs = (config: SyncConfig) => {
  // TODO: 加载指定配置的同步日志
  showLogsDialog.value = true;
};

/**
 * 删除配置
 */
const deleteConfig = async (config: SyncConfig) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除配置 "${config.configName}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    const response = await deleteSyncConfig(config.configId);
    if (response.code === 1000) {
      ElMessage.success('删除成功');
      loadConfigs();
    } else {
      ElMessage.error(response.message || '删除失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除配置失败:', error);
      ElMessage.error('删除配置失败');
    }
  }
};

/**
 * 保存配置
 */
const saveConfig = async () => {
  try {
    await configFormRef.value.validate();
    
    saving.value = true;
    
    const response = editingConfig.value
      ? await updateSyncConfig(editingConfig.value.configId, configForm)
      : await createSyncConfig(configForm);
    
    if (response.code === 1000) {
      ElMessage.success(editingConfig.value ? '更新成功' : '创建成功');
      showAddDialog.value = false;
      loadConfigs();
    } else {
      ElMessage.error(response.message || '保存失败');
    }
  } catch (error) {
    console.error('保存配置失败:', error);
  } finally {
    saving.value = false;
  }
};

/**
 * 重置表单
 */
const resetForm = () => {
  editingConfig.value = null;
  Object.assign(configForm, {
    configName: '',
    configSource: '',
    configUrl: '',
    configHeaders: '',
    configDescription: '',
    syncInterval: 0,
    autoSync: false,
    enableNotification: false
  });
  configFormRef.value?.resetFields();
};

/**
 * 复制URL
 */
const copyUrl = async (url: string) => {
  try {
    await navigator.clipboard.writeText(url);
    ElMessage.success('URL已复制到剪贴板');
  } catch (error) {
    ElMessage.error('复制失败');
  }
};

/**
 * 刷新日志
 */
const refreshLogs = () => {
  // TODO: 重新加载日志
};

/**
 * 清空日志
 */
const clearLogs = () => {
  syncLogs.value = [];
  ElMessage.success('日志已清空');
};

/**
 * 获取来源图标
 */
const getSourceIcon = (source: string) => {
  const iconMap: Record<string, string> = {
    pansou: 'Search',
    online: 'VideoPlay',
    local: 'Folder',
    rss: 'Rss',
    api: 'Link'
  };
  return iconMap[source] || 'Setting';
};

/**
 * 获取来源类型
 */
const getSourceType = (source: string) => {
  const typeMap: Record<string, string> = {
    pansou: 'primary',
    online: 'success',
    local: 'info',
    rss: 'warning',
    api: 'danger'
  };
  return typeMap[source] || '';
};

/**
 * 获取来源名称
 */
const getSourceName = (source: string) => {
  const nameMap: Record<string, string> = {
    pansou: 'PanSou',
    online: '在线视频',
    local: '本地文件',
    rss: 'RSS订阅',
    api: 'API接口'
  };
  return nameMap[source] || source;
};

/**
 * 获取状态类型
 */
const getStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    enabled: 'success',
    disabled: 'info',
    syncing: 'warning',
    error: 'danger'
  };
  return typeMap[status] || '';
};

/**
 * 获取状态名称
 */
const getStatusName = (status: string) => {
  const nameMap: Record<string, string> = {
    enabled: '启用',
    disabled: '禁用',
    syncing: '同步中',
    error: '异常'
  };
  return nameMap[status] || status;
};

/**
 * 获取日志级别样式
 */
const getLogLevelClass = (level: string) => {
  const classMap: Record<string, string> = {
    INFO: 'text-blue-400',
    WARN: 'text-yellow-400',
    ERROR: 'text-red-400',
    DEBUG: 'text-gray-400'
  };
  return classMap[level] || 'text-green-400';
};

/**
 * 格式化时间
 */
const formatTime = (time: string) => {
  if (!time) return '-';
  return new Date(time).toLocaleString();
};

// 组件挂载
onMounted(() => {
  loadConfigs();
  initSocket();
});

// 组件卸载
onUnmounted(() => {
  if (socket) {
    socket.disconnect();
  }
});
</script>

<style scoped>
.video-config {
  padding: 24px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.stat-card {
  transition: transform 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.logs-content {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}

.log-line {
  word-break: break-all;
}

@media (max-width: 768px) {
  .video-config {
    padding: 16px;
  }
  
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .header-actions {
    flex-direction: column;
    gap: 8px;
  }
}
</style>