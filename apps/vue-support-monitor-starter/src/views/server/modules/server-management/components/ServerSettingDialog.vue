<template>
  <sc-dialog
    v-model="visible"
    title="服务器设置"
    width="900px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <div class="dialog-content">
      <!-- 左侧导航 -->
      <ul class="setting-nav">
        <li
          v-for="item in navItems"
          :key="item.key"
          :class="['nav-item', activeTab === item.key ? 'active' : '']"
          @click="activeTab = item.key"
        >
          {{ item.label }}
        </li>
      </ul>

      <!-- 右侧内容 -->
      <div class="setting-content">
        <!-- 基础监控配置 -->
        <div v-show="activeTab === 'basic'" class="section-panel">
          <div class="section-header">
            <h3>基础监控</h3>
            <p>配置服务器的基础监控参数</p>
          </div>

          <div class="form-item">
            <label>启用监控</label>
            <div class="form-control">
              <label class="switch">
                <input type="checkbox" v-model="formData.monitorSysGenServerSettingMonitorEnabled" :true-value="1" :false-value="0">
                <span class="slider"></span>
              </label>
            </div>
          </div>

          <div class="form-item" v-show="formData.monitorSysGenServerSettingDataReportMethod !== 'API'">
            <label>数据收集频率</label>
            <div class="form-control">
              <input type="number" v-model.number="formData.monitorSysGenServerSettingDataCollectionFrequency" min="10" max="3600" step="10">
              <span class="unit">秒</span>
            </div>
          </div>

          <div class="form-item">
            <label>数据保留时间</label>
            <div class="form-control">
              <input type="number" v-model.number="formData.monitorSysGenServerSettingMetricsRetentionDays" min="1" max="365">
              <span class="unit">天</span>
            </div>
          </div>
        </div>

        <!-- 数据上报配置 -->
        <div v-show="activeTab === 'report'" class="section-panel">
          <div class="section-header">
            <h3>数据上报</h3>
            <p>配置监控数据的上报方式</p>
          </div>

          <div class="form-item">
            <label>启用上报</label>
            <div class="form-control">
              <label class="switch">
                <input type="checkbox" v-model="formData.monitorSysGenServerSettingReportEnabled" :true-value="1" :false-value="0">
                <span class="slider"></span>
              </label>
            </div>
          </div>

          <div class="form-item">
            <label>上报方式</label>
            <div class="form-control">
              <select v-model="formData.monitorSysGenServerSettingDataReportMethod">
                <option v-for="opt in reportMethodOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
          </div>

          <div v-show="formData.monitorSysGenServerSettingDataReportMethod === 'PROMETHEUS'" class="sub-config">
            <div class="sub-title">Prometheus配置</div>
            <div class="form-item">
              <label>服务器地址</label>
              <div class="form-control">
                <input type="text" v-model="formData.monitorSysGenServerSettingPrometheusHost" placeholder="Prometheus服务器地址">
              </div>
            </div>
            <div class="form-item">
              <label>端口</label>
              <div class="form-control">
                <input type="number" v-model.number="formData.monitorSysGenServerSettingPrometheusPort" min="1" max="65535">
              </div>
            </div>
          </div>

          <div v-show="formData.monitorSysGenServerSettingDataReportMethod === 'API'" class="info-box">
            API上报方式将通过客户端自动推送数据到服务器，无需额外配置。
          </div>
        </div>

        <!-- 指标管理 -->
        <div v-show="activeTab === 'metrics'" class="section-panel">
          <div class="section-header">
            <h3>指标管理</h3>
            <p>配置监控指标的采集与存储</p>
          </div>

          <div class="form-item">
            <label>监控间隔</label>
            <div class="form-control">
              <input type="number" v-model.number="formData.monitorSysGenServerSettingMonitorInterval" min="30" max="3600" step="30">
              <span class="unit">秒</span>
            </div>
          </div>

          <div class="form-item">
            <label>数据保留时间</label>
            <div class="form-control">
              <input type="number" v-model.number="formData.monitorSysGenServerSettingMetricsRetentionDays" min="1" max="365">
              <span class="unit">天</span>
            </div>
          </div>
        </div>

        <!-- 告警配置 -->
        <div v-show="activeTab === 'alert'" class="section-panel">
          <div class="section-header">
            <h3>告警配置</h3>
            <p>配置告警阈值和通知方式</p>
          </div>

          <div class="form-item">
            <label>启用告警</label>
            <div class="form-control">
              <label class="switch">
                <input type="checkbox" v-model="formData.monitorSysGenServerSettingAlertEnabled" :true-value="1" :false-value="0">
                <span class="slider"></span>
              </label>
            </div>
          </div>

          <div v-show="formData.monitorSysGenServerSettingAlertEnabled">
            <div class="threshold-grid">
              <div class="threshold-card">
                <div class="threshold-label">CPU阈值</div>
                <input type="number" v-model.number="formData.monitorSysGenServerSettingCpuAlertThreshold" min="1" max="100">
                <span class="unit">%</span>
              </div>
              <div class="threshold-card">
                <div class="threshold-label">内存阈值</div>
                <input type="number" v-model.number="formData.monitorSysGenServerSettingMemoryAlertThreshold" min="1" max="100">
                <span class="unit">%</span>
              </div>
              <div class="threshold-card">
                <div class="threshold-label">磁盘阈值</div>
                <input type="number" v-model.number="formData.monitorSysGenServerSettingDiskAlertThreshold" min="1" max="100">
                <span class="unit">%</span>
              </div>
            </div>

            <div class="form-item">
              <label>通知方式</label>
              <div class="form-control">
                <select v-model="formData.monitorSysGenServerSettingAlertNotificationMethod">
                  <option value="EMAIL">邮件</option>
                  <option value="SMS">短信</option>
                  <option value="WEBHOOK">Webhook</option>
                </select>
              </div>
            </div>

            <div class="form-item" v-show="formData.monitorSysGenServerSettingAlertNotificationMethod && formData.monitorSysGenServerSettingAlertNotificationMethod !== 'NONE'">
              <label>通知地址</label>
              <div class="form-control">
                <input type="text" v-model="formData.monitorSysGenServerSettingAlertNotificationAddress" :placeholder="getNotificationAddressPlaceholder()">
              </div>
              <div class="form-tip">{{ getNotificationAddressTip() }}</div>
            </div>
          </div>
        </div>

        <!-- 文件管理配置 -->
        <div v-show="activeTab === 'filemanagement'" class="section-panel">
          <div class="section-header">
            <h3>文件管理</h3>
            <p>配置远程文件管理功能</p>
          </div>

          <div class="form-item">
            <label>启用文件管理</label>
            <div class="form-control">
              <label class="switch">
                <input type="checkbox" v-model="formData.monitorSysGenServerSettingFileManagementEnabled" :true-value="1" :false-value="0">
                <span class="slider"></span>
              </label>
            </div>
          </div>

          <div v-show="formData.monitorSysGenServerSettingFileManagementEnabled">
            <div class="form-item">
              <label>连接方式</label>
              <div class="form-control">
                <select v-model="formData.monitorSysGenServerSettingFileManagementMode" @change="handleFileManagementModeChange">
                  <option value="NONE">不启用</option>
                  <option value="SSH">SSH连接</option>
                  <option value="NODE">NODE客户端</option>
                  <option value="API">API连接</option>
                </select>
              </div>
            </div>

            <div v-show="formData.monitorSysGenServerSettingFileManagementMode === 'API'" class="sub-config">
              <div class="sub-title">API连接配置</div>
              <div class="form-item">
                <label>API主机地址</label>
                <div class="form-control">
                  <input type="text" v-model="apiConfig.apiHost" placeholder="请输入API主机地址" @change="handleApiConfigChange">
                </div>
              </div>
              <div class="form-item">
                <label>API端口</label>
                <div class="form-control">
                  <input type="number" v-model.number="apiConfig.apiPort" min="1" max="65535" @change="handleApiConfigChange">
                </div>
              </div>
              <div class="form-item">
                <label>认证方式</label>
                <div class="form-control">
                  <select v-model="apiConfig.authType" @change="handleApiConfigChange">
                    <option value="NONE">无认证</option>
                    <option value="BASIC">Basic认证</option>
                    <option value="TOKEN">Token认证</option>
                    <option value="API_KEY">API Key认证</option>
                  </select>
                </div>
              </div>
            </div>

            <div v-show="formData.monitorSysGenServerSettingFileManagementMode !== 'NONE'" class="sub-config">
              <div class="sub-title">通用配置</div>
              <div class="form-item">
                <label>操作超时时间</label>
                <div class="form-control">
                  <input type="number" v-model.number="formData.monitorSysGenServerSettingFileManagementTimeout" min="30" max="600" step="30">
                  <span class="unit">秒</span>
                </div>
              </div>
              <div class="form-item">
                <label>最大重试次数</label>
                <div class="form-control">
                  <input type="number" v-model.number="formData.monitorSysGenServerSettingFileManagementMaxRetries" min="0" max="10">
                  <span class="unit">次</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 高级配置 -->
        <div v-show="activeTab === 'advanced'" class="section-panel">
          <div class="section-header">
            <h3>高级配置</h3>
            <p>配置高级监控参数和扩展功能</p>
          </div>

          <div class="form-item">
            <label>连接超时</label>
            <div class="form-control">
              <input type="number" v-model.number="formData.monitorSysGenServerSettingConnectionTimeout" min="5" max="300" step="5">
              <span class="unit">秒</span>
            </div>
          </div>

          <div class="form-item">
            <label>读取超时</label>
            <div class="form-control">
              <input type="number" v-model.number="formData.monitorSysGenServerSettingReadTimeout" min="5" max="300" step="5">
              <span class="unit">秒</span>
            </div>
          </div>

          <div class="form-item">
            <label>启用Docker监控</label>
            <div class="form-control">
              <label class="switch">
                <input type="checkbox" v-model="formData.monitorSysGenServerSettingDockerMonitorEnabled" :true-value="1" :false-value="0">
                <span class="slider"></span>
              </label>
            </div>
          </div>

          <div v-show="formData.monitorSysGenServerSettingDockerMonitorEnabled" class="sub-config">
            <div class="sub-title">Docker配置</div>
            <div class="form-item">
              <label>Docker API主机</label>
              <div class="form-control">
                <input type="text" v-model="formData.monitorSysGenServerSettingDockerHost" placeholder="127.0.0.1">
              </div>
            </div>
            <div class="form-item">
              <label>Docker API端口</label>
              <div class="form-control">
                <input type="number" v-model.number="formData.monitorSysGenServerSettingDockerPort" min="1" max="65535">
              </div>
            </div>
            <div class="form-item">
              <label>连接超时</label>
              <div class="form-control">
                <input type="number" v-model.number="dockerConnectTimeoutSeconds" min="1" max="600">
                <span class="unit">秒</span>
              </div>
            </div>
            <div class="form-item">
              <label>Docker API版本</label>
              <div class="form-control">
                <input type="text" v-model="formData.monitorSysGenServerSettingDockerApiVersion" placeholder="1.40">
              </div>
            </div>
          </div>

          <div class="form-item">
            <label>监控端口</label>
            <div class="form-control">
              <input type="text" v-model="formData.monitorSysGenServerSettingMonitorPorts" placeholder="80,443,3306">
            </div>
          </div>

          <div class="form-item">
            <label>配置描述</label>
            <div class="form-control">
              <textarea v-model="formData.monitorSysGenServerSettingDescription" rows="2" placeholder="配置描述信息"></textarea>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <button type="button" class="btn btn-default" @click="visible = false">取消</button>
        <button type="button" class="btn btn-primary" :disabled="loading" @click="handleSubmit">
          {{ loading ? '保存中...' : '保存配置' }}
        </button>
      </div>
    </template>
  </sc-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch } from "vue";
import { message } from "@repo/utils";
import {
  type ServerSetting,
  type FileManagementApiConfig,
  getOrCreateServerSetting,
  saveOrUpdateServerSetting,
} from "@/api/server/setting";
import { getServerInfo, type ServerInfo } from "@/api/server";

const emit = defineEmits<{ success: [] }>();

const visible = ref(false);
const loading = ref(false);
const activeTab = ref("basic");
const serverId = ref<number | null>(null);
const currentServer = ref<ServerInfo | null>(null);

const navItems = [
  { key: "basic", label: "基础监控" },
  { key: "report", label: "数据上报" },
  { key: "metrics", label: "指标管理" },
  { key: "alert", label: "告警配置" },
  { key: "filemanagement", label: "文件管理" },
  { key: "advanced", label: "高级配置" },
];

const reportMethodOptions = computed(() => {
  const options = [{ label: "不上报", value: "NONE" }];
  if (currentServer.value?.monitorSysGenServerIsLocal === 1) {
    options.push({ label: "本机上报", value: "LOCAL" });
  } else {
    options.push({ label: "API接口", value: "API" });
  }
  options.push({ label: "Prometheus", value: "PROMETHEUS" });
  return options;
});

const apiConfig = reactive<FileManagementApiConfig>({
  apiHost: "localhost",
  apiPort: 8080,
  basePath: "/api/file",
  useHttps: false,
  authType: "NONE",
  username: "",
  password: "",
  token: "",
  apiKey: "",
  apiKeyHeader: "X-API-Key",
  connectionTimeout: 30,
  readTimeout: 60,
  writeTimeout: 60,
  maxRetries: 3,
  retryInterval: 1000,
  customHeaders: "",
  compressionEnabled: true,
  sslVerificationEnabled: true,
  useClientAddress: true,
  useClientPort: true,
});

const formData = reactive<Partial<ServerSetting>>({
  monitorSysGenServerSettingMonitorEnabled: 1,
  monitorSysGenServerSettingReportEnabled: 1,
  monitorSysGenServerSettingDataReportMethod: "API",
  monitorSysGenServerSettingDataCollectionFrequency: 30,
  monitorSysGenServerSettingMetricsRetentionDays: 30,
  monitorSysGenServerSettingAlertEnabled: 0,
  monitorSysGenServerSettingCpuAlertThreshold: 80,
  monitorSysGenServerSettingMemoryAlertThreshold: 80,
  monitorSysGenServerSettingDiskAlertThreshold: 80,
  monitorSysGenServerSettingAlertNotificationMethod: "EMAIL",
  monitorSysGenServerSettingAlertNotificationAddress: "",
  monitorSysGenServerSettingDockerMonitorEnabled: 0,
  monitorSysGenServerSettingDockerHost: "127.0.0.1",
  monitorSysGenServerSettingDockerPort: 2376,
  monitorSysGenServerSettingDockerApiVersion: "1.40",
  monitorSysGenServerSettingDockerUsername: "",
  monitorSysGenServerSettingDockerPassword: "",
  monitorSysGenServerSettingDockerConnectTimeoutMillis: 30000,
  monitorSysGenServerSettingMonitorPorts: "",
  monitorSysGenServerSettingCustomTags: "",
  monitorSysGenServerSettingDescription: "",
  monitorSysGenServerSettingStatus: 1,
  monitorSysGenServerSettingFileManagementEnabled: 0,
  monitorSysGenServerSettingFileManagementMode: "NONE",
  monitorSysGenServerSettingFileManagementApiConfig: "",
  monitorSysGenServerSettingFileManagementTimeout: 60,
  monitorSysGenServerSettingFileManagementMaxRetries: 3,
  monitorSysGenServerSettingClientHealthCheckInterval: 30,
  monitorSysGenServerSettingClientHealthTimeout: 10,
  monitorSysGenServerSettingPrometheusHost: "",
  monitorSysGenServerSettingPrometheusPort: 9090,
  monitorSysGenServerSettingMonitorInterval: 60,
  monitorSysGenServerSettingConnectionTimeout: 30,
  monitorSysGenServerSettingReadTimeout: 60,
});

const dockerConnectTimeoutSeconds = computed({
  get() {
    const ms = Number(formData.monitorSysGenServerSettingDockerConnectTimeoutMillis || 30000);
    return Math.max(1, Math.round(ms / 1000));
  },
  set(v: number) {
    formData.monitorSysGenServerSettingDockerConnectTimeoutMillis = Math.max(1, v) * 1000;
  },
});

const open = async (serverIdParam: number) => {
  serverId.value = serverIdParam;
  visible.value = true;
  activeTab.value = "basic";
  await Promise.all([loadServerInfo(), loadServerSetting()]);
};

const loadServerInfo = async () => {
  if (!serverId.value) return;
  try {
    const result = await getServerInfo(String(serverId.value));
    if (result.code === "00000" && result.data) {
      currentServer.value = result.data;
    }
  } catch (error) {
    console.error("加载服务器信息失败:", error);
  }
};

const loadServerSetting = async () => {
  if (!serverId.value) return;
  try {
    loading.value = true;
    const result = await getOrCreateServerSetting(serverId.value);
    if (result.code === "00000" && result.data) {
      Object.assign(formData, result.data);
    }
  } catch (error) {
    console.error("加载服务器设置失败:", error);
  } finally {
    loading.value = false;
  }
};

watch(() => formData.monitorSysGenServerSettingDockerMonitorEnabled, (val) => {
  if (val === 1) {
    if (!formData.monitorSysGenServerSettingDockerHost) {
      formData.monitorSysGenServerSettingDockerHost = currentServer.value?.monitorSysGenServerHost || "127.0.0.1";
    }
    if (!formData.monitorSysGenServerSettingDockerPort) {
      formData.monitorSysGenServerSettingDockerPort = 2376;
    }
  }
});

const getNotificationAddressPlaceholder = () => {
  switch (formData.monitorSysGenServerSettingAlertNotificationMethod) {
    case "EMAIL": return "邮箱地址，多个用逗号分隔";
    case "WEBHOOK": return "Webhook URL地址";
    case "SMS": return "手机号码，多个用逗号分隔";
    default: return "通知地址";
  }
};

const getNotificationAddressTip = () => {
  switch (formData.monitorSysGenServerSettingAlertNotificationMethod) {
    case "EMAIL": return "支持多个邮箱地址，用逗号分隔";
    case "WEBHOOK": return "Webhook URL地址";
    case "SMS": return "支持多个手机号码，用逗号分隔";
    default: return "";
  }
};

const handleFileManagementModeChange = () => {
  if (formData.monitorSysGenServerSettingFileManagementMode === "API") {
    if (!formData.monitorSysGenServerSettingFileManagementApiConfig) {
      handleApiConfigChange();
    }
  } else {
    formData.monitorSysGenServerSettingFileManagementApiConfig = "";
  }
};

const handleApiConfigChange = () => {
  try {
    formData.monitorSysGenServerSettingFileManagementApiConfig = JSON.stringify(apiConfig);
  } catch (error) {
    formData.monitorSysGenServerSettingFileManagementApiConfig = "";
  }
};

const handleSubmit = async () => {
  try {
    loading.value = true;
    const submitData = { ...formData, monitorSysGenServerId: serverId.value };
    const result = await saveOrUpdateServerSetting(submitData);
    if (result.code === "00000") {
      message.success("保存成功");
      visible.value = false;
      emit("success");
    } else {
      message.error(result.msg || "保存失败");
    }
  } catch (error) {
    console.error("保存失败:", error);
    message.error("保存失败");
  } finally {
    loading.value = false;
  }
};

defineExpose({ open });
</script>

<style scoped lang="scss">
.dialog-content {
  display: flex;
  min-height: 500px;
  max-height: 600px;
}

/* 左侧导航 */
.setting-nav {
  width: 140px;
  background: #f5f7fa;
  border-right: 1px solid #e4e7ed;
  padding: 12px 0;
  margin: 0;
  list-style: none;
  flex-shrink: 0;
}

.nav-item {
  padding: 12px 16px;
  cursor: pointer;
  color: #606266;
  font-size: 14px;
  border-left: 3px solid transparent;
}

.nav-item:hover {
  background: #ecf5ff;
  color: #409eff;
}

.nav-item.active {
  background: #ecf5ff;
  color: #409eff;
  border-left-color: #409eff;
  font-weight: 600;
}

/* 右侧内容 */
.setting-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: #fff;
}

.section-panel {
  display: block;
}

.section-header {
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}

.section-header h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.section-header p {
  margin: 0;
  font-size: 12px;
  color: #909399;
}

/* 表单项 */
.form-item {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #fafafa;
  border-radius: 6px;
}

.form-item > label {
  width: 120px;
  flex-shrink: 0;
  font-size: 14px;
  color: #606266;
}

.form-control {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-control input[type="text"],
.form-control input[type="number"],
.form-control select,
.form-control textarea {
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.form-control input[type="text"]:focus,
.form-control input[type="number"]:focus,
.form-control select:focus,
.form-control textarea:focus {
  border-color: #409eff;
}

.form-control input[type="text"],
.form-control select {
  width: 220px;
}

.form-control input[type="number"] {
  width: 120px;
}

.form-control textarea {
  width: 100%;
  resize: vertical;
}

.unit {
  font-size: 12px;
  color: #909399;
  background: #f0f2f5;
  padding: 4px 8px;
  border-radius: 4px;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
}

/* 开关 */
.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 22px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #dcdfe6;
  transition: 0.3s;
  border-radius: 22px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #409eff;
}

input:checked + .slider:before {
  transform: translateX(22px);
}

/* 子配置区域 */
.sub-config {
  margin: 16px 0;
  padding: 16px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 6px;
}

.sub-title {
  font-size: 13px;
  font-weight: 500;
  color: #606266;
  margin-bottom: 12px;
  padding-left: 8px;
  border-left: 3px solid #409eff;
}

.sub-config .form-item {
  background: transparent;
  padding: 8px 0;
  margin-bottom: 8px;
}

/* 信息框 */
.info-box {
  padding: 12px 16px;
  background: #f4f4f5;
  border-radius: 4px;
  font-size: 13px;
  color: #909399;
}

/* 阈值卡片 */
.threshold-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.threshold-card {
  padding: 12px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  text-align: center;
}

.threshold-card .threshold-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.threshold-card input {
  width: 80px;
  padding: 6px 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  text-align: center;
}

/* 底部按钮 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-default {
  background: #fff;
  border: 1px solid #dcdfe6;
  color: #606266;
}

.btn-default:hover {
  color: #409eff;
  border-color: #c6e2ff;
  background: #ecf5ff;
}

.btn-primary {
  background: #409eff;
  color: #fff;
}

.btn-primary:hover {
  background: #66b1ff;
}

.btn-primary:disabled {
  background: #a0cfff;
  cursor: not-allowed;
}

/* 滚动条 */
.setting-content::-webkit-scrollbar {
  width: 6px;
}

.setting-content::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 3px;
}


/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
}

</style>
