/**
 * 组件字段映射工具
 * 用于前后端字段转换和数据验证
 */

import type { ServerComponent } from '@/api/server';

/**
 * 组件表单数据类型
 */
export interface ComponentFormData {
  monitorSysGenServerComponentId?: number;
  monitorSysGenServerId: number;
  monitorSysGenServerComponentName: string;
  monitorSysGenServerComponentType: string;
  monitorSysGenServerComponentExpressionType?: string;
  monitorSysGenServerComponentExpression?: string;
  monitorSysGenServerComponentUnit?: string;
  monitorSysGenServerComponentDescription?: string;
  monitorSysGenServerComponentEnabled?: boolean;
  monitorSysGenServerComponentRefreshInterval?: number;
  monitorSysGenServerComponentSort?: number;
  monitorSysGenServerComponentConfig?: string;
  monitorSysGenServerComponentPosition?: string;
}

/**
 * 验证结果接口
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * 将表单数据转换为API数据
 * @param formData 表单数据
 * @returns API数据
 */
export function convertFormDataToApiData(formData: ComponentFormData): Partial<ServerComponent> {
  const apiData: Partial<ServerComponent> = {
    monitorSysGenServerId: formData.monitorSysGenServerId,
    monitorSysGenServerComponentName: formData.monitorSysGenServerComponentName,
    monitorSysGenServerComponentType: formData.monitorSysGenServerComponentType,
    monitorSysGenServerComponentExpressionType: formData.monitorSysGenServerComponentExpressionType,
    monitorSysGenServerComponentExpression: formData.monitorSysGenServerComponentExpression,
    monitorSysGenServerComponentUnit: formData.monitorSysGenServerComponentUnit,
    monitorSysGenServerComponentDescription: formData.monitorSysGenServerComponentDescription,
    monitorSysGenServerComponentRefreshInterval: formData.monitorSysGenServerComponentRefreshInterval,
    monitorSysGenServerComponentSort: formData.monitorSysGenServerComponentSort,
    monitorSysGenServerComponentConfig: formData.monitorSysGenServerComponentConfig,
    monitorSysGenServerComponentPosition: formData.monitorSysGenServerComponentPosition,
  };

  // 将 enabled (boolean) 转换为 status (number)
  if (formData.monitorSysGenServerComponentEnabled !== undefined) {
    apiData.monitorSysGenServerComponentStatus = formData.monitorSysGenServerComponentEnabled ? 1 : 0;
  }

  // 如果有ID，则包含ID
  if (formData.monitorSysGenServerComponentId) {
    apiData.monitorSysGenServerComponentId = formData.monitorSysGenServerComponentId;
  }

  return apiData;
}

/**
 * 将API数据转换为表单数据
 * @param apiData API数据
 * @returns 表单数据
 */
export function convertApiDataToFormData(apiData: ServerComponent): ComponentFormData {
  const formData: ComponentFormData = {
    monitorSysGenServerId: apiData.monitorSysGenServerId,
    monitorSysGenServerComponentName: apiData.monitorSysGenServerComponentName,
    monitorSysGenServerComponentType: apiData.monitorSysGenServerComponentType,
    monitorSysGenServerComponentExpressionType: apiData.monitorSysGenServerComponentExpressionType,
    monitorSysGenServerComponentExpression: apiData.monitorSysGenServerComponentExpression,
    monitorSysGenServerComponentUnit: apiData.monitorSysGenServerComponentUnit,
    monitorSysGenServerComponentDescription: apiData.monitorSysGenServerComponentDescription,
    monitorSysGenServerComponentRefreshInterval: apiData.monitorSysGenServerComponentRefreshInterval,
    monitorSysGenServerComponentSort: apiData.monitorSysGenServerComponentSort,
    monitorSysGenServerComponentConfig: apiData.monitorSysGenServerComponentConfig,
    monitorSysGenServerComponentPosition: apiData.monitorSysGenServerComponentPosition,
  };

  // 将 status (number) 转换为 enabled (boolean)
  if (apiData.monitorSysGenServerComponentStatus !== undefined) {
    formData.monitorSysGenServerComponentEnabled = apiData.monitorSysGenServerComponentStatus === 1;
  } else if (apiData.monitorSysGenServerComponentEnabled !== undefined) {
    // 兼容直接使用 enabled 字段的情况
    formData.monitorSysGenServerComponentEnabled = 
      typeof apiData.monitorSysGenServerComponentEnabled === 'boolean' 
        ? apiData.monitorSysGenServerComponentEnabled 
        : apiData.monitorSysGenServerComponentEnabled === 1;
  } else {
    // 默认启用
    formData.monitorSysGenServerComponentEnabled = true;
  }

  // 如果有ID，则包含ID
  if (apiData.monitorSysGenServerComponentId) {
    formData.monitorSysGenServerComponentId = apiData.monitorSysGenServerComponentId;
  }

  return formData;
}

/**
 * 验证组件数据
 * @param formData 表单数据
 * @returns 验证结果
 */
export function validateComponentData(formData: ComponentFormData): ValidationResult {
  const errors: string[] = [];

  // 验证必填字段
  if (!formData.monitorSysGenServerComponentName || formData.monitorSysGenServerComponentName.trim() === '') {
    errors.push('组件名称不能为空');
  }

  if (!formData.monitorSysGenServerComponentType || formData.monitorSysGenServerComponentType.trim() === '') {
    errors.push('组件类型不能为空');
  }

  if (!formData.monitorSysGenServerId || formData.monitorSysGenServerId <= 0) {
    errors.push('服务器ID无效');
  }

  // 验证表达式相关字段
  if (formData.monitorSysGenServerComponentExpressionType && !formData.monitorSysGenServerComponentExpression) {
    errors.push('选择了表达式类型，必须填写表达式');
  }

  if (formData.monitorSysGenServerComponentExpression && !formData.monitorSysGenServerComponentExpressionType) {
    errors.push('填写了表达式，必须选择表达式类型');
  }

  // 验证刷新间隔
  if (formData.monitorSysGenServerComponentRefreshInterval !== undefined && formData.monitorSysGenServerComponentRefreshInterval < 0) {
    errors.push('刷新间隔不能为负数');
  }

  // 验证排序
  if (formData.monitorSysGenServerComponentSort !== undefined && formData.monitorSysGenServerComponentSort < 0) {
    errors.push('排序值不能为负数');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 获取组件类型显示名称
 * @param type 组件类型
 * @returns 显示名称
 */
export function getComponentTypeDisplayName(type: string): string {
  const typeMap: Record<string, string> = {
    card: '卡片',
    chart: '图表',
    table: '表格',
    gauge: '仪表盘',
    text: '文本',
    iframe: '内嵌页面',
    log: '日志',
    terminal: '终端'
  };

  return typeMap[type] || type;
}

/**
 * 获取组件类型标签颜色
 * @param type 组件类型
 * @returns 标签颜色类型
 */
export function getComponentTypeTagColor(type: string): string {
  const colorMap: Record<string, string> = {
    card: 'primary',
    chart: 'success',
    table: 'info',
    gauge: 'warning',
    text: '',
    iframe: 'success',
    log: 'info',
    terminal: 'warning'
  };

  return colorMap[type] || '';
}

/**
 * 获取表达式类型显示名称
 * @param type 表达式类型
 * @returns 显示名称
 */
export function getExpressionTypeDisplayName(type: string): string {
  const typeMap: Record<string, string> = {
    PROMETHEUS: 'Prometheus',
    INFLUXDB: 'InfluxDB',
    ELASTICSEARCH: 'Elasticsearch',
    CUSTOM: '自定义',
    STATIC: '静态值'
  };

  return typeMap[type] || type;
}

/**
 * 获取组件状态文本
 * @param status 状态值 (0: 禁用, 1: 启用)
 * @returns 状态文本
 */
export function getComponentStatusText(status?: number | boolean): string {
  if (typeof status === 'boolean') {
    return status ? '启用' : '禁用';
  }
  
  if (status === undefined || status === null) {
    return '未知';
  }
  
  return status === 1 ? '启用' : '禁用';
}

/**
 * 获取组件状态标签颜色类型
 * @param status 状态值 (0: 禁用, 1: 启用)
 * @returns 标签颜色类型
 */
export function getComponentStatusTagType(status?: number | boolean): string {
  if (typeof status === 'boolean') {
    return status ? 'success' : 'danger';
  }
  
  if (status === undefined || status === null) {
    return 'info';
  }
  
  return status === 1 ? 'success' : 'danger';
}

