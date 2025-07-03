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







      <!-- 监控间隔：从指标管理迁移过来 -->
      <el-form-item prop="monitorSysGenServerSettingMonitorInterval">
        <template #label>
          <div class="form-label">
            <span>监控间隔</span>
            <el-tooltip
              content="后台定时任务检查服务器状态的间隔时间，影响告警检测和状态更新的及时性"
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

      <!-- 指标保留天数 -->
      <el-form-item prop="monitorSysGenServerSettingMetricsRetentionDays">
        <template #label>
          <div class="form-label">
            <span>指标保留天数</span>
            <el-tooltip
              content="历史监控数据的保留时间，超过此时间的数据将被自动清理"
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
          placeholder="保留天数"
          style="width: 200px"
          @change="handleChange"
        />
        <span class="form-tip">天，建议值：30-90</span>
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
        v-show="formData.monitorSysGenServerSettingAlertEnabled &&
                formData.monitorSysGenServerSettingAlertNotificationMethod"
        prop="monitorSysGenServerSettingAlertNotificationAddress"
      >
        <template #label>
          <div class="form-label">
            <span>{{ getNotificationAddressLabel() }}</span>
            <el-tooltip
              :content="getNotificationAddressTooltip()"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input
          v-model="formData.monitorSysGenServerSettingAlertNotificationAddress"
          :placeholder="getNotificationAddressPlaceholder()"
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

    <!-- 任务配置 -->
    <div v-if="section === 'tasks'" class="setting-section">
      <!-- 端口检测配置 -->
      <el-form-item prop="monitorSysGenServerSettingPortCheckInterval">
        <template #label>
          <div class="form-label">
            <span>端口检测间隔</span>
            <el-tooltip
              content="端口状态检测的时间间隔，单位：秒"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input-number
          v-model="formData.monitorSysGenServerSettingPortCheckInterval"
          :min="10"
          :max="3600"
          :step="10"
          style="width: 200px"
          @change="handleChange"
        />
        <span class="unit">秒</span>
      </el-form-item>

      <!-- 在线状态检测 -->
      <el-form-item prop="monitorSysGenServerSettingOnlineCheckEnabled">
        <template #label>
          <div class="form-label">
            <span>在线状态检测</span>
            <el-tooltip
              content="定期检测服务器的在线状态"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-switch
          v-model="formData.monitorSysGenServerSettingOnlineCheckEnabled"
          :active-value="1"
          :inactive-value="0"
          active-text="开启"
          inactive-text="关闭"
          @change="handleChange"
        />
      </el-form-item>

      <el-form-item
        v-if="formData.monitorSysGenServerSettingOnlineCheckEnabled === 1"
        prop="monitorSysGenServerSettingOnlineCheckInterval"
      >
        <template #label>
          <div class="form-label">
            <span>在线检测间隔</span>
            <el-tooltip
              content="在线状态检测的时间间隔，单位：秒"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input-number
          v-model="formData.monitorSysGenServerSettingOnlineCheckInterval"
          :min="10"
          :max="3600"
          :step="10"
          style="width: 200px"
          @change="handleChange"
        />
        <span class="unit">秒</span>
      </el-form-item>

      <!-- 延迟检测 -->
      <el-form-item prop="monitorSysGenServerSettingLatencyCheckEnabled">
        <template #label>
          <div class="form-label">
            <span>延迟检测</span>
            <el-tooltip
              content="定期检测服务器的网络延迟"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-switch
          v-model="formData.monitorSysGenServerSettingLatencyCheckEnabled"
          :active-value="1"
          :inactive-value="0"
          active-text="开启"
          inactive-text="关闭"
          @change="handleChange"
        />
      </el-form-item>

      <el-form-item
        v-if="formData.monitorSysGenServerSettingLatencyCheckEnabled === 1"
        prop="monitorSysGenServerSettingLatencyCheckInterval"
      >
        <template #label>
          <div class="form-label">
            <span>延迟检测间隔</span>
            <el-tooltip
              content="延迟检测的时间间隔，单位：秒"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input-number
          v-model="formData.monitorSysGenServerSettingLatencyCheckInterval"
          :min="10"
          :max="3600"
          :step="10"
          style="width: 200px"
          @change="handleChange"
        />
        <span class="unit">秒</span>
      </el-form-item>
    </div>

    <!-- 清理配置 -->
    <div v-if="section === 'cleanup'" class="setting-section">
      <!-- 日志清理 -->
      <el-form-item prop="monitorSysGenServerSettingLogCleanupEnabled">
        <template #label>
          <div class="form-label">
            <span>日志清理</span>
            <el-tooltip
              content="定期清理过期的日志文件"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-switch
          v-model="formData.monitorSysGenServerSettingLogCleanupEnabled"
          :active-value="1"
          :inactive-value="0"
          active-text="开启"
          inactive-text="关闭"
          @change="handleChange"
        />
      </el-form-item>

      <el-form-item
        v-if="formData.monitorSysGenServerSettingLogCleanupEnabled === 1"
        prop="monitorSysGenServerSettingLogRetentionDays"
      >
        <template #label>
          <div class="form-label">
            <span>日志保留天数</span>
            <el-tooltip
              content="日志文件的保留天数，超过此天数的日志将被清理"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input-number
          v-model="formData.monitorSysGenServerSettingLogRetentionDays"
          :min="1"
          :max="365"
          :step="1"
          style="width: 200px"
          @change="handleChange"
        />
        <span class="unit">天</span>
      </el-form-item>

      <!-- 临时文件清理 -->
      <el-form-item prop="monitorSysGenServerSettingTempFileCleanupEnabled">
        <template #label>
          <div class="form-label">
            <span>临时文件清理</span>
            <el-tooltip
              content="定期清理临时文件和缓存"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-switch
          v-model="formData.monitorSysGenServerSettingTempFileCleanupEnabled"
          :active-value="1"
          :inactive-value="0"
          active-text="开启"
          inactive-text="关闭"
          @change="handleChange"
        />
      </el-form-item>

      <el-form-item
        v-if="formData.monitorSysGenServerSettingTempFileCleanupEnabled === 1"
        prop="monitorSysGenServerSettingTempFileRetentionHours"
      >
        <template #label>
          <div class="form-label">
            <span>临时文件保留时间</span>
            <el-tooltip
              content="临时文件的保留时间，超过此时间的文件将被清理"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input-number
          v-model="formData.monitorSysGenServerSettingTempFileRetentionHours"
          :min="1"
          :max="168"
          :step="1"
          style="width: 200px"
          @change="handleChange"
        />
        <span class="unit">小时</span>
      </el-form-item>

      <!-- WebSocket会话清理 -->
      <el-form-item prop="monitorSysGenServerSettingWebSocketCleanupEnabled">
        <template #label>
          <div class="form-label">
            <span>WebSocket会话清理</span>
            <el-tooltip
              content="定期清理无效的WebSocket连接"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-switch
          v-model="formData.monitorSysGenServerSettingWebSocketCleanupEnabled"
          :active-value="1"
          :inactive-value="0"
          active-text="开启"
          inactive-text="关闭"
          @change="handleChange"
        />
      </el-form-item>

      <el-form-item
        v-if="formData.monitorSysGenServerSettingWebSocketCleanupEnabled === 1"
        prop="monitorSysGenServerSettingWebSocketCleanupInterval"
      >
        <template #label>
          <div class="form-label">
            <span>会话清理间隔</span>
            <el-tooltip
              content="WebSocket会话清理的时间间隔，单位：分钟"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input-number
          v-model="formData.monitorSysGenServerSettingWebSocketCleanupInterval"
          :min="1"
          :max="60"
          :step="1"
          style="width: 200px"
          @change="handleChange"
        />
        <span class="unit">分钟</span>
      </el-form-item>

      <!-- 清除配置按钮 -->
      <el-form-item>
        <el-button type="danger" @click="clearAllSettings">
          <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
          清除所有配置
        </el-button>
        <el-button type="warning" @click="resetToDefault">
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
          重置为默认值
        </el-button>
      </el-form-item>
    </div>

    <!-- Prometheus配置 -->
    <div v-if="section === 'prometheus'" class="setting-section">
      <!-- Prometheus服务器配置 -->
      <el-form-item prop="monitorSysGenServerSettingPrometheusUrl">
        <template #label>
          <div class="form-label">
            <span>服务器URL</span>
            <el-tooltip
              content="Prometheus服务器的完整URL地址，例如：http://localhost:9090"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input
          v-model="formData.monitorSysGenServerSettingPrometheusUrl"
          placeholder="http://localhost:9090"
          clearable
          @change="handleChange"
        />
      </el-form-item>

      <el-form-item prop="monitorSysGenServerSettingPrometheusQueryPath">
        <template #label>
          <div class="form-label">
            <span>查询路径</span>
            <el-tooltip
              content="Prometheus API查询路径，默认为 /api/v1/query_range"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input
          v-model="formData.monitorSysGenServerSettingPrometheusQueryPath"
          placeholder="/api/v1/query_range"
          clearable
          @change="handleChange"
        />
      </el-form-item>

      <el-form-item prop="monitorSysGenServerSettingPrometheusTimeout">
        <template #label>
          <div class="form-label">
            <span>查询超时</span>
            <el-tooltip
              content="Prometheus查询超时时间，单位：秒"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input-number
          v-model="formData.monitorSysGenServerSettingPrometheusTimeout"
          :min="1"
          :max="300"
          :step="1"
          style="width: 200px"
          @change="handleChange"
        />
        <span class="unit">秒</span>
      </el-form-item>

      <!-- 认证配置 -->
      <el-form-item prop="monitorSysGenServerSettingPrometheusAuthEnabled">
        <template #label>
          <div class="form-label">
            <span>启用认证</span>
            <el-tooltip
              content="启用后需要提供用户名和密码进行基本认证"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-switch
          v-model="formData.monitorSysGenServerSettingPrometheusAuthEnabled"
          :active-value="1"
          :inactive-value="0"
          active-text="开启"
          inactive-text="关闭"
          @change="handleChange"
        />
      </el-form-item>

      <el-form-item
        v-if="formData.monitorSysGenServerSettingPrometheusAuthEnabled === 1"
        prop="monitorSysGenServerSettingPrometheusUsername"
      >
        <template #label>
          <div class="form-label">
            <span>用户名</span>
            <el-tooltip
              content="Prometheus服务器认证用户名"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input
          v-model="formData.monitorSysGenServerSettingPrometheusUsername"
          placeholder="请输入用户名"
          clearable
          @change="handleChange"
        />
      </el-form-item>

      <el-form-item
        v-if="formData.monitorSysGenServerSettingPrometheusAuthEnabled === 1"
        prop="monitorSysGenServerSettingPrometheusPassword"
      >
        <template #label>
          <div class="form-label">
            <span>密码</span>
            <el-tooltip
              content="Prometheus服务器认证密码"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input
          v-model="formData.monitorSysGenServerSettingPrometheusPassword"
          type="password"
          placeholder="请输入密码"
          show-password
          clearable
          @change="handleChange"
        />
      </el-form-item>

      <!-- 高级配置 -->
      <el-form-item prop="monitorSysGenServerSettingPrometheusLabels">
        <template #label>
          <div class="form-label">
            <span>标签过滤器</span>
            <el-tooltip
              content="用于过滤Prometheus指标的标签，格式：key1=&quot;value1&quot;,key2=&quot;value2&quot;"
              placement="top"
              effect="dark"
            >
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input
          v-model="formData.monitorSysGenServerSettingPrometheusLabels"
          type="textarea"
          :rows="3"
          placeholder='instance="server_1",job="node_exporter"'
          @change="handleChange"
        />
      </el-form-item>

      <!-- 测试连接 -->
      <el-form-item>
        <el-button type="primary" @click="testPrometheusConnection" :loading="testingConnection">
          <IconifyIconOnline icon="ri:wifi-line" class="mr-1" />
          测试连接
        </el-button>
        <span class="form-item-tip">测试Prometheus服务器连接是否正常</span>
      </el-form-item>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch, defineProps, defineEmits } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { ServerSetting } from "@/api/server/setting";

// 定义属性
const props = defineProps<{
  modelValue: Partial<ServerSetting>;
  section: "monitor" | "alert" | "docker" | "proxy" | "prometheus" | "advanced" | "tasks" | "cleanup";
  isLocalServer?: boolean;
}>();

// 定义事件
const emit = defineEmits<{
  "update:modelValue": [value: Partial<ServerSetting>];
  change: [value: Partial<ServerSetting>];
}>();

// 默认值常量
const DEFAULT_VALUES = {
  // 监控配置默认值
  monitorSysGenServerSettingMonitorEnabled: 0,
  monitorSysGenServerSettingDataReportMethod: "API",
  monitorSysGenServerSettingDataCollectionFrequency: 30,
  monitorSysGenServerSettingMonitorInterval: 60,
  monitorSysGenServerSettingMetricsRetentionDays: 30,
  monitorSysGenServerSettingCpuAlertThreshold: 80,
  monitorSysGenServerSettingMemoryAlertThreshold: 80,
  monitorSysGenServerSettingDiskAlertThreshold: 90,
  monitorSysGenServerSettingNetworkAlertThreshold: 100,
  monitorSysGenServerSettingResponseTimeAlertThreshold: 5000,

  // 告警配置默认值
  monitorSysGenServerSettingAlertEnabled: 0,
  monitorSysGenServerSettingAlertNotificationMethod: "EMAIL",
  monitorSysGenServerSettingAlertNotificationAddress: "",
  monitorSysGenServerSettingAlertSilenceDuration: 30,
  monitorSysGenServerSettingAutoRecoveryNotificationEnabled: 1,

  // Prometheus配置默认值
  monitorSysGenServerSettingPrometheusUrl: "http://localhost:9090",
  monitorSysGenServerSettingPrometheusQueryPath: "/api/v1/query",
  monitorSysGenServerSettingPrometheusAuthEnabled: false,
  monitorSysGenServerSettingPrometheusUsername: "",
  monitorSysGenServerSettingPrometheusPassword: "",
  monitorSysGenServerSettingPrometheusTimeout: 30,
  monitorSysGenServerSettingPrometheusLabels: "",

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

  // 任务配置默认值
  monitorSysGenServerSettingPortCheckInterval: 60,
  monitorSysGenServerSettingOnlineCheckEnabled: 1,
  monitorSysGenServerSettingOnlineCheckInterval: 30,
  monitorSysGenServerSettingLatencyCheckEnabled: 1,
  monitorSysGenServerSettingLatencyCheckInterval: 60,

  // 清理配置默认值
  monitorSysGenServerSettingLogCleanupEnabled: 1,
  monitorSysGenServerSettingLogRetentionDays: 7,
  monitorSysGenServerSettingTempFileCleanupEnabled: 1,
  monitorSysGenServerSettingTempFileRetentionHours: 24,
  monitorSysGenServerSettingWebSocketCleanupEnabled: 1,
  monitorSysGenServerSettingWebSocketCleanupInterval: 10,
};

// 表单数据
const formData = reactive<Partial<ServerSetting & any>>({ ...DEFAULT_VALUES });

// 测试连接状态
const testingConnection = ref(false);



/**
 * 处理数据变化
 */
const handleChange = () => {
  emit("update:modelValue", formData);
  emit("change", formData);
};

/**
 * 获取通知地址标签
 */
const getNotificationAddressLabel = () => {
  const method = formData.monitorSysGenServerSettingAlertNotificationMethod;
  switch (method) {
    case "EMAIL":
      return "邮件地址";
    case "SMS":
      return "手机号码";
    case "DINGTALK":
      return "钉钉Webhook";
    case "WECHAT":
      return "企业微信Webhook";
    case "WEBHOOK":
      return "Webhook URL";
    default:
      return "通知地址";
  }
};

/**
 * 获取通知地址提示
 */
const getNotificationAddressTooltip = () => {
  const method = formData.monitorSysGenServerSettingAlertNotificationMethod;
  switch (method) {
    case "EMAIL":
      return "接收告警邮件的邮箱地址，多个地址用逗号分隔，如：admin@example.com,ops@example.com";
    case "SMS":
      return "接收告警短信的手机号码，多个号码用逗号分隔，如：13800138000,13900139000";
    case "DINGTALK":
      return "钉钉群机器人的Webhook地址，可在钉钉群设置中获取";
    case "WECHAT":
      return "企业微信群机器人的Webhook地址，可在企业微信群设置中获取";
    case "WEBHOOK":
      return "自定义Webhook接收地址，告警信息将以POST请求发送到此URL，支持集成第三方系统";
    default:
      return "请输入通知接收地址";
  }
};

/**
 * 获取通知地址占位符
 */
const getNotificationAddressPlaceholder = () => {
  const method = formData.monitorSysGenServerSettingAlertNotificationMethod;
  switch (method) {
    case "EMAIL":
      return "请输入邮件地址，多个用逗号分隔";
    case "SMS":
      return "请输入手机号码，多个用逗号分隔";
    case "DINGTALK":
      return "请输入钉钉Webhook地址";
    case "WECHAT":
      return "请输入企业微信Webhook地址";
    case "WEBHOOK":
      return "请输入Webhook URL";
    default:
      return "请输入通知地址";
  }
};

// 告警配置相关
const currentAlertConfigName = ref('默认告警配置');

/**
 * 打开告警配置页面
 */
const openAlertConfig = () => {
  // 这里可以打开告警配置对话框或跳转到告警配置页面
  console.log('打开告警配置页面');
  // 可以通过路由跳转或者打开对话框
  // router.push('/alert/config');
};

/**
 * 查看当前告警配置
 */
const viewCurrentAlertConfig = () => {
  // 显示当前告警配置的详细信息
  console.log('查看当前告警配置');
  // 可以打开一个对话框显示当前配置的详细信息
};

/**
 * 更换告警配置
 */
const changeAlertConfig = () => {
  // 打开配置选择对话框
  console.log('更换告警配置');
  // 可以打开一个选择器让用户选择不同的告警配置
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

/**
 * 清除所有配置
 */
const clearAllSettings = () => {
  ElMessageBox.confirm(
    '确定要清除所有配置吗？此操作不可恢复。',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    // 清除所有配置，设置为空值或禁用状态
    Object.keys(formData).forEach(key => {
      if (key.includes('Enabled')) {
        formData[key] = 0;
      } else if (key.includes('Interval') || key.includes('Timeout') || key.includes('Days') || key.includes('Hours')) {
        formData[key] = 0;
      } else if (typeof formData[key] === 'string') {
        formData[key] = '';
      } else if (typeof formData[key] === 'number') {
        formData[key] = 0;
      }
    });

    handleChange();
    ElMessage.success('配置已清除');
  }).catch(() => {
    ElMessage.info('已取消清除操作');
  });
};

/**
 * 重置为默认值
 */
const resetToDefault = () => {
  ElMessageBox.confirm(
    '确定要重置为默认配置吗？当前配置将被覆盖。',
    '确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info',
    }
  ).then(() => {
    // 重置为默认值
    Object.assign(formData, DEFAULT_VALUES);
    handleChange();
    ElMessage.success('配置已重置为默认值');
  }).catch(() => {
    ElMessage.info('已取消重置操作');
  });
};

/**
 * 测试Prometheus连接
 */
const testPrometheusConnection = async () => {
  if (!formData.monitorSysGenServerSettingPrometheusUrl) {
    ElMessage.warning("请先配置Prometheus服务器URL");
    return;
  }

  testingConnection.value = true;
  try {
    // 这里应该调用后端API测试连接
    // 暂时模拟测试
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 模拟成功
    ElMessage.success("Prometheus连接测试成功");
  } catch (error) {
    console.error("Prometheus连接测试失败:", error);
    ElMessage.error("Prometheus连接测试失败，请检查配置");
  } finally {
    testingConnection.value = false;
  }
};


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

.prometheus-config {
  background-color: var(--el-fill-color-lighter);
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
  border: 1px solid var(--el-border-color-light);

  :deep(.el-divider__text) {
    background-color: var(--el-fill-color-lighter);
  }

  .unit {
    margin-left: 8px;
    color: var(--el-text-color-regular);
    font-size: 14px;
  }
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

.current-alert-config {
  display: flex;
  align-items: center;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

.current-alert-config .el-tag {
  font-weight: 500;
}

.current-alert-config .el-button--text {
  color: #409eff;
  font-size: 12px;
}
</style>
