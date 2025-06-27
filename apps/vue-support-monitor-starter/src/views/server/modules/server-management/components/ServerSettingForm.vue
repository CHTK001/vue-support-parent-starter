<template>
  <div class="server-setting-form">
    <!-- 监控配置 -->
    <div v-if="section === 'monitor'" class="setting-section">
      <el-form-item prop="monitorSysGenServerSettingMonitorEnabled">
        <template #label>
          <div class="form-label">
            <span>启用监控</span>
            <el-tooltip
              content="开启后将定期收集服务器的CPU、内存、磁盘、网络等性能指标数据，用于监控服务器运行状态"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-switch
          v-model="formData.monitorSysGenServerSettingMonitorEnabled"
          :active-value="1"
          :inactive-value="0"
          active-text="开启"
          inactive-text="关闭"
          @change="handleChange"
        />
      </el-form-item>

      <el-form-item
        v-show="formData.monitorSysGenServerSettingMonitorEnabled"
        prop="monitorSysGenServerSettingDataReportMethod"
      >
        <template #label>
          <div class="form-label">
            <span>数据上报方式</span>
            <el-tooltip
              content="选择服务器指标数据的上报方式：本地上报(直接收集)、API上报(客户端推送)、Prometheus(第三方采集)"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-select
          v-model="formData.monitorSysGenServerSettingDataReportMethod"
          placeholder="请选择数据上报方式"
          style="width: 200px"
          @change="handleDataReportMethodChange"
        >
          <el-option
            v-if="isLocalServer"
            label="本地上报"
            value="LOCAL"
          />
          <el-option label="API上报" value="API" />
          <el-option label="Prometheus" value="PROMETHEUS" />
        </el-select>
      </el-form-item>

      <el-form-item
        v-show="formData.monitorSysGenServerSettingMonitorEnabled && showDataCollectionFrequency"
        prop="monitorSysGenServerSettingDataCollectionFrequency"
      >
        <template #label>
          <div class="form-label">
            <span>数据收集频率</span>
            <el-tooltip
              content="服务器指标数据的收集间隔时间，频率越高数据越实时但会增加系统负载，建议30-60秒"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input-number
          v-model="formData.monitorSysGenServerSettingDataCollectionFrequency"
          :min="10"
          :max="3600"
          :step="10"
          placeholder="数据收集频率(秒)"
          style="width: 200px"
          @change="handleChange"
        />
        <span class="form-tip">秒，建议值：30-60</span>
      </el-form-item>

      <el-form-item
        v-show="formData.monitorSysGenServerSettingMonitorEnabled && showMonitorInterval"
        prop="monitorSysGenServerSettingMonitorInterval"
      >
        <template #label>
          <div class="form-label">
            <span>监控间隔</span>
            <el-tooltip
              content="监控检查的间隔时间，用于定期检查服务器状态和触发告警检测，建议60-300秒"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input-number
          v-model="formData.monitorSysGenServerSettingMonitorInterval"
          :min="30"
          :max="3600"
          :step="30"
          placeholder="监控间隔(秒)"
          style="width: 200px"
          @change="handleChange"
        />
        <span class="form-tip">秒，建议值：60-300</span>
      </el-form-item>

      <el-form-item
        v-show="formData.monitorSysGenServerSettingMonitorEnabled && showMetricsRetentionDays"
        prop="monitorSysGenServerSettingMetricsRetentionDays"
      >
        <template #label>
          <div class="form-label">
            <span>数据保留天数</span>
            <el-tooltip
              content="监控数据在系统中的保留时间，超过此时间的历史数据将被自动清理，建议7-90天"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input-number
          v-model="formData.monitorSysGenServerSettingMetricsRetentionDays"
          :min="1"
          :max="365"
          :step="1"
          placeholder="数据保留天数"
          style="width: 200px"
          @change="handleChange"
        />
        <span class="form-tip">天，建议值：7-90</span>
      </el-form-item>

      <el-form-item prop="monitorSysGenServerSettingCpuAlertThreshold">
        <template #label>
          <div class="form-label">
            <span>CPU告警阈值</span>
            <el-tooltip
              content="CPU使用率超过此百分比时触发告警通知，建议设置为70-85%，过低会产生过多告警"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input-number
          v-model="formData.monitorSysGenServerSettingCpuAlertThreshold"
          :min="1"
          :max="100"
          :step="1"
          placeholder="CPU使用率阈值(%)"
          style="width: 200px"
          @change="handleChange"
        />
        <span class="form-tip">%，建议值：70-85</span>
      </el-form-item>

      <el-form-item prop="monitorSysGenServerSettingMemoryAlertThreshold">
        <template #label>
          <div class="form-label">
            <span>内存告警阈值</span>
            <el-tooltip
              content="内存使用率超过此百分比时触发告警通知，建议设置为75-90%，需考虑系统缓存占用"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input-number
          v-model="formData.monitorSysGenServerSettingMemoryAlertThreshold"
          :min="1"
          :max="100"
          :step="1"
          placeholder="内存使用率阈值(%)"
          style="width: 200px"
          @change="handleChange"
        />
        <span class="form-tip">%，建议值：75-90</span>
      </el-form-item>

      <el-form-item prop="monitorSysGenServerSettingDiskAlertThreshold">
        <template #label>
          <div class="form-label">
            <span>磁盘告警阈值</span>
            <el-tooltip
              content="磁盘使用率超过此百分比时触发告警通知，建议设置为80-95%，需预留足够空间避免系统异常"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input-number
          v-model="formData.monitorSysGenServerSettingDiskAlertThreshold"
          :min="1"
          :max="100"
          :step="1"
          placeholder="磁盘使用率阈值(%)"
          style="width: 200px"
          @change="handleChange"
        />
        <span class="form-tip">%，建议值：80-95</span>
      </el-form-item>
    </div>

    <!-- 告警配置 -->
    <div v-if="section === 'alert'" class="setting-section">
      <el-form-item prop="monitorSysGenServerSettingAlertEnabled">
        <template #label>
          <div class="form-label">
            <span>启用告警</span>
            <el-tooltip
              content="开启后当监控指标超过设定阈值时将自动发送告警通知，支持多种通知方式"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-switch
          v-model="formData.monitorSysGenServerSettingAlertEnabled"
          :active-value="1"
          :inactive-value="0"
          active-text="开启"
          inactive-text="关闭"
          @change="handleChange"
        />
      </el-form-item>

      <el-form-item
        v-show="formData.monitorSysGenServerSettingAlertEnabled"
        prop="monitorSysGenServerSettingAlertNotificationMethod"
      >
        <template #label>
          <div class="form-label">
            <span>告警方式</span>
            <el-tooltip
              content="选择告警通知的发送方式，支持邮件、短信、钉钉、企业微信和自定义Webhook"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-select
          v-model="formData.monitorSysGenServerSettingAlertNotificationMethod"
          placeholder="请选择告警方式"
          style="width: 200px"
          @change="handleChange"
        >
          <el-option label="邮件" value="EMAIL" />
          <el-option label="短信" value="SMS" />
          <el-option label="钉钉" value="DINGTALK" />
          <el-option label="企业微信" value="WECHAT" />
          <el-option label="Webhook" value="WEBHOOK" />
        </el-select>
      </el-form-item>

      <el-form-item
        v-if="formData.monitorSysGenServerSettingAlertNotificationMethod === 'EMAIL'"
        prop="monitorSysGenServerSettingAlertEmailAddresses"
      >
        <template #label>
          <div class="form-label">
            <span>邮件地址</span>
            <el-tooltip
              content="接收告警邮件的邮箱地址，多个地址用逗号分隔，如：admin@example.com,ops@example.com"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input
          v-model="formData.monitorSysGenServerSettingAlertEmailAddresses"
          placeholder="请输入邮件地址，多个用逗号分隔"
          maxlength="200"
          @change="handleChange"
        />
      </el-form-item>

      <el-form-item
        v-if="formData.monitorSysGenServerSettingAlertNotificationMethod === 'WEBHOOK'"
        prop="monitorSysGenServerSettingAlertWebhookUrl"
      >
        <template #label>
          <div class="form-label">
            <span>Webhook URL</span>
            <el-tooltip
              content="自定义Webhook接收地址，告警信息将以POST请求发送到此URL，支持集成第三方系统"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input
          v-model="formData.monitorSysGenServerSettingAlertWebhookUrl"
          placeholder="请输入Webhook URL"
          maxlength="500"
          @change="handleChange"
        />
      </el-form-item>

      <el-form-item
        v-show="formData.monitorSysGenServerSettingAlertEnabled"
        prop="monitorSysGenServerSettingAlertSilenceDuration"
      >
        <template #label>
          <div class="form-label">
            <span>告警静默时间</span>
            <el-tooltip
              content="同一类型告警在此时间内不会重复发送，避免告警轰炸，建议15-60分钟"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input-number
          v-model="formData.monitorSysGenServerSettingAlertSilenceDuration"
          :min="5"
          :max="1440"
          :step="5"
          placeholder="静默时间(分钟)"
          style="width: 200px"
          @change="handleChange"
        />
        <span class="form-tip">分钟，建议值：15-60</span>
      </el-form-item>

      <el-form-item
        v-show="formData.monitorSysGenServerSettingAlertEnabled"
        prop="monitorSysGenServerSettingAutoRecoveryNotificationEnabled"
      >
        <template #label>
          <div class="form-label">
            <span>自动恢复通知</span>
            <el-tooltip
              content="当告警状态恢复正常时是否发送恢复通知，帮助及时了解问题解决情况"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-switch
          v-model="formData.monitorSysGenServerSettingAutoRecoveryNotificationEnabled"
          :active-value="1"
          :inactive-value="0"
          active-text="开启"
          inactive-text="关闭"
          @change="handleChange"
        />
      </el-form-item>
    </div>

    <!-- Docker配置 -->
    <div v-if="section === 'docker'" class="setting-section">
      <el-form-item label="启用Docker监控" prop="monitorSysGenServerSettingDockerMonitorEnabled">
        <el-switch
          v-model="formData.monitorSysGenServerSettingDockerMonitorEnabled"
          :active-value="1"
          :inactive-value="0"
          active-text="开启"
          inactive-text="关闭"
          @change="handleChange"
        />
        <span class="form-tip">开启后将监控Docker容器</span>
      </el-form-item>

      <el-form-item 
        v-if="formData.monitorSysGenServerSettingDockerMonitorEnabled"
        label="Docker API地址" 
        prop="monitorSysGenServerSettingDockerApiUrl"
      >
        <el-input
          v-model="formData.monitorSysGenServerSettingDockerApiUrl"
          placeholder="请输入Docker API地址"
          maxlength="200"
          @change="handleChange"
        />
      </el-form-item>

      <el-form-item 
        v-if="formData.monitorSysGenServerSettingDockerMonitorEnabled"
        label="API版本" 
        prop="monitorSysGenServerSettingDockerApiVersion"
      >
        <el-input
          v-model="formData.monitorSysGenServerSettingDockerApiVersion"
          placeholder="请输入API版本"
          maxlength="50"
          @change="handleChange"
        />
      </el-form-item>
    </div>

    <!-- 代理配置 -->
    <div v-if="section === 'proxy'" class="setting-section">
      <el-form-item label="启用代理" prop="monitorSysGenServerSettingProxyEnabled">
        <el-switch
          v-model="formData.monitorSysGenServerSettingProxyEnabled"
          :active-value="1"
          :inactive-value="0"
          active-text="开启"
          inactive-text="关闭"
          @change="handleChange"
        />
        <span class="form-tip">通过代理服务器连接</span>
      </el-form-item>

      <el-form-item 
        v-if="formData.monitorSysGenServerSettingProxyEnabled"
        label="代理类型" 
        prop="monitorSysGenServerSettingProxyType"
      >
        <el-select
          v-model="formData.monitorSysGenServerSettingProxyType"
          placeholder="请选择代理类型"
          style="width: 200px"
          @change="handleChange"
        >
          <el-option label="HTTP代理" value="HTTP" />
          <el-option label="SOCKS5代理" value="SOCKS5" />
        </el-select>
      </el-form-item>

      <el-form-item 
        v-if="formData.monitorSysGenServerSettingProxyEnabled"
        label="代理主机" 
        prop="monitorSysGenServerSettingProxyHost"
      >
        <el-input
          v-model="formData.monitorSysGenServerSettingProxyHost"
          placeholder="请输入代理主机地址"
          maxlength="100"
          @change="handleChange"
        />
      </el-form-item>

      <el-form-item 
        v-if="formData.monitorSysGenServerSettingProxyEnabled"
        label="代理端口" 
        prop="monitorSysGenServerSettingProxyPort"
      >
        <el-input-number
          v-model="formData.monitorSysGenServerSettingProxyPort"
          :min="1"
          :max="65535"
          placeholder="代理端口"
          style="width: 200px"
          @change="handleChange"
        />
      </el-form-item>
    </div>

    <!-- 高级配置 -->
    <div v-if="section === 'advanced'" class="setting-section">
      <el-form-item label="日志监控" prop="monitorSysGenServerSettingLogMonitorEnabled">
        <el-switch
          v-model="formData.monitorSysGenServerSettingLogMonitorEnabled"
          :active-value="1"
          :inactive-value="0"
          active-text="开启"
          inactive-text="关闭"
          @change="handleChange"
        />
        <span class="form-tip">监控系统日志</span>
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
          placeholder="请输入日志文件路径，多个路径用换行分隔"
          maxlength="1000"
          @change="handleChange"
        />
      </el-form-item>

      <el-form-item label="连接超时时间" prop="monitorSysGenServerSettingConnectionTimeout">
        <el-input-number
          v-model="formData.monitorSysGenServerSettingConnectionTimeout"
          :min="5"
          :max="300"
          :step="5"
          placeholder="连接超时时间(秒)"
          style="width: 200px"
          @change="handleChange"
        />
        <span class="form-tip">秒，建议值：30</span>
      </el-form-item>

      <el-form-item label="读取超时时间" prop="monitorSysGenServerSettingReadTimeout">
        <el-input-number
          v-model="formData.monitorSysGenServerSettingReadTimeout"
          :min="10"
          :max="600"
          :step="10"
          placeholder="读取超时时间(秒)"
          style="width: 200px"
          @change="handleChange"
        />
        <span class="form-tip">秒，建议值：60</span>
      </el-form-item>

      <el-form-item label="监控端口" prop="monitorSysGenServerSettingMonitorPorts">
        <el-input
          v-model="formData.monitorSysGenServerSettingMonitorPorts"
          placeholder="请输入监控端口，多个端口用逗号分隔"
          maxlength="500"
          @change="handleChange"
        />
        <span class="form-tip">例如：80,443,3306</span>
      </el-form-item>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch, defineProps, defineEmits } from "vue";
import type { ServerSetting } from "@/api/server/setting";

// 定义属性
const props = defineProps<{
  modelValue: Partial<ServerSetting>;
  section: "monitor" | "alert" | "docker" | "proxy" | "advanced";
}>();

// 定义事件
const emit = defineEmits<{
  "update:modelValue": [value: Partial<ServerSetting>];
  change: [value: Partial<ServerSetting>];
}>();

// 表单数据
const formData = reactive<Partial<ServerSetting>>({
  // 监控配置默认值
  monitorSysGenServerSettingMonitorEnabled: 0,
  monitorSysGenServerSettingDataCollectionFrequency: 30,
  monitorSysGenServerSettingCpuAlertThreshold: 80,
  monitorSysGenServerSettingMemoryAlertThreshold: 80,
  monitorSysGenServerSettingDiskAlertThreshold: 90,
  
  // 告警配置默认值
  monitorSysGenServerSettingAlertEnabled: 0,
  monitorSysGenServerSettingAlertNotificationMethod: "EMAIL",
  
  // Docker配置默认值
  monitorSysGenServerSettingDockerMonitorEnabled: 0,
  monitorSysGenServerSettingDockerApiVersion: "1.40",
  
  // 代理配置默认值
  monitorSysGenServerSettingProxyEnabled: 0,
  monitorSysGenServerSettingProxyType: "HTTP",
  
  // 高级配置默认值
  monitorSysGenServerSettingLogMonitorEnabled: 0,
  monitorSysGenServerSettingConnectionTimeout: 30,
  monitorSysGenServerSettingReadTimeout: 60,
});

/**
 * 处理数据变化
 */
const handleChange = () => {
  emit("update:modelValue", formData);
  emit("change", formData);
};

// 监听外部数据变化
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      Object.assign(formData, newValue);
    }
  },
  { immediate: true, deep: true }
);

// 监听表单数据变化
watch(
  formData,
  (newValue) => {
    emit("update:modelValue", newValue);
  },
  { deep: true }
);
</script>

<style scoped>
.server-setting-form {
  padding: 20px 0;
}

.setting-section {
  max-width: 600px;
}

.form-tip {
  margin-left: 8px;
  font-size: 12px;
  color: #909399;
}

:deep(.el-form-item) {
  margin-bottom: 24px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #303133;
}
</style>
