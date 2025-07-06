/**
 * 组件字段映射工具
 * 用于处理前端表单字段和后端API字段之间的转换
 */

import type { ServerComponent } from '@/api/server';

/**
 * 前端表单数据接口
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
  monitorSysGenServerComponentEnabled: boolean;
}

/**
 * 将前端表单数据转换为后端API数据
 * @param formData 前端表单数据
 * @returns 后端API数据
 */
export function convertFormDataToApiData(formData: ComponentFormData): ServerComponent {
  const apiData: ServerComponent = {
    ...formData,
    // 将前端的 enabled 布尔值转换为后端的 status 数字值
    monitorSysGenServerComponentStatus: formData.monitorSysGenServerComponentEnabled ? 1 : 0
  };

  // 移除前端专用字段
  delete (apiData as any).monitorSysGenServerComponentEnabled;

  return apiData;
}

/**
 * 将后端API数据转换为前端表单数据
 * @param apiData 后端API数据
 * @returns 前端表单数据
 */
export function convertApiDataToFormData(apiData: ServerComponent): ComponentFormData {
  return {
    ...apiData,
    // 将后端的 status 数字值转换为前端的 enabled 布尔值
    monitorSysGenServerComponentEnabled: apiData.monitorSysGenServerComponentStatus === 1,
    // 确保必填字段有默认值
    monitorSysGenServerId: apiData.monitorSysGenServerId || 0,
    monitorSysGenServerComponentName: apiData.monitorSysGenServerComponentName || '',
    monitorSysGenServerComponentType: apiData.monitorSysGenServerComponentType || 'card'
  };
}

/**
 * 验证组件数据完整性
 * @param data 组件数据
 * @returns 验证结果
 */
export function validateComponentData(data: Partial<ServerComponent>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.monitorSysGenServerComponentName?.trim()) {
    errors.push('组件名称不能为空');
  }

  if (!data.monitorSysGenServerComponentType?.trim()) {
    errors.push('组件类型不能为空');
  }

  if (!data.monitorSysGenServerId) {
    errors.push('服务器ID不能为空');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 获取组件状态显示文本
 * @param status 状态值
 * @returns 显示文本
 */
export function getComponentStatusText(status?: number): string {
  return status === 1 ? '启用' : '禁用';
}

/**
 * 获取组件状态标签类型
 * @param status 状态值
 * @returns 标签类型
 */
export function getComponentStatusTagType(status?: number): 'success' | 'danger' {
  return status === 1 ? 'success' : 'danger';
}

/**
 * 获取组件类型显示名称
 * @param type 组件类型
 * @returns 显示名称
 */
export function getComponentTypeDisplayName(type: string): string {
  const typeMap: Record<string, string> = {
    'card': '卡片',
    'gauge': '仪表盘',
    'line': '折线图',
    'bar': '柱状图',
    'pie': '饼图'
  };
  return typeMap[type] || type;
}

/**
 * 获取组件类型标签颜色
 * @param type 组件类型
 * @returns 标签颜色
 */
export function getComponentTypeTagColor(type: string): string {
  const colorMap: Record<string, string> = {
    'card': 'primary',
    'gauge': 'success',
    'line': 'info',
    'bar': 'warning',
    'pie': 'danger'
  };
  return colorMap[type] || 'info';
}

/**
 * 获取表达式类型显示名称
 * @param type 表达式类型
 * @returns 显示名称
 */
export function getExpressionTypeDisplayName(type?: string): string {
  const typeMap: Record<string, string> = {
    'PROMETHEUS': 'PromQL',
    'SQL': 'SQL',
    'COMPONENT': '组件'
  };
  return typeMap[type || 'COMPONENT'] || '未知';
}
