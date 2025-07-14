import request from "@/api/config";

// 文件分组接口
export interface FileSystemGroup {
  fileSystemGroupId?: number;
  fileSystemGroupName: string;
  fileSystemGroupParentId?: number;
  fileSystemGroupPath: string;
  fileSystemGroupFullPath?: string;
  fileSystemGroupLevel?: number;
  fileSystemGroupTreePath?: string;
  fileSystemGroupDescription?: string;
  fileSystemGroupIsDefault?: boolean;
  fileSystemGroupSort?: number;
  fileSystemGroupStatus?: number;
  fileSystemGroupIcon?: string;
  fileSystemGroupColor?: string;
  children?: FileSystemGroup[];
  fileCount?: number;
  createTime?: string;
  updateTime?: string;
  createBy?: string;
  updateBy?: string;
}

// 分组迁移请求参数
export interface MigrateFilesRequest {
  fileIds: number[];
  targetGroupId: number;
}

/**
 * 获取分组树形结构
 */
export function getGroupTree() {
  return request<FileSystemGroup[]>({
    url: "/v1/filesystem/group/tree",
    method: "GET",
  });
}

/**
 * 创建分组
 */
export function createGroup(group: FileSystemGroup) {
  return request<FileSystemGroup>({
    url: "/v1/filesystem/group",
    method: "POST",
    data: group,
  });
}

/**
 * 更新分组
 */
export function updateGroup(group: FileSystemGroup) {
  return request<FileSystemGroup>({
    url: "/v1/filesystem/group",
    method: "PUT",
    data: group,
  });
}

/**
 * 删除分组
 */
export function deleteGroup(groupId: number) {
  return request<boolean>({
    url: `/v1/filesystem/group/${groupId}`,
    method: "DELETE",
  });
}

/**
 * 移动分组
 */
export function moveGroup(groupId: number, newParentId?: number) {
  return request<boolean>({
    url: `/v1/filesystem/group/${groupId}/move`,
    method: "PUT",
    params: { newParentId },
  });
}

/**
 * 获取分组及其子分组的ID列表
 */
export function getGroupAndChildrenIds(groupId: number) {
  return request<number[]>({
    url: `/v1/filesystem/group/${groupId}/children-ids`,
    method: "GET",
  });
}

/**
 * 迁移文件到指定分组
 */
export function migrateFilesToGroup(fileIds: number[], targetGroupId: number) {
  return request<number>({
    url: "/v1/filesystem/group/operation/migrate-files",
    method: "PUT",
    params: { fileIds: fileIds.join(","), targetGroupId },
  });
}

/**
 * 初始化默认分组
 */
export function initDefaultGroups() {
  return request<string>({
    url: "/v1/filesystem/group/init-default",
    method: "POST",
  });
}

/**
 * 根据文件类型获取推荐分组
 */
export function getRecommendedGroup(fileExtension: string) {
  return request<number>({
    url: "/v1/filesystem/group/recommend",
    method: "GET",
    params: { fileExtension },
  });
}

/**
 * 获取默认分组
 */
export function getDefaultGroup() {
  return request<FileSystemGroup>({
    url: "/v1/filesystem/group/default",
    method: "GET",
  });
}
