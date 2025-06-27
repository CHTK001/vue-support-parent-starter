<template>
  <el-dialog
    v-model="visible"
    title="服务器配置管理"
    width="90%"
    :close-on-click-modal="false"
    destroy-on-close
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
                <div class="server-name">{{ currentServer.monitorSysGenServerName }}</div>
                <div class="server-host">{{ currentServer.monitorSysGenServerHost }}</div>
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
              <span>代理配置</span>
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
            <el-menu-item index="advanced">
              <IconifyIconOnline icon="ri:tools-line" />
              <span>高级配置</span>
            </el-menu-item>
          </el-menu>
        </div>

        <!-- 右侧配置内容 -->
        <div class="config-content">
          <el-card class="config-card">
            <template #header>
              <div class="card-header">
                <span class="card-title">{{ getSectionTitle() }}</span>
                <div class="card-actions">
                  <el-button @click="handleReset" plain size="small">
                    <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
                    重置
                  </el-button>
                  <el-button @click="handleSave" type="primary" size="small" :loading="saving">
                    <IconifyIconOnline icon="ri:save-line" class="mr-1" />
                    保存配置
                  </el-button>
                </div>
              </div>
            </template>

            <!-- 配置表单 -->
            <el-form
              ref="formRef"
              :model="formData"
              :rules="rules"
              label-width="140px"
              size="default"
              class="config-form"
            >
              <!-- 代理配置 -->
              <div v-show="activeSection === 'proxy'" class="config-section">
                <el-form-item label="启用代理">
                  <el-switch
                    v-model="settingData.monitorSysGenServerSettingProxyEnabled"
                    :active-value="1"
                    :inactive-value="0"
                    active-text="启用"
                    inactive-text="禁用"
                    @change="handleSettingChange"
                  />
                  <span class="form-tip">启用后将通过代理服务器进行连接</span>
                </el-form-item>

                <template v-if="settingData.monitorSysGenServerSettingProxyEnabled === 1">
                  <el-form-item label="代理类型">
                    <el-select
                      v-model="settingData.monitorSysGenServerSettingProxyType"
                      placeholder="选择代理类型"
                      style="width: 200px"
                      @change="handleSettingChange"
                    >
                      <el-option label="HTTP代理" value="HTTP" />
                      <el-option label="SOCKS5代理" value="SOCKS5" />
                      <el-option label="SSH隧道" value="SSH_TUNNEL" />
                    </el-select>
                  </el-form-item>

                  <el-form-item label="代理地址">
                    <el-input
                      v-model="settingData.monitorSysGenServerSettingProxyHost"
                      placeholder="请输入代理服务器地址"
                      style="width: 300px"
                      @change="handleSettingChange"
                    />
                  </el-form-item>

                  <el-form-item label="代理端口">
                    <el-input-number
                      v-model="settingData.monitorSysGenServerSettingProxyPort"
                      :min="1"
                      :max="65535"
                      placeholder="端口号"
                      style="width: 200px"
                      @change="handleSettingChange"
                    />
                  </el-form-item>

                  <el-form-item label="代理用户名">
                    <el-input
                      v-model="settingData.monitorSysGenServerSettingProxyUsername"
                      placeholder="代理用户名（可选）"
                      style="width: 200px"
                      @change="handleSettingChange"
                    />
                  </el-form-item>

                  <el-form-item label="代理密码">
                    <el-input
                      v-model="settingData.monitorSysGenServerSettingProxyPassword"
                      type="password"
                      placeholder="代理密码（可选）"
                      show-password
                      style="width: 200px"
                      @change="handleSettingChange"
                    />
                  </el-form-item>
                </template>
              </div>

              <!-- 指标管理 -->
              <div v-show="activeSection === 'metrics'" class="config-section">
                <el-form-item label="指标收集">
                  <el-switch
                    v-model="settingData.monitorSysGenServerSettingMetricsEnabled"
                    :active-value="1"
                    :inactive-value="0"
                    active-text="启用"
                    inactive-text="禁用"
                    @change="handleSettingChange"
                  />
                  <span class="form-tip">启用后将收集服务器性能指标</span>
                </el-form-item>

                <template v-if="settingData.monitorSysGenServerSettingMetricsEnabled === 1">
                  <el-form-item label="数据上报方式">
                    <el-select
                      v-model="settingData.monitorSysGenServerSettingDataReportMethod"
                      placeholder="选择上报方式"
                      style="width: 200px"
                      @change="handleSettingChange"
                    >
                      <el-option label="无上报" value="NONE" />
                      <el-option label="API上报" value="API" />
                      <el-option label="Prometheus" value="PROMETHEUS" />
                    </el-select>
                    <span class="form-tip">选择指标数据的上报方式</span>
                  </el-form-item>

                  <el-form-item label="收集频率">
                    <el-input-number
                      v-model="settingData.monitorSysGenServerSettingDataCollectionFrequency"
                      :min="10"
                      :max="3600"
                      :step="10"
                      placeholder="收集频率(秒)"
                      style="width: 200px"
                      @change="handleSettingChange"
                    />
                    <span class="form-tip">秒，建议值：30</span>
                  </el-form-item>

                  <el-form-item label="数据保留天数">
                    <el-input-number
                      v-model="settingData.monitorSysGenServerSettingMetricsRetentionDays"
                      :min="1"
                      :max="365"
                      placeholder="保留天数"
                      style="width: 200px"
                      @change="handleSettingChange"
                    />
                    <span class="form-tip">天，建议值：30</span>
                  </el-form-item>
                </template>
              </div>

              <!-- 其他配置节 -->
              <div v-show="!['proxy', 'metrics'].includes(activeSection)" class="config-section">
                <ServerSettingForm
                  v-model="settingData"
                  :section="activeSection"
                  @change="handleSettingChange"
                />
              </div>
            </el-form>
          </el-card>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">关闭</el-button>
        <el-button @click="handleReset" plain>
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
          重置
        </el-button>
        <el-button @click="handleSave" type="primary" :loading="saving">
          <IconifyIconOnline icon="ri:save-line" class="mr-1" />
          保存配置
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, defineAsyncComponent } from "vue";
import { message } from "@repo/utils";
import { getServerInfo, updateServer, type ServerInfo } from "@/api/server";
import { getServerSettingByServerId, saveOrUpdateServerSetting, type ServerSetting } from "@/api/server/setting";

// 异步组件
const ServerSettingForm = defineAsyncComponent(() => import("./ServerSettingForm.vue"));

// 定义事件
const emit = defineEmits<{
  success: [];
}>();

// 响应式状态
const visible = ref(false);
const loading = ref(false);
const saving = ref(false);
const activeSection = ref("proxy");
const formRef = ref();

// 服务器ID
const serverId = ref<number | null>(null);

// 当前服务器信息
const currentServer = ref<ServerInfo | null>(null);

// 服务器设置数据
const settingData = ref<Partial<ServerSetting>>({});

/**
 * 获取当前节的标题
 */
const getSectionTitle = () => {
  const titles = {
    proxy: "代理配置",
    metrics: "指标管理",
    monitor: "监控配置",
    alert: "告警配置",
    docker: "Docker配置",
    advanced: "高级配置"
  };
  return titles[activeSection.value] || "配置";
};

/**
 * 处理节切换
 */
const handleSectionChange = (section: string) => {
  activeSection.value = section;
};

/**
 * 处理设置数据变化
 */
const handleSettingChange = (data: Partial<ServerSetting>) => {
  settingData.value = { ...settingData.value, ...data };
};

/**
 * 重置表单
 */
const handleReset = () => {
  loadServerData();
};

/**
 * 保存配置
 */
const handleSave = async () => {
  try {
    // 表单验证
    const isValid = await formRef.value?.validate().catch(() => false);
    if (!isValid) return;

    saving.value = true;

    // 保存基础配置
    if (activeSection.value === "basic") {
      const result = await updateServer(formData);
      if (result.code === "00000") {
        message.success("基础配置保存成功");
        // 重新加载服务器信息
        await loadServerInfo();
        emit("success");
      } else {
        message.error(result.msg || "基础配置保存失败");
        return;
      }
    } else {
      // 保存服务器设置
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
      
      // 填充基础配置表单
      Object.assign(formData, {
        monitorSysGenServerId: result.data.monitorSysGenServerId,
        monitorSysGenServerName: result.data.monitorSysGenServerName || "",
        monitorSysGenServerDesc: result.data.monitorSysGenServerDesc || "",
        monitorSysGenServerTags: result.data.monitorSysGenServerTags || "",
        monitorSysGenServerTimeout: result.data.monitorSysGenServerTimeout || 30000,
        monitorSysGenServerStatus: result.data.monitorSysGenServerStatus ?? 1,
      });
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
    const result = await getServerSettingByServerId(serverId.value);
    if (result.code === "00000" && result.data) {
      settingData.value = result.data;
    }
  } catch (error) {
    console.error("加载服务器设置失败:", error);
    // 设置默认值
    settingData.value = {};
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
    await Promise.all([
      loadServerInfo(),
      loadServerSetting()
    ]);
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
    border-radius: 12px;
  }
  
  :deep(.el-dialog__body) {
    padding: 0;
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
  width: 240px;
  background: #f8f9fa;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
}

.server-info {
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
  background: white;
}

.server-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.server-icon {
  font-size: 24px;
  color: #409eff;
}

.server-details {
  flex: 1;
}

.server-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.server-host {
  font-size: 12px;
  color: #909399;
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
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.config-form {
  padding: 20px;
  height: calc(100% - 60px);
  overflow: auto;
}

.config-section {
  max-width: 600px;
}

.form-tip {
  margin-left: 8px;
  font-size: 12px;
  color: #909399;
}

:deep(.el-menu-item) {
  border-radius: 0;
  margin: 0;
}

:deep(.el-menu-item.is-active) {
  background-color: #ecf5ff;
  color: #409eff;
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
}
</style>
