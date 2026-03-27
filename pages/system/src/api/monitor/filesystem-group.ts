import { http, type ReturnResult } from "@repo/utils";

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

export interface MigrateFilesRequest {
  fileIds: number[];
  targetGroupId: number;
}

export function getGroupTree() {
  return http.request<ReturnResult<FileSystemGroup[]>>("get", "/v1/filesystem/group/tree");
}

export function createGroup(group: FileSystemGroup) {
  return http.request<ReturnResult<FileSystemGroup>>("post", "/v1/filesystem/group", {
    data: group,
  });
}

export function updateGroup(group: FileSystemGroup) {
  return http.request<ReturnResult<FileSystemGroup>>("put", "/v1/filesystem/group", {
    data: group,
  });
}

export function deleteGroup(groupId: number) {
  return http.request<ReturnResult<boolean>>("delete", `/v1/filesystem/group/${groupId}`);
}

export function moveGroup(groupId: number, newParentId?: number) {
  return http.request<ReturnResult<boolean>>(
    "put",
    `/v1/filesystem/group/operation/${groupId}/move`,
    {
      params: { newParentId },
    },
  );
}

export function getGroupAndChildrenIds(groupId: number) {
  return http.request<ReturnResult<number[]>>(
    "get",
    `/v1/filesystem/group/operation/${groupId}/children-ids`,
  );
}

export function migrateFilesToGroup(fileIds: number[], targetGroupId: number) {
  return http.request<ReturnResult<number>>(
    "put",
    "/v1/filesystem/group/operation/migrate-files",
    {
      params: { fileIds: fileIds.join(","), targetGroupId },
    },
  );
}

export function initDefaultGroups() {
  return http.request<ReturnResult<string>>("post", "/v1/filesystem/group/init-default");
}

export function getRecommendedGroup(fileExtension: string) {
  return http.request<ReturnResult<number>>("get", "/v1/filesystem/group/recommend", {
    params: { fileExtension },
  });
}

export function getDefaultGroup() {
  return http.request<ReturnResult<FileSystemGroup>>("get", "/v1/filesystem/group/default");
}
