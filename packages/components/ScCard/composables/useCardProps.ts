/**
 * ScCard Props 计算 Composable
 * 根据不同布局类型生成对应的组件属性
 */
import { computed, type ComputedRef } from 'vue';

export interface ScCardBaseProps {
  title: string;
  hoverable: boolean;
  shadow: string;
  borderPosition: string;
}

export interface ScCardProps extends ScCardBaseProps {
  layout: string;
  renderAs: string;
  padding: string;
  // Media layout
  mediaPosition?: string;
  mediaWidth?: string | number;
  mediaHeight?: string | number;
  mediaBgColor?: string;
  // Header-content layout
  headerHeight?: string | number;
  headerBgColor?: string;
  headerBgImage?: string;
  // Panel-3d / Tech layout
  icon?: string;
  showHeader?: boolean;
  active?: boolean;
  depth?: number;
  theme?: string;
  backgroundColor?: string;
  borderColor?: string;
  activeBorderColor?: string;
  // Compact layout
  subtitle?: string;
  iconBgColor?: string;
  // Stats layout
  value?: string | number;
  label?: string;
  trendIcon?: string;
  trendText?: string;
  counting?: boolean;
  size?: string;
  // Custom layout
  customComponent?: object | null;
}

// Tech 主题映射表（静态常量，避免每次重新创建）
const TECH_THEME_MAP: Record<string, string> = {
  default: 'cyan',
  primary: 'blue',
  success: 'green',
  warning: 'orange',
  danger: 'red',
  info: 'blue',
  blue: 'blue',
  green: 'green',
  purple: 'purple',
  orange: 'orange',
  cyan: 'cyan',
  red: 'red',
  custom: 'cyan',
};

// 布局属性生成器映射
const layoutPropsGenerators: Record<string, (props: ScCardProps, baseProps: ScCardBaseProps) => Record<string, any>> = {
  media: (props, baseProps) => ({
    ...baseProps,
    mediaPosition: props.mediaPosition,
    mediaWidth: props.mediaWidth,
    mediaHeight: props.mediaHeight,
    mediaBgColor: props.mediaBgColor,
  }),
  
  'header-content': (props, baseProps) => ({
    ...baseProps,
    headerHeight: props.headerHeight,
    headerBgColor: props.headerBgColor,
    headerBgImage: props.headerBgImage,
  }),
  
  'panel-3d': (props, baseProps) => ({
    ...baseProps,
    icon: props.icon,
    showHeader: props.showHeader,
    active: props.active,
    depth: props.depth,
    theme: props.theme,
    backgroundColor: props.backgroundColor,
    borderColor: props.borderColor,
    activeBorderColor: props.activeBorderColor,
    padding: props.padding,
  }),
  
  compact: (props, baseProps) => ({
    ...baseProps,
    icon: props.icon,
    subtitle: props.subtitle,
    iconBgColor: props.iconBgColor,
    active: props.active,
    theme: props.theme,
  }),
  
  stats: (props, baseProps) => ({
    ...baseProps,
    icon: props.icon,
    value: props.value,
    label: props.label,
    trendIcon: props.trendIcon,
    trendText: props.trendText,
    counting: props.counting,
    active: props.active,
    theme: props.theme,
    size: props.size === 'normal' ? 'small' : props.size,
  }),
  
  'stats-simple': (props, baseProps) => ({
    ...baseProps,
    icon: props.icon,
    value: props.value,
    label: props.label,
    theme: props.theme,
  }),
  
  tech: (props, baseProps) => ({
    ...baseProps,
    icon: props.icon,
    showHeader: props.showHeader,
    active: props.active,
    theme: TECH_THEME_MAP[props.theme || 'default'] || 'cyan',
    padding: props.padding,
    showDataFlow: true,
  }),
  
  custom: (props, baseProps) => ({
    ...baseProps,
    ...props,
  }),
};

export function useCardProps(props: ScCardProps): ComputedRef<Record<string, any>> {
  return computed(() => {
    const baseProps: ScCardBaseProps = {
      title: props.title,
      hoverable: props.hoverable,
      shadow: props.shadow,
      borderPosition: props.borderPosition,
    };

    // el-card 特殊处理
    if (props.renderAs === 'el-card') {
      return {
        header: props.title,
        shadow: props.shadow,
        bodyStyle: props.padding ? { padding: props.padding } : {},
      };
    }

    // 使用映射表获取生成器
    const generator = layoutPropsGenerators[props.layout];
    if (generator) {
      return generator(props, baseProps);
    }

    // 默认返回基础属性
    return baseProps;
  });
}
