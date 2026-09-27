/**
 * 公告接口注册表
 *
 * 公告数据属于业务能力（@pages/system），而主题包位于框架层，不得反向依赖
 * pages/*。因此此处只定义契约与注册点：由应用在启动时注入具体实现，
 * AnnouncementBar 通过 getAnnouncementApi 取用；未注册时静默跳过、不发请求。
 *
 * 设计约束：与 themeInstallers 一致，本模块不 import 任何业务包，
 * 避免 @repo/theme 与 @pages/* 形成循环依赖。
 */

/** 公告条目：与 AnnouncementBar 消费的字段保持一致 */
export interface AnnouncementItem {
  /** 公告主键 */
  sysAnnouncementId: number;
  /** 公告标题 */
  sysAnnouncementTitle: string;
  /** 公告正文 */
  sysAnnouncementContent: string;
  /** 级别：info / warning / important / emergency */
  sysAnnouncementLevel: string;
  /** 展示位置：fixed-top / default 等 */
  sysAnnouncementPosition: string;
  /** 点击跳转地址，可为空 */
  sysAnnouncementTargetUrl: string;
}

/** 公告接口契约：由应用侧注入实现 */
export interface AnnouncementApi {
  /**
   * 查询当前用户可见的活跃公告
   *
   * @return 接口响应；data 为公告列表
   */
  getActiveAnnouncements(): Promise<{ data?: AnnouncementItem[] } | null | undefined>;

  /**
   * 标记公告已读（幂等，best-effort）
   *
   * @param id 公告主键
   * @return 接口响应
   */
  markAnnouncementRead(id: number): Promise<unknown>;
}

/** 已注入的实现；未注入时为 null */
let provider: AnnouncementApi | null = null;

/**
 * 注入公告接口实现（应用启动时调用一次）
 *
 * @param api 公告接口实现
 * @return 无返回值
 */
export function registerAnnouncementApi(api: AnnouncementApi): void {
  provider = api;
}

/**
 * 获取已注入的公告接口实现
 *
 * @return 实现；未注入时返回 null
 */
export function getAnnouncementApi(): AnnouncementApi | null {
  return provider;
}
