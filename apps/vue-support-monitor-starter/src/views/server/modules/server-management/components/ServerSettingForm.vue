<template>
  <div class="server-setting-form">
    <!-- 监控配置 -->
    <div v-if="section === 'monitor'" class="setting-section">
      <el-form-item label="启用监控" prop="monitorSysGenServerSettingMonitorEnabled">
        <el-switch
          v-model="formData.monitorSysGenServerSettingMonitorEnabled"
          :active-value="1"
          :inactive-value="0"
          active-text="开启"
          inactive-text="关闭"
          @change="handleChange"
        />
        <span class="form-tip">开启后将收集服务器性能指标</span>
      </el-form-item>

      <el-form-item label="数据收集频率" prop="monitorSysGenServerSettingDataCollectionFrequency">
        <el-input-number
          v-model="formData.monitorSysGenServerSettingDataCollectionFrequency"
          :min="10"
          :max="3600"
          :step="10"
          placeholder="数据收集频率(秒)"
          style="width: 200px"
          @change="handleChange"
        />
        <span class="form-tip">秒，建议值：30</span>
      </el-form-item>

      <el-form-item label="CPU阈值" prop="monitorSysGenServerSettingCpuAlertThreshold">
        <el-input-number
          v-model="formData.monitorSysGenServerSettingCpuAlertThreshold"
          :min="1"
          :max="100"
          :step="1"
          placeholder="CPU使用率阈值(%)"
          style="width: 200px"
          @change="handleChange"
        />
        <span class="form-tip">%，超过此值将触发告警</span>
      </el-form-item>

      <el-form-item label="内存阈值" prop="monitorSysGenServerSettingMemoryAlertThreshold">
        <el-input-number
          v-model="formData.monitorSysGenServerSettingMemoryAlertThreshold"
          :min="1"
          :max="100"
          :step="1"
          placeholder="内存使用率阈值(%)"
          style="width: 200px"
          @change="handleChange"
        />
        <span class="form-tip">%，超过此值将触发告警</span>
      </el-form-item>

      <el-form-item label="磁盘阈值" prop="monitorSysGenServerSettingDiskAlertThreshold">
        <el-input-number
          v-model="formData.monitorSysGenServerSettingDiskAlertThreshold"
          :min="1"
          :max="100"
          :step="1"
          placeholder="磁盘使用率阈值(%)"
          style="width: 200px"
          @change="handleChange"
        />
        <span class="form-tip">%，超过此值将触发告警</span>
      </el-form-item>
    </div>

    <!-- 告警配置 -->
    <div v-if="section === 'alert'" class="setting-section">
      <el-form-item label="启用告警" prop="monitorSysGenServerSettingAlertEnabled">
        <el-switch
          v-model="formData.monitorSysGenServerSettingAlertEnabled"
          :active-value="1"
          :inactive-value="0"
          active-text="开启"
          inactive-text="关闭"
          @change="handleChange"
        />
        <span class="form-tip">开启后将发送告警通知</span>
      </el-form-item>

      <el-form-item label="告警方式" prop="monitorSysGenServerSettingAlertNotificationMethod">
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
        label="邮件地址" 
        prop="monitorSysGenServerSettingAlertEmailAddresses"
      >
        <el-input
          v-model="formData.monitorSysGenServerSettingAlertEmailAddresses"
          placeholder="请输入邮件地址"
          maxlength="200"
          @change="handleChange"
        />
      </el-form-item>

      <el-form-item 
        v-if="formData.monitorSysGenServerSettingAlertNotificationMethod === 'WEBHOOK'"
        label="Webhook URL" 
        prop="monitorSysGenServerSettingAlertWebhookUrl"
      >
        <el-input
          v-model="formData.monitorSysGenServerSettingAlertWebhookUrl"
          placeholder="请输入Webhook URL"
          maxlength="500"
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
