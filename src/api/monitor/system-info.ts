import request from "@/api/config";

// 磁盘驱动器信息接口
export interface DriveInfo {
  path: string;
  name: string;
  type: string;
  totalSpace: number;
  freeSpace: number;
  usedSpace: number;
}

// 目录信息接口
export interface DirectoryInfo {
  path: string;
  name: string;
  isDirectory: boolean;
  size?: number;
  lastModified?: number;
  canRead?: boolean;
  canWrite?: boolean;
  hidden?: boolean;
}

/**
 * 获取系统磁盘驱动器列表
 */
export function getSystemDrives() {
  return request<DriveInfo[]>({
    url: "/v1/system-info/drives",
    method: "GET",
  });
}

/**
 * 获取指定路径下的目录列表
 */
export function getDirectories(path: string, includeHidden = false) {
  return request<DirectoryInfo[]>({
    url: "/v1/system-info/directories",
    method: "GET",
    params: { path, includeHidden },
  });
}

/**
 * 创建目录
 */
export function createDirectory(parentPath: string, directoryName: string) {
  return request<boolean>({
    url: "/v1/system-info/directories",
    method: "POST",
    params: { parentPath, directoryName },
  });
}

/**
 * 验证路径是否有效
 */
export function validatePath(path: string) {
  return request<boolean>({
    url: "/v1/system-info/validate-path",
    method: "GET",
    params: { path },
  });
}
