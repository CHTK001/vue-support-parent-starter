import type { PlatformConfigs } from "../types/config";
export const globalSetting: PlatformConfigs = {
  adminRoles: ["ADMIN", "SUPER_ADMIN"], // 管理员角色列表
  storageEncode: true, //缓存是否加密
  remoteAnimation: true, //开启远程动画
  openAuth: true, //开启鉴权
  remoteLayout: false, //开启远程布局
  remoteMenu: false, //开启远程菜单
  menuTransition: false, //开启动画
  layoutRadius: 10, // 圆角
  layoutBlur: 10, // 模糊程度
  showBarSetting: false, //是否显示设置
  showBarNotice: false, //是否显示通知
  showLanguage: true, //是否显示语言切换: false, //是否显示通知
  showBarSearch: true, //是否显示查询
  systemCode: "system", // 平台名称
  storageKey: "2XNN4K8LC0ELVWN4", // 缓存加密密钥
  baseUrl: "",
  Version: "0.7.0", // 平台版本号
  Title: "代理管理", // 平台标题
  FixedHeader: true, // 是否固定页头和标签页（true 内容区超出出现纵向滚动条 false 页头、标签页、内容区可纵向滚动）
  HiddenSideBar: false, // 隐藏菜单和页头，只显示标签页和内容区
  MultiTagsCache: false, // 是否开启持久化标签 （会缓存）
  KeepAlive: true, // 是否开启组件缓存（此处不同于路由的 keepAlive，如果此处为 true 表示设置路由的 keepAlive 起效，反之设置 false 屏蔽平台整体的 keepAlive，即使路由设置了keepAlive 也不再起作用）
  Locale: "zh-CN", // 默认国际化语言 （zh 中文、en 英文）（会缓存）
  Layout: "vertical", // 导航菜单模式 （vertical 左侧菜单模式、horizontal 顶部菜单模式、mix 混合菜单模式、double 左侧双栏菜单模式）（会缓存）
  Theme: "light", // 主题模式（会缓存）
  DarkMode: false, // 是否开启暗黑模式 （会缓存）
  OverallStyle: "light", // 整体风格（浅色：light、深色：dark、自动：system）（会缓存）更多详情看 https://github.com/pure-admin/vue-pure-admin/commit/dd783136229da9e291b518df93227111f4216ad0#commitcomment-137027417
  Grey: false, // 灰色模式（会缓存）
  Weak: false, // 色弱模式（会缓存）
  HideTabs: false, // 是否隐藏标签页（会缓存）
  HideFooter: true, // 是否隐藏页脚（会缓存）
  SidebarStatus: true, // vertical左侧菜单模式模式下侧边栏状态（true 展开、false 收起）（会缓存）
  EpThemeColor: "#409EFF", // 主题色（会缓存）
  ShowLogo: true, // 是否显示logo（会缓存）
  ShowModel: "google", // 标签页风格（smart 灵动模式、card 卡片模式）（会缓存）
  MenuArrowIconNoTransition: false, // 菜单展开、收起图标是否开启动画，如遇菜单展开、收起卡顿设置成 true 即可（默认 false，开启动画）
  CachingAsyncRoutes: true, // 是否开启动态路由缓存本地的全局配置，默认 false
  TooltipEffect: "light", // 可配置平台主体所有 el-tooltip 的 effect 属性，默认 light，不会影响业务代码
  ResponsiveStorageNameSpace: "responsive-", // 本地响应式存储的命名空间
  MenuSearchHistory: 6, // 菜单搜索历史的最大条目
};

const settingStorage = {
  token: null,
};
