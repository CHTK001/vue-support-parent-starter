import { http, type ReturnResult } from "@repo/utils";

/**
 * 服务器组接口
 */

// 服务器组类型定义
export interface ServerGroup {
  monitorSysGenServerGroupId?: number;
  monitorSysGenServerGroupName?: string;
  monitorSysGenServerGroupDesc?: string;
  monitorSysGenServerGroupColor?: string;
  monitorSysGenServerGroupIcon?: string;
  monitorSysGenServerGroupStatus?: number;
  monitorSysGenServerGroupIsDefault?: number;
  monitorSysGenServerGroupSort?: number;
  monitorSysGenServerGroupRemark?: string;
  createTime?: string;
  updateTime?: string;
  serverCount?: number; // 服务器数量
}

// 分页查询参数
export interface ServerGroupPageParams {
  current?: number;
  size?: number;
  monitorSysGenServerGroupName?: string;
  monitorSysGenServerGroupStatus?: number;
}

/**
 * 分页查询服务器组
 */
export const getServerGroupPage = (params: ServerGroupPageParams) => {
  return http.request<ReturnResult<{ records: ServerGroup[]; total: number }>>(
    "get",
    "/v1/server/group/page",
    { params }
  );
};

/**
 * 获取所有启用的服务器组
 */
export const getEnabledServerGroups = () => {
  return http.request<ReturnResult<ServerGroup[]>>(
    "get",
    "/v1/server/group/enabled"
  );
};

/**
 * 获取所有服务器组
 */
export const getAllServerGroups = () => {
  return http.request<ReturnResult<ServerGroup[]>>(
    "get",
    "/v1/server/group/all"
  );
};

/**
 * 根据ID获取服务器组
 */
export const getServerGroupById = (groupId: number) => {
  return http.request<ReturnResult<ServerGroup>>(
    "get",
    `/v1/server/group/${groupId}`
  );
};

/**
 * 创建服务器组
 */
export const createServerGroup = (data: ServerGroup) => {
  return http.request<ReturnResult<boolean>>("post", "/v1/server/group", {
    data,
  });
};

/**
 * 更新服务器组
 */
export const updateServerGroup = (data: ServerGroup) => {
  return http.request<ReturnResult<boolean>>("put", "/v1/server/group", {
    data,
  });
};

/**
 * 删除服务器组
 */
export const deleteServerGroup = (groupId: number) => {
  return http.request<ReturnResult<boolean>>(
    "delete",
    `/v1/server/group/${groupId}`
  );
};

/**
 * 检查组名是否存在
 */
export const checkGroupNameExists = (groupName: string, excludeId?: number) => {
  return http.request<ReturnResult<boolean>>(
    "get",
    "/v1/server/group/check-name",
    {
      params: { groupName, excludeId },
    }
  );
};

/**
 * 获取默认分组
 */
export const getDefaultGroup = () => {
  return http.request<ReturnResult<ServerGroup>>(
    "get",
    "/v1/server/group/default"
  );
};

/**
 * 设置默认分组
 */
export const setDefaultGroup = (groupId: number) => {
  return http.request<ReturnResult<boolean>>(
    "put",
    `/v1/server/group/${groupId}/set-default`
  );
};

/**
 * 获取分组下的服务器数量
 */
export const getGroupServerCount = (groupId: number) => {
  return http.request<ReturnResult<number>>(
    "get",
    `/v1/server/group/${groupId}/server-count`
  );
};

/**
 * 批量移动服务器到指定分组
 */
export const moveServersToGroup = (serverIds: number[], groupId: number) => {
  return http.request<ReturnResult<boolean>>(
    "put",
    "/v1/server/group/move-servers",
    {
      data: { serverIds, groupId },
    }
  );
};

/**
 * 启用/禁用分组
 */
export const toggleGroupStatus = (groupId: number, status: number) => {
  return http.request<ReturnResult<boolean>>(
    "put",
    `/v1/server/group/${groupId}/status`,
    { data: { status } }
  );
};

/**
 * 更新分组排序
 */
export const updateGroupSort = (groupId: number, sort: number) => {
  return http.request<ReturnResult<boolean>>(
    "put",
    `/v1/server/group/${groupId}/sort`,
    { data: { sort } }
  );
};
