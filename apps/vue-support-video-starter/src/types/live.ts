/**
 * 直播频道领域类型
 *
 * 与后端 spring-api-support-common-video-starter 的 LiveGroup / LiveChannel 对应。
 */

/** 直播分组 */
export interface LiveGroup {
  id: string;
  label: string;
  /** 是否央视分组 */
  cctv: boolean;
  sort: number;
  /** 分组内频道数量 */
  count: number;
}

/** 直播频道 */
export interface LiveChannel {
  id: string;
  name: string;
  group: string;
  groupLabel?: string;
  /** 是否央视分组 */
  cctv: boolean;
  sort: number;
  /** 候选流地址（m3u8），按优先级排列 */
  sources: string[];
  /** 候选流数量 */
  sourceCount?: number;
}

/** 直播频道查询参数 */
export interface LiveQuery {
  group?: string;
  cctv?: boolean;
}
