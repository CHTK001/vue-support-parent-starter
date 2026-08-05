// 用来配置项目的Logo、标题等设置

/** 安全读取 vite 环境变量（非 vite 环境或未配置时返回默认值） */
const env = (key: string, fallback = ""): string => {
  const meta = import.meta as unknown as { env?: Record<string, string> };
  const value = meta.env?.[key];
  return value ?? fallback;
};

export default {
  /**
   * 网页标题
   */
  logoTitle: env("VITE_WEB_TITLE", "ADMIN"),

  /**
   * 网页英文标题
   */
  logoEnTitle: env("VITE_WEB_EN_TITLE", "ADMIN"),

  /**
   * 网页标题大小
   */
  loginTitleSize: 18,

  /**
   * 登录页面标题
   */
  loginTitle: env("VITE_LOGIN_TITLE", "ADMIN"),

  /**
   * 登录页面英文标题
   */
  loginEnTitle: env("VITE_LOGIN_EN_TITLE", "ADMIN"),

  /**
   * Logo大小
   */
  logoSize: "34px",

  /**
   * Logo地址
   */
  // logoUrl: "./src/assets/images/logo/logo.webp",

  /**
   * 是否显示Logo和网页标题[true-显示，false-隐藏]
   */
  logoShow: true,

  /**
   * 管理平台标题动画
   */
  logoTitleAnimate: "",

  /**
   * 左侧菜单动画
   */
  menuAnimate: "animate__animated animate__fadeInLeft",

  /**
   * 左侧折叠宽度
   */
  asideMenuCollapseWidth: "56px",

  /**
   * 左侧悬浮折叠宽度
   */
  asideMenuHoverCollapse: "60px",

  /**
   * 左侧折叠宽度[双栏布局]
   */
  columnMenuCollapseWidth: "56px",

  /**
   * 左侧悬浮折叠宽度[双栏布局]
   */
  columnMenuHoverCollapse: "56px"
};
