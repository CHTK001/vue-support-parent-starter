<template>
  <div class="connection-result" :class="{ compact }">
    <el-card :class="getResultClass()">
      <template #header>
        <div class="result-header">
          <div class="address-info">
            <IconifyIconOnline :icon="getConnectionIcon()" class="connection-icon" />
            <span class="address">{{ result.address }}</span>
            <el-tag :type="getConnectionTypeTagType()" size="small">
              {{ result.connectionType }}
            </el-tag>
          </div>
          <div class="status-info">
            <el-tag :type="getStatusTagType()" size="small">
              {{ getStatusText() }}
            </el-tag>
          </div>
        </div>
      </template>

      <div class="result-content">
        <!-- 基本信息 -->
        <div class="basic-info">
          <div class="info-item">
            <span class="label">响应时间:</span>
            <span class="value" :class="getResponseTimeClass()">
              {{ getResponseTimeText() }}
            </span>
          </div>
          
          <div v-if="result.httpStatusCode" class="info-item">
            <span class="label">HTTP状态码:</span>
            <span class="value" :class="getHttpStatusClass()">
              {{ result.httpStatusCode }}
            </span>
          </div>
          
          <div class="info-item">
            <span class="label">测试时间:</span>
            <span class="value">{{ formatTestTime() }}</span>
          </div>
        </div>

        <!-- 消息信息 -->
        <div v-if="result.message" class="message-info">
          <div class="info-item">
            <span class="label">消息:</span>
            <span class="value">{{ result.message }}</span>
          </div>
        </div>

        <!-- 错误信息 -->
        <div v-if="result.errorMessage" class="error-info">
          <el-alert
            :title="result.errorMessage"
            type="error"
            :closable="false"
            show-icon
          />
        </div>

        <!-- 扩展信息 -->
        <div v-if="result.extendedInfo && !compact" class="extended-info">
          <el-collapse>
            <el-collapse-item title="详细信息" name="details">
              <div class="extended-content">
                <div
                  v-for="(value, key) in result.extendedInfo"
                  :key="key"
                  class="extended-item"
                >
                  <span class="extended-label">{{ formatExtendedKey(key) }}:</span>
                  <span class="extended-value">{{ formatExtendedValue(value) }}</span>
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

// Props
interface ConnectionTestResult {
  address: string;
  connectionType: string;
  success: boolean;
  responseTime?: number;
  httpStatusCode?: number;
  message?: string;
  errorMessage?: string;
  testTime: string;
  extendedInfo?: Record<string, any>;
}

const props = defineProps<{
  result: ConnectionTestResult;
  compact?: boolean;
}>();

// 获取连接图标
const getConnectionIcon = () => {
  switch (props.result.connectionType?.toUpperCase()) {
    case 'HTTP':
    case 'HTTPS':
      return 'ri:global-line';
    case 'SOCKET':
    case 'TCP':
      return 'ri:plug-line';
    case 'PROMETHEUS':
      return 'ri:dashboard-line';
    default:
      return 'ri:link';
  }
};

// 获取连接类型标签类型
const getConnectionTypeTagType = () => {
  switch (props.result.connectionType?.toUpperCase()) {
    case 'HTTP':
      return 'primary';
    case 'HTTPS':
      return 'success';
    case 'SOCKET':
    case 'TCP':
      return 'warning';
    case 'PROMETHEUS':
      return 'info';
    default:
      return '';
  }
};

// 获取状态标签类型
const getStatusTagType = () => {
  return props.result.success ? 'success' : 'danger';
};

// 获取状态文本
const getStatusText = () => {
  return props.result.success ? '连接成功' : '连接失败';
};

// 获取结果卡片样式类
const getResultClass = () => {
  return props.result.success ? 'result-success' : 'result-failed';
};

// 获取响应时间样式类
const getResponseTimeClass = () => {
  if (!props.result.responseTime) return '';
  
  if (props.result.responseTime < 100) return 'response-excellent';
  if (props.result.responseTime < 500) return 'response-good';
  if (props.result.responseTime < 1000) return 'response-normal';
  if (props.result.responseTime < 3000) return 'response-slow';
  return 'response-very-slow';
};

// 获取响应时间文本
const getResponseTimeText = () => {
  if (!props.result.responseTime) return '未知';
  
  const time = props.result.responseTime;
  if (time < 100) return `${time}ms (极快)`;
  if (time < 500) return `${time}ms (快)`;
  if (time < 1000) return `${time}ms (正常)`;
  if (time < 3000) return `${time}ms (慢)`;
  return `${time}ms (很慢)`;
};

// 获取HTTP状态码样式类
const getHttpStatusClass = () => {
  if (!props.result.httpStatusCode) return '';
  
  const code = props.result.httpStatusCode;
  if (code >= 200 && code < 300) return 'http-success';
  if (code >= 300 && code < 400) return 'http-redirect';
  if (code >= 400 && code < 500) return 'http-client-error';
  if (code >= 500) return 'http-server-error';
  return '';
};

// 格式化测试时间
const formatTestTime = () => {
  if (!props.result.testTime) return '未知';
  
  try {
    const date = new Date(props.result.testTime);
    return date.toLocaleString('zh-CN');
  } catch {
    return props.result.testTime;
  }
};

// 格式化扩展信息键名
const formatExtendedKey = (key: string) => {
  const keyMap: Record<string, string> = {
    contentType: '内容类型',
    contentLength: '内容长度',
    lastModified: '最后修改时间',
    localAddress: '本地地址',
    localPort: '本地端口',
    remoteAddress: '远程地址',
    healthCheckUrl: '健康检查URL',
    serverHeader: '服务器头'
  };
  
  return keyMap[key] || key;
};

// 格式化扩展信息值
const formatExtendedValue = (value: any) => {
  if (value === null || value === undefined) return '无';
  if (typeof value === 'number' && value > 1000000000) {
    // 可能是时间戳
    try {
      return new Date(value).toLocaleString('zh-CN');
    } catch {
      return value.toString();
    }
  }
  return value.toString();
};
</script>

<style scoped>
.connection-result {
  width: 100%;
}

.connection-result.compact {
  font-size: 14px;
}

.result-success :deep(.el-card) {
  border-color: var(--el-color-success-light-7);
}

.result-failed :deep(.el-card) {
  border-color: var(--el-color-danger-light-7);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.address-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.connection-icon {
  font-size: 16px;
  color: var(--el-color-primary);
}

.address {
  font-weight: 500;
  color: var(--el-text-color-primary);
  word-break: break-all;
}

.status-info {
  flex-shrink: 0;
}

.result-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.basic-info,
.message-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.label {
  font-weight: 500;
  color: var(--el-text-color-regular);
  min-width: 80px;
}

.value {
  color: var(--el-text-color-primary);
}

/* 响应时间颜色 */
.response-excellent {
  color: var(--el-color-success);
  font-weight: 600;
}

.response-good {
  color: var(--el-color-success);
}

.response-normal {
  color: var(--el-color-primary);
}

.response-slow {
  color: var(--el-color-warning);
}

.response-very-slow {
  color: var(--el-color-danger);
}

/* HTTP状态码颜色 */
.http-success {
  color: var(--el-color-success);
  font-weight: 600;
}

.http-redirect {
  color: var(--el-color-info);
}

.http-client-error {
  color: var(--el-color-warning);
}

.http-server-error {
  color: var(--el-color-danger);
}

.error-info {
  margin-top: 8px;
}

.extended-info {
  margin-top: 8px;
}

.extended-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.extended-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  border-bottom: 1px solid var(--el-border-color-extra-light);
}

.extended-item:last-child {
  border-bottom: none;
}

.extended-label {
  font-weight: 500;
  color: var(--el-text-color-regular);
  min-width: 120px;
}

.extended-value {
  color: var(--el-text-color-primary);
  word-break: break-all;
}
</style>
