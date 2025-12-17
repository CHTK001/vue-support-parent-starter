/**
 * Layout 主题皮肤配置
 * @author CH
 * @date 2025-12-12
 * @version 2.0.0
 */

/**
 * 主题类型
 */
export enum ThemeType {
  /** 常规主题：一直显示，不受节日自动切换影响 */
  REGULAR = 'regular',
  /** 节日主题：在关闭自动切换时显示 */
  FESTIVAL = 'festival',
  /** 内测主题：仅开发/测试环境或superadmin权限显示 */
  BETA = 'beta',
}

/**
 * 主题配置接口
 */
export interface LayoutTheme {
  /** 主题名称 */
  name: string;
  /** 主题键值 */
  key: string;
  /** 主题描述 */
  description: string;
  /** 主题类型 */
  type: ThemeType;
  /** 样式表文件 */
  stylesheet?: string;
  /** 主题颜色 */
  color?: string;
  /** 主题图标 */
  icon?: string;
  /** 所需权限角色列表（仅对BETA主题生效） */
  requiredRoles?: string[];
}

/**
 * 主题皮肤列表
 */
export const layoutThemes: LayoutTheme[] = [
  {
    name: "默认",
    key: "default",
    description: "系统默认配色方案",
    type: ThemeType.REGULAR,
    color: "#409EFF",
    icon: "ri:contrast-2-line",
  },
  {
    name: "元旦",
    key: "new-year",
    description: "新年新气象，蓝紫渐变",
    type: ThemeType.FESTIVAL,
    stylesheet: "new-year.css",
    color: "#1890ff",
    icon: "noto:party-popper",
  },
  {
    name: "春节",
    key: "spring-festival",
    description: "喜庆祥和的红色主题",
    type: ThemeType.FESTIVAL,
    stylesheet: "spring-festival.css",
    color: "#f5222d",
    icon: "noto:firecracker",
  },
  {
    name: "中秋",
    key: "mid-autumn",
    description: "月圆人团圆的青色主题",
    type: ThemeType.FESTIVAL,
    stylesheet: "mid-autumn.css",
    color: "#13c2c2",
    icon: "noto:full-moon",
  },
  {
    name: "圣诞",
    key: "christmas",
    description: "温馨浪漫的圣诞主题",
    type: ThemeType.FESTIVAL,
    stylesheet: "christmas.css",
    color: "#c41e3a",
    icon: "noto:christmas-tree",
  },
  {
    name: "赛博朋克",
    key: "cyberpunk",
    description: "未来科技风格，内测中",
    type: ThemeType.BETA,
    color: "#00ffff",
    icon: "ri:code-s-slash-line",
    requiredRoles: [], // 开发/测试环境或superadmin可访问
  },
];

/**
 * 获取主题皮肤
 * @param themeKey 主题键值
 */
export const getLayoutTheme = (themeKey: string = "default"): LayoutTheme => {
  const theme = layoutThemes.find((t) => t.key === themeKey);
  return theme || layoutThemes[0];
};

/**
 * 加载主题皮肤样式表
 * @deprecated 现在使用组件化主题，不需要CSS文件
 * @param themeKey 主题键值
 */
export const loadThemeStylesheet = async (themeKey: string): Promise<void> => {
  // 组件化主题不需要加载CSS文件
  console.log(`Theme switched to: ${themeKey}`);
};

/**
 * 统一应用主题（移除旧类并加载样式）
 */
export const THEME_CLASS_LIST = [
  'theme-christmas',
  'theme-spring-festival',
  'theme-mid-autumn',
  'theme-new-year',
  'theme-cyberpunk',
];

/**
 * 应用布局主题（使用 data-skin 属性）
 * @param themeKey 主题键值
 */
export const applyLayoutTheme = (themeKey: string): void => {
  const htmlEl = document.documentElement;
  
  // 使用 data-skin 属性而不是 class
  htmlEl.setAttribute('data-skin', themeKey);
  
  console.log(`✅ 主题已应用: data-skin="${themeKey}"`);
  
  // 不再需要动态加载CSS，所有主题样式已经在 @repo/skin 中加载
};

/**
 * 检查用户是否有权限查看指定主题
 * @param theme 主题配置
 * @param userRoles 用户角色列表
 * @param isDev 是否为开发环境
 * @param isTest 是否为测试环境
 */
export const canAccessTheme = (
  theme: LayoutTheme,
  userRoles: string[] = [],
  isDev: boolean = false,
  isTest: boolean = false
): boolean => {
  // superadmin 拥有最高权限，不受任何限制
  if (userRoles.includes('superadmin')) {
    return true;
  }
  
  // 常规主题和节日主题，所有用户都可以访问
  if (theme.type === ThemeType.REGULAR || theme.type === ThemeType.FESTIVAL) {
    return true;
  }
  
  // 内测主题需要特殊权限
  if (theme.type === ThemeType.BETA) {
    // 开发或测试环境可以访问
    if (isDev || isTest) {
      return true;
    }
    
    // 检查用户角色（除superadmin外的其他角色）
    if (theme.requiredRoles && theme.requiredRoles.length > 0) {
      return theme.requiredRoles.some(role => userRoles.includes(role));
    }
  }
  
  return false;
};

/**
 * 获取可用的主题列表（根据权限和环境过滤）
 * @param enableFestivalTheme 是否开启节日主题自动切换
 * @param userRoles 用户角色列表
 * @param isDev 是否为开发环境
 * @param isTest 是否为测试环境
 */
export const getAvailableThemes = (
  enableFestivalTheme: boolean = false,
  userRoles: string[] = [],
  isDev: boolean = false,
  isTest: boolean = false
): LayoutTheme[] => {
  return layoutThemes.filter(theme => {
    // 1. 检查权限
    if (!canAccessTheme(theme, userRoles, isDev, isTest)) {
      return false;
    }
    
    // 2. 常规主题：无论是否开启节日自动切换，都始终显示
    if (theme.type === ThemeType.REGULAR) {
      return true;
    }
    
    // 3. 内测主题：无论是否开启节日自动切换，都始终显示（已经通过权限检查）
    if (theme.type === ThemeType.BETA) {
      return true;
    }
    
    // 4. 节日主题：只在关闭节日自动切换时显示，开启时隐藏（由系统自动控制）
    if (theme.type === ThemeType.FESTIVAL) {
      return !enableFestivalTheme;
    }
    
    return false;
  });
};

/**
 * 检测当前是否为节日期间，自动返回对应的主题
 */
export const detectFestivalTheme = (): LayoutTheme | null => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  // 元旦（1月1日-1月3日）
  if (month === 1 && day >= 1 && day <= 3) {
    return layoutThemes.find((t) => t.key === "new-year") || null;
  }

  // 春节（农历正月初一前后15天，这里简化为公历1月20日-2月20日）
  if ((month === 1 && day >= 20) || (month === 2 && day <= 20)) {
    return layoutThemes.find((t) => t.key === "spring-festival") || null;
  }

  // 中秋（农历八月十五前后7天，这里简化为公历9月10日-9月25日）
  if (month === 9 && day >= 10 && day <= 25) {
    return layoutThemes.find((t) => t.key === "mid-autumn") || null;
  }

  // 圣诞（12月15日-12月31日）
  if (month === 12 && day >= 15) {
    return layoutThemes.find((t) => t.key === "christmas") || null;
  }

  return null;
};
