<template>
  <el-dialog
    v-model="visible"
    title="服务器配置管�?
    width="90%"
    :close-on-click-modal="false"
    destroy-on-close
    top="10px"
    class="server-config-dialog"
  >
    <div class="dialog-content" v-loading="loading">
      <div class="config-container">
        <!-- 左侧导航 -->
        <div class="config-nav">
          <div class="server-info" v-if="currentServer">
            <div class="server-title">
              <IconifyIconOnline icon="ri:server-line" class="server-icon" />
              <div class="server-details">
                <div class="server-name">
                  {{ currentServer.monitorSysGenServerName }}
                </div>
                <div class="server-host">
                  {{ currentServer.monitorSysGenServerHost }}
                </div>
              </div>
            </div>
          </div>

          <el-menu
            v-model="activeSection"
            mode="vertical"
            class="config-menu"
            @select="handleSectionChange"
          >
            <el-menu-item index="proxy">
              <IconifyIconOnline icon="ri:global-line" />
              <span>代理设置</span>
            </el-menu-item>
            <el-menu-item index="metrics">
              <IconifyIconOnline icon="ri:bar-chart-line" />
              <span>指标管理</span>
            </el-menu-item>
            <el-menu-item index="monitor">
              <IconifyIconOnline icon="ri:eye-line" />
              <span>监控配置</span>
            </el-menu-item>
            <el-menu-item index="alert">
              <IconifyIconOnline icon="ri:alarm-warning-line" />
              <span>告警配置</span>
            </el-menu-item>
            <el-menu-item index="docker">
              <IconifyIconOnline icon="simple-icons:docker" />
              <span>Docker配置</span>
            </el-menu-item>
            <el-menu-item index="filemanagement">
              <IconifyIconOnline icon="ri:folder-line" />
              <span>文件管理</span>
            </el-menu-item>
            <!-- <el-menu-item index="prometheus">
              <IconifyIconOnline icon="ri:bar-chart-line" />
              <span>Prometheus配置</span>
            </el-menu-item> -->
            <el-menu-item index="advanced">
              <IconifyIconOnline icon="ri:tools-line" />
              <span>高级配置</span>
            </el-menu-item>
            <el-menu-item index="tasks">
              <IconifyIconOnline icon="ri:timer-line" />
              <span>任务配置</span>
            </el-menu-item>
            <el-menu-item index="cleanup">
              <IconifyIconOnline icon="ri:delete-bin-line" />
              <span>清理配置</span>
            </el-menu-item>
            <el-menu-item index="history">
              <IconifyIconOnline icon="ri:history-line" />
              <span>配置历史</span>
            </el-menu-item>
          </el-menu>
        </div>

        <!-- 右侧配置内容 -->
        <div class="config-content">
          <el-card class="config-card">
            <template #header>
              <div class="card-header">
                <span class="card-title">{{ getSectionTitle() }}</span>
                <div class="card-actions" v-if="activeSection !== 'history'">
                  <el-button @click="handleReset" plain size="small">
                    <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
                    重置
                  </el-button>
                </div>
              </div>
            </template>

            <!-- 配置表单 -->
            <div
              v-loading="loadingSettings"
              element-loading-text="加载配置�?.."
              class="form-container"
            >
              <el-form
                ref="formRef"
                :model="settingData"
                label-width="160px"
                size="default"
                class="config-form"
                :disabled="loadingSettings"
              >
                <!-- 代理配置 -->
                <div v-show="activeSection === 'proxy'" class="config-section">
                  <div class="section-description">
                    <el-alert
                      title="代理配置"
                      description="配置代理服务器以实现网络连接转发，支持HTTP、SOCKS5、SSH隧道和Guacamole等多种代理类型�?
                      type="info"
                      :closable="false"
                      class="mb-4"
                    />
                  </div>

                  <el-form-item label="启用代理">
                    <div class="switch-wrapper">
                      <el-switch
                        v-model="
                          settingData.monitorSysGenServerSettingProxyEnabled
                        "
                        :active-value="1"
                        :inactive-value="0"
                        active-text="启用"
                        inactive-text="禁用"
                        @change="handleSettingChange"
                      />
                      <el-tooltip
                        content="启用后将通过代理服务器进行连�?
                        placement="top"
                      >
                        <IconifyIconOnline
                          icon="ri:question-line"
                          class="help-icon"
                        />
                      </el-tooltip>
                    </div>
                  </el-form-item>

                  <template
                    v-if="
                      settingData.monitorSysGenServerSettingProxyEnabled === 1
                    "
                  >
                    <el-form-item label="代理类型">
                      <el-select
                        v-model="
                          settingData.monitorSysGenServerSettingProxyType
                        "
                        placeholder="选择代理类型"
                        style="width: 200px !important"
                        @change="handleSettingChange"
                      >
                        <el-option label="HTTP代理" value="HTTP" />
                        <el-option label="SOCKS5代理" value="SOCKS5" />
                        <el-option label="SSH隧道" value="SSH_TUNNEL" />
                        <el-option label="Guacamole代理" value="GUACAMOLE" />
                      </el-select>
                    </el-form-item>

                    <el-form-item label="代理地址">
                      <el-input
                        v-model="
                          settingData.monitorSysGenServerSettingProxyHost
                        "
                        placeholder="请输入代理服务器地址"
                        style="width: 300px"
                        @change="handleSettingChange"
                      />
                    </el-form-item>

                    <el-form-item label="代理端口">
                      <el-input-number
                        v-model="
                          settingData.monitorSysGenServerSettingProxyPort
                        "
                        :min="1"
                        :max="65535"
                        placeholder="端口�?
                        style="width: 200px"
                        @change="handleSettingChange"
                      />
                    </el-form-item>

                    <el-form-item label="代理用户�?>
                      <el-input
                        v-model="
                          settingData.monitorSysGenServerSettingProxyUsername
                        "
                        placeholder="代理用户名（可选）"
                        style="width: 200px"
                        @change="handleSettingChange"
                      />
                    </el-form-item>

                    <el-form-item label="代理密码">
                      <el-input
                        v-model="
                          settingData.monitorSysGenServerSettingProxyPassword
                        "
                        type="password"
                        placeholder="代理密码（可选）"
                        show-password
                        style="width: 200px"
                        @change="handleSettingChange"
                      />
                    </el-form-item>

                    <!-- GUACAMOLE特殊配置说明 -->
                    <template
                      v-if="
                        settingData.monitorSysGenServerSettingProxyType ===
                        'GUACAMOLE'
                      "
                    >
                      <el-alert
                        title="Guacamole代理配置"
                        description="Guacamole代理将通过Web界面提供远程桌面连接功能，具体连接参数请在服务器详情页面中配置�?
                        type="info"
                        :closable="false"
                        class="mt-4"
                      />
                    </template>
                  </template>
                </div>

                <!-- 指标管理 -->
                <div
                  v-show="activeSection === 'metrics'"
                  class="config-section"
                >
                  <div class="section-description">
                    <el-alert
                      title="指标管理"
                      description="配置服务器性能指标的收集、上报和存储策略，支持多种数据上报方式�?
                      type="info"
                      :closable="false"
                      class="mb-4"
                    />
                  </div>

                  <el-form-item label="指标收集">
                    <div class="switch-wrapper">
                      <el-switch
                        v-model="
                          settingData.monitorSysGenServerSettingMonitorEnabled
                        "
                        :active-value="1"
                        :inactive-value="0"
                        active-text="启用"
                        inactive-text="禁用"
                      />
                      <el-tooltip
                        content="启用后将收集服务器性能指标"
                        placement="top"
                      >
                        <IconifyIconOnline
                          icon="ri:question-line"
                          class="help-icon"
                        />
                      </el-tooltip>
                    </div>
                  </el-form-item>

                  <template
                    v-if="
                      settingData.monitorSysGenServerSettingMonitorEnabled === 1
                    "
                  >
                    <el-form-item label="收集频率">
                      <el-input-number
                        v-model="
                          settingData.monitorSysGenServerSettingDataCollectionFrequency
                        "
                        :min="10"
                        :max="3600"
                        :step="10"
                        placeholder="收集频率(�?"
                        style="width: 200px"
                        @change="handleSettingChange"
                      />
                      <span class="form-tip">秒，建议值：30</span>
                    </el-form-item>

                    <el-form-item label="数据保留天数">
                      <el-input-number
                        v-model="
                          settingData.monitorSysGenServerSettingMetricsRetentionDays
                        "
                        :min="1"
                        :max="365"
                        placeholder="保留天数"
                        style="width: 200px"
                        @change="handleSettingChange"
                      />
                      <span class="form-tip">天，建议值：30</span>
                    </el-form-item>

                    <el-alert
                      title="指标管理说明"
                      description="此页面主要用于查看和管理服务器的监控指标数据，包括数据查询、图表展示等功能。具体的监控参数配置请使用左侧对应的配置页面�?
                      type="success"
                      :closable="false"
                      class="mb-4"
                    />
                  </template>
                </div>

                <!-- 监控配置�?-->
                <div
                  v-show="activeSection === 'monitor'"
                  class="config-section"
                >
                  <ServerSettingForm
                    v-model="settingData"
                    section="monitor"
                    :is-local-server="
                      currentServer?.monitorSysGenServerIsLocal === 1
                    "
                    @change="handleSettingChange"
                  />
                </div>

                <!-- 告警配置�?-->
                <div v-show="activeSection === 'alert'" class="config-section">
                  <ServerSettingForm
                    v-model="settingData"
                    section="alert"
                    :is-local-server="
                      currentServer?.monitorSysGenServerIsLocal === 1
                    "
                    @change="handleSettingChange"
                  />
                </div>

                <!-- Docker配置�?-->
                <div v-show="activeSection === 'docker'" class="config-section">
                  <ServerSettingForm
                    v-model="settingData"
                    section="docker"
                    :is-local-server="
                      currentServer?.monitorSysGenServerIsLocal === 1
                    "
                    :server-host="currentServer?.monitorSysGenServerHost"
                    @change="handleSettingChange"
                  />
                </div>

                <!-- Prometheus配置�?-->
                <div
                  v-show="activeSection === 'prometheus'"
                  class="config-section"
                >
                  <div class="section-description">
                    <el-alert
                      title="Prometheus配置"
                      description="配置Prometheus服务器连接信息，用于查询历史监控数据和指标。支持基本认证和自定义查询路径�?
                      type="info"
                      show-icon
                      :closable="false"
                      class="mb-4"
                    />
                  </div>
                  <ServerSettingForm
                    v-model="settingData"
                    section="prometheus"
                    :is-local-server="
                      currentServer?.monitorSysGenServerIsLocal === 1
                    "
                    @change="handleSettingChange"
                  />
                </div>
                <!-- 文件管理配置�?-->
                <div
                  v-show="activeSection === 'filemanagement'"
                  class="config-section"
                >
                  <div class="section-description">
                    <el-alert
                      title="文件管理配置"
                      description="配置服务器文件管理功能，支持SSH连接、NODE客户端代理和API连接等多种方式，提供完整的文件系统访问和管理能力�?
                      type="info"
                      show-icon
                      :closable="false"
                      class="mb-4"
                    />
                  </div>
                  <ServerSettingForm
                    v-model="settingData"
                    section="filemanagement"
                    :is-local-server="
                      currentServer?.monitorSysGenServerIsLocal === 1
                    "
                    :simple-style="true"
                    @change="handleSettingChange"
                  />
                </div>
                <!-- 高级配置�?-->
                <div
                  v-show="activeSection === 'advanced'"
                  class="config-section"
                >
                  <ServerSettingForm
                    v-model="settingData"
                    section="advanced"
                    :is-local-server="
                      currentServer?.monitorSysGenServerIsLocal === 1
                    "
                    @change="handleSettingChange"
                  />
                </div>

                <!-- 任务配置�?-->
                <div v-show="activeSection === 'tasks'" class="config-section">
                  <div class="section-description">
                    <el-alert
                      title="任务配置"
                      description="配置服务器的定时任务，包括端口检测、在线状态检测、延迟检测等功能�?
                      type="info"
                      show-icon
                      :closable="false"
                      class="mb-4"
                    />
                  </div>
                  <ServerSettingForm
                    v-model="settingData"
                    section="tasks"
                    :is-local-server="
                      currentServer?.monitorSysGenServerIsLocal === 1
                    "
                    @change="handleSettingChange"
                  />
                </div>

                <!-- 清理配置�?-->
                <div
                  v-show="activeSection === 'cleanup'"
                  class="config-section"
                >
                  <div class="section-description">
                    <el-alert
                      title="清理配置"
                      description="配置系统清理任务，包括日志清理、临时文件清理、WebSocket会话清理等功能�?
                      type="info"
                      show-icon
                      :closable="false"
                      class="mb-4"
                    />
                  </div>
                  <ServerSettingForm
                    v-model="settingData"
                    section="cleanup"
                    :is-local-server="
                      currentServer?.monitorSysGenServerIsLocal === 1
                    "
                    @change="handleSettingChange"
                  />
                </div>

                <!-- 配置历史�?-->
                <div
                  v-show="activeSection === 'history'"
                  class="config-section"
                >
                  <ServerSettingHistory
                    v-if="serverId && activeSection === 'history'"
                    :server-id="serverId"
                    :server-info="currentServer"
                    @restored="handleHistoryRestored"
                  />
                </div>
              </el-form>
            </div>
          </el-card>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">关闭</el-button>
        <template v-if="activeSection !== 'history'">
          <el-button type="primary" :loading="saving" @click="handleSave">
            <IconifyIconOnline icon="ri:save-line" class="mr-1" />
            保存配置
          </el-button>
        </template>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { getServerInfo, type ServerInfo } from "@/api/server";
import {
  getServerSettingByServerId,
  saveOrUpdateServerSetting,
  type ServerSetting,
} from "@/api/server/setting";
import { message } from "@repo/utils";
import { defineAsyncComponent, ref } from "vue";

// 异步组件
const ServerSettingForm = defineAsyncComponent(
  () => import("./ServerSettingForm.vue")
);
const ServerSettingHistory = defineAsyncComponent(
  () => import("./ServerSettingHistory.vue")
);

// 定义事件
const emit = defineEmits<{
  success: [];
}>();

// 响应式状�?
const visible = ref(false);
const loading = ref(false);
const saving = ref(false);
const loadingSettings = ref(false);
const activeSection = ref("proxy");
const formRef = ref();

// 服务器ID
const serverId = ref<number | null>(null);

// 当前服务器信�?
const currentServer = ref<ServerInfo | null>(null);

// 服务器设置数�?
const settingData = ref<Partial<ServerSetting>>({});

// 表单验证规则
const validationRules = {
  proxy: {
    monitorSysGenServerSettingProxyHost: [
      { required: true, message: "请输入代理服务器地址", trigger: "blur" },
      {
        pattern: /^[a-zA-Z0-9.-]+$/,
        message: "请输入有效的主机地址",
        trigger: "blur",
      },
    ],
    monitorSysGenServerSettingProxyPort: [
      { required: true, message: "请输入代理端�?, trigger: "blur" },
      {
        type: "number",
        min: 1,
        max: 65535,
        message: "端口范围�?-65535",
        trigger: "blur",
      },
    ],
  },
  metrics: {
    monitorSysGenServerSettingDataCollectionFrequency: [
      { required: true, message: "请设置收集频�?, trigger: "blur" },
      {
        type: "number",
        min: 10,
        max: 3600,
        message: "收集频率范围�?0-3600�?,
        trigger: "blur",
      },
    ],
    monitorSysGenServerSettingMetricsRetentionDays: [
      { required: true, message: "请设置数据保留天�?, trigger: "blur" },
      {
        type: "number",
        min: 1,
        max: 365,
        message: "保留天数范围�?-365�?,
        trigger: "blur",
      },
    ],
  },
};

/**
 * 获取当前节的标题
 */
const getSectionTitle = () => {
  const titles = {
    proxy: "代理设置",
    metrics: "指标管理",
    monitor: "监控配置",
    alert: "告警配置",
    docker: "Docker配置",
    filemanagement: "文件管理配置",
    prometheus: "Prometheus配置",
    advanced: "高级配置",
    tasks: "任务配置",
    cleanup: "清理配置",
    history: "配置历史",
  };
  return titles[activeSection.value] || "配置";
};

/**
 * 处理节切�?
 */
const handleSectionChange = (section: string) => {
  activeSection.value = section;
};

/**
 * 处理历史配置恢复
 */
const handleHistoryRestored = (historyId: number) => {
  message.success("配置已从历史记录恢复");
  // 重新加载当前配置
  loadServerSetting();
  // 切换到相应的配置节以查看恢复的配�?
  activeSection.value = "proxy";
};

/**
 * 处理设置数据变化
 */
const handleSettingChange = () => {
  // 当表单数据变化时触发，settingData已经通过v-model自动更新
  console.log("设置数据变化:", settingData.value);
};

/**
 * 重置表单
 */
const handleReset = () => {
  loadServerData();
};

/**
 * 验证当前配置节的数据
 */
const validateCurrentSection = () => {
  const currentRules =
    validationRules[activeSection.value as keyof typeof validationRules];
  if (!currentRules) return true;

  // 特殊处理代理配置�?- 只有在启用代理时才进行校�?
  if (activeSection.value === "proxy") {
    const proxyEnabled =
      settingData.value.monitorSysGenServerSettingProxyEnabled;
    if (!proxyEnabled || proxyEnabled === 0) {
      // 代理未启用，跳过代理参数校验
      return true;
    }
  }

  for (const [field, rules] of Object.entries(currentRules)) {
    const value = settingData.value[field as keyof ServerSetting];

    for (const rule of rules as any[]) {
      if (rule.required && !value && value !== 0) {
        message.error(rule.message);
        return false;
      }

      if (rule.type === "number" && value !== undefined) {
        if (rule.min !== undefined && value < rule.min) {
          message.error(rule.message);
          return false;
        }
        if (rule.max !== undefined && value > rule.max) {
          message.error(rule.message);
          return false;
        }
      }

      if (rule.pattern && value && !rule.pattern.test(String(value))) {
        message.error(rule.message);
        return false;
      }
    }
  }

  return true;
};

/**
 * 保存配置
 */
const handleSave = async () => {
  try {
    // 基本参数验证
    if (!serverId.value) {
      message.error("服务器ID不能为空");
      return;
    }

    saving.value = true;

    // 保存服务器设�?
    const submitData = {
      ...settingData.value,
      monitorSysGenServerId: serverId.value,
    };

    const result = await saveOrUpdateServerSetting(submitData);
    if (result.code === "00000") {
      message.success("配置保存成功");
      // 重新加载设置数据
      await loadServerSetting();
      emit("success");
    } else {
      message.error(result.msg || "配置保存失败");
      return;
    }
  } catch (error) {
    console.error("保存配置失败:", error);
    message.error("保存失败");
  } finally {
    saving.value = false;
  }
};

/**
 * 加载服务器信�?
 */
const loadServerInfo = async () => {
  if (!serverId.value) return;

  try {
    const result = await getServerInfo(String(serverId.value));
    if (result.code === "00000" && result.data) {
      currentServer.value = result.data;
    }
  } catch (error) {
    console.error("加载服务器信息失�?", error);
    message.error("加载服务器信息失�?);
  }
};

/**
 * 加载服务器设�?
 */
const loadServerSetting = async () => {
  if (!serverId.value) return;

  try {
    loadingSettings.value = true;
    const result = await getServerSettingByServerId(serverId.value);
    if (result.code === "00000" && result.data) {
      settingData.value = result.data;
    } else {
      // 如果没有设置数据，初始化默认�?
      settingData.value = {
        monitorSysGenServerId: serverId.value,
        monitorSysGenServerSettingProxyEnabled: 0,
        monitorSysGenServerSettingMonitorEnabled: 1,
        monitorSysGenServerSettingDataCollectionFrequency: 60,
        monitorSysGenServerSettingMetricsRetentionDays: 30,
      };
    }
  } catch (error) {
    console.error("加载服务器设置失�?", error);
    message.error("加载服务器设置失�?);
    // 设置默认�?
    settingData.value = {
      monitorSysGenServerId: serverId.value,
      monitorSysGenServerSettingProxyEnabled: 0,
      monitorSysGenServerSettingMonitorEnabled: 1,
      monitorSysGenServerSettingDataCollectionFrequency: 60,
      monitorSysGenServerSettingMetricsRetentionDays: 30,
    };
  } finally {
    loadingSettings.value = false;
  }
};

/**
 * 加载所有数�?
 */
const loadServerData = async () => {
  if (!serverId.value) {
    message.error("服务器ID不能为空");
    return;
  }

  loading.value = true;
  try {
    await Promise.all([loadServerInfo(), loadServerSetting()]);
  } finally {
    loading.value = false;
  }
};

/**
 * 打开对话�?
 */
const open = async (id: number) => {
  serverId.value = id;
  visible.value = true;
  activeSection.value = "proxy";
  await loadServerData();
};

// 暴露方法
defineExpose({
  open,
});
</script>

<style scoped>
.server-config-dialog {
  :deep(.el-dialog) {
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  }

  :deep(.el-dialog__header) {
    padding: 20px 28px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
    margin: 0;
    position: relative;
    overflow: hidden;

    &::before {
      content: "";
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(
        circle,
        rgba(255, 255, 255, 0.1) 0%,
        transparent 50%
      );
      animation: headerShimmer 4s ease-in-out infinite;
    }

    .el-dialog__title {
      color: #fff;
      font-size: 18px;
      font-weight: 700;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .el-dialog__headerbtn {
      top: 20px;
      right: 20px;

      .el-dialog__close {
        color: rgba(255, 255, 255, 0.8);
        font-size: 18px;

        &:hover {
          color: #fff;
        }
      }
    }
  }

  :deep(.el-dialog__body) {
    padding: 0;
  }
}

@keyframes headerShimmer {
  0%,
  100% {
    transform: translateX(-30%) translateY(-30%) rotate(0deg);
  }
  50% {
    transform: translateX(30%) translateY(30%) rotate(180deg);
  }
}

.dialog-content {
  height: 70vh;
  overflow: hidden;
}

.config-container {
  display: flex;
  height: 100%;
  gap: 0;
}

.config-nav {
  width: 260px;
  background: linear-gradient(
    180deg,
    rgba(248, 250, 252, 0.95) 0%,
    rgba(241, 245, 249, 0.98) 100%
  );
  border-right: 1px solid rgba(226, 232, 240, 0.8);
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(10px);
}

.server-info {
  padding: 20px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  background: linear-gradient(
    135deg,
    rgba(102, 126, 234, 0.08) 0%,
    rgba(118, 75, 162, 0.05) 100%
  );
}

.server-title {
  display: flex;
  align-items: center;
  gap: 14px;
}

.server-icon {
  font-size: 28px;
  color: #fff;
  padding: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.server-details {
  flex: 1;
}

.server-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.server-host {
  font-size: 12px;
  color: var(--el-text-color-primary);
}

.config-menu {
  border: none;
  flex: 1;
  background: transparent;
}

.config-content {
  flex: 1;
  overflow: hidden;
}

.config-card {
  height: 100%;
  border: none;
  border-radius: 0;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: linear-gradient(
    135deg,
    rgba(102, 126, 234, 0.05) 0%,
    rgba(118, 75, 162, 0.03) 100%
  );
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
}

.card-title {
  font-size: 17px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.card-actions {
  .el-button {
    border-radius: 8px;
    font-weight: 500;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
  }
}

.form-container {
  position: relative;
  min-height: 200px;
  height: calc(100% - 60px);
}

.config-form {
  padding: 20px;
  height: 100%;
  overflow: auto;
}

.config-section {
  max-width: 800px;

  .section-description {
    margin-bottom: 20px;

    .el-alert {
      border-radius: 8px;
      border: none;
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);

      :deep(.el-alert__title) {
        font-weight: 600;
        color: #0369a1;
      }

      :deep(.el-alert__description) {
        color: #0284c7;
        line-height: 1.5;
      }
    }
  }

  .switch-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;

    .help-icon {
      font-size: 14px;
      color: var(--el-text-color-primary);
      cursor: help;
      transition: color 0.3s;

      &:hover {
        color: #409eff;
      }
    }
  }
}

.form-tip {
  margin-left: 8px;
  font-size: 12px;
  color: var(--el-text-color-primary);
}

:deep(.el-menu-item) {
  border-radius: 8px;
  margin: 4px 8px;
  transition: all 0.3s ease;

  &:hover {
    background-color: #f5f7fa;
    transform: translateX(4px);
  }
}

:deep(.el-menu-item.is-active) {
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  color: var(--el-text-color-primary);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);

  &:hover {
    background: linear-gradient(135deg, #337ecc 0%, #529b2e 100%);
    transform: translateX(4px);
  }
}

:deep(.el-card__body) {
  padding: 0;
  height: calc(100% - 60px);
  overflow: hidden;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  background: #fafafa;
  border-top: 1px solid #e4e7ed;
}

/* 表单元素美化 */
:deep(.el-form-item__label) {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

:deep(.el-input) {
  .el-input__wrapper {
    border-radius: 6px;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 0 0 1px #c0c4cc inset;
    }

    &.is-focus {
      box-shadow: 0 0 0 1px #409eff inset;
    }
  }
}

:deep(.el-select) {
  .el-input__wrapper {
    border-radius: 6px;
  }
}

:deep(.el-input-number) {
  .el-input__wrapper {
    border-radius: 6px;
  }
}

:deep(.el-switch) {
  .el-switch__core {
    border-radius: 12px;
  }
}

.config-section {
  :deep(.el-row) {
    .el-col {
      .form-tip {
        font-size: 11px;
        color: var(--el-text-color-primary);
        margin-top: 4px;
        text-align: center;
      }
    }
  }
}

.config-card {
  :deep(.el-card__body) {
    animation: fadeInUp 0.3s ease-out;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.config-menu {
  padding: 12px 8px;

  :deep(.el-menu-item) {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 10px;
    margin: 4px 8px;
    height: 44px;
    line-height: 44px;
    font-size: 14px;
    font-weight: 500;

    .iconify {
      font-size: 18px;
      margin-right: 10px;
    }

    &:hover {
      background: linear-gradient(
        135deg,
        rgba(102, 126, 234, 0.1) 0%,
        rgba(118, 75, 162, 0.08) 100%
      );
      transform: translateX(4px);
      color: #667eea;

      .iconify {
        color: #667eea;
      }
    }

    &.is-active {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
      font-weight: 600;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);

      .iconify {
        color: #fff;
      }

      &:hover {
        background: linear-gradient(135deg, #7c8ff0 0%, #8b5fb8 100%);
        color: #fff;
      }
    }
  }
}

/* 数据采集方式选择样式 */
.report-method-wrapper {
  .report-method-selector {
    .method-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;

      .method-card {
        position: relative;
        cursor: pointer;
        transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);

        &:hover:not(.disabled) {
          transform: translateY(-4px) scale(1.02);

          .card-content {
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
            border-color: #409eff;
          }
        }

        &.selected {
          .card-content {
            background: linear-gradient(135deg, #ecf5ff 0%, #e1f3d8 100%);
            border-color: #409eff;
            border-width: 2px;
            box-shadow: 0 6px 20px rgba(64, 158, 255, 0.25);

            .card-title {
              color: #409eff;
              font-weight: 600;
            }

            .card-badge {
              opacity: 1;
              transform: scale(1);
            }
          }
        }

        &.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .card-content {
          padding: 20px;
          border: 1px solid #e4e7ed;
          border-radius: 12px;
          background: var(--el-bg-color-overlay);
          transition: all 0.3s ease;
          height: 100%;
          display: flex;
          flex-direction: column;

          .card-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
            position: relative;

            .card-icon {
              font-size: 24px;
              transition: all 0.3s ease;

              &.none {
                color: var(--el-text-color-primary);
              }

              &.local {
                color: #67c23a;
              }

              &.api {
                color: #409eff;
              }

              &.prometheus {
                color: #e6a23c;
              }
            }

            .card-title {
              font-size: 16px;
              font-weight: 500;
              color: var(--el-text-color-primary);
              transition: all 0.3s ease;
              flex: 1;
            }

            .card-badge {
              position: absolute;
              right: 0;
              top: -2px;
              width: 24px;
              height: 24px;
              background: var(--el-bg-color-overlay);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: var(--el-text-color-primary);
              font-size: 12px;
              opacity: 0;
              transform: scale(0);
              transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            }
          }

          .card-desc {
            font-size: 13px;
            color: #606266;
            line-height: 1.5;
            margin-bottom: 12px;
            flex: 1;
          }

          .card-features {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;

            .feature-tag {
              padding: 2px 8px;
              background: #f0f2f5;
              border-radius: 12px;
              font-size: 11px;
              color: #606266;
              transition: all 0.3s ease;
            }
          }
        }
      }
    }
  }

  .method-description {
    margin-top: 20px;
  }
}

/* 卡片动画 */
.method-card-move,
.method-card-enter-active,
.method-card-leave-active {
  transition: all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.method-card-enter-from {
  opacity: 0;
  transform: translateY(30px) scale(0.9);
}

.method-card-leave-to {
  opacity: 0;
  transform: translateY(-30px) scale(0.9);
}

.method-card-leave-active {
  position: absolute;
}

/* 分割线样�?*/
.divider-text {
  font-size: 13px;
  font-weight: 600;
  color: #606266;
}
</style>
