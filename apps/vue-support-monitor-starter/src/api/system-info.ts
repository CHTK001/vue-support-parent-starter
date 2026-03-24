import { http, type ReturnResult } from "@repo/utils";

export interface DriveInfo {
  path: string;
  name: string;
  type?: string;
  totalSpace?: number;
  freeSpace?: number;
  usedSpace?: number;
}

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

export function getSystemDrives() {
  return http.request<ReturnResult<DriveInfo[]>>("get", "/v1/system-info/drives");
}

export function getSystemDirectories(path: string, includeHidden = false) {
  return http.request<ReturnResult<DirectoryInfo[]>>("get", "/v1/system-info/directories", {
    params: { path, includeHidden }
  });
}


