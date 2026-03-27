import { http, type ReturnResult } from "@repo/utils";

// 文件信息接口
export interface FileInfo {
  name: string;
  path: string;
  size: number;
  isDirectory: boolean;
  modifiedTime: string;
  permissions?: string;
  owner?: string;
  group?: string;
  children?: FileInfo[];
  extraProperties?: string;
  leaf?: boolean;
}

// 文件操作响应接口
export interface FileOperationResponse {
  success: boolean;
  message: string;
  operation: string;
  files?: FileInfo[];
  tree?: FileInfo;
  fileTree?: FileInfo;
  data?: any;
}

export function getFileList(
  serverId: number,
  path: string,
  includeHidden: boolean = false,
  sortBy: string = "name",
  sortOrder: string = "asc",
) {
  console.log("API: getFileList called with", {
    serverId,
    path,
    includeHidden,
    sortBy,
    sortOrder,
  });

  return http.request<ReturnResult<FileOperationResponse>>(
    "get",
    "v1/file-management/list",
    {
      params: {
        serverId,
        path,
        includeHidden,
        sortBy,
        sortOrder,
      },
    },
  );
}

export function getFileTree(
  serverId: number,
  path: string,
  maxDepth: number = 3,
  includeHidden: boolean = false,
  lazyLoad: boolean = true,
  pageSize: number = 1000,
  pageIndex: number = 0,
) {
  return http.request<ReturnResult<FileOperationResponse>>(
    "get",
    "v1/file-management/tree",
    {
      params: {
        serverId,
        path,
        maxDepth,
        includeHidden,
        lazyLoad,
        pageSize,
        pageIndex,
      },
    },
  );
}

export function uploadFile(
  serverId: number,
  targetPath: string,
  file: File,
  overwrite: boolean = false,
) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("targetPath", targetPath);
  formData.append("overwrite", overwrite.toString());

  return http.request<ReturnResult<FileOperationResponse>>(
    "post",
    `v1/file-management/upload/${serverId}`,
    {
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
}

export function createDirectory(
  serverId: number,
  path: string,
  recursive: boolean = false,
) {
  return http.request<ReturnResult<FileOperationResponse>>(
    "post",
    "v1/file-management/mkdir",
    {
      params: {
        serverId,
        path,
        recursive,
      },
    },
  );
}

export function deleteFile(
  serverId: number,
  path: string,
  recursive: boolean = false,
) {
  return http.request<ReturnResult<FileOperationResponse>>(
    "delete",
    "v1/file-management/delete",
    {
      params: {
        serverId,
        path,
        recursive,
      },
    },
  );
}

export function renameFile(serverId: number, oldPath: string, newName: string) {
  console.log("API: renameFile called with", { serverId, oldPath, newName });

  return http.request<ReturnResult<FileOperationResponse>>(
    "post",
    "v1/file-management/rename",
    {
      params: {
        serverId,
        oldPath,
        newName,
      },
    },
  );
}

export function copyFile(
  serverId: number,
  sourcePath: string,
  targetPath: string,
  overwrite: boolean = false,
) {
  console.log("API: copyFile called with", {
    serverId,
    sourcePath,
    targetPath,
    overwrite,
  });

  return http.request<ReturnResult<FileOperationResponse>>(
    "post",
    "v1/file-management/copy",
    {
      params: {
        serverId,
        sourcePath,
        targetPath,
        overwrite,
      },
    },
  );
}

export function moveFile(
  serverId: number,
  sourcePath: string,
  targetPath: string,
  overwrite: boolean = false,
) {
  console.log("API: moveFile called with", {
    serverId,
    sourcePath,
    targetPath,
    overwrite,
  });

  return http.request<ReturnResult<FileOperationResponse>>(
    "post",
    "v1/file-management/move",
    {
      params: {
        serverId,
        sourcePath,
        targetPath,
        overwrite,
      },
    },
  );
}

export function batchDeleteFiles(
  serverId: number,
  paths: string[],
  recursive: boolean = false,
) {
  console.log("API: batchDeleteFiles called with", {
    serverId,
    paths,
    recursive,
  });

  return http.request<ReturnResult<FileOperationResponse>>(
    "post",
    "v1/file-management/batch-delete",
    {
      data: {
        serverId,
        paths,
        recursive,
      },
    },
  );
}

export function readFileContent(serverId: number, filePath: string) {
  console.log("API: readFileContent called with", { serverId, filePath });

  return http.request<ReturnResult<string>>("get", "v1/file-management/read", {
    params: {
      serverId,
      filePath,
    },
  });
}

export function saveFileContent(
  serverId: number,
  filePath: string,
  content: string,
) {
  console.log("API: saveFileContent called with", {
    serverId,
    filePath,
    contentLength: content.length,
  });

  return http.request<ReturnResult<FileOperationResponse>>(
    "post",
    "v1/file-management/write",
    {
      data: {
        serverId,
        filePath,
        content,
      },
    },
  );
}

export function previewFile(
  serverId: number,
  filePath: string,
  previewType: string = "auto",
  maxSizeMB: number = 10,
) {
  return http.request<ReturnResult<FileOperationResponse>>(
    "get",
    "v1/file-management/preview",
    {
      params: {
        serverId,
        filePath,
        previewType,
        maxSizeMB,
      },
    },
  );
}

export function downloadFile(serverId: number, filePath: string) {
  console.log("API: downloadFile called with", { serverId, filePath });

  return http.request<ReturnResult<FileOperationResponse>>(
    "get",
    "v1/file-management/download",
    {
      params: {
        serverId,
        filePath,
      },
    },
  );
}
