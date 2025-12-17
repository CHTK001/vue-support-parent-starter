/**
 * 主题装饰元素配置
 * @author CH
 * @date 2025-12-13
 * @description 定义每个主题的装饰元素、位置、动画等配置
 */

/** 装饰元素位置 */
export type DecorationPosition = 'top' | 'bottom' | 'left' | 'right' | 'center' | 'custom';

/** 装饰元素类型 */
export type DecorationType = 'emoji' | 'icon' | 'svg' | 'particle';

/** 动画类型 */
export type AnimationType = 'swing' | 'wave' | 'float' | 'bounce' | 'rotate' | 'twinkle' | 'none';

/** 装饰元素配置接口 */
export interface DecorationConfig {
  /** 装饰元素内容（emoji、图标名称等） */
  content: string;
  /** 装饰元素类型 */
  type: DecorationType;
  /** 显示位置 */
  position: DecorationPosition;
  /** 定位类型（默认 absolute，可设为 fixed） */
  positionType?: 'absolute' | 'fixed';
  /** 自定义位置（当position为custom时使用） */
  customPosition?: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
  /** 大小 */
  size?: string;
  /** 动画类型 */
  animation?: AnimationType;
  /** 动画时长（秒） */
  animationDuration?: number;
  /** 动画延迟（秒） */
  animationDelay?: number;
  /** z-index */
  zIndex?: number;
  /** 是否可交互 */
  interactive?: boolean;
  /** 悬停时的动画 */
  hoverAnimation?: AnimationType;
  /** 点击时的动画 */
  clickAnimation?: AnimationType;
}

/** 目标组件类型 */
export type TargetComponent = 'lay-tag' | 'lay-header' | 'lay-sidebar' | 'lay-navbar' | 'lay-content' | 'global';

/** 主题装饰配置接口 */
export interface ThemeDecorationConfig {
  /** 主题键值 */
  themeKey: string;
  /** 主题名称 */
  themeName: string;
  /** 是否启用装饰 */
  enabled: boolean;
  /** 装饰元素列表 */
  decorations: {
    /** 目标组件 */
    target: TargetComponent;
    /** 装饰元素列表 */
    elements: DecorationConfig[];
  }[];
  /** 粒子效果配置（可选） */
  particles?: {
    enabled: boolean;
    type: 'fireworks' | 'snow' | 'confetti' | 'coins';
    count?: number;
    color?: string;
  };
}

/** 春节主题装饰配置 */
export const springFestivalDecorations: ThemeDecorationConfig = {
  themeKey: 'spring-festival',
  themeName: '春节',
  enabled: true,
  decorations: [
    {
      target: 'global',
      elements: [
        // 左侧灯笼 - 使用 fixed 定位挂在页面顶部左侧
        {
          content: '🏮',
          type: 'emoji',
          position: 'custom',
          positionType: 'fixed',
          customPosition: { top: '60px', left: '20px' },
          size: '55px',
          animation: 'swing',
          animationDuration: 3,
          animationDelay: 0,
          interactive: true,
          hoverAnimation: 'bounce',
          zIndex: 9999,
        },
        // 右侧灯笼 - 使用 fixed 定位挂在页面顶部右侧
        {
          content: '🏮',
          type: 'emoji',
          position: 'custom',
          positionType: 'fixed',
          customPosition: { top: '60px', right: '20px' },
          size: '55px',
          animation: 'swing',
          animationDuration: 2.8,
          animationDelay: 0.5,
          interactive: true,
          hoverAnimation: 'bounce',
          zIndex: 9999,
        }
      ]
    },
    {
      target: 'lay-header',
      elements: [
        // 左侧大的红灯笼
        {
          content: '🏮',
          type: 'emoji',
          position: 'custom',
          customPosition: { top: '10px', left: '80px' },
          size: '32px',
          animation: 'swing',
          animationDuration: 3.5,
          zIndex: 1000,
          interactive: true,
          hoverAnimation: 'bounce'
        },
        // 右侧大的红灯笼
        {
          content: '🏮',
          type: 'emoji',
          position: 'custom',
          customPosition: { top: '10px', right: '80px' },
          size: '32px',
          animation: 'swing',
          animationDuration: 3,
          zIndex: 1000,
          interactive: true,
          hoverAnimation: 'bounce'
        },
        // 中国结
        {
          content: '🎀',
          type: 'emoji',
          position: 'custom',
          customPosition: { top: '12px', left: '50%' },
          size: '28px',
          animation: 'rotate',
          animationDuration: 8,
          zIndex: 999,
          interactive: true,
          hoverAnimation: 'twinkle'
        },
        // 鹭炮
        {
          content: '🧨',
          type: 'emoji',
          position: 'custom',
          customPosition: { top: '12px', left: '180px' },
          size: '24px',
          animation: 'float',
          animationDuration: 4,
          zIndex: 998,
          interactive: true,
          hoverAnimation: 'rotate'
        },
        {
          content: '🧨',
          type: 'emoji',
          position: 'custom',
          customPosition: { top: '12px', right: '180px' },
          size: '24px',
          animation: 'float',
          animationDuration: 3.5,
          zIndex: 998,
          interactive: true,
          hoverAnimation: 'rotate'
        }
      ]
    },
    {
      target: 'lay-sidebar',
      elements: [
        {
          content: '🏮',
          type: 'emoji',
          position: 'custom',
          customPosition: { top: '20px', right: '12px' },
          size: '20px',
          animation: 'swing',
          animationDuration: 3,
          zIndex: 50,
          interactive: true,
          hoverAnimation: 'bounce'
        },
        {
          content: '🧨',
          type: 'emoji',
          position: 'custom',
          customPosition: { top: '100px', right: '10px' },
          size: '18px',
          animation: 'float',
          animationDuration: 4,
          zIndex: 49,
          interactive: true,
          hoverAnimation: 'rotate'
        }
      ]
    },
    {
      target: 'global',
      elements: [
        {
          content: '福',
          type: 'emoji',
          position: 'custom',
          customPosition: { top: '50%', left: '50px' },
          size: '80px',
          animation: 'none',
          zIndex: 0,
        }
      ]
    }
  ],
  particles: {
    enabled: true,
    type: 'fireworks',
    count: 5,
    color: '#f5222d',
  }
};


/** 圣诞主题装饰配置 */
export const christmasDecorations: ThemeDecorationConfig = {
  themeKey: 'christmas',
  themeName: '圣诞',
  enabled: true,
  decorations: [
    // 圣诞主题不需要 lay-tag 装饰
    {
      target: 'lay-header',
      elements: [
        // 左侧圣诞树
        {
          content: '🎄',
          type: 'emoji',
          position: 'custom',
          customPosition: { top: '8px', left: '85px' },
          size: '34px',
          animation: 'float',
          animationDuration: 3.5,
          zIndex: 1000,
          interactive: true,
          hoverAnimation: 'twinkle'
        },
        // 右侧圣诞老人
        {
          content: '🎅',
          type: 'emoji',
          position: 'custom',
          customPosition: { top: '10px', right: '85px' },
          size: '30px',
          animation: 'bounce',
          animationDuration: 2.5,
          zIndex: 1000,
          interactive: true,
          hoverAnimation: 'wave'
        },
        // 铃铛
        {
          content: '🔔',
          type: 'emoji',
          position: 'custom',
          customPosition: { top: '12px', left: '170px' },
          size: '24px',
          animation: 'swing',
          animationDuration: 2.2,
          zIndex: 999,
          interactive: true,
          hoverAnimation: 'rotate'
        },
        // 礼物
        {
          content: '🎁',
          type: 'emoji',
          position: 'custom',
          customPosition: { top: '12px', right: '170px' },
          size: '24px',
          animation: 'float',
          animationDuration: 3.2,
          zIndex: 999,
          interactive: true,
          hoverAnimation: 'bounce'
        },
        // 雪花
        {
          content: '❄️',
          type: 'emoji',
          position: 'custom',
          customPosition: { top: '14px', left: '50%' },
          size: '22px',
          animation: 'float',
          animationDuration: 4,
          zIndex: 998,
          interactive: true,
          hoverAnimation: 'twinkle'
        },
        // 额外的铃铛
        {
          content: '🔔',
          type: 'emoji',
          position: 'custom',
          customPosition: { top: '12px', right: '250px' },
          size: '20px',
          animation: 'swing',
          animationDuration: 2.8,
          zIndex: 997,
          interactive: true,
          hoverAnimation: 'rotate'
        }
      ]
    },
    {
      target: 'lay-sidebar',
      elements: [
        {
          content: '🎄',
          type: 'emoji',
          position: 'custom',
          customPosition: { top: '20px', right: '12px' },
          size: '24px',
          animation: 'float',
          animationDuration: 3.5,
          zIndex: 50,
          interactive: true,
          hoverAnimation: 'twinkle'
        },
        {
          content: '🔔',
          type: 'emoji',
          position: 'custom',
          customPosition: { top: '90px', right: '10px' },
          size: '18px',
          animation: 'swing',
          animationDuration: 2.5,
          zIndex: 49,
          interactive: true,
          hoverAnimation: 'rotate'
        },
        {
          content: '🎁',
          type: 'emoji',
          position: 'custom',
          customPosition: { top: '160px', right: '10px' },
          size: '18px',
          animation: 'float',
          animationDuration: 3,
          zIndex: 48,
          interactive: true,
          hoverAnimation: 'bounce'
        }
      ]
    }
  ],
  particles: {
    enabled: true,
    type: 'snow',
    count: 50,
    color: '#ffffff',
  }
};

/** 元旦主题装饰配置 - 冰雪蓝白清新风格 */
export const newYearDecorations: ThemeDecorationConfig = {
  themeKey: 'new-year',
  themeName: '元旦',
  enabled: true,
  decorations: [
    // 元旦主题 - 冰雪清新装饰
    {
      target: 'lay-header',
      elements: [
        // 左侧雪花
        {
          content: '❄️',
          type: 'emoji',
          position: 'custom',
          customPosition: { top: '10px', left: '90px' },
          size: '26px',
          animation: 'float',
          animationDuration: 4,
          zIndex: 1000,
          interactive: true,
          hoverAnimation: 'twinkle'
        },
        // 右侧雪花
        {
          content: '❄️',
          type: 'emoji',
          position: 'custom',
          customPosition: { top: '10px', right: '90px' },
          size: '26px',
          animation: 'float',
          animationDuration: 3.5,
          zIndex: 1000,
          interactive: true,
          hoverAnimation: 'twinkle'
        },
        // 中间星星
        {
          content: '✨',
          type: 'emoji',
          position: 'custom',
          customPosition: { top: '12px', left: '50%' },
          size: '22px',
          animation: 'twinkle',
          animationDuration: 2,
          zIndex: 999,
          interactive: true,
          hoverAnimation: 'bounce'
        },
        // 左侧冰晶
        {
          content: '💎',
          type: 'emoji',
          position: 'custom',
          customPosition: { top: '12px', left: '180px' },
          size: '20px',
          animation: 'twinkle',
          animationDuration: 3,
          zIndex: 998,
          interactive: true,
          hoverAnimation: 'rotate'
        },
        // 右侧冰晶
        {
          content: '💎',
          type: 'emoji',
          position: 'custom',
          customPosition: { top: '12px', right: '180px' },
          size: '20px',
          animation: 'twinkle',
          animationDuration: 2.8,
          zIndex: 998,
          interactive: true,
          hoverAnimation: 'rotate'
        }
      ]
    },
    {
      target: 'lay-sidebar',
      elements: [
        // 雪花装饰
        {
          content: '❄️',
          type: 'emoji',
          position: 'custom',
          customPosition: { top: '20px', right: '12px' },
          size: '20px',
          animation: 'float',
          animationDuration: 4,
          zIndex: 50,
          interactive: true,
          hoverAnimation: 'twinkle'
        },
        // 星星装饰
        {
          content: '✨',
          type: 'emoji',
          position: 'custom',
          customPosition: { top: '90px', right: '10px' },
          size: '18px',
          animation: 'twinkle',
          animationDuration: 2.5,
          zIndex: 49,
          interactive: true,
          hoverAnimation: 'bounce'
        }
      ]
    }
  ],
  particles: {
    enabled: true,
    type: 'snow',
    count: 35,
    color: '#7CC2E8',
  }
};

/** 中秋主题装饰配置 */
export const midAutumnDecorations: ThemeDecorationConfig = {
  themeKey: 'mid-autumn',
  themeName: '中秋',
  enabled: true,
  decorations: [
    {
      target: 'lay-tag',
      elements: [
        // 中秋：左侧月亮 - 挂在标签栏底部下方
        {
          content: '🌕',
          type: 'emoji',
          position: 'custom',
          customPosition: { bottom: '-75px', left: '50px' },
          size: '60px',
          animation: 'float',
          animationDuration: 5,
          zIndex: 500, // 低于tags-view(1000)，高于content
          interactive: true,
          hoverAnimation: 'twinkle',
        },
        // 右侧月亮
        {
          content: '🌕',
          type: 'emoji',
          position: 'custom',
          customPosition: { bottom: '-75px', right: '50px' },
          size: '60px',
          animation: 'float',
          animationDuration: 4.5,
          animationDelay: 0.5,
          zIndex: 500, // 低于tags-view(1000)，高于content
          interactive: true,
          hoverAnimation: 'twinkle',
        }
      ]
    },
    {
      target: 'lay-header',
      elements: [
        // 左侧月亮
        {
          content: '🌕',
          type: 'emoji',
          position: 'custom',
          customPosition: { top: '8px', left: '90px' },
          size: '32px',
          animation: 'float',
          animationDuration: 5,
          zIndex: 1000,
          interactive: true,
          hoverAnimation: 'twinkle'
        },
        // 右侧小兔子
        {
          content: '🐰',
          type: 'emoji',
          position: 'custom',
          customPosition: { top: '10px', right: '90px' },
          size: '28px',
          animation: 'bounce',
          animationDuration: 2.5,
          zIndex: 1000,
          interactive: true,
          hoverAnimation: 'float'
        },
        // 中间月饼
        {
          content: '🥮',
          type: 'emoji',
          position: 'custom',
          customPosition: { top: '12px', left: '50%' },
          size: '26px',
          animation: 'rotate',
          animationDuration: 6,
          zIndex: 999,
          interactive: true,
          hoverAnimation: 'bounce'
        },
        // 星星点缀
        {
          content: '⭐',
          type: 'emoji',
          position: 'custom',
          customPosition: { top: '14px', left: '180px' },
          size: '22px',
          animation: 'twinkle',
          animationDuration: 2,
          zIndex: 998,
          interactive: true,
          hoverAnimation: 'rotate'
        },
        {
          content: '⭐',
          type: 'emoji',
          position: 'custom',
          customPosition: { top: '14px', right: '180px' },
          size: '22px',
          animation: 'twinkle',
          animationDuration: 1.8,
          zIndex: 998,
          interactive: true,
          hoverAnimation: 'rotate'
        }
      ]
    },
    {
      target: 'lay-sidebar',
      elements: [
        {
          content: '🌕',
          type: 'emoji',
          position: 'custom',
          customPosition: { top: '20px', right: '12px' },
          size: '24px',
          animation: 'float',
          animationDuration: 5,
          zIndex: 50,
          interactive: true,
          hoverAnimation: 'twinkle'
        },
        {
          content: '🐰',
          type: 'emoji',
          position: 'custom',
          customPosition: { top: '90px', right: '10px' },
          size: '20px',
          animation: 'bounce',
          animationDuration: 2.5,
          zIndex: 49,
          interactive: true,
          hoverAnimation: 'float'
        },
        {
          content: '🥮',
          type: 'emoji',
          position: 'custom',
          customPosition: { top: '160px', right: '10px' },
          size: '18px',
          animation: 'rotate',
          animationDuration: 5,
          zIndex: 48,
          interactive: true,
          hoverAnimation: 'bounce'
        }
      ]
    }
  ],
  particles: {
    enabled: false,
  }
};

/** 默认主题装饰配置（无装饰） */
export const defaultDecorations: ThemeDecorationConfig = {
  themeKey: 'default',
  themeName: '默认',
  enabled: false,
  decorations: [],
};

/** 所有主题装饰配置映射 */
export const themeDecorationsMap: Record<string, ThemeDecorationConfig> = {
  'default': defaultDecorations,
  'spring-festival': springFestivalDecorations,
  'christmas': christmasDecorations,
  'new-year': newYearDecorations,
  'mid-autumn': midAutumnDecorations,
};

/**
 * 获取主题装饰配置
 * @param themeKey 主题键值
 */
export function getThemeDecorations(themeKey: string): ThemeDecorationConfig {
  return themeDecorationsMap[themeKey] || defaultDecorations;
}

/**
 * 获取指定组件的装饰配置
 * @param themeKey 主题键值
 * @param target 目标组件
 */
export function getComponentDecorations(
  themeKey: string,
  target: TargetComponent
): DecorationConfig[] {
  const themeConfig = getThemeDecorations(themeKey);
  const targetConfig = themeConfig.decorations.find(d => d.target === target);
  return targetConfig?.elements || [];
}
