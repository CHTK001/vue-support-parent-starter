const settings = {
  // ===== 布局 =====
  asideMenuCollapseWidth: "64px",
  columnMenuCollapseWidth: "64px",
  columnWidth: 80,
  menuAnimate: true,
  layout: "vertical" as const,
  sidebarStatus: "expanded" as const,

  // ===== Logo =====
  logoShow: true,
  loginTitleSize: 18,
  logoSize: 32,
  logoTitleAnimate: true,

  // ===== 尺寸 =====
  menuWidth: 210,
  headerHeight: 56,

  // ===== 菜单 =====
  isCollapse: false,
  uniqueOpened: true,

  // ===== 主题/外观 =====
  theme: "light" as const,
  themeColor: "#2992FF",
  overallStyle: "light" as const,
  dimension: "default",
  transition: "fade-default",

  // ===== 多页签 =====
  showModel: "chrome" as const,
  tabsCache: true,
  tabsStyle: "google" as const,
  tabsDraggable: true,
  tabsShowIcon: true,
  tabsShowClose: true,
  tabsMaxCount: 16,

  // ===== Header 工具栏 =====
  asideBorder: true,
  fixedHeader: true,
  showBreadCrumb: true,
  showBreadcrumbIcon: true,

  // 顶部 Toolbar 各项子开关
  showHeaderToolbar: true,
  showCollapseButton: true,
  showRefreshButton: true,
  showFullScreenButton: true,
  showThemeButton: true,
  showSearchMenu: true,
  showLanguage: true,
  showDarkToggle: true,
  showMessageCenter: false,
  showTaskCenter: false,

  // ===== 语言 =====
  language: "zh-CN",

  // ===== 路由 =====
  HomeUrl: "/home",
  LoginUrl: "/login"
};

export default settings;