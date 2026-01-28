<template>
  <sc-dialog
    v-model="visible"
    width="1200px"
    :close-on-click-modal="false"
    destroy-on-close
    append-to-body
    top="5vh"
    class="server-config-dialog"
  >
    <template #header>
      <div class="dialog-header">
        <div class="header-left">
          <div class="header-icon-box">
            <IconifyIconOnline icon="ri:settings-3-line" class="header-icon" />
          </div>
          <div class="header-info">
            <span class="header-title">服务器配置</span>
            <span v-if="currentServer" class="header-subtitle">
              {{ currentServer.monitorSysGenServerName }} ·
              {{ currentServer.monitorSysGenServerHost }}
            </span>
          </div>
        </div>
        <div class="header-right" v-if="activeSection !== 'history'">
          <el-button size="small" @click="handleReset">
            <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
            重置
          </el-button>
          <el-button
            size="small"
            type="danger"
            plain
            @click="handleDisableAllSwitches"
          >
            <IconifyIconOnline icon="ri:toggle-line" class="mr-1" />
            一键关闭
          </el-button>
        </div>
      </div>
    </template>
    <div class="dialog-content" v-loading="loading">
      <div class="config-container">
        <!-- 左侧导航 -->
        <div class="config-nav">
          <el-menu
            v-model="activeSection"
            mode="vertical"
            class="config-menu"
            @select="handleSectionChange"
          >
          <el-menu-item index="connection">
            <IconifyIconOnline icon="ri:link" />
            <span>连接配置</span>
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
              <span>Docker</span>
            </el-menu-item>
            <el-menu-item index="filemanagement">
              <IconifyIconOnline icon="ri:folder-line" />
              <span>文件管理</span>
            </el-menu-item>
            <el-menu-item index="advanced">
              <IconifyIconOnline icon="ri:tools-line" />
              <span>高级配置</span>
            </el-menu-item>
            <el-menu-item index="tasks">
              <IconifyIconOnline icon="ri:plug-line" />
              <span>端口配置</span>
            </el-menu-item>
            <el-menu-item index="history">
              <IconifyIconOnline icon="ri:history-line" />
              <span>配置历史</span>
            </el-menu-item>
          </el-menu>
        </div>

        <!-- 右侧配置内容 -->
        <div class="config-content">
          <div class="content-header">
            <div class="content-title-wrapper">
              <IconifyIconOnline
                :icon="getSectionIcon()"
                class="section-icon"
              />
              <span class="content-title">{{ getSectionTitle() }}</span>
            </div>
            <span class="content-desc">{{ getSectionDesc() }}</span>
          </div>

          <!-- 配置表单 -->
          <div
            v-loading="loadingSettings"
            element-loading-text="加载配置中..."
            class="form-container"
          >
            <el-form
              ref="formRef"
              :model="settingData"
              label-width="140px"
              size="default"
              class="config-form"
              :disabled="loadingSettings"
            >
              <!-- 连接配置 -->
              <div v-show="activeSection === 'connection'" class="config-section">
                <el-form-item label="连接模式">
                  <el-radio-group v-model="connectionMode">
                    <el-radio-button label="SSH">SSH</el-radio-button>
                    <el-radio-button label="REMOTE">远程桌面</el-radio-button>
                    <el-radio-button label="GUACAMOLE">Guacamole</el-radio-button>
                    <el-radio-button label="VNC">VNC</el-radio-button>
                  </el-radio-group>
                </el-form-item>

                <div class="config-tip" v-show="(currentServer?.monitorSysGenServerOsType || '').toLowerCase().includes('linux')">
                  <IconifyIconOnline icon="ri:information-line" />
                  <span>检测到 Linux，默认建议使用 SSH。</span>
                </div>

                <!-- SSH 配置 -->
                <div v-show="connectionMode === 'SSH'" class="sub-config-section">
                  <el-row :gutter="20">
                    <el-col :span="10">
                      <el-form-item label="SSH 端口">
                        <el-input-number 
                          v-model="settingData.monitorSysGenServerSettingSshPort" 
                          :min="1" 
                          :max="65535" 
                          placeholder="22" 
                          controls-position="right" 
                          style="width: 100%" 
                          @change="handleSettingChange" 
                        />
                      </el-form-item>
                    </el-col>
                  </el-row>
                </div>

                <!-- 远程桌面配置（REMOTE 模式） -->
                <div v-show="connectionMode === 'REMOTE'" class="sub-config-section">
                  <div class="config-tip">
                    <IconifyIconOnline icon="ri:information-line" />
                    <span>远程桌面模式需要目标服务器运行 Remote Desktop Agent（默认端口 8899）。</span>
                  </div>
                  <el-row :gutter="20">
                    <el-col :span="10">
                      <el-form-item label="Agent 端口">
                        <el-input-number v-model="settingData.monitorSysGenServerSettingRemotePort" :min="1" :max="65535" placeholder="8899" controls-position="right" style="width: 100%" @change="handleSettingChange" />
                      </el-form-item>
                    </el-col>
                  </el-row>
                </div>

                <!-- Guacamole 代理配置（GUACAMOLE/VNC 时需要） -->
                <div v-show="['GUACAMOLE','VNC'].includes(connectionMode)" class="sub-config-section">
                  <el-row :gutter="20">
                    <el-col :span="10">
                      <el-form-item :label="connectionMode === 'VNC' ? 'VNC 端口' : '连接端口'">
                        <el-input-number 
                          v-model="settingData.monitorSysGenServerSettingVncPort" 
                          :min="1" 
                          :max="65535" 
                          :placeholder="connectionMode === 'VNC' ? '5900' : '22'" 
                          controls-position="right" 
                          style="width: 100%" 
                          @change="handleSettingChange" 
                        />
                      </el-form-item>
                    </el-col>
                  </el-row>
                  <el-row :gutter="20">
                    <el-col :span="14">
                      <el-form-item label="Guacd 地址">
                        <el-input v-model="settingData.monitorSysGenServerSettingProxyHost" placeholder="guacd 主机名或IP" @change="handleSettingChange" />
                      </el-form-item>
                    </el-col>
                    <el-col :span="10">
                      <el-form-item label="Guacd 端口">
                        <el-input-number v-model="settingData.monitorSysGenServerSettingProxyPort" :min="1" :max="65535" placeholder="4822" controls-position="right" style="width: 100%" @change="handleSettingChange" />
                      </el-form-item>
                    </el-col>
                  </el-row>
                </div>
              </div>

              <!-- 监控配置节 -->
              <div v-show="activeSection === 'monitor'" class="config-section">
                <ServerSettingForm
                  v-model="settingData"
                  section="monitor"
                  :is-local-server="
                    currentServer?.monitorSysGenServerIsLocal === 1
                  "
                  @change="handleSettingChange"
                />
              </div>

              <!-- 告警配置节 -->
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

              <!-- Docker配置节 -->
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

              <!-- 文件管理配置节 -->
              <div
                v-show="activeSection === 'filemanagement'"
                class="config-section"
              >
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

              <!-- 高级配置节 -->
              <div v-show="activeSection === 'advanced'" class="config-section">
                <ServerSettingForm
                  v-model="settingData"
                  section="advanced"
                  :is-local-server="
                    currentServer?.monitorSysGenServerIsLocal === 1
                  "
                  @change="handleSettingChange"
                />
              </div>

              <!-- 端口配置节 -->
              <div v-show="activeSection === 'tasks'" class="config-section">
                <ServerSettingForm
                  v-model="settingData"
                  section="tasks"
                  :is-local-server="
                    currentServer?.monitorSysGenServerIsLocal === 1
                  "
                  @change="handleSettingChange"
                />
              </div>

              <!-- 配置历史节 -->
              <div v-show="activeSection === 'history'" class="config-section">
                <ServerSettingHistory
                  v-show="serverId && activeSection === 'history'"
                  :server-id="serverId"
                  :server-info="currentServer"
                  @restored="handleHistoryRestored"
                />
              </div>
            </el-form>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">关闭</el-button>
        <el-button
          v-if="activeSection !== 'history'"
          type="primary"
          :loading="saving"
          @click="handleSave"
        >
          保存配置
        </el-button>
      </div>
    </template>
  </sc-dialog>
</template>

<script setup lang="ts">
import { getServerInfo, type ServerInfo, updateServer } from "@/api/server";
import {
  getServerSettingByServerId,
  saveOrUpdateServerSetting,
  type ServerSetting,
} from "@/api/server/setting";
import { message } from "@repo/utils";
import { ElMessageBox } from "element-plus";
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

// 响应式状态
const visible = ref(false);
const loading = ref(false);
const saving = ref(false);
const loadingSettings = ref(false);
const activeSection = ref("connection");
// 当前连接模式（SSH/RDP/VNC/GUACAMOLE）
const connectionMode = ref('SSH');
const formRef = ref();

// 服务器ID
const serverId = ref<number | null>(null);

// 当前服务器信息
const currentServer = ref<ServerInfo | null>(null);

// 服务器设置数据
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
      { required: true, message: "请输入代理端口", trigger: "blur" },
      {
        type: "number",
        min: 1,
        max: 65535,
        message: "端口范围为1-65535",
        trigger: "blur",
      },
    ],
  },
  metrics: {
    monitorSysGenServerSettingDataCollectionFrequency: [
      { required: true, message: "请设置收集频率", trigger: "blur" },
      {
        type: "number",
        min: 10,
        max: 3600,
        message: "收集频率范围为10-3600秒",
        trigger: "blur",
      },
    ],
    monitorSysGenServerSettingMetricsRetentionDays: [
      { required: true, message: "请设置数据保留天数", trigger: "blur" },
      {
        type: "number",
        min: 1,
        max: 365,
        message: "保留天数范围为1-365天",
        trigger: "blur",
      },
    ],
  },
};

/**
 * 获取当前节的标题
 */
// 配置项元数据（包含详细说明）
const sectionMeta = {
  connection: {
    title: "连接配置",
    icon: "ri:link",
    desc: "选择连接模式（SSH/RDP/VNC/Guacamole）并配置所需参数",
  },
  monitor: {
    title: "监控配置",
    icon: "ri:eye-line",
    desc: "配置数据上报方式和监控参数",
  },
  alert: {
    title: "告警配置",
    icon: "ri:alarm-warning-line",
    desc: "设置告警阈值和通知方式",
  },
  docker: {
    title: "Docker",
    icon: "simple-icons:docker",
    desc: "配置 Docker 容器监控和管理",
  },
  filemanagement: {
    title: "文件管理",
    icon: "ri:folder-line",
    desc: "配置远程文件系统访问方式",
  },
  advanced: {
    title: "高级配置",
    icon: "ri:tools-line",
    desc: "连接超时、重试策略等高级参数",
  },
  tasks: {
    title: "端口配置",
    icon: "ri:plug-line",
    desc: "配置端口监控、在线检测、延迟检测等",
  },
  history: {
    title: "配置历史",
    icon: "ri:history-line",
    desc: "查看和恢复历史配置",
  },
};

const getSectionTitle = () => sectionMeta[activeSection.value]?.title || "配置";
const getSectionIcon = () =>
  sectionMeta[activeSection.value]?.icon || "ri:settings-line";
const getSectionDesc = () => sectionMeta[activeSection.value]?.desc || "";

/**
 * 处理节切换
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
  // 切换到相应的配置节以查看恢复的配置
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
 * 一键关闭所有开关配置
 */
const handleDisableAllSwitches = async () => {
  try {
    await ElMessageBox.confirm(
      "确定要关闭所有开关配置吗？此操作将禁用监控、告警、Docker、文件管理等所有功能开关。",
      "一键关闭确认",
      {
        confirmButtonText: "确定关闭",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    // 关闭所有 Enabled 类型的开关
    settingData.value = {
      ...settingData.value,
      // 基础监控开关
      monitorSysGenServerSettingMonitorEnabled: 0,
      monitorSysGenServerSettingReportEnabled: 0,
      monitorSysGenServerSettingAlertEnabled: 0,
      // Docker 相关
      monitorSysGenServerSettingDockerEnabled: 0,
      monitorSysGenServerSettingDockerMonitorEnabled: 0,
      monitorSysGenServerSettingDockerTlsEnabled: 0,
      // 代理配置
      monitorSysGenServerSettingProxyEnabled: 0,
      // Prometheus 相关
      monitorSysGenServerSettingPrometheusAuthEnabled: 0,
      // 检测配置
      monitorSysGenServerSettingOnlineCheckEnabled: 0,
      monitorSysGenServerSettingLatencyCheckEnabled: 0,
      // 文件管理
      monitorSysGenServerSettingFileManagementEnabled: 0,
      // 健康检查和指标采集
      monitorSysGenServerSettingHealthCheckEnabled: 0,
      monitorSysGenServerSettingMetricsCollectionEnabled: 0,
      // 自动恢复通知
      monitorSysGenServerSettingAutoRecoveryNotificationEnabled: 0,
    };

    message.success("已关闭所有开关配置，请点击保存按钮提交更改");
  } catch {
    // 用户取消操作
  }
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

  // 特殊处理代理配置节 - 只有在启用代理时才进行校验
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

    // 先保存连接模式到服务器基础信息（如有变化）
    if (currentServer.value && connectionMode.value && connectionMode.value !== (currentServer.value.monitorSysGenServerProtocol || '')) {
      await updateServer({
        monitorSysGenServerId: serverId.value!,
        monitorSysGenServerProtocol: connectionMode.value,
        // 端口保持不变；如需切换默认端口，后续可在此按模式设置默认值
      } as any);
    }

    // 保存服务器设置（包含 guacd 配置等）
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
 * 加载服务器信息
 */
const loadServerInfo = async () => {
  if (!serverId.value) return;

  try {
    const result = await getServerInfo(String(serverId.value));
    if (result.code === "00000" && result.data) {
      currentServer.value = result.data;
      connectionMode.value = (currentServer.value?.monitorSysGenServerProtocol || 'SSH').toUpperCase();
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
    loadingSettings.value = true;
    const result = await getServerSettingByServerId(serverId.value);
    if (result.code === "00000" && result.data) {
      settingData.value = result.data;
    } else {
      // 如果没有设置数据，初始化默认值
      settingData.value = {
        monitorSysGenServerId: serverId.value,
        monitorSysGenServerSettingProxyEnabled: 0,
        monitorSysGenServerSettingMonitorEnabled: 1,
        monitorSysGenServerSettingDataCollectionFrequency: 60,
        monitorSysGenServerSettingMetricsRetentionDays: 30,
      };
    }
  } catch (error) {
    console.error("加载服务器设置失败:", error);
    message.error("加载服务器设置失败");
    // 设置默认值
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
 * 加载所有数据
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
 * 打开对话框
 */
const open = async (id: number) => {
  serverId.value = id;
  visible.value = true;
  activeSection.value = "connection";
  await loadServerData();
};

// 暴露方法
defineExpose({
  open,
});
</script>

<style scoped lang="scss">
// 对话框头部样式
.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .header-left {
    display: flex;
    align-items: center;
    gap: 14px;

    .header-icon-box {
      width: 42px;
      height: 42px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(
        135deg,
        var(--el-color-primary) 0%,
        var(--el-color-primary-light-3) 100%
      );
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);

      .header-icon {
        font-size: 22px;
        color: #fff;
      }
    }

    .header-info {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .header-title {
        font-size: 17px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      .header-subtitle {
        font-size: 13px;
        color: var(--el-text-color-secondary);
      }
    }
  }

  .header-right {
    display: flex;
    gap: 8px;
  }
}

.dialog-content {
  height: 68vh;
  overflow: hidden;
}

.config-container {
  display: flex;
  height: 100%;
  gap: 0;
  border-radius: 12px;
  overflow: hidden;
  background: var(--el-bg-color);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.config-nav {
  width: 200px;
  background: var(--el-fill-color-lighter);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  border-right: 1px solid var(--el-border-color-lighter);
}

.config-menu {
  border: none;
  flex: 1;
  background: transparent;
  padding: 12px 8px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--el-border-color);
    border-radius: 2px;
  }
}

.config-content {
  flex: 1;
  overflow: hidden;
  background: var(--el-bg-color);
  display: flex;
  flex-direction: column;
}

.content-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px 24px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: linear-gradient(
    180deg,
    var(--el-fill-color-lighter) 0%,
    var(--el-bg-color) 100%
  );
  flex-shrink: 0;

  .content-title-wrapper {
    display: flex;
    align-items: center;
    gap: 10px;

    .section-icon {
      font-size: 20px;
      color: var(--el-color-primary);
    }

    .content-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }

  .content-desc {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    margin-left: 30px;
  }
}

.form-container {
  flex: 1;
  overflow: hidden;
}

.config-form {
  padding: 24px;
  height: 100%;
  overflow: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--el-border-color);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }
}

.config-section {
  max-width: 800px;

  .switch-wrapper {
    display: flex;
    align-items: center;
    gap: 12px;

    .help-icon {
      font-size: 15px;
      color: var(--el-text-color-placeholder);
      cursor: help;
      transition: color 0.2s;

      &:hover {
        color: var(--el-color-primary);
      }
    }
  }
}

.config-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--el-color-primary-light-9);
  border-radius: 8px;
  font-size: 13px;
  color: var(--el-color-primary);
  margin-top: 12px;
  border: 1px solid var(--el-color-primary-light-7);

  .iconify {
    font-size: 18px;
    flex-shrink: 0;
  }
}

// 菜单项样式
:deep(.el-menu-item) {
  border-radius: 8px;
  margin: 3px 0;
  height: 42px;
  line-height: 42px;
  transition: all 0.25s ease;
  font-size: 13px;
  color: var(--el-text-color-regular);

  .iconify {
    font-size: 18px;
    margin-right: 10px;
    transition: transform 0.2s;
  }

  &:hover {
    background: var(--el-fill-color);
    color: var(--el-color-primary);

    .iconify {
      transform: scale(1.1);
    }
  }
}

:deep(.el-menu-item.is-active) {
  background: linear-gradient(
    135deg,
    var(--el-color-primary) 0%,
    var(--el-color-primary-light-3) 100%
  ) !important;
  color: #fff !important;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.35);

  span {
    color: #fff !important;
  }

  .iconify {
    color: #fff !important;
  }

  &:hover {
    background: linear-gradient(
      135deg,
      var(--el-color-primary-dark-2) 0%,
      var(--el-color-primary) 100%
    ) !important;
    color: #fff !important;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

// 表单样式
:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

:deep(.el-select) {
  width: 220px;
}

:deep(.el-input__wrapper),
:deep(.el-input-number .el-input__wrapper) {
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 0 0 1px var(--el-border-color-hover) inset;
  }
}

:deep(.el-switch) {
  --el-switch-on-color: var(--el-color-primary);
}


// 响应式设计
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
}

</style>

<!-- 全局对话框样式 -->
<style lang="scss">
.server-config-dialog {
  .el-dialog {
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  }

  .el-dialog__header {
    padding: 20px 24px;
    margin: 0;
    background: var(--el-bg-color);
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .el-dialog__headerbtn {
    top: 20px;
    right: 20px;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    transition: all 0.2s;

    &:hover {
      background: var(--el-fill-color);
    }
  }

  .el-dialog__body {
    padding: 20px;
    background: var(--el-fill-color-lighter);
  }

  .el-dialog__footer {
    padding: 16px 24px;
    background: var(--el-bg-color);
    border-top: 1px solid var(--el-border-color-lighter);
  }
}
</style>
