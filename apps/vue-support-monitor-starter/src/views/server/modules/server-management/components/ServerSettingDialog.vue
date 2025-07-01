<template>
  <el-dialog
    v-model="visible"
    title="服务器设置"
    width="800px"
    :close-on-click-modal="false"
    destroy-on-close
    class="server-setting-dialog"
  >
    <div class="dialog-content">
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="120px" size="small">
        <el-tabs v-model="activeTab" type="border-card">
          <!-- 基础监控配置 -->
          <el-tab-pane label="基础监控" name="basic">
            <div class="tab-content">
              <el-form-item label="启用监控" prop="monitorSysGenServerSettingMonitorEnabled">
                <el-switch
                  v-model="formData.monitorSysGenServerSettingMonitorEnabled"
                  :active-value="1"
                  :inactive-value="0"
                  active-text="开启"
                  inactive-text="关闭"
                />
              </el-form-item>



              <!-- 数据收集频率：仅在非API上报方式时显示 -->
              <el-form-item
                v-if="formData.monitorSysGenServerSettingDataReportMethod !== 'API'"
                label="数据收集频率"
                prop="monitorSysGenServerSettingDataCollectionFrequency"
              >
                <el-input-number
                  v-model="formData.monitorSysGenServerSettingDataCollectionFrequency"
                  :min="10"
                  :max="3600"
                  :step="10"
                  controls-position="right"
                />
                <span class="unit">秒</span>
                <el-tooltip content="API上报方式由客户端控制推送频率，无需设置收集频率" placement="top">
                  <el-icon class="info-icon"><InfoFilled /></el-icon>
                </el-tooltip>
              </el-form-item>

              <el-form-item label="数据保留时间" prop="monitorSysGenServerSettingMetricsRetentionDays">
                <el-input-number
                  v-model="formData.monitorSysGenServerSettingMetricsRetentionDays"
                  :min="1"
                  :max="365"
                  :step="1"
                  controls-position="right"
                />
                <span class="unit">天</span>
              </el-form-item>
            </div>
          </el-tab-pane>

          <!-- 数据上报配置 -->
          <el-tab-pane label="数据上报" name="report">
            <div class="tab-content">
              <el-form-item label="启用上报" prop="monitorSysGenServerSettingReportEnabled">
                <el-switch
                  v-model="formData.monitorSysGenServerSettingReportEnabled"
                  :active-value="1"
                  :inactive-value="0"
                  active-text="开启"
                  inactive-text="关闭"
                />
              </el-form-item>

            
              <el-form-item label="上报方式" prop="monitorSysGenServerSettingDataReportMethod">
                <el-select v-model="formData.monitorSysGenServerSettingDataReportMethod" placeholder="选择上报方式">
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
            </div>
          </el-tab-pane>

          <!-- 告警配置 -->
          <el-tab-pane label="告警配置" name="alert">
            <div class="tab-content">
              <el-form-item label="启用告警" prop="monitorSysGenServerSettingAlertEnabled">
                <el-switch
                  v-model="formData.monitorSysGenServerSettingAlertEnabled"
                  :active-value="1"
                  :inactive-value="0"
                  active-text="开启"
                  inactive-text="关闭"
                />
              </el-form-item>

              <template v-if="formData.monitorSysGenServerSettingAlertEnabled">
                <el-form-item label="CPU阈值" prop="monitorSysGenServerSettingCpuAlertThreshold">
                  <el-input-number
                    v-model="formData.monitorSysGenServerSettingCpuAlertThreshold"
                    :min="1"
                    :max="100"
                    :precision="1"
                    controls-position="right"
                  />
                  <span class="unit">%</span>
                </el-form-item>

                <el-form-item label="内存阈值" prop="monitorSysGenServerSettingMemoryAlertThreshold">
                  <el-input-number
                    v-model="formData.monitorSysGenServerSettingMemoryAlertThreshold"
                    :min="1"
                    :max="100"
                    :precision="1"
                    controls-position="right"
                  />
                  <span class="unit">%</span>
                </el-form-item>

                <el-form-item label="磁盘阈值" prop="monitorSysGenServerSettingDiskAlertThreshold">
                  <el-input-number
                    v-model="formData.monitorSysGenServerSettingDiskAlertThreshold"
                    :min="1"
                    :max="100"
                    :precision="1"
                    controls-position="right"
                  />
                  <span class="unit">%</span>
                </el-form-item>

                <el-form-item label="通知方式" prop="monitorSysGenServerSettingAlertNotificationMethod">
                  <el-select v-model="formData.monitorSysGenServerSettingAlertNotificationMethod" placeholder="选择通知方式">
                    <el-option label="邮件" value="EMAIL" />
                    <el-option label="短信" value="SMS" />
                    <el-option label="Webhook" value="WEBHOOK" />
                  </el-select>
                </el-form-item>

                <el-form-item
                  v-if="formData.monitorSysGenServerSettingAlertNotificationMethod === 'EMAIL'"
                  label="邮箱地址"
                  prop="monitorSysGenServerSettingAlertEmailAddresses"
                >
                  <el-input
                    v-model="formData.monitorSysGenServerSettingAlertEmailAddresses"
                    placeholder="邮箱地址，多个用逗号分隔"
                    clearable
                  />
                </el-form-item>

                <el-form-item
                  v-if="formData.monitorSysGenServerSettingAlertNotificationMethod === 'WEBHOOK'"
                  label="Webhook地址"
                  prop="monitorSysGenServerSettingAlertWebhookUrl"
                >
                  <el-input
                    v-model="formData.monitorSysGenServerSettingAlertWebhookUrl"
                    placeholder="Webhook URL地址"
                    clearable
                  />
                </el-form-item>
              </template>
            </div>
          </el-tab-pane>

          <!-- 高级配置 -->
          <el-tab-pane label="高级配置" name="advanced">
            <div class="tab-content">
              <el-form-item label="连接超时" prop="monitorSysGenServerSettingConnectionTimeout">
                <el-input-number
                  v-model="formData.monitorSysGenServerSettingConnectionTimeout"
                  :min="5"
                  :max="300"
                  :step="5"
                  controls-position="right"
                />
                <span class="unit">秒</span>
              </el-form-item>

              <el-form-item label="读取超时" prop="monitorSysGenServerSettingReadTimeout">
                <el-input-number
                  v-model="formData.monitorSysGenServerSettingReadTimeout"
                  :min="5"
                  :max="300"
                  :step="5"
                  controls-position="right"
                />
                <span class="unit">秒</span>
              </el-form-item>

              <el-form-item label="启用Docker监控" prop="monitorSysGenServerSettingDockerMonitorEnabled">
                <el-switch
                  v-model="formData.monitorSysGenServerSettingDockerMonitorEnabled"
                  :active-value="1"
                  :inactive-value="0"
                  active-text="开启"
                  inactive-text="关闭"
                />
              </el-form-item>

              <template v-if="formData.monitorSysGenServerSettingDockerMonitorEnabled">
                <el-form-item label="Docker API地址" prop="monitorSysGenServerSettingDockerApiUrl">
                  <el-input
                    v-model="formData.monitorSysGenServerSettingDockerApiUrl"
                    placeholder="Docker API地址，如：tcp://localhost:2376"
                    clearable
                  />
                </el-form-item>

                <el-form-item label="Docker API版本" prop="monitorSysGenServerSettingDockerApiVersion">
                  <el-input
                    v-model="formData.monitorSysGenServerSettingDockerApiVersion"
                    placeholder="Docker API版本，如：1.40"
                    clearable
                  />
                </el-form-item>
              </template>

              <el-form-item label="启用日志监控" prop="monitorSysGenServerSettingLogMonitorEnabled">
                <el-switch
                  v-model="formData.monitorSysGenServerSettingLogMonitorEnabled"
                  :active-value="1"
                  :inactive-value="0"
                  active-text="开启"
                  inactive-text="关闭"
                />
              </el-form-item>

              <template v-if="formData.monitorSysGenServerSettingLogMonitorEnabled">
                <el-form-item label="日志文件路径" prop="monitorSysGenServerSettingLogFilePaths">
                  <el-input
                    v-model="formData.monitorSysGenServerSettingLogFilePaths"
                    type="textarea"
                    :rows="3"
                    placeholder="日志文件路径，多个路径用换行分隔"
                  />
                </el-form-item>
              </template>

              <el-form-item label="监控端口" prop="monitorSysGenServerSettingMonitorPorts">
                <el-input
                  v-model="formData.monitorSysGenServerSettingMonitorPorts"
                  placeholder="监控的端口列表，用逗号分隔，如：80,443,3306"
                  clearable
                />
              </el-form-item>

              <el-form-item label="自定义标签" prop="monitorSysGenServerSettingCustomTags">
                <el-input
                  v-model="formData.monitorSysGenServerSettingCustomTags"
                  type="textarea"
                  :rows="3"
                  placeholder="JSON格式的自定义标签"
                />
              </el-form-item>

              <el-form-item label="配置描述" prop="monitorSysGenServerSettingDescription">
                <el-input
                  v-model="formData.monitorSysGenServerSettingDescription"
                  type="textarea"
                  :rows="3"
                  placeholder="配置描述信息"
                />
              </el-form-item>
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">保存</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from "vue";
import { message } from "@repo/utils";
import {
  type ServerSetting,
  getOrCreateServerSetting,
  saveOrUpdateServerSetting
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
  monitorSysGenServerSettingAlertEmailAddresses: "",
  monitorSysGenServerSettingAlertWebhookUrl: "",
  monitorSysGenServerSettingConnectionTimeout: 30,
  monitorSysGenServerSettingReadTimeout: 30,
  monitorSysGenServerSettingDockerMonitorEnabled: 0,
  monitorSysGenServerSettingDockerApiUrl: "",
  monitorSysGenServerSettingDockerApiVersion: "1.40",
  monitorSysGenServerSettingLogMonitorEnabled: 0,
  monitorSysGenServerSettingLogFilePaths: "",
  monitorSysGenServerSettingMonitorPorts: "",
  monitorSysGenServerSettingCustomTags: "",
  monitorSysGenServerSettingDescription: "",
  monitorSysGenServerSettingStatus: 1,
});

// 表单验证规则 - 动态规则
const rules = computed(() => {
  const baseRules: any = {
    monitorSysGenServerSettingMetricsRetentionDays: [
      { required: true, message: "数据保留时间不能为空", trigger: "blur" },
      { type: "number", min: 1, max: 365, message: "数据保留时间范围 1-365 天", trigger: "blur" },
    ],
  };

  // 仅在非API上报方式时添加数据收集频率验证
  if (formData.monitorSysGenServerSettingDataReportMethod !== 'API') {
    baseRules.monitorSysGenServerSettingDataCollectionFrequency = [
      { required: true, message: "数据收集频率不能为空", trigger: "blur" },
      { type: "number", min: 10, max: 3600, message: "数据收集频率范围 10-3600 秒", trigger: "blur" },
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
debugger
  // 同时加载服务器信息和设置
  await Promise.all([
    loadServerInfo(),
    loadServerSetting()
  ]);
};

/**
 * 加载服务器信息
 */
const loadServerInfo = async () => {
  if (!serverId.value) return;

  try {
    const result = await getServerInfo(String(serverId.value));
    debugger
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
    console.error('加载服务器设置失败:', error);
    message.error('加载服务器设置失败');
  } finally {
    loading.value = false;
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
.server-setting-dialog {
  :deep(.el-dialog) {
    border-radius: 12px;
  }
}

.dialog-content {
  padding: 0;
}

.tab-content {
  padding: 20px 0;
}

.unit {
  margin-left: 8px;
  color: var(--el-text-color-regular);
  font-size: 12px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
