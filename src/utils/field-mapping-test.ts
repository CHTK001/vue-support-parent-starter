/**
 * 字段映射正确性测试工具
 * 用于验证前端接口定义与后端实体类字段的一致性
 */

import type { ServerInfo, ServerDetailComponent, ServerMetrics } from "@/api/monitor/gen/server";

/**
 * 后端实体类字段列表（基于MonitorSysGenServer）
 */
const BACKEND_SERVER_FIELDS = [
  'monitorSysGenServerId',
  'monitorSysGenServerName',
  'monitorSysGenServerHost',
  'monitorSysGenServerPort',
  'monitorSysGenServerProtocol',
  'monitorSysGenServerUsername',
  'monitorSysGenServerPassword',
  'monitorSysGenServerPrivateKey',
  'monitorSysGenServerMetricsRetentionDays',
  'monitorSysGenServerMonitorInterval',
  'monitorSysGenServerTimeout',
  'monitorSysGenServerDesc',
  'monitorSysGenServerStatus',
  'monitorSysGenServerMonitorEnabled',
  'monitorSysGenServerTags',
  'monitorSysGenServerConnectionStatus',
  'monitorSysGenServerLastConnectTime',
  'monitorSysGenServerConnectionError',
  'genId',
  'monitorSysGenServerCreateTime',
  'monitorSysGenServerUpdateTime',
  'monitorSysGenServerReportEnabled',
  'monitorSysGenServerProxyType',
  'monitorSysGenServerDataReportMethod',
  'monitorSysGenServerPrometheusHost',
  'monitorSysGenServerPrometheusPort',
  'monitorSysGenServerProxyHost',
  'monitorSysGenServerProxyPort',
] as const;

/**
 * 后端实体类字段列表（基于MonitorSysGenServerDetailComponent）
 */
const BACKEND_COMPONENT_FIELDS = [
  'monitorSysGenServerDetailComponentId',
  'monitorSysGenServerId',
  'monitorSysGenServerDetailComponentName',
  'monitorSysGenServerDetailComponentTitle',
  'monitorSysGenServerDetailComponentType',
  'monitorSysGenServerDetailComponentExpressionType',
  'monitorSysGenServerDetailComponentExpression',
  'monitorSysGenServerDetailComponentPosition',
  'monitorSysGenServerDetailComponentChartConfig',
  'monitorSysGenServerDetailComponentRefreshInterval',
  'monitorSysGenServerDetailComponentEnabled',
  'monitorSysGenServerDetailComponentSortOrder',
  'monitorSysGenServerDetailComponentDesc',
  'monitorSysGenServerDetailComponentCreateTime',
  'monitorSysGenServerDetailComponentUpdateTime',
] as const;

/**
 * 后端实体类字段列表（基于MonitorSysGenServerMetrics）
 */
const BACKEND_METRICS_FIELDS = [
  'monitorSysGenServerMetricsId',
  'monitorSysGenServerId',
  'monitorSysGenServerMetricsCollectTime',
  'monitorSysGenServerMetricsCpuUsage',
  'monitorSysGenServerMetricsCpuCores',
  'monitorSysGenServerMetricsCpuLoad1m',
  'monitorSysGenServerMetricsCpuLoad5m',
  'monitorSysGenServerMetricsCpuLoad15m',
  'monitorSysGenServerMetricsMemoryTotal',
  'monitorSysGenServerMetricsMemoryUsed',
  'monitorSysGenServerMetricsMemoryFree',
  'monitorSysGenServerMetricsMemoryUsage',
  'monitorSysGenServerMetricsDiskTotal',
  'monitorSysGenServerMetricsDiskUsed',
  'monitorSysGenServerMetricsDiskFree',
  'monitorSysGenServerMetricsDiskUsage',
  'monitorSysGenServerMetricsNetworkIn',
  'monitorSysGenServerMetricsNetworkOut',
  'monitorSysGenServerMetricsUptime',
  'monitorSysGenServerMetricsProcessCount',
  'monitorSysGenServerMetricsStatus',
  'monitorSysGenServerMetricsResponseTime',
  'monitorSysGenServerMetricsOsInfo',
  'monitorSysGenServerMetricsExtraInfo',
] as const;

/**
 * 验证前端接口字段与后端实体类字段的一致性
 */
export function validateFieldMapping() {
  const results = {
    server: validateServerFields(),
    component: validateComponentFields(),
    metrics: validateMetricsFields(),
  };

  console.log('字段映射验证结果:', results);
  return results;
}

/**
 * 验证服务器字段
 */
function validateServerFields() {
  const serverInfo: ServerInfo = {} as ServerInfo;
  const frontendFields = Object.keys(serverInfo) as (keyof ServerInfo)[];
  
  const missingInFrontend = BACKEND_SERVER_FIELDS.filter(
    field => !frontendFields.includes(field as keyof ServerInfo)
  );
  
  const extraInFrontend = frontendFields.filter(
    field => !BACKEND_SERVER_FIELDS.includes(field as any)
  );

  return {
    valid: missingInFrontend.length === 0 && extraInFrontend.length === 0,
    missingInFrontend,
    extraInFrontend,
    totalBackendFields: BACKEND_SERVER_FIELDS.length,
    totalFrontendFields: frontendFields.length,
  };
}

/**
 * 验证组件字段
 */
function validateComponentFields() {
  const component: ServerDetailComponent = {} as ServerDetailComponent;
  const frontendFields = Object.keys(component) as (keyof ServerDetailComponent)[];
  
  const missingInFrontend = BACKEND_COMPONENT_FIELDS.filter(
    field => !frontendFields.includes(field as keyof ServerDetailComponent)
  );
  
  const extraInFrontend = frontendFields.filter(
    field => !BACKEND_COMPONENT_FIELDS.includes(field as any)
  );

  return {
    valid: missingInFrontend.length === 0 && extraInFrontend.length === 0,
    missingInFrontend,
    extraInFrontend,
    totalBackendFields: BACKEND_COMPONENT_FIELDS.length,
    totalFrontendFields: frontendFields.length,
  };
}

/**
 * 验证指标字段
 */
function validateMetricsFields() {
  const metrics: ServerMetrics = {} as ServerMetrics;
  const frontendFields = Object.keys(metrics) as (keyof ServerMetrics)[];
  
  const missingInFrontend = BACKEND_METRICS_FIELDS.filter(
    field => !frontendFields.includes(field as keyof ServerMetrics)
  );
  
  const extraInFrontend = frontendFields.filter(
    field => !BACKEND_METRICS_FIELDS.includes(field as any)
  );

  return {
    valid: missingInFrontend.length === 0 && extraInFrontend.length === 0,
    missingInFrontend,
    extraInFrontend,
    totalBackendFields: BACKEND_METRICS_FIELDS.length,
    totalFrontendFields: frontendFields.length,
  };
}

/**
 * 生成字段映射报告
 */
export function generateFieldMappingReport() {
  const results = validateFieldMapping();
  
  let report = '# 字段映射验证报告\n\n';
  
  // 服务器字段报告
  report += '## 服务器字段 (ServerInfo)\n';
  report += `- 后端字段数量: ${results.server.totalBackendFields}\n`;
  report += `- 前端字段数量: ${results.server.totalFrontendFields}\n`;
  report += `- 映射状态: ${results.server.valid ? '✅ 完全一致' : '❌ 存在差异'}\n`;
  
  if (results.server.missingInFrontend.length > 0) {
    report += `- 前端缺失字段: ${results.server.missingInFrontend.join(', ')}\n`;
  }
  
  if (results.server.extraInFrontend.length > 0) {
    report += `- 前端多余字段: ${results.server.extraInFrontend.join(', ')}\n`;
  }
  
  // 组件字段报告
  report += '\n## 组件字段 (ServerDetailComponent)\n';
  report += `- 后端字段数量: ${results.component.totalBackendFields}\n`;
  report += `- 前端字段数量: ${results.component.totalFrontendFields}\n`;
  report += `- 映射状态: ${results.component.valid ? '✅ 完全一致' : '❌ 存在差异'}\n`;
  
  if (results.component.missingInFrontend.length > 0) {
    report += `- 前端缺失字段: ${results.component.missingInFrontend.join(', ')}\n`;
  }
  
  if (results.component.extraInFrontend.length > 0) {
    report += `- 前端多余字段: ${results.component.extraInFrontend.join(', ')}\n`;
  }
  
  // 指标字段报告
  report += '\n## 指标字段 (ServerMetrics)\n';
  report += `- 后端字段数量: ${results.metrics.totalBackendFields}\n`;
  report += `- 前端字段数量: ${results.metrics.totalFrontendFields}\n`;
  report += `- 映射状态: ${results.metrics.valid ? '✅ 完全一致' : '❌ 存在差异'}\n`;
  
  if (results.metrics.missingInFrontend.length > 0) {
    report += `- 前端缺失字段: ${results.metrics.missingInFrontend.join(', ')}\n`;
  }
  
  if (results.metrics.extraInFrontend.length > 0) {
    report += `- 前端多余字段: ${results.metrics.extraInFrontend.join(', ')}\n`;
  }
  
  report += '\n## 总结\n';
  const allValid = results.server.valid && results.component.valid && results.metrics.valid;
  report += `整体映射状态: ${allValid ? '✅ 所有字段映射正确' : '❌ 存在字段映射问题'}\n`;
  
  console.log(report);
  return report;
}
