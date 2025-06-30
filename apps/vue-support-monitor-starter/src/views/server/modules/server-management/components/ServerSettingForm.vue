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
          style="width: 200px !important"
          class="min-w-[200px]"
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
      <el-form-item prop="monitorSysGenServerSettingDockerEnabled">
        <template #label>
          <div class="form-label">
            <span>支持Docker</span>
            <el-tooltip
              content="标识服务器是否安装了Docker，开启后可以监控Docker容器和镜像信息"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-switch
          v-model="formData.monitorSysGenServerSettingDockerEnabled"
          :active-value="1"
          :inactive-value="0"
          active-text="支持"
          inactive-text="不支持"
          @change="handleChange"
        />
      </el-form-item>

      <el-form-item
        v-show="formData.monitorSysGenServerSettingDockerEnabled"
        prop="monitorSysGenServerSettingDockerMonitorEnabled"
      >
        <template #label>
          <div class="form-label">
            <span>启用Docker监控</span>
            <el-tooltip
              content="开启后将监控Docker容器的运行状态、资源使用情况和容器日志"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-switch
          v-model="formData.monitorSysGenServerSettingDockerMonitorEnabled"
          :active-value="1"
          :inactive-value="0"
          active-text="开启"
          inactive-text="关闭"
          @change="handleChange"
        />
      </el-form-item>

      <el-form-item
        v-show="formData.monitorSysGenServerSettingDockerEnabled"
        prop="monitorSysGenServerSettingDockerConnectionType"
      >
        <template #label>
          <div class="form-label">
            <span>连接方式</span>
            <el-tooltip
              content="选择连接Docker的方式：Shell命令行方式或Docker API方式"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-select
          v-model="formData.monitorSysGenServerSettingDockerConnectionType"
          placeholder="请选择连接方式"
          style="width: 200px !important"
          @change="handleChange"
        >
          <el-option label="Shell命令" value="SHELL" />
          <el-option label="Docker API" value="API" />
        </el-select>
      </el-form-item>

      <el-form-item
        v-show="formData.monitorSysGenServerSettingDockerEnabled && formData.monitorSysGenServerSettingDockerConnectionType === 'API'"
        prop="monitorSysGenServerSettingDockerApiUrl"
      >
        <template #label>
          <div class="form-label">
            <span>Docker API地址</span>
            <el-tooltip
              content="Docker API的访问地址，如：unix:///var/run/docker.sock 或 tcp://localhost:2376"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input
          v-model="formData.monitorSysGenServerSettingDockerApiUrl"
          placeholder="如：unix:///var/run/docker.sock"
          maxlength="200"
          @change="handleChange"
        />
      </el-form-item>

      <el-form-item
        v-show="formData.monitorSysGenServerSettingDockerEnabled && formData.monitorSysGenServerSettingDockerConnectionType === 'API'"
        prop="monitorSysGenServerSettingDockerApiVersion"
      >
        <template #label>
          <div class="form-label">
            <span>API版本</span>
            <el-tooltip
              content="Docker API的版本号，如：1.40、1.41等，可通过 docker version 命令查看"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input
          v-model="formData.monitorSysGenServerSettingDockerApiVersion"
          placeholder="如：1.40"
          maxlength="50"
          @change="handleChange"
        />
      </el-form-item>

      <el-form-item
        v-show="formData.monitorSysGenServerSettingDockerEnabled && formData.monitorSysGenServerSettingDockerConnectionType === 'API'"
        prop="monitorSysGenServerSettingDockerTlsEnabled"
      >
        <template #label>
          <div class="form-label">
            <span>启用TLS</span>
            <el-tooltip
              content="是否启用TLS加密连接Docker API，提高连接安全性"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-switch
          v-model="formData.monitorSysGenServerSettingDockerTlsEnabled"
          :active-value="1"
          :inactive-value="0"
          active-text="开启"
          inactive-text="关闭"
          @change="handleChange"
        />
      </el-form-item>
    </div>

    <!-- 代理配置 -->
    <div v-if="section === 'proxy'" class="setting-section">
      <el-form-item prop="monitorSysGenServerSettingProxyEnabled">
        <template #label>
          <div class="form-label">
            <span>启用代理</span>
            <el-tooltip
              content="通过代理服务器连接目标服务器，适用于网络隔离或需要跳板机的环境"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-switch
          v-model="formData.monitorSysGenServerSettingProxyEnabled"
          :active-value="1"
          :inactive-value="0"
          active-text="开启"
          inactive-text="关闭"
          @change="handleChange"
        />
      </el-form-item>

      <el-form-item
        v-show="formData.monitorSysGenServerSettingProxyEnabled"
        prop="monitorSysGenServerSettingProxyType"
      >
        <template #label>
          <div class="form-label">
            <span>代理类型</span>
            <el-tooltip
              content="选择代理协议类型：HTTP代理适用于Web流量，SOCKS5代理支持更多协议，Guacamole用于远程桌面"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-select
          v-model="formData.monitorSysGenServerSettingProxyType"
          placeholder="请选择代理类型"
          style="width: 200px !important"
          @change="handleChange"
        >
          <el-option label="HTTP代理" value="HTTP" />
          <el-option label="SOCKS5代理" value="SOCKS5" />
          <el-option label="Guacamole代理" value="GUACAMOLE" />
        </el-select>
      </el-form-item>

      <el-form-item
        v-show="formData.monitorSysGenServerSettingProxyEnabled"
        prop="monitorSysGenServerSettingProxyHost"
      >
        <template #label>
          <div class="form-label">
            <span>代理主机</span>
            <el-tooltip
              content="代理服务器的IP地址或域名，如：192.168.1.100 或 proxy.example.com"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input
          v-model="formData.monitorSysGenServerSettingProxyHost"
          placeholder="请输入代理主机地址"
          maxlength="100"
          @change="handleChange"
        />
      </el-form-item>

      <el-form-item
        v-show="formData.monitorSysGenServerSettingProxyEnabled"
        prop="monitorSysGenServerSettingProxyPort"
      >
        <template #label>
          <div class="form-label">
            <span>代理端口</span>
            <el-tooltip
              content="代理服务器的端口号，HTTP代理通常使用8080，SOCKS5代理通常使用1080"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input-number
          v-model="formData.monitorSysGenServerSettingProxyPort"
          :min="1"
          :max="65535"
          placeholder="代理端口"
          style="width: 200px"
          @change="handleChange"
        />
      </el-form-item>

      <el-form-item
        v-show="formData.monitorSysGenServerSettingProxyEnabled && formData.monitorSysGenServerSettingProxyType !== 'GUACAMOLE'"
        prop="monitorSysGenServerSettingProxyUsername"
      >
        <template #label>
          <div class="form-label">
            <span>代理用户名</span>
            <el-tooltip
              content="代理服务器的认证用户名，如果代理不需要认证可留空"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input
          v-model="formData.monitorSysGenServerSettingProxyUsername"
          placeholder="代理用户名(可选)"
          maxlength="100"
          @change="handleChange"
        />
      </el-form-item>

      <el-form-item
        v-show="formData.monitorSysGenServerSettingProxyEnabled && formData.monitorSysGenServerSettingProxyType !== 'GUACAMOLE'"
        prop="monitorSysGenServerSettingProxyPassword"
      >
        <template #label>
          <div class="form-label">
            <span>代理密码</span>
            <el-tooltip
              content="代理服务器的认证密码，如果代理不需要认证可留空"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input
          v-model="formData.monitorSysGenServerSettingProxyPassword"
          type="password"
          placeholder="代理密码(可选)"
          maxlength="100"
          show-password
          @change="handleChange"
        />
      </el-form-item>
    </div>

    <!-- 高级配置 -->
    <div v-if="section === 'advanced'" class="setting-section">
      <el-form-item prop="monitorSysGenServerSettingLogMonitorEnabled">
        <template #label>
          <div class="form-label">
            <span>日志监控</span>
            <el-tooltip
              content="开启后将监控指定的系统日志文件，检测异常日志和错误信息"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-switch
          v-model="formData.monitorSysGenServerSettingLogMonitorEnabled"
          :active-value="1"
          :inactive-value="0"
          active-text="开启"
          inactive-text="关闭"
          @change="handleChange"
        />
      </el-form-item>

      <el-form-item
        v-show="formData.monitorSysGenServerSettingLogMonitorEnabled"
        prop="monitorSysGenServerSettingLogFilePaths"
      >
        <template #label>
          <div class="form-label">
            <span>日志文件路径</span>
            <el-tooltip
              content="需要监控的日志文件路径，支持通配符，多个路径用换行分隔，如：/var/log/nginx/*.log"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input
          v-model="formData.monitorSysGenServerSettingLogFilePaths"
          type="textarea"
          :rows="3"
          placeholder="请输入日志文件路径，多个路径用换行分隔&#10;如：/var/log/nginx/access.log&#10;/var/log/nginx/error.log"
          maxlength="1000"
          @change="handleChange"
        />
      </el-form-item>

      <el-form-item prop="monitorSysGenServerSettingPortMonitorEnabled">
        <template #label>
          <div class="form-label">
            <span>端口监控</span>
            <el-tooltip
              content="开启后将监控指定端口的连通性和响应时间"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-switch
          v-model="formData.monitorSysGenServerSettingPortMonitorEnabled"
          :active-value="1"
          :inactive-value="0"
          active-text="开启"
          inactive-text="关闭"
          @change="handleChange"
        />
      </el-form-item>

      <el-form-item
        v-show="formData.monitorSysGenServerSettingPortMonitorEnabled"
        prop="monitorSysGenServerSettingMonitorPorts"
      >
        <template #label>
          <div class="form-label">
            <span>监控端口</span>
            <el-tooltip
              content="需要监控的端口列表，多个端口用逗号分隔，如：80,443,3306,6379"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input
          v-model="formData.monitorSysGenServerSettingMonitorPorts"
          placeholder="请输入监控端口，多个端口用逗号分隔，如：80,443,3306"
          maxlength="500"
          @change="handleChange"
        />
      </el-form-item>

      <el-form-item prop="monitorSysGenServerSettingConnectionTimeout">
        <template #label>
          <div class="form-label">
            <span>连接超时时间</span>
            <el-tooltip
              content="建立连接的最大等待时间，超过此时间将认为连接失败，建议15-60秒"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input-number
          v-model="formData.monitorSysGenServerSettingConnectionTimeout"
          :min="5"
          :max="300"
          :step="5"
          placeholder="连接超时时间(秒)"
          style="width: 200px"
          @change="handleChange"
        />
        <span class="form-tip">秒，建议值：15-60</span>
      </el-form-item>

      <el-form-item prop="monitorSysGenServerSettingReadTimeout">
        <template #label>
          <div class="form-label">
            <span>读取超时时间</span>
            <el-tooltip
              content="数据读取的最大等待时间，超过此时间将认为读取失败，建议30-120秒"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input-number
          v-model="formData.monitorSysGenServerSettingReadTimeout"
          :min="10"
          :max="600"
          :step="10"
          placeholder="读取超时时间(秒)"
          style="width: 200px"
          @change="handleChange"
        />
        <span class="form-tip">秒，建议值：30-120</span>
      </el-form-item>

      <el-form-item prop="monitorSysGenServerSettingPerformanceSuggestionEnabled">
        <template #label>
          <div class="form-label">
            <span>性能优化建议</span>
            <el-tooltip
              content="开启后系统将根据监控数据分析服务器性能瓶颈并提供优化建议"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-switch
          v-model="formData.monitorSysGenServerSettingPerformanceSuggestionEnabled"
          :active-value="1"
          :inactive-value="0"
          active-text="开启"
          inactive-text="关闭"
          @change="handleChange"
        />
      </el-form-item>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch, computed, defineProps, defineEmits } from "vue";
import type { ServerSetting } from "@/api/server/setting";

// 定义属性
const props = defineProps<{
  modelValue: Partial<ServerSetting>;
  section: "monitor" | "alert" | "docker" | "proxy" | "advanced";
  isLocalServer?: boolean;
}>();

// 定义事件
const emit = defineEmits<{
  "update:modelValue": [value: Partial<ServerSetting>];
  change: [value: Partial<ServerSetting>];
}>();

// 表单数据
const formData = reactive<Partial<ServerSetting & any>>({
  // 监控配置默认值
  monitorSysGenServerSettingMonitorEnabled: 0,
  monitorSysGenServerSettingDataReportMethod: "API",
  monitorSysGenServerSettingDataCollectionFrequency: 30,
  monitorSysGenServerSettingMonitorInterval: 60,
  monitorSysGenServerSettingMetricsRetentionDays: 30,
  monitorSysGenServerSettingCpuAlertThreshold: 80,
  monitorSysGenServerSettingMemoryAlertThreshold: 80,
  monitorSysGenServerSettingDiskAlertThreshold: 90,

  // 告警配置默认值
  monitorSysGenServerSettingAlertEnabled: 0,
  monitorSysGenServerSettingAlertNotificationMethod: "EMAIL",
  monitorSysGenServerSettingAlertSilenceDuration: 30,
  monitorSysGenServerSettingAutoRecoveryNotificationEnabled: 1,

  // Docker配置默认值
  monitorSysGenServerSettingDockerEnabled: 0,
  monitorSysGenServerSettingDockerMonitorEnabled: 0,
  monitorSysGenServerSettingDockerConnectionType: "SHELL",
  monitorSysGenServerSettingDockerApiVersion: "1.40",
  monitorSysGenServerSettingDockerTlsEnabled: 0,

  // 代理配置默认值
  monitorSysGenServerSettingProxyEnabled: 0,
  monitorSysGenServerSettingProxyType: "HTTP",

  // 高级配置默认值
  monitorSysGenServerSettingLogMonitorEnabled: 0,
  monitorSysGenServerSettingPortMonitorEnabled: 0,
  monitorSysGenServerSettingConnectionTimeout: 30,
  monitorSysGenServerSettingReadTimeout: 60,
  monitorSysGenServerSettingPerformanceSuggestionEnabled: 1,
});

// 计算属性：是否为本地服务器
const isLocalServer = computed(() => {
  return props.isLocalServer || false;
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
:deep(.el-select__wrapper) {
  width: 100%;
}
.server-setting-form {
  padding: 20px 0;
}

.setting-section {
  max-width: 600px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 6px;
}

.help-icon {
  font-size: 14px;
  color: #909399;
  cursor: help;
  transition: color 0.3s;
}

.help-icon:hover {
  color: #409eff;
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

:deep(.el-tooltip__trigger) {
  display: inline-flex;
  align-items: center;
}
</style>
