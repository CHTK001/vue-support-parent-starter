<template>
  <el-dialog
    v-model="visible"
    title="服务器设置"
    width="900px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <div class="dialog-content">
      <!-- 左侧导航 -->
      <div class="setting-nav">
        <div
          v-for="item in navItems"
          :key="item.key"
          class="nav-item"
          :class="{ active: activeTab === item.key }"
          @click="activeTab = item.key"
        >
          <IconifyIconOnline :icon="item.icon" class="nav-icon" />
          <span class="nav-text">{{ item.label }}</span>
        </div>
      </div>

      <!-- 右侧内容 -->
      <div class="setting-content">
        <el-form
          ref="formRef"
          :model="formData"
          :rules="rules"
          label-width="130px"
          label-position="left"
          size="default"
          class="setting-form"
        >
          <!-- 基础监控配置 -->
          <div v-show="activeTab === 'basic'" class="section-panel">
            <div class="section-header">
              <div class="section-icon">
                <IconifyIconOnline icon="ri:dashboard-3-line" />
              </div>
              <div class="section-info">
                <div class="section-title">基础监控</div>
                <div class="section-desc">配置服务器的基础监控参数</div>
              </div>
            </div>

            <el-form-item
              label="启用监控"
              prop="monitorSysGenServerSettingMonitorEnabled"
            >
              <el-switch
                v-model="formData.monitorSysGenServerSettingMonitorEnabled"
                :active-value="1"
                :inactive-value="0"
                inline-prompt
                active-text="开"
                inactive-text="关"
              />
            </el-form-item>

            <el-form-item
              v-if="
                formData.monitorSysGenServerSettingDataReportMethod !== 'API'
              "
              label="数据收集频率"
              prop="monitorSysGenServerSettingDataCollectionFrequency"
            >
              <el-input-number
                v-model="
                  formData.monitorSysGenServerSettingDataCollectionFrequency
                "
                :min="10"
                :max="3600"
                :step="10"
              />
              <span class="unit">秒</span>
              <el-tooltip
                content="API上报方式由客户端控制推送频率"
                placement="top"
              >
                <IconifyIconOnline icon="ri:question-line" class="info-icon" />
              </el-tooltip>
            </el-form-item>

            <el-form-item
              label="数据保留时间"
              prop="monitorSysGenServerSettingMetricsRetentionDays"
            >
              <el-input-number
                v-model="
                  formData.monitorSysGenServerSettingMetricsRetentionDays
                "
                :min="1"
                :max="365"
                :step="1"
              />
              <span class="unit">天</span>
            </el-form-item>
          </div>

          <!-- 数据上报配置 -->
          <div v-show="activeTab === 'report'" class="section-panel">
            <div class="section-header">
              <div class="section-icon">
                <IconifyIconOnline icon="ri:upload-cloud-2-line" />
              </div>
              <div class="section-info">
                <div class="section-title">数据上报</div>
                <div class="section-desc">配置监控数据的上报方式</div>
              </div>
            </div>

            <el-form-item
              label="启用上报"
              prop="monitorSysGenServerSettingReportEnabled"
            >
              <el-switch
                v-model="formData.monitorSysGenServerSettingReportEnabled"
                :active-value="1"
                :inactive-value="0"
                inline-prompt
                active-text="开"
                inactive-text="关"
              />
            </el-form-item>

            <el-form-item
              label="上报方式"
              prop="monitorSysGenServerSettingDataReportMethod"
            >
              <el-select
                v-model="formData.monitorSysGenServerSettingDataReportMethod"
                placeholder="选择上报方式"
              >
                <el-option label="不上报" value="NONE" />
                <el-option
                  v-if="currentServer?.monitorSysGenServerIsLocal === 1"
                  label="本机上报"
                  value="LOCAL"
                />
                <el-option
                  v-if="currentServer?.monitorSysGenServerIsLocal !== 1"
                  label="API接口"
                  value="API"
                />
                <el-option label="Prometheus" value="PROMETHEUS" />
              </el-select>
            </el-form-item>

            <!-- Prometheus配置 -->
            <div
              v-if="
                formData.monitorSysGenServerSettingDataReportMethod ===
                'PROMETHEUS'
              "
              class="sub-config"
            >
              <div class="sub-config-title">Prometheus配置</div>
              <el-form-item
                label="服务器地址"
                prop="monitorSysGenServerSettingPrometheusHost"
              >
                <el-input
                  v-model="formData.monitorSysGenServerSettingPrometheusHost"
                  placeholder="Prometheus服务器地址"
                  clearable
                />
              </el-form-item>
              <el-form-item
                label="端口"
                prop="monitorSysGenServerSettingPrometheusPort"
              >
                <el-input-number
                  v-model="formData.monitorSysGenServerSettingPrometheusPort"
                  :min="1"
                  :max="65535"
                />
              </el-form-item>
            </div>

            <el-alert
              v-if="
                formData.monitorSysGenServerSettingDataReportMethod === 'API'
              "
              title="API上报方式将通过客户端自动推送数据到服务器，无需额外配置。"
              type="info"
              :closable="false"
              show-icon
            />
          </div>

          <!-- 指标管理 -->
          <div v-show="activeTab === 'metrics'" class="section-panel">
            <div class="section-header">
              <div class="section-icon">
                <IconifyIconOnline icon="ri:line-chart-line" />
              </div>
              <div class="section-info">
                <div class="section-title">指标管理</div>
                <div class="section-desc">配置监控指标的采集与存储</div>
              </div>
            </div>

            <el-form-item
              label="监控间隔"
              prop="monitorSysGenServerSettingMonitorInterval"
            >
              <el-input-number
                v-model="formData.monitorSysGenServerSettingMonitorInterval"
                :min="30"
                :max="3600"
                :step="30"
              />
              <span class="unit">秒</span>
            </el-form-item>

            <el-form-item
              label="数据保留时间"
              prop="monitorSysGenServerSettingMetricsRetentionDays"
            >
              <el-input-number
                v-model="
                  formData.monitorSysGenServerSettingMetricsRetentionDays
                "
                :min="1"
                :max="365"
                :step="1"
              />
              <span class="unit">天</span>
            </el-form-item>
          </div>

          <!-- 告警配置 -->
          <div v-show="activeTab === 'alert'" class="section-panel">
            <div class="section-header">
              <div
                class="section-icon"
                style="
                  background: linear-gradient(135deg, #f56c6c 0%, #e6a23c 100%);
                "
              >
                <IconifyIconOnline icon="ri:alarm-warning-line" />
              </div>
              <div class="section-info">
                <div class="section-title">告警配置</div>
                <div class="section-desc">配置告警阈值和通知方式</div>
              </div>
            </div>

            <el-form-item
              label="启用告警"
              prop="monitorSysGenServerSettingAlertEnabled"
            >
              <el-switch
                v-model="formData.monitorSysGenServerSettingAlertEnabled"
                :active-value="1"
                :inactive-value="0"
                inline-prompt
                active-text="开"
                inactive-text="关"
              />
            </el-form-item>

            <template v-if="formData.monitorSysGenServerSettingAlertEnabled">
              <div class="threshold-grid">
                <div class="threshold-card">
                  <div class="threshold-label">CPU阈值</div>
                  <el-input-number
                    v-model="
                      formData.monitorSysGenServerSettingCpuAlertThreshold
                    "
                    :min="1"
                    :max="100"
                    :precision="1"
                  />
                  <span class="unit">%</span>
                </div>
                <div class="threshold-card">
                  <div class="threshold-label">内存阈值</div>
                  <el-input-number
                    v-model="
                      formData.monitorSysGenServerSettingMemoryAlertThreshold
                    "
                    :min="1"
                    :max="100"
                    :precision="1"
                  />
                  <span class="unit">%</span>
                </div>
                <div class="threshold-card">
                  <div class="threshold-label">磁盘阈值</div>
                  <el-input-number
                    v-model="
                      formData.monitorSysGenServerSettingDiskAlertThreshold
                    "
                    :min="1"
                    :max="100"
                    :precision="1"
                  />
                  <span class="unit">%</span>
                </div>
              </div>

              <el-form-item
                label="通知方式"
                prop="monitorSysGenServerSettingAlertNotificationMethod"
                style="margin-top: 20px"
              >
                <el-select
                  v-model="
                    formData.monitorSysGenServerSettingAlertNotificationMethod
                  "
                  placeholder="选择通知方式"
                >
                  <el-option label="邮件" value="EMAIL" />
                  <el-option label="短信" value="SMS" />
                  <el-option label="Webhook" value="WEBHOOK" />
                </el-select>
              </el-form-item>

              <el-form-item
                v-if="
                  formData.monitorSysGenServerSettingAlertNotificationMethod &&
                  formData.monitorSysGenServerSettingAlertNotificationMethod !==
                    'NONE'
                "
                label="通知地址"
                prop="monitorSysGenServerSettingAlertNotificationAddress"
              >
                <el-input
                  v-model="
                    formData.monitorSysGenServerSettingAlertNotificationAddress
                  "
                  :placeholder="getNotificationAddressPlaceholder()"
                  clearable
                />
                <span class="form-tip">{{ getNotificationAddressTip() }}</span>
              </el-form-item>
            </template>
          </div>

          <!-- 文件管理配置 -->
          <div v-show="activeTab === 'filemanagement'" class="section-panel">
            <div class="section-header">
              <div
                class="section-icon"
                style="
                  background: linear-gradient(135deg, #67c23a 0%, #95d475 100%);
                "
              >
                <IconifyIconOnline icon="ri:folder-3-line" />
              </div>
              <div class="section-info">
                <div class="section-title">文件管理</div>
                <div class="section-desc">配置远程文件管理功能</div>
              </div>
            </div>

            <el-form-item
              label="启用文件管理"
              prop="monitorSysGenServerSettingFileManagementEnabled"
            >
              <el-switch
                v-model="
                  formData.monitorSysGenServerSettingFileManagementEnabled
                "
                :active-value="1"
                :inactive-value="0"
                inline-prompt
                active-text="开"
                inactive-text="关"
              />
            </el-form-item>

            <template
              v-if="formData.monitorSysGenServerSettingFileManagementEnabled"
            >
              <el-form-item
                label="连接方式"
                prop="monitorSysGenServerSettingFileManagementMode"
              >
                <el-select
                  v-model="
                    formData.monitorSysGenServerSettingFileManagementMode
                  "
                  placeholder="请选择连接方式"
                  @change="handleFileManagementModeChange"
                >
                  <el-option label="不启用" value="NONE" />
                  <el-option label="SSH连接" value="SSH" />
                  <el-option label="NODE客户端" value="NODE" />
                  <el-option label="API连接" value="API" />
                </el-select>
              </el-form-item>

              <!-- API连接配置 -->
              <div
                v-if="
                  formData.monitorSysGenServerSettingFileManagementMode ===
                  'API'
                "
                class="sub-config"
              >
                <div class="sub-config-title">API连接配置</div>
                <el-form-item label="API主机地址">
                  <el-input
                    v-model="apiConfig.apiHost"
                    placeholder="请输入API主机地址"
                    maxlength="100"
                    @change="handleApiConfigChange"
                  />
                </el-form-item>
                <el-form-item label="API端口">
                  <el-input-number
                    v-model="apiConfig.apiPort"
                    :min="1"
                    :max="65535"
                    @change="handleApiConfigChange"
                  />
                </el-form-item>
                <el-form-item label="认证方式">
                  <el-select
                    v-model="apiConfig.authType"
                    placeholder="请选择认证方式"
                    @change="handleApiConfigChange"
                  >
                    <el-option label="无认证" value="NONE" />
                    <el-option label="Basic认证" value="BASIC" />
                    <el-option label="Token认证" value="TOKEN" />
                    <el-option label="API Key认证" value="API_KEY" />
                  </el-select>
                </el-form-item>
                <template v-if="apiConfig.authType === 'BASIC'">
                  <el-form-item label="用户名">
                    <el-input
                      v-model="apiConfig.username"
                      placeholder="请输入用户名"
                      @change="handleApiConfigChange"
                    />
                  </el-form-item>
                  <el-form-item label="密码">
                    <el-input
                      v-model="apiConfig.password"
                      type="password"
                      placeholder="请输入密码"
                      show-password
                      @change="handleApiConfigChange"
                    />
                  </el-form-item>
                </template>
                <template v-if="apiConfig.authType === 'TOKEN'">
                  <el-form-item label="Token">
                    <el-input
                      v-model="apiConfig.token"
                      type="password"
                      placeholder="请输入Token"
                      show-password
                      @change="handleApiConfigChange"
                    />
                  </el-form-item>
                </template>
                <template v-if="apiConfig.authType === 'API_KEY'">
                  <el-form-item label="API密钥">
                    <el-input
                      v-model="apiConfig.apiKey"
                      type="password"
                      placeholder="请输入API密钥"
                      show-password
                      @change="handleApiConfigChange"
                    />
                  </el-form-item>
                </template>
              </div>

              <!-- 通用配置 -->
              <div
                v-if="
                  formData.monitorSysGenServerSettingFileManagementMode !==
                  'NONE'
                "
                class="sub-config"
              >
                <div class="sub-config-title">通用配置</div>
                <el-form-item
                  label="操作超时时间"
                  prop="monitorSysGenServerSettingFileManagementTimeout"
                >
                  <el-input-number
                    v-model="
                      formData.monitorSysGenServerSettingFileManagementTimeout
                    "
                    :min="30"
                    :max="600"
                    :step="30"
                  />
                  <span class="unit">秒</span>
                </el-form-item>
                <el-form-item
                  label="最大重试次数"
                  prop="monitorSysGenServerSettingFileManagementMaxRetries"
                >
                  <el-input-number
                    v-model="
                      formData.monitorSysGenServerSettingFileManagementMaxRetries
                    "
                    :min="0"
                    :max="10"
                    :step="1"
                  />
                  <span class="unit">次</span>
                </el-form-item>
              </div>
            </template>
          </div>

          <!-- 高级配置 -->
          <div v-show="activeTab === 'advanced'" class="section-panel">
            <div class="section-header">
              <div
                class="section-icon"
                style="
                  background: linear-gradient(135deg, #909399 0%, #c0c4cc 100%);
                "
              >
                <IconifyIconOnline icon="ri:settings-5-line" />
              </div>
              <div class="section-info">
                <div class="section-title">高级配置</div>
                <div class="section-desc">配置高级监控参数和扩展功能</div>
              </div>
            </div>

            <el-form-item
              label="连接超时"
              prop="monitorSysGenServerSettingConnectionTimeout"
            >
              <el-input-number
                v-model="formData.monitorSysGenServerSettingConnectionTimeout"
                :min="5"
                :max="300"
                :step="5"
              />
              <span class="unit">秒</span>
            </el-form-item>

            <el-form-item
              label="读取超时"
              prop="monitorSysGenServerSettingReadTimeout"
            >
              <el-input-number
                v-model="formData.monitorSysGenServerSettingReadTimeout"
                :min="5"
                :max="300"
                :step="5"
              />
              <span class="unit">秒</span>
            </el-form-item>

            <el-form-item
              label="启用Docker监控"
              prop="monitorSysGenServerSettingDockerMonitorEnabled"
            >
              <el-switch
                v-model="
                  formData.monitorSysGenServerSettingDockerMonitorEnabled
                "
                :active-value="1"
                :inactive-value="0"
                inline-prompt
                active-text="开"
                inactive-text="关"
              />
            </el-form-item>

            <div
              v-if="formData.monitorSysGenServerSettingDockerMonitorEnabled"
              class="sub-config"
            >
              <div class="sub-config-title">Docker配置</div>
              <el-form-item
                label="Docker API主机"
                prop="monitorSysGenServerSettingDockerHost"
              >
                <el-input
                  v-model="formData.monitorSysGenServerSettingDockerHost"
                  :placeholder="
                    currentServer?.monitorSysGenServerHost || '127.0.0.1'
                  "
                  clearable
                />
                <span class="form-tip">默认使用当前服务器IP</span>
              </el-form-item>
              <el-form-item
                label="Docker API端口"
                prop="monitorSysGenServerSettingDockerPort"
              >
                <el-input-number
                  v-model="formData.monitorSysGenServerSettingDockerPort"
                  :min="1"
                  :max="65535"
                />
              </el-form-item>
              <el-form-item
                label="API用户名"
                prop="monitorSysGenServerSettingDockerUsername"
              >
                <el-input
                  v-model="formData.monitorSysGenServerSettingDockerUsername"
                  placeholder="可选"
                  clearable
                />
              </el-form-item>
              <el-form-item
                label="API密码"
                prop="monitorSysGenServerSettingDockerPassword"
              >
                <el-input
                  v-model="formData.monitorSysGenServerSettingDockerPassword"
                  type="password"
                  show-password
                  placeholder="可选"
                  clearable
                />
              </el-form-item>
              <el-form-item
                label="连接超时"
                prop="monitorSysGenServerSettingDockerConnectTimeoutMillis"
              >
                <el-input-number
                  v-model="dockerConnectTimeoutSecondsDialog"
                  :min="1"
                  :max="600"
                  :step="1"
                />
                <span class="unit">秒</span>
              </el-form-item>
              <el-form-item
                label="Docker API版本"
                prop="monitorSysGenServerSettingDockerApiVersion"
              >
                <el-input
                  v-model="formData.monitorSysGenServerSettingDockerApiVersion"
                  placeholder="Docker API版本，如：1.40"
                  clearable
                />
              </el-form-item>
            </div>

            <el-form-item
              label="启用日志监控"
              prop="monitorSysGenServerSettingLogMonitorEnabled"
            >
              <el-switch
                v-model="formData.monitorSysGenServerSettingLogMonitorEnabled"
                :active-value="1"
                :inactive-value="0"
                inline-prompt
                active-text="开"
                inactive-text="关"
              />
            </el-form-item>

            <el-form-item
              v-if="formData.monitorSysGenServerSettingLogMonitorEnabled"
              label="日志文件路径"
              prop="monitorSysGenServerSettingLogFilePaths"
            >
              <el-input
                v-model="formData.monitorSysGenServerSettingLogFilePaths"
                type="textarea"
                :rows="3"
                placeholder="日志文件路径，多个路径用换行分隔"
              />
            </el-form-item>

            <el-form-item
              label="监控端口"
              prop="monitorSysGenServerSettingMonitorPorts"
            >
              <el-input
                v-model="formData.monitorSysGenServerSettingMonitorPorts"
                placeholder="监控的端口列表，用逗号分隔，如：80,443,3306"
                clearable
              />
            </el-form-item>

            <el-form-item
              label="自定义标签"
              prop="monitorSysGenServerSettingCustomTags"
            >
              <el-input
                v-model="formData.monitorSysGenServerSettingCustomTags"
                type="textarea"
                :rows="3"
                placeholder="JSON格式的自定义标签"
              />
            </el-form-item>

            <el-form-item
              label="配置描述"
              prop="monitorSysGenServerSettingDescription"
            >
              <el-input
                v-model="formData.monitorSysGenServerSettingDescription"
                type="textarea"
                :rows="3"
                placeholder="配置描述信息"
              />
            </el-form-item>
          </div>
        </el-form>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false" class="cancel-btn">
          <IconifyIconOnline icon="ri:close-line" class="mr-1" />
          取消
        </el-button>
        <el-button
          type="primary"
          :loading="loading"
          @click="handleSubmit"
          class="save-btn"
        >
          <IconifyIconOnline icon="ri:save-line" class="mr-1" />
          保存配置
        </el-button>
      </div>
    </template>
  </el-dialog>
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

// 定义事件
const emit = defineEmits<{
  success: [];
}>();

// 响应式状态
const visible = ref(false);
const loading = ref(false);
const activeTab = ref("basic");
const formRef = ref();
const serverId = ref<number | null>(null);
const currentServer = ref<ServerInfo | null>(null);

// 导航菜单配置
const navItems = [
  { key: "basic", label: "基础监控", icon: "ri:dashboard-3-line" },
  { key: "report", label: "数据上报", icon: "ri:upload-cloud-2-line" },
  { key: "metrics", label: "指标管理", icon: "ri:line-chart-line" },
  { key: "alert", label: "告警配置", icon: "ri:alarm-warning-line" },
  { key: "filemanagement", label: "文件管理", icon: "ri:folder-3-line" },
  { key: "advanced", label: "高级配置", icon: "ri:settings-5-line" },
];

// 文件管理器API配置
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

// 表单数据
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
  monitorSysGenServerSettingConnectionTimeout: 30,
  monitorSysGenServerSettingReadTimeout: 30,
  monitorSysGenServerSettingDockerMonitorEnabled: 0,
  monitorSysGenServerSettingDockerHost: "127.0.0.1",
  monitorSysGenServerSettingDockerPort: 2376,
  monitorSysGenServerSettingDockerApiVersion: "1.40",
  monitorSysGenServerSettingDockerUsername: "",
  monitorSysGenServerSettingDockerPassword: "",
  monitorSysGenServerSettingDockerConnectTimeoutMillis: 30000,
  monitorSysGenServerSettingLogMonitorEnabled: 0,
  monitorSysGenServerSettingLogFilePaths: "",
  monitorSysGenServerSettingMonitorPorts: "",
  monitorSysGenServerSettingCustomTags: "",
  monitorSysGenServerSettingDescription: "",
  monitorSysGenServerSettingStatus: 1,

  // 文件管理配置默认值
  monitorSysGenServerSettingFileManagementEnabled: 0,
  monitorSysGenServerSettingFileManagementMode: "NONE",
  monitorSysGenServerSettingFileManagementApiConfig: "",
  monitorSysGenServerSettingFileManagementTimeout: 60,
  monitorSysGenServerSettingFileManagementMaxRetries: 3,
  monitorSysGenServerSettingClientHealthCheckInterval: 30,
  monitorSysGenServerSettingClientHealthTimeout: 10,
  // 数据上报扩展字段
  monitorSysGenServerSettingPrometheusHost: "",
  monitorSysGenServerSettingPrometheusPort: 9090,
});

// 表单验证规则 - 动态规则
const rules = computed(() => {
  const baseRules: any = {
    monitorSysGenServerSettingMetricsRetentionDays: [
      { required: true, message: "数据保留时间不能为空", trigger: "blur" },
      {
        type: "number",
        min: 1,
        max: 365,
        message: "数据保留时间范围 1-365 天",
        trigger: "blur",
      },
    ],
  };

  // 仅在非API上报方式时添加数据收集频率验证
  if (formData.monitorSysGenServerSettingDataReportMethod !== "API") {
    baseRules.monitorSysGenServerSettingDataCollectionFrequency = [
      { required: true, message: "数据收集频率不能为空", trigger: "blur" },
      {
        type: "number",
        min: 10,
        max: 3600,
        message: "数据收集频率范围 10-3600 秒",
        trigger: "blur",
      },
    ];
  }

  return baseRules;
});

/**
 * 打开对话框
 */
const open = async (serverIdParam: number) => {
  serverId.value = serverIdParam;
  visible.value = true;
  activeTab.value = "basic";
  // 同时加载服务器信息和设置
  await Promise.all([loadServerInfo(), loadServerSetting()]);
};

/**
 * 加载服务器信息
 */
const loadServerInfo = async () => {
  if (!serverId.value) return;

  try {
    const result = await getServerInfo(String(serverId.value));
    if (result.code === "00000" && result.data) {
      currentServer.value = result.data;
    }
  } catch (error) {
    console.error("加载服务器信息失败:", error);
    message.error("加载服务器信息失败");
  }
};

/**
 * 加载服务器设置
 */
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
    message.error("加载服务器设置失败");
  } finally {
    loading.value = false;
  }
};

// 表单变化处理已集成到各个配置项中

// 当开启 Docker 监控时，若未填写主机/端口，则默认填充当前服务器IP:2376
watch(
  () => formData.monitorSysGenServerSettingDockerMonitorEnabled,
  (val) => {
    if (val === 1) {
      if (!formData.monitorSysGenServerSettingDockerHost) {
        // 使用当前服务器的IP作为默认Docker主机，如果没有则使用127.0.0.1
        formData.monitorSysGenServerSettingDockerHost =
          currentServer.value?.monitorSysGenServerHost || "127.0.0.1";
      }
      if (!formData.monitorSysGenServerSettingDockerPort) {
        formData.monitorSysGenServerSettingDockerPort = 2376 as any;
      }
      if (!formData.monitorSysGenServerSettingDockerConnectTimeoutMillis) {
        formData.monitorSysGenServerSettingDockerConnectTimeoutMillis =
          30000 as any;
      }
    }
  }
);

// Docker API 连接超时（秒）双向绑定（内部以毫秒存储）
const dockerConnectTimeoutSecondsDialog = computed({
  get() {
    const ms = Number(
      formData.monitorSysGenServerSettingDockerConnectTimeoutMillis || 30000
    );
    return Math.max(1, Math.round(ms / 1000));
  },
  set(v: number) {
    const seconds = Number(v || 30);
    formData.monitorSysGenServerSettingDockerConnectTimeoutMillis =
      Math.max(1, seconds) * 1000;
  },
});

/**
 * 获取通知地址占位符
 */
const getNotificationAddressPlaceholder = () => {
  switch (formData.monitorSysGenServerSettingAlertNotificationMethod) {
    case "EMAIL":
      return "邮箱地址，多个用逗号分隔";
    case "WEBHOOK":
      return "Webhook URL地址";
    case "SMS":
      return "手机号码，多个用逗号分隔";
    default:
      return "通知地址";
  }
};

/**
 * 获取通知地址提示
 */
const getNotificationAddressTip = () => {
  switch (formData.monitorSysGenServerSettingAlertNotificationMethod) {
    case "EMAIL":
      return "支持多个邮箱地址，用逗号分隔，如：admin@example.com,user@example.com";
    case "WEBHOOK":
      return "Webhook URL地址，用于接收告警通知的HTTP接口";
    case "SMS":
      return "支持多个手机号码，用逗号分隔，如：13800138000,13900139000";
    default:
      return "";
  }
};

/**
 * 处理文件管理模式变化
 */
const handleFileManagementModeChange = () => {
  // 当模式变化时，重置API配置
  if (formData.monitorSysGenServerSettingFileManagementMode === "API") {
    // 如果切换到API模式，初始化API配置
    if (!formData.monitorSysGenServerSettingFileManagementApiConfig) {
      Object.assign(apiConfig, {
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
      handleApiConfigChange();
    } else {
      // 如果已有配置，解析并加载
      try {
        const config = JSON.parse(
          formData.monitorSysGenServerSettingFileManagementApiConfig
        );
        Object.assign(apiConfig, config);
      } catch (error) {
        console.warn("解析API配置失败，使用默认配置:", error);
      }
    }
  } else {
    // 如果切换到其他模式，清空API配置
    formData.monitorSysGenServerSettingFileManagementApiConfig = "";
  }
};

/**
 * 处理API配置变化
 */
const handleApiConfigChange = () => {
  // 将API配置对象序列化为JSON字符串
  try {
    formData.monitorSysGenServerSettingFileManagementApiConfig =
      JSON.stringify(apiConfig);
  } catch (error) {
    console.error("序列化API配置失败:", error);
    formData.monitorSysGenServerSettingFileManagementApiConfig = "";
  }
};

/**
 * 提交表单
 */
const handleSubmit = async () => {
  try {
    // 表单验证
    const isValid = await formRef.value?.validate().catch(() => false);
    if (!isValid) return;

    loading.value = true;

    // 准备提交数据
    const submitData = {
      ...formData,
      monitorSysGenServerId: serverId.value,
    };

    const result = await saveOrUpdateServerSetting(submitData);
    if (result.code === "00000") {
      message.success("保存成功");
      visible.value = false;
      emit("success");
    } else {
      message.error(result.msg || "保存失败");
    }
  } catch (error) {
    console.error("保存服务器设置失败:", error);
    message.error("保存失败");
  } finally {
    loading.value = false;
  }
};

// 暴露方法
defineExpose({
  open,
});
</script>

<style scoped>
.dialog-content {
  display: flex;
  min-height: 500px;
  max-height: 600px;
}

/* 左侧导航菜单 */
.setting-nav {
  width: 180px;
  background: var(--el-fill-color-light);
  border-right: 1px solid var(--el-border-color-lighter);
  padding: 16px 0;
  flex-shrink: 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  cursor: pointer;
  color: var(--el-text-color-regular);
  font-size: 14px;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
  margin: 2px 0;

  &:hover {
    background: var(--el-fill-color);
    color: var(--el-color-primary);
  }

  &.active {
    background: linear-gradient(
      90deg,
      var(--el-color-primary-light-9) 0%,
      transparent 100%
    );
    color: var(--el-color-primary);
    border-left-color: var(--el-color-primary);
    font-weight: 500;
  }

  .nav-icon {
    font-size: 18px;
    flex-shrink: 0;
  }

  .nav-text {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

/* 右侧内容区域 */
.setting-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background: var(--el-bg-color);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--el-border-color-lighter);

  .section-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    color: #fff;
    background: linear-gradient(
      135deg,
      var(--el-color-primary) 0%,
      var(--el-color-primary-light-3) 100%
    );
  }

  .section-info {
    flex: 1;

    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin-bottom: 4px;
    }

    .section-desc {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }
}

.setting-form {
  :deep(.el-form-item) {
    margin-bottom: 20px;
    padding: 16px;
    background: var(--el-fill-color-lighter);
    border-radius: 10px;
    border: 1px solid var(--el-border-color-lighter);
    transition: all 0.3s ease;

    &:hover {
      border-color: var(--el-color-primary-light-5);
      box-shadow: 0 2px 12px rgba(var(--el-color-primary-rgb), 0.08);
    }
  }

  :deep(.el-form-item__label) {
    font-weight: 500;
    color: var(--el-text-color-primary);
  }

  :deep(.el-input-number),
  :deep(.el-select),
  :deep(.el-input) {
    max-width: 280px;
  }

  :deep(.el-switch) {
    --el-switch-on-color: var(--el-color-primary);
  }
}

.config-card {
  background: var(--el-fill-color-lighter);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  border: 1px solid var(--el-border-color-lighter);

  .card-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px dashed var(--el-border-color);

    .card-icon {
      color: var(--el-color-primary);
      font-size: 16px;
    }
  }
}

.form-tip {
  margin-left: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.unit {
  margin-left: 8px;
  color: var(--el-text-color-regular);
  font-size: 12px;
  background: var(--el-fill-color);
  padding: 2px 8px;
  border-radius: 4px;
}

.info-icon {
  margin-left: 8px;
  color: var(--el-color-info);
  cursor: help;
  font-size: 16px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;

  .cancel-btn {
    border-radius: 8px;
    min-width: 88px;
    transition: all 0.3s ease;

    &:hover {
      background: var(--el-fill-color);
      transform: translateY(-1px);
    }
  }

  .save-btn {
    border-radius: 8px;
    min-width: 110px;
    background: linear-gradient(
      135deg,
      var(--el-color-primary) 0%,
      var(--el-color-primary-light-3) 100%
    );
    border: none;
    box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.35);
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(var(--el-color-primary-rgb), 0.45);
    }
  }
}

/* 子配置区域 */
.sub-config {
  margin-top: 16px;
  padding: 16px;
  background: var(--el-bg-color);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
}

.sub-config-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-regular);
  margin-bottom: 12px;

  &::before {
    content: "";
    width: 3px;
    height: 14px;
    background: var(--el-color-primary);
    border-radius: 2px;
  }
}

/* 告警阈值卡片 */
.threshold-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 16px;
}

.threshold-card {
  background: var(--el-bg-color);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid var(--el-border-color-lighter);
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--el-color-primary-light-5);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .threshold-label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-bottom: 8px;
  }
}

/* 滚动条样式 */
.setting-content::-webkit-scrollbar {
  width: 6px;
}

.setting-content::-webkit-scrollbar-track {
  background: transparent;
}

.setting-content::-webkit-scrollbar-thumb {
  background: var(--el-border-color);
  border-radius: 3px;

  &:hover {
    background: var(--el-border-color-darker);
  }
}

/* 加载状态 */
.loading-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}
</style>
