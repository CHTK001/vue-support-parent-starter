/**
 * 主题装饰元素配置
 * @author CH
 * @date 2025-12-13
 * @description 装饰功能已移除，保留接口定义以保持兼容性
 */

/** 装饰元素位置 */
export type DecorationPosition = 'top' | 'bottom' | 'left' | 'right' | 'center' | 'custom';

/** 装饰元素类型 */
export type DecorationType = 'emoji' | 'icon' | 'svg' | 'particle';

/** 动画类型 */
export type AnimationType = 'swing' | 'wave' | 'float' | 'bounce' | 'rotate' | 'twinkle' | 'none';

/** 装饰元素配置接口 */
export interface DecorationConfig {
  content: string;
  type: DecorationType;
  position: DecorationPosition;
  positionType?: 'absolute' | 'fixed';
  customPosition?: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
  size?: string;
  animation?: AnimationType;
  animationDuration?: number;
  animationDelay?: number;
  zIndex?: number;
  interactive?: boolean;
  hoverAnimation?: AnimationType;
  clickAnimation?: AnimationType;
}

/** 目标组件类型 */
export type TargetComponent = 'lay-tag' | 'lay-header' | 'lay-sidebar' | 'lay-navbar' | 'lay-content' | 'global';

/** 主题装饰配置接口 */
export interface ThemeDecorationConfig {
  themeKey: string;
  themeName: string;
  enabled: boolean;
  decorations: {
    target: TargetComponent;
    elements: DecorationConfig[];
  }[];
  particles?: {
    enabled: boolean;
    type: 'fireworks' | 'snow' | 'confetti' | 'coins';
    count?: number;
    color?: string;
  };
}

/** 默认主题装饰配置（无装饰） */
export const defaultDecorations: ThemeDecorationConfig = {
  themeKey: 'default',
  themeName: '默认',
  enabled: false,
  decorations: [],
};

/** 所有主题装饰配置映射（已清空） */
export const themeDecorationsMap: Record<string, ThemeDecorationConfig> = {
  'default': defaultDecorations,
};

/**
 * 获取主题装饰配置
 * @param themeKey 主题键值
 * @returns 始终返回无装饰的默认配置
 */
export function getThemeDecorations(themeKey: string): ThemeDecorationConfig {
  return defaultDecorations;
}

/**
 * 获取指定组件的装饰配置
 * @param themeKey 主题键值
 * @param target 目标组件
 * @returns 始终返回空数组
 */
export function getComponentDecorations(
  themeKey: string,
  target: TargetComponent
): DecorationConfig[] {
  return [];
}
