/**
 * 主题装饰元素配置
 * @deprecated 装饰功能已废弃，该文件仅保留类型定义以保持向后兼容
 */

/** 目标组件类型 */
export type TargetComponent = 'lay-tag' | 'lay-header' | 'lay-sidebar' | 'lay-navbar' | 'lay-content' | 'global';

/** 装饰元素配置接口（简化版） */
export interface DecorationConfig {
  content: string;
  type: string;
  position: string;
}

/**
 * 获取指定组件的装饰配置
 * @deprecated 装饰功能已废弃
 * @returns 始终返回空数组
 */
export function getComponentDecorations(
  _themeKey: string,
  _target: TargetComponent
): DecorationConfig[] {
  return [];
}
