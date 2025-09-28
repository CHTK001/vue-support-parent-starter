export interface PlatformConfigs {
  AdminRoles?: string[];
  OpsRoles?: string[];
  CardBody?: boolean;
  OpenAuth?: boolean;
  OpenSetting?: boolean;
  OpenTenantLogin?: boolean;
  OpenBaseLogin?: boolean;
  SfcScriptUrl?: string;
  RemoteAnimation?: boolean;
  MenuTransition?: boolean;
  contentMargin?: Number;
  RemoteLayout?: boolean;
  LayoutRadius?: number;
  LayoutBlur?: number;
  RemoteMenu?: boolean;
  StorageEncode?: boolean;
  ShowBarSetting?: boolean;
  ShowBarNotice?: boolean;
  ShowLanguage?: boolean;
  ShowBarSearch?: boolean;
  StorageKey?: string;
  SystemCode?: string;
  Version?: string;
  Title?: string;
  BaseUrl?: string;
  FixedHeader?: boolean;
  HiddenSideBar?: boolean;
  MultiTagsCache?: boolean;
  MaxTagsLevel?: number;
  KeepAlive?: boolean;
  Locale?: string;
  Layout?: string;
  Theme?: string;
  DarkMode?: boolean;
  OverallStyle?: string;
  Grey?: boolean;
  Weak?: boolean;
  Invert?: boolean;
  Monochrome?: boolean;
  HideTabs?: boolean;
  HideFooter?: boolean;
  Stretch?: boolean | number;
  SidebarStatus?: boolean;
  EpThemeColor?: string;
  ShowLogo?: boolean;
  ShowModel?: string;
  MenuArrowIconNoTransition?: boolean;
  CachingAsyncRoutes?: boolean;
  TooltipEffect?: Effect;
  ResponsiveStorageNameSpace?: string;
  MenuSearchHistory?: number;
  // 菜单设置相关配置
  ShowNewMenu?: boolean; // 是否显示新增菜单
  NewMenuText?: string; // 新菜单显示文本
  NewMenuTimeLimit?: number; // 新菜单显示时间限制（小时）
  // API版本配置
  apiVersion?: string; // API版本号
}
export type Effect = "light" | "dark";