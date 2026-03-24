import { http, type ReturnResult } from "@repo/utils";

/**
 * 节假日数据接口
 * @author CH
 * @since 2025/1/20
 * @version 1.0.0
 */
export interface SysHoliday {
  /** 节假日ID */
  sysHolidayId?: number;
  /** 节假日年份 */
  sysHolidayYear: number;
  /** 节假日日期 */
  sysHolidayDate: string;
  /** 节假日名称 */
  sysHolidayName: string;
  /** 是否节假日 */
  sysHolidayIsHoliday: boolean;
}

/**
 * 节假日查询参数接口
 * @author CH
 * @since 2025/1/20
 * @version 1.0.0
 */
export interface HolidayQueryParams {
  /** 年份，可选参数 */
  year?: number;
}

/**
 * 获取节假日列表
 * @param params 查询参数
 * @returns 节假日列表
 * @author CH
 * @since 2025/1/20
 * @version 1.0.0
 */
export const fetchHolidayList = (params?: HolidayQueryParams): Promise<ReturnResult<SysHoliday[]>> => {
  return http.request<SysHoliday[]>("get", "/v2/holiday/get", { params });
};

/**
 * 同步节假日数据
 * @returns 同步结果
 * @author CH
 * @since 2025/1/20
 * @version 1.0.0
 */
export const syncHolidayData = (): Promise<ReturnResult<boolean>> => {
  return http.request<boolean>("get", "/v2/holiday/sync");
};