<template>
  <div class="server-setting-form">
    <!-- 监控配置 -->
    <div v-if="section === 'monitor'" class="setting-section">
      <el-form-item prop="monitorSysGenServerSettingMonitorEnabled">
        <template #label>
          <div class="form-label">
            <span>启用监控</span>
            <el-tooltip content="开启后将定期收集服务器的CPU、内存、磁盘、网络等性能指标数据，用于监控服务器运行状态" placement="top" effect="dark">
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-switch v-model="formData.monitorSysGenServerSettingMonitorEnabled" :active-value="1" :inactive-value="0" active-text="开启" inactive-text="关闭" @change="handleChange" />
      </el-form-item>

      <!-- 监控间隔：从指标管理迁移过来 -->
      <el-form-item prop="monitorSysGenServerSettingMonitorInterval">
        <template #label>
          <div class="form-label">
            <span>监控间隔</span>
            <el-tooltip content="后台定时任务检查服务器状态的间隔时间，影响告警检测和状态更新的及时性" placement="top" effect="dark">
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input-number v-model="formData.monitorSysGenServerSettingMonitorInterval" :min="30" :max="3600" :step="30" placeholder="监控间隔(秒)" style="width: 200px" @change="handleChange" />
        <span class="form-tip">秒，建议值：60-300</span>
      </el-form-item>

      <!-- 数据上报方式 -->
      <el-form-item prop="monitorSysGenServerSettingDataReportMethod">
        <template #label>
          <div class="form-label">
            <span>数据上报方式</span>
            <el-tooltip content="选择监控数据的上报方式：NONE-不上报，API-通过API上报，PROMETHEUS-通过Prometheus上报" placement="top" effect="dark">
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-select v-model="formData.monitorSysGenServerSettingDataReportMethod" placeholder="请选择上报方式" style="width: 200px" @change="handleChange">
          <el-option label="不上报" value="NONE" />
          <el-option label="API上报" value="API" />
          <el-option label="本地上报" value="LOCAL" />
          <el-option label="Prometheus" value="PROMETHEUS" />
        </el-select>
        <span class="form-tip">选择合适的数据上报方式</span>
      </el-form-item>

      <!-- 指标保留天数 -->
      <el-form-item prop="monitorSysGenServerSettingMetricsRetentionDays">
        <template #label>
          <div class="form-label">
            <span>指标保留天数</span>
            <el-tooltip content="历史监控数据的保留时间，超过此时间的数据将被自动清理" placement="top" effect="dark">
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input-number v-model="formData.monitorSysGenServerSettingMetricsRetentionDays" :min="1" :max="365" :step="1" placeholder="保留天数" style="width: 200px" @change="handleChange" />
        <span class="form-tip">天，建议值：30-90</span>
      </el-form-item>

      <!-- Prometheus配置 - 当选择Prometheus上报方式时显示 -->
      <div v-if="formData.monitorSysGenServerSettingDataReportMethod === 'PROMETHEUS'" class="prometheus-basic-config">
        <el-form-item prop="monitorSysGenServerSettingPrometheusHost">
          <template #label>
            <div class="form-label">
              <span>Prometheus主机</span>
              <el-tooltip content="Prometheus服务器的主机地址，例如：localhost 或 192.168.1.100" placement="top" effect="dark">
                <IconifyIconOnline icon="ri:question-line" class="help-icon" />
              </el-tooltip>
            </div>
          </template>
          <el-input v-model="formData.monitorSysGenServerSettingPrometheusHost" placeholder="localhost" clearable style="width: 200px" @change="handleChange" />
          <span class="form-tip">Prometheus服务器地址</span>
        </el-form-item>

        <el-form-item prop="monitorSysGenServerSettingPrometheusPort">
          <template #label>
            <div class="form-label">
              <span>Prometheus端口</span>
              <el-tooltip content="Prometheus服务器的端口号，默认为9090" placement="top" effect="dark">
                <IconifyIconOnline icon="ri:question-line" class="help-icon" />
              </el-tooltip>
            </div>
          </template>
          <el-input-number v-model="formData.monitorSysGenServerSettingPrometheusPort" :min="1" :max="65535" :step="1" placeholder="9090" style="width: 200px" @change="handleChange" />
          <span class="form-tip">端口号，默认9090</span>
        </el-form-item>
      </div>
    </div>

    <!-- 告警配置 -->
    <div v-if="section === 'alert'" class="setting-section">
      <el-form-item prop="monitorSysGenServerSettingAlertEnabled">
        <template #label>
          <div class="form-label">
            <span>启用告警</span>
            <el-tooltip content="开启后当监控指标超过设定阈值时将自动发送告警通知，支持多种通知方式" placement="top" effect="dark">
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-switch v-model="formData.monitorSysGenServerSettingAlertEnabled" :active-value="1" :inactive-value="0" active-text="开启" inactive-text="关闭" @change="handleChange" />
      </el-form-item>

      <el-form-item v-show="formData.monitorSysGenServerSettingAlertEnabled" prop="monitorSysGenServerSettingAlertNotificationMethod">
        <template #label>
          <div class="form-label">
            <span>告警方式</span>
            <el-tooltip content="选择告警通知的发送方式，支持邮件、短信、钉钉、企业微信和自定义Webhook" placement="top" effect="dark">
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-select v-model="formData.monitorSysGenServerSettingAlertNotificationMethod" placeholder="请选择告警方式" style="width: 200px !important" class="min-w-[200px]" @change="handleChange">
          <el-option label="邮件" value="EMAIL" />
          <el-option label="短信" value="SMS" />
          <el-option label="钉钉" value="DINGTALK" />
          <el-option label="企业微信" value="WECHAT" />
          <el-option label="网页推送" value="WEB_PUSH" />
          <el-option label="Webhook" value="WEBHOOK" />
        </el-select>
      </el-form-item>

      <el-form-item v-show="formData.monitorSysGenServerSettingAlertEnabled && formData.monitorSysGenServerSettingAlertNotificationMethod" prop="monitorSysGenServerSettingAlertNotificationAddress">
        <template #label>
          <div class="form-label">
            <span>{{ getNotificationAddressLabel() }}</span>
            <el-tooltip :content="getNotificationAddressTooltip()" placement="top" effect="dark">
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input v-model="formData.monitorSysGenServerSettingAlertNotificationAddress" :placeholder="getNotificationAddressPlaceholder()" maxlength="500" @change="handleChange" />
      </el-form-item>

      <!-- 告警阈值配置 -->
      <template v-if="formData.monitorSysGenServerSettingAlertEnabled">
        <el-divider content-position="left">
          <span class="divider-text">告警阈值配置</span>
        </el-divider>

        <el-row :gutter="16">
          <el-col :span="24">
            <el-form-item prop="monitorSysGenServerSettingCpuAlertThreshold">
              <template #label>
                <div class="form-label">
                  <span>CPU使用率阈值</span>
                  <el-tooltip content="当CPU使用率超过此阈值时触发告警，建议设置为70-85%" placement="top" effect="dark">
                    <IconifyIconOnline icon="ri:question-line" class="help-icon" />
                  </el-tooltip>
                </div>
              </template>
              <el-input-number
                v-model="formData.monitorSysGenServerSettingCpuAlertThreshold"
                :min="1"
                :max="100"
                :precision="1"
                :step="5"
                placeholder="CPU阈值"
                style="width: 100%"
                @change="handleChange"
              />
              <span class="form-tip">%，建议值：80</span>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item prop="monitorSysGenServerSettingMemoryAlertThreshold">
              <template #label>
                <div class="form-label">
                  <span>内存使用率阈值</span>
                  <el-tooltip content="当内存使用率超过此阈值时触发告警，建议设置为75-90%" placement="top" effect="dark">
                    <IconifyIconOnline icon="ri:question-line" class="help-icon" />
                  </el-tooltip>
                </div>
              </template>
              <el-input-number
                v-model="formData.monitorSysGenServerSettingMemoryAlertThreshold"
                :min="1"
                :max="100"
                :precision="1"
                :step="5"
                placeholder="内存阈值"
                style="width: 100%"
                @change="handleChange"
              />
              <span class="form-tip">%，建议值：85</span>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="24">
            <el-form-item prop="monitorSysGenServerSettingDiskAlertThreshold">
              <template #label>
                <div class="form-label">
                  <span>磁盘使用率阈值</span>
                  <el-tooltip content="当磁盘使用率超过此阈值时触发告警，建议设置为80-95%" placement="top" effect="dark">
                    <IconifyIconOnline icon="ri:question-line" class="help-icon" />
                  </el-tooltip>
                </div>
              </template>
              <el-input-number
                v-model="formData.monitorSysGenServerSettingDiskAlertThreshold"
                :min="1"
                :max="100"
                :precision="1"
                :step="5"
                placeholder="磁盘阈值"
                style="width: 100%"
                @change="handleChange"
              />
              <span class="form-tip">%，建议值：90</span>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item prop="monitorSysGenServerSettingNetworkAlertThreshold">
              <template #label>
                <div class="form-label">
                  <span>网络流量阈值</span>
                  <el-tooltip content="当网络流量超过此阈值时触发告警，单位为Mbps" placement="top" effect="dark">
                    <IconifyIconOnline icon="ri:question-line" class="help-icon" />
                  </el-tooltip>
                </div>
              </template>
              <el-input-number
                v-model="formData.monitorSysGenServerSettingNetworkAlertThreshold"
                :min="1"
                :max="10000"
                :precision="1"
                :step="10"
                placeholder="网络阈值"
                style="width: 100%"
                @change="handleChange"
              />
              <span class="form-tip">Mbps，建议值：100</span>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item prop="monitorSysGenServerSettingResponseTimeAlertThreshold">
          <template #label>
            <div class="form-label">
              <span>响应时间阈值</span>
              <el-tooltip content="当服务器响应时间超过此阈值时触发告警，单位为毫秒" placement="top" effect="dark">
                <IconifyIconOnline icon="ri:question-line" class="help-icon" />
              </el-tooltip>
            </div>
          </template>
          <el-input-number
            v-model="formData.monitorSysGenServerSettingResponseTimeAlertThreshold"
            :min="100"
            :max="60000"
            :step="100"
            placeholder="响应时间阈值"
            style="width: 200px"
            @change="handleChange"
          />
          <span class="form-tip">毫秒，建议值：5000</span>
        </el-form-item>

        <el-divider content-position="left">
          <span class="divider-text">通知配置</span>
        </el-divider>
      </template>

      <el-form-item v-show="formData.monitorSysGenServerSettingAlertEnabled" prop="monitorSysGenServerSettingAlertSilenceDuration">
        <template #label>
          <div class="form-label">
            <span>告警静默时间</span>
            <el-tooltip content="同一类型告警在此时间内不会重复发送，避免告警轰炸，建议15-60分钟" placement="top" effect="dark">
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input-number v-model="formData.monitorSysGenServerSettingAlertSilenceDuration" :min="5" :max="1440" :step="5" placeholder="静默时间(分钟)" style="width: 200px" @change="handleChange" />
        <span class="form-tip">分钟，建议值：15-60</span>
      </el-form-item>

      <el-form-item v-show="formData.monitorSysGenServerSettingAlertEnabled" prop="monitorSysGenServerSettingAutoRecoveryNotificationEnabled">
        <template #label>
          <div class="form-label">
            <span>自动恢复通知</span>
            <el-tooltip content="当告警状态恢复正常时是否发送恢复通知，帮助及时了解问题解决情况" placement="top" effect="dark">
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-switch v-model="formData.monitorSysGenServerSettingAutoRecoveryNotificationEnabled" :active-value="1" :inactive-value="0" active-text="开启" inactive-text="关闭" @change="handleChange" />
      </el-form-item>
    </div>

    <!-- Docker配置 -->
    <div v-if="section === 'docker'" class="setting-section">
      <el-form-item prop="monitorSysGenServerSettingDockerEnabled">
        <template #label>
          <div class="form-label">
            <span>支持Docker</span>
            <el-tooltip content="标识服务器是否安装了Docker，开启后可以监控Docker容器和镜像信息" placement="top" effect="dark">
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-switch v-model="formData.monitorSysGenServerSettingDockerEnabled" :active-value="1" :inactive-value="0" active-text="支持" inactive-text="不支持" @change="handleChange" />
      </el-form-item>

      <el-form-item v-show="formData.monitorSysGenServerSettingDockerEnabled" prop="monitorSysGenServerSettingDockerMonitorEnabled">
        <template #label>
          <div class="form-label">
            <span>启用Docker监控</span>
            <el-tooltip content="开启后将监控Docker容器的运行状态、资源使用情况和容器日志" placement="top" effect="dark">
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-switch v-model="formData.monitorSysGenServerSettingDockerMonitorEnabled" :active-value="1" :inactive-value="0" active-text="开启" inactive-text="关闭" @change="handleChange" />
      </el-form-item>

      <el-form-item v-show="formData.monitorSysGenServerSettingDockerEnabled" prop="monitorSysGenServerSettingDockerConnectionType">
        <template #label>
          <div class="form-label">
            <span>连接方式</span>
            <el-tooltip content="选择连接Docker的方式：Shell命令行方式或Docker API方式" placement="top" effect="dark">
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-select v-model="formData.monitorSysGenServerSettingDockerConnectionType" placeholder="请选择连接方式" style="width: 200px !important" @change="handleChange">
          <el-option label="Shell命令" value="SHELL" />
          <el-option label="Docker API" value="API" />
        </el-select>
      </el-form-item>

      <el-form-item v-show="formData.monitorSysGenServerSettingDockerEnabled && formData.monitorSysGenServerSettingDockerConnectionType === 'API'" prop="monitorSysGenServerSettingDockerApiUrl">
        <template #label>
          <div class="form-label">
            <span>Docker API地址</span>
            <el-tooltip content="Docker API的访问地址，如：unix:///var/run/docker.sock 或 tcp://localhost:2376" placement="top" effect="dark">
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input v-model="formData.monitorSysGenServerSettingDockerApiUrl" placeholder="如：unix:///var/run/docker.sock" maxlength="200" @change="handleChange" />
      </el-form-item>

      <el-form-item v-show="formData.monitorSysGenServerSettingDockerEnabled && formData.monitorSysGenServerSettingDockerConnectionType === 'API'" prop="monitorSysGenServerSettingDockerApiVersion">
        <template #label>
          <div class="form-label">
            <span>API版本</span>
            <el-tooltip content="Docker API的版本号，如：1.40、1.41等，可通过 docker version 命令查看" placement="top" effect="dark">
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input v-model="formData.monitorSysGenServerSettingDockerApiVersion" placeholder="如：1.40" maxlength="50" @change="handleChange" />
      </el-form-item>

      <el-form-item v-show="formData.monitorSysGenServerSettingDockerEnabled && formData.monitorSysGenServerSettingDockerConnectionType === 'API'" prop="monitorSysGenServerSettingDockerTlsEnabled">
        <template #label>
          <div class="form-label">
            <span>启用TLS</span>
            <el-tooltip content="是否启用TLS加密连接Docker API，提高连接安全性" placement="top" effect="dark">
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-switch v-model="formData.monitorSysGenServerSettingDockerTlsEnabled" :active-value="1" :inactive-value="0" active-text="开启" inactive-text="关闭" @change="handleChange" />
      </el-form-item>
    </div>

    <!-- 代理配置 -->
    <div v-if="section === 'proxy'" class="setting-section">
      <el-form-item prop="monitorSysGenServerSettingProxyEnabled">
        <template #label>
          <div class="form-label">
            <span>启用代理</span>
            <el-tooltip content="通过代理服务器连接目标服务器，适用于网络隔离或需要跳板机的环境" placement="top" effect="dark">
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-switch v-model="formData.monitorSysGenServerSettingProxyEnabled" :active-value="1" :inactive-value="0" active-text="开启" inactive-text="关闭" @change="handleChange" />
      </el-form-item>

      <el-form-item v-show="formData.monitorSysGenServerSettingProxyEnabled" prop="monitorSysGenServerSettingProxyType">
        <template #label>
          <div class="form-label">
            <span>代理类型</span>
            <el-tooltip content="选择代理协议类型：HTTP代理适用于Web流量，SOCKS5代理支持更多协议，Guacamole用于远程桌面" placement="top" effect="dark">
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-select v-model="formData.monitorSysGenServerSettingProxyType" placeholder="请选择代理类型" style="width: 200px !important" @change="handleChange">
          <el-option label="HTTP代理" value="HTTP" />
          <el-option label="SOCKS5代理" value="SOCKS5" />
          <el-option label="Guacamole代理" value="GUACAMOLE" />
        </el-select>
      </el-form-item>

      <el-form-item v-show="formData.monitorSysGenServerSettingProxyEnabled" prop="monitorSysGenServerSettingProxyHost">
        <template #label>
          <div class="form-label">
            <span>代理主机</span>
            <el-tooltip content="代理服务器的IP地址或域名，如：192.168.1.100 或 proxy.example.com" placement="top" effect="dark">
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input v-model="formData.monitorSysGenServerSettingProxyHost" placeholder="请输入代理主机地址" maxlength="100" @change="handleChange" />
      </el-form-item>

      <el-form-item v-show="formData.monitorSysGenServerSettingProxyEnabled" prop="monitorSysGenServerSettingProxyPort">
        <template #label>
          <div class="form-label">
            <span>代理端口</span>
            <el-tooltip content="代理服务器的端口号，HTTP代理通常使用8080，SOCKS5代理通常使用1080" placement="top" effect="dark">
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input-number v-model="formData.monitorSysGenServerSettingProxyPort" :min="1" :max="65535" placeholder="代理端口" style="width: 200px" @change="handleChange" />
      </el-form-item>

      <el-form-item v-show="formData.monitorSysGenServerSettingProxyEnabled && formData.monitorSysGenServerSettingProxyType !== 'GUACAMOLE'" prop="monitorSysGenServerSettingProxyUsername">
        <template #label>
          <div class="form-label">
            <span>代理用户名</span>
            <el-tooltip content="代理服务器的认证用户名，如果代理不需要认证可留空" placement="top" effect="dark">
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input v-model="formData.monitorSysGenServerSettingProxyUsername" placeholder="代理用户名(可选)" maxlength="100" @change="handleChange" />
      </el-form-item>

      <el-form-item v-show="formData.monitorSysGenServerSettingProxyEnabled && formData.monitorSysGenServerSettingProxyType !== 'GUACAMOLE'" prop="monitorSysGenServerSettingProxyPassword">
        <template #label>
          <div class="form-label">
            <span>代理密码</span>
            <el-tooltip content="代理服务器的认证密码，如果代理不需要认证可留空" placement="top" effect="dark">
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input v-model="formData.monitorSysGenServerSettingProxyPassword" type="password" placeholder="代理密码(可选)" maxlength="100" show-password @change="handleChange" />
      </el-form-item>
    </div>

    <!-- 高级配置 -->
    <div v-if="section === 'advanced'" class="setting-section">
      <el-form-item prop="monitorSysGenServerSettingLogMonitorEnabled">
        <template #label>
          <div class="form-label">
            <span>日志监控</span>
            <el-tooltip content="开启后将监控指定的系统日志文件，检测异常日志和错误信息" placement="top" effect="dark">
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-switch v-model="formData.monitorSysGenServerSettingLogMonitorEnabled" :active-value="1" :inactive-value="0" active-text="开启" inactive-text="关闭" @change="handleChange" />
      </el-form-item>

      <el-form-item v-show="formData.monitorSysGenServerSettingLogMonitorEnabled" prop="monitorSysGenServerSettingLogFilePaths">
        <template #label>
          <div class="form-label">
            <span>日志文件路径</span>
            <el-tooltip content="需要监控的日志文件路径，支持通配符，多个路径用换行分隔，如：/var/log/nginx/*.log" placement="top" effect="dark">
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
            <el-tooltip content="开启后将监控指定端口的连通性和响应时间" placement="top" effect="dark">
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-switch v-model="formData.monitorSysGenServerSettingPortMonitorEnabled" :active-value="1" :inactive-value="0" active-text="开启" inactive-text="关闭" @change="handleChange" />
      </el-form-item>

      <el-form-item v-show="formData.monitorSysGenServerSettingPortMonitorEnabled" prop="monitorSysGenServerSettingMonitorPorts">
        <template #label>
          <div class="form-label">
            <span>监控端口</span>
            <el-tooltip content="需要监控的端口列表，多个端口用逗号分隔，如：80,443,3306,6379" placement="top" effect="dark">
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input v-model="formData.monitorSysGenServerSettingMonitorPorts" placeholder="请输入监控端口，多个端口用逗号分隔，如：80,443,3306" maxlength="500" @change="handleChange" />
      </el-form-item>

      <el-form-item prop="monitorSysGenServerSettingConnectionTimeout">
        <template #label>
          <div class="form-label">
            <span>连接超时时间</span>
            <el-tooltip content="建立连接的最大等待时间，超过此时间将认为连接失败，建议15-60秒" placement="top" effect="dark">
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input-number v-model="formData.monitorSysGenServerSettingConnectionTimeout" :min="5" :max="300" :step="5" placeholder="连接超时时间(秒)" style="width: 200px" @change="handleChange" />
        <span class="form-tip">秒，建议值：15-60</span>
      </el-form-item>

      <el-form-item prop="monitorSysGenServerSettingReadTimeout">
        <template #label>
          <div class="form-label">
            <span>读取超时时间</span>
            <el-tooltip content="数据读取的最大等待时间，超过此时间将认为读取失败，建议30-120秒" placement="top" effect="dark">
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input-number v-model="formData.monitorSysGenServerSettingReadTimeout" :min="10" :max="600" :step="10" placeholder="读取超时时间(秒)" style="width: 200px" @change="handleChange" />
        <span class="form-tip">秒，建议值：30-120</span>
      </el-form-item>

      <el-form-item prop="monitorSysGenServerSettingPerformanceSuggestionEnabled">
        <template #label>
          <div class="form-label">
            <span>性能优化建议</span>
            <el-tooltip content="开启后系统将根据监控数据分析服务器性能瓶颈并提供优化建议" placement="top" effect="dark">
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-switch v-model="formData.monitorSysGenServerSettingPerformanceSuggestionEnabled" :active-value="1" :inactive-value="0" active-text="开启" inactive-text="关闭" @change="handleChange" />
      </el-form-item>
    </div>

    <!-- 任务配置 -->
    <div v-if="section === 'tasks'" class="setting-section">
      <!-- 端口检测配置 -->
      <el-form-item prop="monitorSysGenServerSettingPortCheckInterval">
        <template #label>
          <div class="form-label">
            <span>端口检测间隔</span>
            <el-tooltip content="端口状态检测的时间间隔，单位：秒" placement="top" effect="dark">
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input-number v-model="formData.monitorSysGenServerSettingPortCheckInterval" :min="10" :max="3600" :step="10" style="width: 200px" @change="handleChange" />
        <span class="unit">秒</span>
      </el-form-item>

      <!-- 在线状态检测 -->
      <el-form-item prop="monitorSysGenServerSettingOnlineCheckEnabled">
        <template #label>
          <div class="form-label">
            <span>在线状态检测</span>
            <el-tooltip content="定期检测服务器的在线状态" placement="top" effect="dark">
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-switch v-model="formData.monitorSysGenServerSettingOnlineCheckEnabled" :active-value="1" :inactive-value="0" active-text="开启" inactive-text="关闭" @change="handleChange" />
      </el-form-item>

      <el-form-item v-if="formData.monitorSysGenServerSettingOnlineCheckEnabled === 1" prop="monitorSysGenServerSettingOnlineCheckInterval">
        <template #label>
          <div class="form-label">
            <span>在线检测间隔</span>
            <el-tooltip content="在线状态检测的时间间隔，单位：秒" placement="top" effect="dark">
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input-number v-model="formData.monitorSysGenServerSettingOnlineCheckInterval" :min="10" :max="3600" :step="10" style="width: 200px" @change="handleChange" />
        <span class="unit">秒</span>
      </el-form-item>

      <!-- 延迟检测 -->
      <el-form-item prop="monitorSysGenServerSettingLatencyCheckEnabled">
        <template #label>
          <div class="form-label">
            <span>延迟检测</span>
            <el-tooltip content="定期检测服务器的网络延迟" placement="top" effect="dark">
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-switch v-model="formData.monitorSysGenServerSettingLatencyCheckEnabled" :active-value="1" :inactive-value="0" active-text="开启" inactive-text="关闭" @change="handleChange" />
      </el-form-item>

      <el-form-item v-if="formData.monitorSysGenServerSettingLatencyCheckEnabled === 1" prop="monitorSysGenServerSettingLatencyCheckInterval">
        <template #label>
          <div class="form-label">
            <span>延迟检测间隔</span>
            <el-tooltip content="延迟检测的时间间隔，单位：秒" placement="top" effect="dark">
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input-number v-model="formData.monitorSysGenServerSettingLatencyCheckInterval" :min="10" :max="3600" :step="10" style="width: 200px" @change="handleChange" />
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
            <el-tooltip content="定期清理过期的日志文件" placement="top" effect="dark">
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-switch v-model="formData.monitorSysGenServerSettingLogCleanupEnabled" :active-value="1" :inactive-value="0" active-text="开启" inactive-text="关闭" @change="handleChange" />
      </el-form-item>

      <el-form-item v-if="formData.monitorSysGenServerSettingLogCleanupEnabled === 1" prop="monitorSysGenServerSettingLogRetentionDays">
        <template #label>
          <div class="form-label">
            <span>日志保留天数</span>
            <el-tooltip content="日志文件的保留天数，超过此天数的日志将被清理" placement="top" effect="dark">
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input-number v-model="formData.monitorSysGenServerSettingLogRetentionDays" :min="1" :max="365" :step="1" style="width: 200px" @change="handleChange" />
        <span class="unit">天</span>
      </el-form-item>

      <!-- 临时文件清理 -->
      <el-form-item prop="monitorSysGenServerSettingTempFileCleanupEnabled">
        <template #label>
          <div class="form-label">
            <span>临时文件清理</span>
            <el-tooltip content="定期清理临时文件和缓存" placement="top" effect="dark">
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-switch v-model="formData.monitorSysGenServerSettingTempFileCleanupEnabled" :active-value="1" :inactive-value="0" active-text="开启" inactive-text="关闭" @change="handleChange" />
      </el-form-item>

      <el-form-item v-if="formData.monitorSysGenServerSettingTempFileCleanupEnabled === 1" prop="monitorSysGenServerSettingTempFileRetentionHours">
        <template #label>
          <div class="form-label">
            <span>临时文件保留时间</span>
            <el-tooltip content="临时文件的保留时间，超过此时间的文件将被清理" placement="top" effect="dark">
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input-number v-model="formData.monitorSysGenServerSettingTempFileRetentionHours" :min="1" :max="168" :step="1" style="width: 200px" @change="handleChange" />
        <span class="unit">小时</span>
      </el-form-item>

      <!-- WebSocket会话清理 -->
      <el-form-item prop="monitorSysGenServerSettingWebSocketCleanupEnabled">
        <template #label>
          <div class="form-label">
            <span>WebSocket会话清理</span>
            <el-tooltip content="定期清理无效的WebSocket连接" placement="top" effect="dark">
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-switch v-model="formData.monitorSysGenServerSettingWebSocketCleanupEnabled" :active-value="1" :inactive-value="0" active-text="开启" inactive-text="关闭" @change="handleChange" />
      </el-form-item>

      <el-form-item v-if="formData.monitorSysGenServerSettingWebSocketCleanupEnabled === 1" prop="monitorSysGenServerSettingWebSocketCleanupInterval">
        <template #label>
          <div class="form-label">
            <span>会话清理间隔</span>
            <el-tooltip content="WebSocket会话清理的时间间隔，单位：分钟" placement="top" effect="dark">
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input-number v-model="formData.monitorSysGenServerSettingWebSocketCleanupInterval" :min="1" :max="60" :step="1" style="width: 200px" @change="handleChange" />
        <span class="unit">分钟</span>
      </el-form-item>

      <!-- 文件上传队列处理 -->
      <el-form-item prop="monitorSysGenServerSettingFileUploadEnabled">
        <template #label>
          <div class="form-label">
            <span>文件上传队列处理</span>
            <el-tooltip content="启用文件上传队列的自动处理功能" placement="top" effect="dark">
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-switch v-model="formData.monitorSysGenServerSettingFileUploadEnabled" :active-value="1" :inactive-value="0" active-text="开启" inactive-text="关闭" @change="handleChange" />
      </el-form-item>

      <el-form-item v-if="formData.monitorSysGenServerSettingFileUploadEnabled === 1" prop="monitorSysGenServerSettingFileUploadInterval">
        <template #label>
          <div class="form-label">
            <span>队列处理间隔</span>
            <el-tooltip content="文件上传队列处理的时间间隔，单位：秒" placement="top" effect="dark">
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input-number v-model="formData.monitorSysGenServerSettingFileUploadInterval" :min="5" :max="300" :step="5" style="width: 200px" @change="handleChange" />
        <span class="unit">秒</span>
      </el-form-item>

      <el-form-item v-if="formData.monitorSysGenServerSettingFileUploadEnabled === 1" prop="monitorSysGenServerSettingFileUploadStatusCheckInterval">
        <template #label>
          <div class="form-label">
            <span>状态检查间隔</span>
            <el-tooltip content="文件上传任务状态检查的时间间隔，单位：秒" placement="top" effect="dark">
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input-number v-model="formData.monitorSysGenServerSettingFileUploadStatusCheckInterval" :min="10" :max="600" :step="10" style="width: 200px" @change="handleChange" />
        <span class="unit">秒</span>
      </el-form-item>

      <el-form-item v-if="formData.monitorSysGenServerSettingFileUploadEnabled === 1" prop="monitorSysGenServerSettingFileUploadCleanupInterval">
        <template #label>
          <div class="form-label">
            <span>临时文件清理间隔</span>
            <el-tooltip content="文件上传临时文件清理的时间间隔，单位：小时" placement="top" effect="dark">
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input-number v-model="formData.monitorSysGenServerSettingFileUploadCleanupInterval" :min="1" :max="24" :step="1" style="width: 200px" @change="handleChange" />
        <span class="unit">小时</span>
      </el-form-item>

      <el-form-item v-if="formData.monitorSysGenServerSettingFileUploadEnabled === 1" prop="monitorSysGenServerSettingFileUploadTimeout">
        <template #label>
          <div class="form-label">
            <span>上传超时时间</span>
            <el-tooltip content="文件上传任务的超时时间，单位：分钟" placement="top" effect="dark">
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input-number v-model="formData.monitorSysGenServerSettingFileUploadTimeout" :min="5" :max="120" :step="5" style="width: 200px" @change="handleChange" />
        <span class="unit">分钟</span>
      </el-form-item>

      <el-form-item v-if="formData.monitorSysGenServerSettingFileUploadEnabled === 1" prop="monitorSysGenServerSettingFileUploadMaxRetries">
        <template #label>
          <div class="form-label">
            <span>最大重试次数</span>
            <el-tooltip content="文件上传失败时的最大重试次数" placement="top" effect="dark">
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input-number v-model="formData.monitorSysGenServerSettingFileUploadMaxRetries" :min="0" :max="10" :step="1" style="width: 200px" @change="handleChange" />
        <span class="unit">次</span>
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

    <!-- 文件管理配置 -->
    <div
      v-if="section === 'filemanagement'"
      class="setting-section"
      :class="
        !simpleStyle
          ? {
              'file-management-section': true,
              enabled: formData.monitorSysGenServerSettingFileManagementEnabled === 1,
              configured: formData.monitorSysGenServerSettingFileManagementEnabled === 1 && formData.monitorSysGenServerSettingFileManagementMode !== 'NONE'
            }
          : {}
      "
    >
      <!-- 配置内容（简洁风格） -->
      <div class="file-management-content">
        <!-- 启用文件管理 -->
        <el-form-item prop="monitorSysGenServerSettingFileManagementEnabled">
          <template #label>
            <div class="form-label">
              <span>启用文件管理</span>
              <el-tooltip content="开启后可以通过Web界面管理服务器文件系统，支持文件上传、下载、编辑等操作" placement="top" effect="dark">
                <IconifyIconOnline icon="ri:question-line" class="help-icon" />
              </el-tooltip>
            </div>
          </template>
          <el-switch v-model="formData.monitorSysGenServerSettingFileManagementEnabled" :active-value="1" :inactive-value="0" active-text="开启" inactive-text="关闭" @change="handleChange" />
        </el-form-item>

        <!-- 文件管理模式 -->
        <el-form-item v-if="formData.monitorSysGenServerSettingFileManagementEnabled === 1" prop="monitorSysGenServerSettingFileManagementMode">
          <template #label>
            <div class="form-label">
              <span>文件管理模式</span>
              <el-tooltip content="选择文件管理的连接方式：LOCAL-本地连接，SSH-SSH连接，NODE-NODE客户端代理，API-API接口连接" placement="top" effect="dark">
                <IconifyIconOnline icon="ri:question-line" class="help-icon" />
              </el-tooltip>
            </div>
          </template>
          <el-select v-model="formData.monitorSysGenServerSettingFileManagementMode" placeholder="请选择文件管理模式" @change="handleFileManagementModeChange">
            <el-option label="不启用" value="NONE" />
            <el-option v-if="isLocalServer" label="本地连接" value="LOCAL" />
            <el-option label="SSH连接" value="SSH" />
            <el-option label="NODE客户端" value="NODE" />
            <el-option label="API接口" value="API" />
          </el-select>
        </el-form-item>

        <!-- NODE客户端选择 -->
        <el-form-item
          v-if="formData.monitorSysGenServerSettingFileManagementEnabled === 1 && formData.monitorSysGenServerSettingFileManagementMode === 'NODE'"
          prop="monitorSysGenServerSettingFileManagementNodeClient"
        >
          <template #label>
            <div class="form-label">
              <span>NODE客户端</span>
              <el-tooltip content="选择用于文件管理的NODE客户端，客户端必须在线且支持文件管理功能" placement="top" effect="dark">
                <IconifyIconOnline icon="ri:question-line" class="help-icon" />
              </el-tooltip>
            </div>
          </template>
          <el-select v-model="formData.monitorSysGenServerSettingFileManagementNodeClient" placeholder="请选择NODE客户端" :loading="loadingNodeClients" @change="handleChange">
            <el-option v-for="client in nodeClients" :key="client.serverId" :label="`${client.name} (${client.address})`" :value="client.serverId" />
          </el-select>
          <div class="form-item-help">
            <el-button size="small" type="primary" link @click="loadNodeClients">刷新客户端列表</el-button>
          </div>
        </el-form-item>

        <!-- API配置 -->
        <div v-if="formData.monitorSysGenServerSettingFileManagementEnabled === 1 && formData.monitorSysGenServerSettingFileManagementMode === 'API'" class="api-config-section">
          <el-divider content-position="left">API连接配置</el-divider>

          <!-- API主机 -->
          <el-form-item>
            <template #label>
              <div class="form-label">
                <span>API主机</span>
                <el-tooltip content="文件管理API服务器的主机地址" placement="top" effect="dark">
                  <IconifyIconOnline icon="ri:question-line" class="help-icon" />
                </el-tooltip>
              </div>
            </template>
            <el-input v-model="apiConfig.apiHost" placeholder="localhost" @input="handleApiConfigChange" />
          </el-form-item>

          <!-- API端口 -->
          <el-form-item>
            <template #label>
              <div class="form-label">
                <span>API端口</span>
              </div>
            </template>
            <el-input-number v-model="apiConfig.apiPort" :min="1" :max="65535" placeholder="8080" @change="handleApiConfigChange" />
          </el-form-item>

          <!-- 基础路径 -->
          <el-form-item>
            <template #label>
              <div class="form-label">
                <span>基础路径</span>
              </div>
            </template>
            <el-input v-model="apiConfig.basePath" placeholder="/api/file" @input="handleApiConfigChange" />
          </el-form-item>

          <!-- HTTPS -->
          <el-form-item>
            <template #label>
              <div class="form-label">
                <span>使用HTTPS</span>
              </div>
            </template>
            <el-switch v-model="apiConfig.useHttps" @change="handleApiConfigChange" />
          </el-form-item>

          <!-- 认证类型 -->
          <el-form-item>
            <template #label>
              <div class="form-label">
                <span>认证类型</span>
              </div>
            </template>
            <el-select v-model="apiConfig.authType" @change="handleApiConfigChange">
              <el-option label="无认证" value="NONE" />
              <el-option label="基础认证" value="BASIC" />
              <el-option label="Token认证" value="TOKEN" />
              <el-option label="API Key" value="API_KEY" />
            </el-select>
          </el-form-item>

          <!-- 基础认证 -->
          <div v-if="apiConfig.authType === 'BASIC'">
            <el-form-item>
              <template #label>
                <span>用户名</span>
              </template>
              <el-input v-model="apiConfig.username" @input="handleApiConfigChange" />
            </el-form-item>
            <el-form-item>
              <template #label>
                <span>密码</span>
              </template>
              <el-input v-model="apiConfig.password" type="password" show-password @input="handleApiConfigChange" />
            </el-form-item>
          </div>

          <!-- Token认证 -->
          <el-form-item v-if="apiConfig.authType === 'TOKEN'">
            <template #label>
              <span>Token</span>
            </template>
            <el-input v-model="apiConfig.token" type="password" show-password @input="handleApiConfigChange" />
          </el-form-item>

          <!-- API Key认证 -->
          <div v-if="apiConfig.authType === 'API_KEY'">
            <el-form-item>
              <template #label>
                <span>API Key</span>
              </template>
              <el-input v-model="apiConfig.apiKey" type="password" show-password @input="handleApiConfigChange" />
            </el-form-item>
            <el-form-item>
              <template #label>
                <span>API Key Header</span>
              </template>
              <el-input v-model="apiConfig.apiKeyHeader" placeholder="X-API-Key" @input="handleApiConfigChange" />
            </el-form-item>
          </div>
        </div>

        <!-- 高级配置 -->
        <div v-if="formData.monitorSysGenServerSettingFileManagementEnabled === 1 && formData.monitorSysGenServerSettingFileManagementMode !== 'NONE'" class="advanced-config-section">
          <el-divider content-position="left">高级配置</el-divider>

          <!-- 操作超时时间 -->
          <el-form-item prop="monitorSysGenServerSettingFileManagementTimeout">
            <template #label>
              <div class="form-label">
                <span>操作超时时间</span>
                <el-tooltip content="文件操作的超时时间，单位：秒" placement="top" effect="dark">
                  <IconifyIconOnline icon="ri:question-line" class="help-icon" />
                </el-tooltip>
              </div>
            </template>
            <el-input-number v-model="formData.monitorSysGenServerSettingFileManagementTimeout" :min="10" :max="300" @change="handleChange" />
            <span class="input-suffix">秒</span>
          </el-form-item>

          <!-- 最大重试次数 -->
          <el-form-item prop="monitorSysGenServerSettingFileManagementMaxRetries">
            <template #label>
              <div class="form-label">
                <span>最大重试次数</span>
                <el-tooltip content="文件操作失败时的最大重试次数" placement="top" effect="dark">
                  <IconifyIconOnline icon="ri:question-line" class="help-icon" />
                </el-tooltip>
              </div>
            </template>
            <el-input-number v-model="formData.monitorSysGenServerSettingFileManagementMaxRetries" :min="0" :max="10" @change="handleChange" />
          </el-form-item>

          <!-- 健康检查间隔 -->
          <el-form-item prop="monitorSysGenServerSettingClientHealthCheckInterval">
            <template #label>
              <div class="form-label">
                <span>健康检查间隔</span>
                <el-tooltip content="客户端健康状态检查间隔，单位：秒" placement="top" effect="dark">
                  <IconifyIconOnline icon="ri:question-line" class="help-icon" />
                </el-tooltip>
              </div>
            </template>
            <el-input-number v-model="formData.monitorSysGenServerSettingClientHealthCheckInterval" :min="10" :max="300" @change="handleChange" />
            <span class="input-suffix">秒</span>
          </el-form-item>

          <!-- 健康检查超时 -->
          <el-form-item prop="monitorSysGenServerSettingClientHealthTimeout">
            <template #label>
              <div class="form-label">
                <span>健康检查超时</span>
                <el-tooltip content="客户端健康状态检查的超时时间，单位：秒" placement="top" effect="dark">
                  <IconifyIconOnline icon="ri:question-line" class="help-icon" />
                </el-tooltip>
              </div>
            </template>
            <el-input-number v-model="formData.monitorSysGenServerSettingClientHealthTimeout" :min="5" :max="60" @change="handleChange" />
            <span class="input-suffix">秒</span>
          </el-form-item>
        </div>

        <!-- 测试连接按钮 -->
        <el-form-item v-if="formData.monitorSysGenServerSettingFileManagementEnabled === 1 && formData.monitorSysGenServerSettingFileManagementMode !== 'NONE'">
          <el-button type="primary" :loading="testingFileManagement" @click="testFileManagementConnection">
            <IconifyIconOnline icon="ri:wifi-line" class="mr-1" />
            测试连接
          </el-button>
        </el-form-item>
      </div>
    </div>

    <!-- Prometheus配置 -->
    <div v-if="section === 'prometheus'" class="setting-section">
      <!-- Prometheus服务器配置 -->
      <el-form-item prop="monitorSysGenServerSettingPrometheusUrl">
        <template #label>
          <div class="form-label">
            <span>服务器URL</span>
            <el-tooltip content="Prometheus服务器的完整URL地址，例如：http://localhost:9090" placement="top" effect="dark">
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input v-model="formData.monitorSysGenServerSettingPrometheusUrl" placeholder="http://localhost:9090" clearable @change="handleChange" />
      </el-form-item>

      <el-form-item prop="monitorSysGenServerSettingPrometheusQueryPath">
        <template #label>
          <div class="form-label">
            <span>查询路径</span>
            <el-tooltip content="Prometheus API查询路径，默认为 /api/v1/query_range" placement="top" effect="dark">
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input v-model="formData.monitorSysGenServerSettingPrometheusQueryPath" placeholder="/api/v1/query_range" clearable @change="handleChange" />
      </el-form-item>

      <el-form-item prop="monitorSysGenServerSettingPrometheusTimeout">
        <template #label>
          <div class="form-label">
            <span>查询超时</span>
            <el-tooltip content="Prometheus查询超时时间，单位：秒" placement="top" effect="dark">
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input-number v-model="formData.monitorSysGenServerSettingPrometheusTimeout" :min="1" :max="300" :step="1" style="width: 200px" @change="handleChange" />
        <span class="unit">秒</span>
      </el-form-item>

      <!-- 认证配置 -->
      <el-form-item prop="monitorSysGenServerSettingPrometheusAuthEnabled">
        <template #label>
          <div class="form-label">
            <span>启用认证</span>
            <el-tooltip content="启用后需要提供用户名和密码进行基本认证" placement="top" effect="dark">
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-switch v-model="formData.monitorSysGenServerSettingPrometheusAuthEnabled" :active-value="1" :inactive-value="0" active-text="开启" inactive-text="关闭" @change="handleChange" />
      </el-form-item>

      <el-form-item v-if="formData.monitorSysGenServerSettingPrometheusAuthEnabled === 1" prop="monitorSysGenServerSettingPrometheusUsername">
        <template #label>
          <div class="form-label">
            <span>用户名</span>
            <el-tooltip content="Prometheus服务器认证用户名" placement="top" effect="dark">
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input v-model="formData.monitorSysGenServerSettingPrometheusUsername" placeholder="请输入用户名" clearable @change="handleChange" />
      </el-form-item>

      <el-form-item v-if="formData.monitorSysGenServerSettingPrometheusAuthEnabled === 1" prop="monitorSysGenServerSettingPrometheusPassword">
        <template #label>
          <div class="form-label">
            <span>密码</span>
            <el-tooltip content="Prometheus服务器认证密码" placement="top" effect="dark">
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input v-model="formData.monitorSysGenServerSettingPrometheusPassword" type="password" placeholder="请输入密码" show-password clearable @change="handleChange" />
      </el-form-item>

      <!-- 高级配置 -->
      <el-form-item prop="monitorSysGenServerSettingPrometheusLabels">
        <template #label>
          <div class="form-label">
            <span>标签过滤器</span>
            <el-tooltip content='用于过滤Prometheus指标的标签，格式：key1="value1",key2="value2"' placement="top" effect="dark">
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
        </template>
        <el-input v-model="formData.monitorSysGenServerSettingPrometheusLabels" type="textarea" :rows="3" placeholder='instance="server_1",job="node_exporter"' @change="handleChange" />
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
import { reactive, ref, watch, nextTick, defineProps, defineEmits } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { ServerSetting, FileManagementApiConfig } from "@/api/server/setting";
import { testFileManagementConnection as testFileManagementConnectionApi, getAvailableNodeClients } from "@/api/server/setting";

// 定义属性
const props = defineProps<{
  modelValue: Partial<ServerSetting>;
  section: "monitor" | "alert" | "docker" | "proxy" | "prometheus" | "filemanagement" | "advanced" | "tasks" | "cleanup";
  isLocalServer?: boolean;
  serverId?: number;
  /** 简洁样式：用于在配置对话框中与其他分节保持一致的风格 */
  simpleStyle?: boolean;
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
  monitorSysGenServerSettingCpuAlertThreshold: 80.0,
  monitorSysGenServerSettingMemoryAlertThreshold: 85.0,
  monitorSysGenServerSettingDiskAlertThreshold: 90.0,
  monitorSysGenServerSettingNetworkAlertThreshold: 100.0,
  monitorSysGenServerSettingResponseTimeAlertThreshold: 5000,

  // 告警配置默认值
  monitorSysGenServerSettingAlertEnabled: 0,
  monitorSysGenServerSettingAlertNotificationMethod: "EMAIL",
  monitorSysGenServerSettingAlertNotificationAddress: "",
  monitorSysGenServerSettingAlertSilenceDuration: 30,
  monitorSysGenServerSettingAutoRecoveryNotificationEnabled: 1,

  // Prometheus配置默认值
  monitorSysGenServerSettingPrometheusHost: "localhost",
  monitorSysGenServerSettingPrometheusPort: 9090,
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

  // 文件上传配置默认值
  monitorSysGenServerSettingFileUploadEnabled: 1,
  monitorSysGenServerSettingFileUploadInterval: 10,
  monitorSysGenServerSettingFileUploadStatusCheckInterval: 30,
  monitorSysGenServerSettingFileUploadCleanupInterval: 1,
  monitorSysGenServerSettingFileUploadTimeout: 30,
  monitorSysGenServerSettingFileUploadMaxRetries: 3,

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

  // 文件管理配置默认值
  monitorSysGenServerSettingFileManagementEnabled: 0,
  monitorSysGenServerSettingFileManagementMode: "NONE",
  monitorSysGenServerSettingFileManagementApiConfig: "",
  monitorSysGenServerSettingFileManagementTimeout: 60,
  monitorSysGenServerSettingFileManagementMaxRetries: 3,
  monitorSysGenServerSettingClientHealthCheckInterval: 30,
  monitorSysGenServerSettingClientHealthTimeout: 10
};

// 表单数据
const formData = reactive<Partial<ServerSetting & any>>({ ...DEFAULT_VALUES });

// 测试连接状态
const testingConnection = ref(false);
const testingFileManagement = ref(false);

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
  useClientPort: true
});

// NODE 客户端相关数据
const nodeClients = ref<any[]>([]);
const loadingNodeClients = ref(false);
const selectedNodeClient = ref<any>(null);

// 文件管理配置面板状态

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
    case "WEB_PUSH":
      return "推送配置";
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
    case "WEB_PUSH":
      return '网页推送配置，格式为JSON：{"endpoint":"推送端点","keys":{"p256dh":"公钥","auth":"认证密钥"}}';
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
    case "WEB_PUSH":
      return "请输入网页推送配置JSON";
    case "WEBHOOK":
      return "请输入Webhook URL";
    default:
      return "请输入通知地址";
  }
};

// 告警配置相关功能已集成到主配置中

// 添加标志位防止循环更新
const isUpdatingFromParent = ref(false);
const isInternalUpdate = ref(false);

// 监听外部数据变化
watch(
  () => props.modelValue,
  newValue => {
    if (newValue && !isInternalUpdate.value) {
      isUpdatingFromParent.value = true;

      // 只更新真正发生变化的字段，避免覆盖用户正在编辑的内容
      const changes: Record<string, any> = {};
      for (const key in newValue) {
        if (newValue[key] !== formData[key]) {
          changes[key] = newValue[key];
        }
      }

      // 如果有变化才更新
      if (Object.keys(changes).length > 0) {
        Object.assign(formData, changes);
      }

      // 使用 nextTick 确保在下一个事件循环中重置标志位
      nextTick(() => {
        isUpdatingFromParent.value = false;
      });
    }
  },
  { immediate: true, deep: true }
);

// 监听表单数据变化
watch(
  formData,
  newValue => {
    // 只有在不是从父组件更新时才向上传递
    if (!isUpdatingFromParent.value) {
      isInternalUpdate.value = true;
      emit("update:modelValue", newValue);
      nextTick(() => {
        isInternalUpdate.value = false;
      });
    }
  },
  { deep: true }
);

/**
 * 清除所有配置
 */
const clearAllSettings = () => {
  ElMessageBox.confirm("确定要清除所有配置吗？此操作不可恢复。", "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(() => {
      // 清除所有配置，设置为空值或禁用状态
      Object.keys(formData).forEach(key => {
        if (key.includes("Enabled")) {
          formData[key] = 0;
        } else if (key.includes("Interval") || key.includes("Timeout") || key.includes("Days") || key.includes("Hours")) {
          formData[key] = 0;
        } else if (typeof formData[key] === "string") {
          formData[key] = "";
        } else if (typeof formData[key] === "number") {
          formData[key] = 0;
        }
      });

      handleChange();
      ElMessage.success("配置已清除");
    })
    .catch(() => {
      ElMessage.info("已取消清除操作");
    });
};

/**
 * 重置为默认值
 */
const resetToDefault = () => {
  ElMessageBox.confirm("确定要重置为默认配置吗？当前配置将被覆盖。", "确认", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "info"
  })
    .then(() => {
      // 重置为默认值
      Object.assign(formData, DEFAULT_VALUES);
      handleChange();
      ElMessage.success("配置已重置为默认值");
    })
    .catch(() => {
      ElMessage.info("已取消重置操作");
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
        sslVerificationEnabled: true
      });
      handleApiConfigChange();
    } else {
      // 如果已有配置，解析并加载
      try {
        const config = JSON.parse(formData.monitorSysGenServerSettingFileManagementApiConfig);
        Object.assign(apiConfig, config);
      } catch (error) {
        console.warn("解析API配置失败，使用默认配置:", error);
      }
    }
  } else if (formData.monitorSysGenServerSettingFileManagementMode === "NODE") {
    // 如果切换到NODE模式，加载客户端列表
    loadNodeClients();
  } else {
    // 如果切换到其他模式，清空API配置和NODE客户端选择
    formData.monitorSysGenServerSettingFileManagementApiConfig = "";
    formData.monitorSysGenServerSettingFileManagementNodeClient = "";
    selectedNodeClient.value = null;
  }

  handleChange();
};

/**
 * 加载NODE客户端列表
 */
const loadNodeClients = async () => {
  if (loadingNodeClients.value) return;

  loadingNodeClients.value = true;
  try {
    const response = await getAvailableNodeClients();
    if (response.code === 200 && response.data) {
      nodeClients.value = response.data;
    } else {
      nodeClients.value = [];
      ElMessage.warning("未找到可用的NODE客户端");
    }

    // 如果已有选择的客户端，更新选中状态
    if (formData.monitorSysGenServerSettingFileManagementNodeClient) {
      const selected = nodeClients.value.find(client => client.serverId === formData.monitorSysGenServerSettingFileManagementNodeClient);
      selectedNodeClient.value = selected || null;
    }
  } catch (error) {
    console.error("加载NODE客户端列表失败:", error);
    ElMessage.error("加载NODE客户端列表失败");
    nodeClients.value = [];
  } finally {
    loadingNodeClients.value = false;
  }
};

/**
 * 处理API配置变化
 */
const handleApiConfigChange = () => {
  // 将API配置对象序列化为JSON字符串
  try {
    formData.monitorSysGenServerSettingFileManagementApiConfig = JSON.stringify(apiConfig);
  } catch (error) {
    console.error("序列化API配置失败:", error);
    formData.monitorSysGenServerSettingFileManagementApiConfig = "";
  }

  handleChange();
};

/**
 * 测试文件管理连接
 */
const testFileManagementConnection = async () => {
  if (!formData.monitorSysGenServerId) {
    ElMessage.warning("请先保存服务器信息");
    return;
  }

  testingFileManagement.value = true;
  try {
    console.log("测试文件管理连接...");

    // 调用API测试连接
    const result = await testFileManagementConnectionApi(formData.monitorSysGenServerId);

    if (result.data) {
      ElMessage.success("文件管理连接测试成功");
    } else {
      ElMessage.error("文件管理连接测试失败，请检查配置");
    }
  } catch (error) {
    console.error("文件管理连接测试失败:", error);
    ElMessage.error("文件管理连接测试失败，请检查配置");
  } finally {
    testingFileManagement.value = false;
  }
};

// 已移除文件管理折叠/点击启用逻辑，采用简洁风格直接展示表单
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

.prometheus-basic-config {
  background-color: var(--el-fill-color-extra-light);
  border-radius: 6px;
  padding: 16px;
  margin: 12px 0;
  border: 1px solid var(--el-border-color-lighter);
  border-left: 3px solid #409eff;

  .el-form-item {
    margin-bottom: 16px;
  }

  .form-tip {
    color: var(--el-text-color-secondary);
    font-size: 12px;
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

/* NODE客户端选择样式 */
.node-client-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 4px 0;
}

.client-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.client-name {
  font-weight: 500;
  color: #303133;
  font-size: 14px;
}

.client-address {
  color: #909399;
  font-size: 12px;
  margin-top: 2px;
}

.client-status {
  margin-left: 8px;
}

/* 文件管理配置区域样式 */
/* .file-management-section {
  border: 2px solid transparent;
  border-radius: 12px;
  padding: 0;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.file-management-section:hover {
  border-color: var(--el-color-primary-light-7);
  background-color: var(--el-fill-color-extra-light);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

/* .file-management-section.enabled {
  border-color: var(--el-color-primary-light-8);
  background-color: var(--el-fill-color-lighter);
}

/* .file-management-section.configured {
  border-color: var(--el-color-success-light-7);
  background-color: var(--el-color-success-light-9);
}

/* .file-management-section.configured:hover {
  border-color: var(--el-color-success-light-5);
  box-shadow: 0 2px 8px rgba(103, 194, 58, 0.15);
}

/* .file-management-header {
  padding: 16px 20px;
  background: linear-gradient(135deg, var(--el-fill-color-light) 0%, var(--el-fill-color-lighter) 100%);
  border-bottom: 1px solid var(--el-border-color-lighter);
  cursor: default;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  font-size: 16px;
}

.section-icon {
  font-size: 20px;
  color: var(--el-color-primary);
}

.info-icon {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  cursor: help;
  transition: color 0.3s;
}

.info-icon:hover {
  color: var(--el-color-primary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* .file-management-content {
  padding: 20px;
}

/* 点击提示动画 */
.file-management-section::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: radial-gradient(circle, rgba(64, 158, 255, 0.2) 0%, transparent 70%);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: all 0.6s ease;
  pointer-events: none;
  z-index: 1;
}

.file-management-section:active::before {
  width: 200px;
  height: 200px;
}

/* 快速启用按钮样式 */
.header-actions .el-button--primary {
  background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-dark-2) 100%);
  border: none;
  box-shadow: 0 2px 4px rgba(64, 158, 255, 0.3);
  transition: all 0.3s ease;
}

.header-actions .el-button--primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(64, 158, 255, 0.4);
}
</style>
