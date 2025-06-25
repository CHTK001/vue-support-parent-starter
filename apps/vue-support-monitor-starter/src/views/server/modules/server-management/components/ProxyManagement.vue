<template>
  <div class="proxy-management">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button type="primary" @click="showCreateDialog">
          <IconifyIconOnline icon="ri:add-line" />
          创建代理
        </el-button>
        <el-button @click="refreshProxies">
          <IconifyIconOnline icon="ri:refresh-line" />
          刷新
        </el-button>
      </div>
      <div class="toolbar-right">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索代理名称"
          style="width: 300px"
          clearable
          @input="handleSearch"
        >
          <template #prefix>
            <IconifyIconOnline icon="ri:search-line" />
          </template>
        </el-input>
      </div>
    </div>

    <!-- 代理列表 -->
    <el-table
      v-loading="loading"
      :data="filteredProxies"
      stripe
      style="width: 100%"
    >
      <el-table-column prop="proxyName" label="代理名称" min-width="150" />
      <el-table-column prop="proxyHost" label="代理地址" min-width="150" />
      <el-table-column prop="proxyPort" label="端口" width="80" />
      <el-table-column prop="proxyType" label="类型" width="100" />
      <el-table-column prop="proxyStatus" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.proxyStatus)">
            {{ getStatusText(row.proxyStatus) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="proxyDesc" label="描述" min-width="200" />
      <el-table-column prop="proxyCreateTime" label="创建时间" width="160" />
      <el-table-column label="操作" width="300" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="row.proxyStatus === 0"
            size="small"
            type="primary"
            @click="startProxy(row)"
          >
            启动
          </el-button>
          <el-button
            v-if="row.proxyStatus === 1"
            size="small"
            type="warning"
            @click="stopProxy(row)"
          >
            停止
          </el-button>
          <el-button
            v-if="row.proxyStatus === 1"
            size="small"
            @click="refreshProxy(row)"
          >
            刷新
          </el-button>
          <el-button size="small" @click="editProxy(row)">
            编辑
          </el-button>
          <el-button size="small" @click="viewConfig(row)">
            配置
          </el-button>
          <el-button size="small" @click="viewLogs(row)">
            日志
          </el-button>
          <el-button
            size="small"
            type="danger"
            @click="deleteProxy(row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination">
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

    <!-- 创建/编辑代理对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      :title="isEdit ? '编辑代理' : '创建代理'"
      width="600px"
      @close="resetEditForm"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        label-width="120px"
      >
        <el-form-item label="代理名称" prop="proxyName">
          <el-input v-model="editForm.proxyName" placeholder="请输入代理名称" />
        </el-form-item>
        <el-form-item label="代理地址" prop="proxyHost">
          <el-input v-model="editForm.proxyHost" placeholder="请输入代理地址" />
        </el-form-item>
        <el-form-item label="端口" prop="proxyPort">
          <el-input-number
            v-model="editForm.proxyPort"
            :min="1"
            :max="65535"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="代理类型" prop="proxyType">
          <el-select v-model="editForm.proxyType" placeholder="选择代理类型" style="width: 100%">
            <el-option label="HTTP" value="HTTP" />
            <el-option label="HTTPS" value="HTTPS" />
            <el-option label="SOCKS5" value="SOCKS5" />
            <el-option label="Guacamole" value="GUACAMOLE" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="editForm.proxyDesc"
            type="textarea"
            :rows="3"
            placeholder="请输入代理描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveProxy" :loading="saving">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 代理配置对话框 -->
    <el-dialog
      v-model="configDialogVisible"
      title="代理配置"
      width="800px"
    >
      <div v-if="currentProxy" class="config-content">
        <el-button type="primary" @click="showAddConfigDialog" style="margin-bottom: 16px">
          <IconifyIconOnline icon="ri:add-line" />
          添加配置
        </el-button>
        
        <el-table :data="proxyConfigs" stripe>
          <el-table-column prop="proxyConfigName" label="配置名称" />
          <el-table-column prop="proxyConfigValue" label="配置值" />
          <el-table-column prop="proxyConfigDesc" label="描述" />
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button size="small" @click="editConfig(row)">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteConfig(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>

    <!-- 代理日志对话框 -->
    <el-dialog
      v-model="logDialogVisible"
      title="代理日志"
      width="1000px"
    >
      <div v-if="currentProxy" class="log-content">
        <div class="log-toolbar">
          <el-select v-model="logFilter.type" placeholder="日志类型" style="width: 150px">
            <el-option label="全部" value="" />
            <el-option label="访问日志" value="ACCESS" />
            <el-option label="错误日志" value="ERROR" />
            <el-option label="限制日志" value="LIMIT" />
            <el-option label="白名单" value="WHITE" />
            <el-option label="黑名单" value="BLACK" />
          </el-select>
          <el-button @click="loadProxyLogs">刷新</el-button>
        </div>
        
        <el-table :data="proxyLogs" stripe style="margin-top: 16px">
          <el-table-column prop="monitorProxyLogType" label="类型" width="100" />
          <el-table-column prop="monitorProxyLogLevel" label="级别" width="80" />
          <el-table-column prop="monitorProxyLogContent" label="内容" min-width="300" />
          <el-table-column prop="monitorProxyLogCreateTime" label="时间" width="160" />
        </el-table>
        
        <div class="log-pagination">
          <el-pagination
            v-model:current-page="logPagination.page"
            v-model:page-size="logPagination.pageSize"
            :total="logPagination.total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @size-change="handleLogSizeChange"
            @current-change="handleLogCurrentChange"
          />
        </div>
      </div>
    </el-dialog>

    <!-- 添加配置对话框 -->
    <el-dialog
      v-model="addConfigDialogVisible"
      title="添加配置"
      width="500px"
    >
      <el-form
        ref="configFormRef"
        :model="configForm"
        :rules="configRules"
        label-width="100px"
      >
        <el-form-item label="配置名称" prop="proxyConfigName">
          <el-input v-model="configForm.proxyConfigName" placeholder="请输入配置名称" />
        </el-form-item>
        <el-form-item label="配置值" prop="proxyConfigValue">
          <el-input v-model="configForm.proxyConfigValue" placeholder="请输入配置值" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="configForm.proxyConfigDesc"
            type="textarea"
            :rows="3"
            placeholder="请输入配置描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addConfigDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveConfig" :loading="savingConfig">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import IconifyIconOnline from "@repo/components/ReIcon/src/iconifyIconOnline";
import {
  getProxyPageList,
  saveProxy as saveProxyApi,
  updateProxy,
  deleteProxy as deleteProxyApi,
  startProxy as startProxyApi,
  stopProxy as stopProxyApi,
  refreshProxy as refreshProxyApi,
  getProxyPluginConfigs,
  saveProxyPluginConfig,
  getProxyLogs,
  type MonitorProxy,
  type ProxyPageParams,
  type ProxySaveParams,
  type MonitorProxyPluginConfig,
  type MonitorProxyLog,
  PROXY_STATUS
} from '@/api/monitor/gen/proxy';

// 响应式数据
const loading = ref(false);
const saving = ref(false);
const savingConfig = ref(false);
const proxies = ref<MonitorProxy[]>([]);
const searchKeyword = ref('');

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
});

// 对话框状态
const editDialogVisible = ref(false);
const configDialogVisible = ref(false);
const logDialogVisible = ref(false);
const addConfigDialogVisible = ref(false);
const isEdit = ref(false);
const currentProxy = ref<MonitorProxy | null>(null);

// 表单
const editFormRef = ref();
const configFormRef = ref();
const editForm = reactive<ProxySaveParams>({
  proxyName: '',
  proxyHost: '',
  proxyPort: 8080,
  proxyType: 'HTTP',
  proxyDesc: ''
});

const configForm = reactive({
  proxyConfigName: '',
  proxyConfigValue: '',
  proxyConfigDesc: ''
});

// 配置和日志数据
const proxyConfigs = ref<MonitorProxyPluginConfig[]>([]);
const proxyLogs = ref<MonitorProxyLog[]>([]);

// 日志过滤和分页
const logFilter = reactive({
  type: ''
});

const logPagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
});

// 表单验证规则
const editRules = {
  proxyName: [{ required: true, message: '请输入代理名称', trigger: 'blur' }],
  proxyHost: [{ required: true, message: '请输入代理地址', trigger: 'blur' }],
  proxyPort: [{ required: true, message: '请输入端口', trigger: 'blur' }]
};

const configRules = {
  proxyConfigName: [{ required: true, message: '请输入配置名称', trigger: 'blur' }],
  proxyConfigValue: [{ required: true, message: '请输入配置值', trigger: 'blur' }]
};

// 计算属性
const filteredProxies = computed(() => {
  if (!searchKeyword.value) return proxies.value;
  const keyword = searchKeyword.value.toLowerCase();
  return proxies.value.filter(proxy =>
    proxy.proxyName?.toLowerCase().includes(keyword)
  );
});

// 方法
const loadProxies = async () => {
  try {
    loading.value = true;
    const params: ProxyPageParams = {
      page: pagination.page,
      pageSize: pagination.pageSize
    };
    
    const res = await getProxyPageList(params);
    if (res.code === '00000') {
      proxies.value = res.data?.records || [];
      pagination.total = res.data?.total || 0;
    }
  } catch (error) {
    console.error('加载代理列表失败:', error);
    ElMessage.error('加载代理列表失败');
  } finally {
    loading.value = false;
  }
};

const refreshProxies = () => {
  loadProxies();
};

const handleSearch = () => {
  // 搜索逻辑在计算属性中处理
};

const handleSizeChange = (size: number) => {
  pagination.pageSize = size;
  pagination.page = 1;
  loadProxies();
};

const handleCurrentChange = (page: number) => {
  pagination.page = page;
  loadProxies();
};

// 状态相关方法
const getStatusType = (status: number): 'success' | 'warning' | 'info' | 'primary' | 'danger' => {
  return status === PROXY_STATUS.RUNNING ? 'success' : 'info';
};

const getStatusText = (status: number) => {
  return status === PROXY_STATUS.RUNNING ? '运行中' : '已停止';
};

// 代理操作方法
const showCreateDialog = () => {
  isEdit.value = false;
  editDialogVisible.value = true;
};

const editProxy = (proxy: MonitorProxy) => {
  isEdit.value = true;
  Object.assign(editForm, {
    proxyId: proxy.proxyId,
    proxyName: proxy.proxyName,
    proxyHost: proxy.proxyHost,
    proxyPort: proxy.proxyPort,
    proxyType: proxy.proxyType,
    proxyDesc: proxy.proxyDesc
  });
  editDialogVisible.value = true;
};

const resetEditForm = () => {
  Object.assign(editForm, {
    proxyName: '',
    proxyHost: '',
    proxyPort: 8080,
    proxyType: 'HTTP',
    proxyDesc: ''
  });
  editFormRef.value?.resetFields();
};

const saveProxy = async () => {
  try {
    await editFormRef.value?.validate();
    saving.value = true;
    
    const api = isEdit.value ? updateProxy : saveProxyApi;
    const res = await api(editForm);
    
    if (res.code === '00000') {
      ElMessage.success(isEdit.value ? '代理更新成功' : '代理创建成功');
      editDialogVisible.value = false;
      loadProxies();
    } else {
      ElMessage.error(res.msg || '操作失败');
    }
  } catch (error) {
    console.error('保存代理失败:', error);
  } finally {
    saving.value = false;
  }
};

const startProxy = async (proxy: MonitorProxy) => {
  try {
    const res = await startProxyApi(proxy.proxyId);
    if (res.code === '00000') {
      ElMessage.success('代理启动成功');
      loadProxies();
    } else {
      ElMessage.error(res.msg || '代理启动失败');
    }
  } catch (error) {
    console.error('启动代理失败:', error);
    ElMessage.error('启动代理失败');
  }
};

const stopProxy = async (proxy: MonitorProxy) => {
  try {
    const res = await stopProxyApi(proxy.proxyId);
    if (res.code === '00000') {
      ElMessage.success('代理停止成功');
      loadProxies();
    } else {
      ElMessage.error(res.msg || '代理停止失败');
    }
  } catch (error) {
    console.error('停止代理失败:', error);
    ElMessage.error('停止代理失败');
  }
};

const refreshProxy = async (proxy: MonitorProxy) => {
  try {
    const res = await refreshProxyApi(proxy.proxyId);
    if (res.code === '00000') {
      ElMessage.success('代理刷新成功');
    } else {
      ElMessage.error(res.msg || '代理刷新失败');
    }
  } catch (error) {
    console.error('刷新代理失败:', error);
    ElMessage.error('刷新代理失败');
  }
};

const deleteProxy = async (proxy: MonitorProxy) => {
  try {
    await ElMessageBox.confirm('确定要删除这个代理吗？', '确认删除', {
      type: 'warning'
    });
    
    const res = await deleteProxyApi(proxy.proxyId);
    if (res.code === '00000') {
      ElMessage.success('代理删除成功');
      loadProxies();
    } else {
      ElMessage.error(res.msg || '代理删除失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除代理失败:', error);
      ElMessage.error('删除代理失败');
    }
  }
};

// 配置管理方法
const viewConfig = async (proxy: MonitorProxy) => {
  currentProxy.value = proxy;
  configDialogVisible.value = true;
  await loadProxyConfigs();
};

const loadProxyConfigs = async () => {
  if (!currentProxy.value) return;
  
  try {
    const res = await getProxyPluginConfigs(currentProxy.value.proxyId);
    if (res.code === '00000') {
      proxyConfigs.value = res.data || [];
    }
  } catch (error) {
    console.error('加载代理配置失败:', error);
  }
};

const showAddConfigDialog = () => {
  addConfigDialogVisible.value = true;
};

const saveConfig = async () => {
  try {
    await configFormRef.value?.validate();
    savingConfig.value = true;
    
    const configData = {
      ...configForm,
      proxyId: currentProxy.value?.proxyId
    };
    
    const res = await saveProxyPluginConfig(configData);
    if (res.code === '00000') {
      ElMessage.success('配置保存成功');
      addConfigDialogVisible.value = false;
      loadProxyConfigs();
    } else {
      ElMessage.error(res.msg || '配置保存失败');
    }
  } catch (error) {
    console.error('保存配置失败:', error);
  } finally {
    savingConfig.value = false;
  }
};

const editConfig = (config: MonitorProxyPluginConfig) => {
  // TODO: 实现配置编辑
  ElMessage.info('配置编辑功能开发中');
};

const deleteConfig = async (config: MonitorProxyPluginConfig) => {
  // TODO: 实现配置删除
  ElMessage.info('配置删除功能开发中');
};

// 日志管理方法
const viewLogs = async (proxy: MonitorProxy) => {
  currentProxy.value = proxy;
  logDialogVisible.value = true;
  await loadProxyLogs();
};

const loadProxyLogs = async () => {
  if (!currentProxy.value) return;
  
  try {
    const res = await getProxyLogs(currentProxy.value.proxyId, {
      page: logPagination.page,
      pageSize: logPagination.pageSize
    });
    if (res.code === '00000') {
      proxyLogs.value = res.data?.records || [];
      logPagination.total = res.data?.total || 0;
    }
  } catch (error) {
    console.error('加载代理日志失败:', error);
  }
};

const handleLogSizeChange = (size: number) => {
  logPagination.pageSize = size;
  logPagination.page = 1;
  loadProxyLogs();
};

const handleLogCurrentChange = (page: number) => {
  logPagination.page = page;
  loadProxyLogs();
};

// 生命周期
onMounted(() => {
  loadProxies();
});

// 暴露方法
defineExpose({
  refreshProxies,
  loadProxies
});
</script>

<style scoped>
.proxy-management {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 16px;
  background: var(--el-bg-color);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
}

.toolbar-left {
  display: flex;
  gap: 8px;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

.config-content,
.log-content {
  min-height: 400px;
}

.log-toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
}

.log-pagination {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}
</style>
