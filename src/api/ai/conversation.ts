import { http } from "@repo/utils";

// AI会话管理相关接口
export interface SysAiGroup {
  sysAiGroupId?: number;
  groupName: string;
  sysProjectId: number;
  groupType?: string;
  groupDescription?: string;
  createTime?: string;
  updateTime?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * 获取智能组列表
 * @param sysProjectId 项目ID
 * @returns 智能组列表
 */
export const getConversationList = (sysProjectId: number) => {
  return http.request<ApiResponse<SysAiGroup[]>>("get", "/v2/project/ai/group/group", {
    params: { sysProjectId },
  });
};

/**
 * 保存或更新智能组
 * @param data 智能组数据
 * @returns 操作结果
 */
export const saveOrUpdateConversation = (data: SysAiGroup) => {
  return http.request<ApiResponse<number>>("post", "/v2/project/ai/group/saveOrUpdate", {
    data: data,
  });
};

/**
 * 删除智能组
 * @param sysAiGroupId 智能组ID
 * @returns 操作结果
 */
export const deleteConversation = (sysAiGroupId: number) => {
  return http.request<ApiResponse<boolean>>("delete", "/v2/project/ai/group/delete", {
    params: { sysAiGroupId },
  });
};

/**
 * 创建新会话
 * @param groupName 会话名称
 * @param sysProjectId 项目ID
 * @param groupType 会话类型
 * @returns 新会话ID
 */
export const createConversation = (groupName: string, sysProjectId: number, groupType = "chat") => {
  return saveOrUpdateConversation({
    groupName,
    sysProjectId,
    groupType,
  });
};

/**
 * 重命名会话
 * @param conversation 会话对象
 * @param newName 新名称
 * @returns 操作结果
 */
export const renameConversation = (conversation: SysAiGroup, newName: string) => {
  return saveOrUpdateConversation({
    ...conversation,
    groupName: newName,
  });
};
