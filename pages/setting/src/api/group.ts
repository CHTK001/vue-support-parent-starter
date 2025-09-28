import { http, type ReturnResult } from "@repo/utils";

/**
 * 配置组
 * 表名: sys_setting_group
 */
export interface SysSettingGroup {
  /** 主键 */
  sysSettingGroupId?: number;

  /** 名称 */
  sysSettingGroupName?: string;

  /** 唯一编码 */
  sysSettingGroupCode?: string;

  /** 图标 */
  sysSettingGroupIcon?: string;

  /** 是否启用 */
  sysSettingGroupEnable?: boolean;

  /** 描述 */
  sysSettingGroupRemark?: string;
  
  /** 排序 */
  sysSettingGroupSort?: number;
  
  /** 是否使用项目组接口 */
  sysSettingGroupUseProjectInterface?: boolean;
}

/**
 * 配置组
 */
export const fetchListForGroup = (params: SysSettingGroup) => {
  return http.request<ReturnResult<SysSettingGroup[]>>("get", "/v2/setting/group/list", {
    params,
  });
};
/**
 * 新增/更新
 */
export const fetchSaveOrUpdateForGroup = (params: SysSettingGroup) => {
  return http.request<ReturnResult<SysSettingGroup>>("post", "/v2/setting/group/saveOrUpdate", {
    data: params,
  });
};
/**
 * 更新
 */
export const fetchBatchUpdateForGroup = (params: SysSettingGroup[]) => {
  return http.request<ReturnResult<SysSettingGroup>>("post", "/v2/setting/group/batchUpdate", {
    data: params,
  });
};
/**
 * 删除
 */
export const fetchDeleteForGroup = (params: { sysSettingGroupId: number }) => {
  return http.request<ReturnResult<SysSettingGroup>>("post", "/v2/setting/group/delete", {
    params,
  });
};