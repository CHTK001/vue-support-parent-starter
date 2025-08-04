<template>
  <div class="file-management-config">
    <!-- 启用文件管理 -->
    <el-form-item prop="monitorSysGenServerSettingFileManagementEnabled">
      <template #label>
        <div class="form-label">
          <span>启用文件管理</span>
          <el-tooltip
            content="开启后可以通过Web界面管理服务器文件"
            placement="top"
            effect="dark"
          >
            <IconifyIconOnline icon="ri:question-line" class="help-icon" />
          </el-tooltip>
        </div>
      </template>
      <el-switch
        v-model="formData.monitorSysGenServerSettingFileManagementEnabled"
        :active-value="1"
        :inactive-value="0"
        active-text="启用"
        inactive-text="禁用"
        @change="handleChange"
      />
    </el-form-item>

    <!-- 文件管理模式 -->
    <el-form-item
      v-if="formData.monitorSysGenServerSettingFileManagementEnabled"
      prop="monitorSysGenServerSettingFileManagementMode"
    >
      <template #label>
        <div class="form-label">
          <span>文件管理模式</span>
          <el-tooltip
            content="选择文件管理的连接方式"
            placement="top"
            effect="dark"
          >
            <IconifyIconOnline icon="ri:question-line" class="help-icon" />
          </el-tooltip>
        </div>
      </template>
      <el-select
        v-model="formData.monitorSysGenServerSettingFileManagementMode"
        placeholder="请选择文件管理模式"
        style="width: 100%"
        @change="handleModeChange"
      >
        <el-option v-if="isLocalServer" label="本地连接" value="LOCAL">
          <div class="mode-option">
            <span>本地连接</span>
            <span class="mode-desc">直接访问本地文件系统</span>
          </div>
        </el-option>
        <el-option label="SSH模式" value="SSH">
          <div class="mode-option">
            <span>SSH模式</span>
            <span class="mode-desc">通过SSH/SFTP协议访问</span>
          </div>
        </el-option>
        <el-option label="NODE模式" value="NODE">
          <div class="mode-option">
            <span>NODE模式</span>
            <span class="mode-desc">通过在线客户端代理</span>
          </div>
        </el-option>
        <el-option label="API模式" value="API">
          <div class="mode-option">
            <span>API模式</span>
            <span class="mode-desc">通过HTTP API接口</span>
          </div>
        </el-option>
      </el-select>
    </el-form-item>

    <!-- 模式说明 -->
    <el-alert
      v-if="
        formData.monitorSysGenServerSettingFileManagementEnabled &&
        formData.monitorSysGenServerSettingFileManagementMode
      "
      :title="getModeDescription()"
      type="info"
      :closable="false"
      show-icon
      style="margin-bottom: 16px"
    />

    <!-- NODE模式配置 -->
    <template
      v-if="formData.monitorSysGenServerSettingFileManagementMode === 'NODE'"
    >
      <el-form-item prop="monitorSysGenServerSettingFileManagementNodeClient">
        <template #label>
          <div class="form-label">
            <span>选择客户端</span>
            <el-tooltip
              content="选择要用于文件管理的NODE客户端实例"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-select
          v-model="formData.monitorSysGenServerSettingFileManagementNodeClient"
          placeholder="请选择NODE客户端"
          style="width: 100%"
          :loading="loadingNodeClients"
          @focus="loadNodeClients"
          @change="handleChange"
        >
          <el-option
            v-for="client in nodeClients"
            :key="client.serverId"
            :label="`${client.host}:${client.port} (${client.applicationName})`"
            :value="client.serverId"
          >
            <div class="node-client-option">
              <div class="client-info">
                <span class="client-name">{{ client.applicationName }}</span>
                <span class="client-address"
                  >{{ client.host }}:{{ client.port }}</span
                >
              </div>
              <div class="client-status">
                <el-tag
                  :type="client.status === 'ONLINE' ? 'success' : 'danger'"
                  size="small"
                >
                  {{ client.status === "ONLINE" ? "在线" : "离线" }}
                </el-tag>
              </div>
            </div>
          </el-option>
        </el-select>
      </el-form-item>

      <!-- 刷新客户端列表 -->
      <el-form-item>
        <el-button
          type="primary"
          @click="loadNodeClients"
          :loading="loadingNodeClients"
        >
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
          刷新客户端列表
        </el-button>
        <span class="form-item-tip">重新获取可用的NODE客户端列表</span>
      </el-form-item>
    </template>

    <!-- API模式配置 -->
    <template
      v-if="formData.monitorSysGenServerSettingFileManagementMode === 'API'"
    >
      <el-divider content-position="left">
        <span class="divider-text">API连接配置</span>
      </el-divider>

      <el-form-item prop="apiHost">
        <template #label>
          <div class="form-label">
            <span>API主机地址</span>
            <el-tooltip
              content="文件管理API服务的主机地址"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input
          v-model="apiConfig.apiHost"
          placeholder="请输入API主机地址"
          maxlength="100"
          @change="handleApiConfigChange"
        />
      </el-form-item>

      <el-form-item prop="apiPort">
        <template #label>
          <div class="form-label">
            <span>API端口</span>
            <el-tooltip
              content="文件管理API服务的端口号"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input-number
          v-model="apiConfig.apiPort"
          :min="1"
          :max="65535"
          placeholder="API端口"
          style="width: 200px"
          @change="handleApiConfigChange"
        />
      </el-form-item>
    </template>

    <!-- 通用配置 -->
    <template
      v-if="
        formData.monitorSysGenServerSettingFileManagementEnabled &&
        formData.monitorSysGenServerSettingFileManagementMode !== 'NONE'
      "
    >
      <el-divider content-position="left">
        <span class="divider-text">通用配置</span>
      </el-divider>

      <el-form-item prop="monitorSysGenServerSettingFileManagementTimeout">
        <template #label>
          <div class="form-label">
            <span>操作超时时间</span>
            <el-tooltip
              content="文件管理操作的超时时间，单位：秒"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input-number
          v-model="formData.monitorSysGenServerSettingFileManagementTimeout"
          :min="30"
          :max="600"
          :step="30"
          placeholder="操作超时时间(秒)"
          style="width: 200px"
          @change="handleChange"
        />
        <span class="form-tip">秒，建议值：60</span>
      </el-form-item>

      <el-form-item prop="monitorSysGenServerSettingFileManagementMaxRetries">
        <template #label>
          <div class="form-label">
            <span>最大重试次数</span>
            <el-tooltip
              content="文件操作失败时的最大重试次数"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input-number
          v-model="formData.monitorSysGenServerSettingFileManagementMaxRetries"
          :min="0"
          :max="10"
          :step="1"
          placeholder="最大重试次数"
          style="width: 200px"
          @change="handleChange"
        />
        <span class="form-tip">次，建议值：3</span>
      </el-form-item>

      <!-- 测试连接 -->
      <el-form-item>
        <el-button
          type="primary"
          @click="testConnection"
          :loading="testingConnection"
        >
          <IconifyIconOnline icon="ri:wifi-line" class="mr-1" />
          测试连接
        </el-button>
        <span class="form-item-tip">测试文件管理连接是否正常</span>
      </el-form-item>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import { ElMessage } from "element-plus";
import { IconifyIconOnline } from "@iconify/vue";
import type {
  ServerSetting,
  FileManagementApiConfig,
} from "@/api/server/setting";
import {
  getAvailableNodeClients,
  testFileManagementConnection,
} from "@/api/server/setting";

// Props
const props = defineProps<{
  modelValue: Partial<ServerSetting>;
  serverId?: number;
  isLocalServer?: boolean;
}>();

// Emits
const emit = defineEmits<{
  change: [];
  "update:modelValue": [value: Partial<ServerSetting>];
}>();

// 响应式数据
const formData = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const nodeClients = ref<any[]>([]);
const loadingNodeClients = ref(false);
const testingConnection = ref(false);

// API配置
const apiConfig = reactive<FileManagementApiConfig>({
  apiHost: "localhost",
  apiPort: 8080,
  basePath: "/api/file",
  useHttps: false,
  authType: "NONE",
  connectionTimeout: 30,
  readTimeout: 60,
  maxRetries: 3,
  sslVerificationEnabled: true,
});

// 方法
const handleChange = () => {
  emit("change");
};

const handleModeChange = () => {
  // 重置相关配置
  if (formData.value.monitorSysGenServerSettingFileManagementMode !== "NODE") {
    formData.value.monitorSysGenServerSettingFileManagementNodeClient = "";
  }
  handleChange();
};

const handleApiConfigChange = () => {
  // 更新API配置到formData
  formData.value.monitorSysGenServerSettingFileManagementApiConfig =
    JSON.stringify(apiConfig);
  handleChange();
};

const getModeDescription = () => {
  const mode = formData.value.monitorSysGenServerSettingFileManagementMode;
  switch (mode) {
    case "LOCAL":
      return "本地模式：直接访问服务器本地文件系统，仅适用于本地服务器";
    case "SSH":
      return "SSH模式：通过SSH/SFTP协议直接访问服务器文件系统";
    case "NODE":
      return "NODE模式：通过在线客户端代理进行文件管理，自动检测客户端地址";
    case "API":
      return "API模式：通过手动配置的HTTP API地址进行文件管理";
    default:
      return "";
  }
};

const loadNodeClients = async () => {
  if (!props.serverId) return;

  loadingNodeClients.value = true;
  try {
    const result = await getAvailableNodeClients();
    if (result.code === 200) {
      nodeClients.value = result.data || [];
    } else {
      ElMessage.error("获取NODE客户端列表失败");
    }
  } catch (error) {
    ElMessage.error("获取NODE客户端列表失败");
  } finally {
    loadingNodeClients.value = false;
  }
};

const testConnection = async () => {
  if (!props.serverId) return;

  testingConnection.value = true;
  try {
    const result = await testFileManagementConnection(props.serverId);
    if (result.code === 200 && result.data) {
      ElMessage.success("文件管理连接测试成功");
    } else {
      ElMessage.error("文件管理连接测试失败");
    }
  } catch (error) {
    ElMessage.error("文件管理连接测试失败");
  } finally {
    testingConnection.value = false;
  }
};

// 监听API配置变化
watch(
  () => formData.value.monitorSysGenServerSettingFileManagementApiConfig,
  (newValue) => {
    if (newValue) {
      try {
        const config = JSON.parse(newValue);
        Object.assign(apiConfig, config);
      } catch (error) {
        // 忽略解析错误
      }
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.file-management-config {
  padding: 0;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 4px;
}

.help-icon {
  color: #909399;
  cursor: help;
}

.form-tip {
  margin-left: 8px;
  color: #909399;
  font-size: 12px;
}

.form-item-tip {
  margin-left: 8px;
  color: #909399;
  font-size: 12px;
}

.divider-text {
  font-weight: 500;
  color: #303133;
}

.mode-option {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mode-desc {
  font-size: 12px;
  color: #909399;
}

.node-client-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.client-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.client-name {
  font-weight: 500;
}

.client-address {
  font-size: 12px;
  color: #909399;
}

.client-status {
  margin-left: 8px;
}
</style>
